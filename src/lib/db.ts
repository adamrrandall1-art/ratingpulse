import { createClient } from '@supabase/supabase-js';
import { getInitialServerBusiness } from '@/lib/server-business';
import fs from 'fs';
import path from 'path';

// Server-side persistent business store for robust navigation and resilience
const globalStore = globalThis as unknown as {
  __rp_businesses?: Map<string, BusinessRecord>;
};
if (!globalStore.__rp_businesses) {
  globalStore.__rp_businesses = new Map<string, BusinessRecord>();
}

function getCacheFilePath(): string | null {
  try {
    const dir = path.join(process.cwd(), 'node_modules', '.cache');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'rp_businesses.json');
  } catch {
    return null;
  }
}

function saveToDisk(record: BusinessRecord) {
  try {
    const filePath = getCacheFilePath();
    if (!filePath) return;
    let data: Record<string, BusinessRecord> = {};
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    data[record.id] = record;
    if (record.userId) data[record.userId] = record;
    if (record.clerkUserId) data[record.clerkUserId] = record;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

function loadFromDisk(targetId: string): BusinessRecord | null {
  try {
    const filePath = getCacheFilePath();
    if (!filePath || !fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data[targetId] || null;
  } catch {
    return null;
  }
}

function cacheRecord(record: BusinessRecord) {
  if (!globalStore.__rp_businesses) globalStore.__rp_businesses = new Map<string, BusinessRecord>();
  if (record.id) globalStore.__rp_businesses.set(record.id, record);
  if (record.userId) globalStore.__rp_businesses.set(record.userId, record);
  if (record.clerkUserId) globalStore.__rp_businesses.set(record.clerkUserId, record);
  saveToDisk(record);
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BusinessRecord {
  id: string;
  userId?: string | null;
  name: string;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  placeId?: string | null;
  reviewUrl?: string | null;
  googleReviewUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  isGoogleConnected: boolean;
  negativeAlertEmail?: string | null;
  negativeAlertPhone?: string | null;
  positiveAlertEmail?: string | null;
  positiveAlertPhone?: string | null;
  negativeAlertsEnabled: boolean;
  negativeEmailAlertEnabled: boolean;
  negativeSmsAlertEnabled: boolean;
  positiveAlertsEnabled: boolean;
  positiveEmailAlertEnabled: boolean;
  positiveSmsAlertEnabled: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

export const db = {
  $disconnect: async () => {},
  business: {
    findMany: async (_args?: any): Promise<BusinessRecord[]> => {
      const supabase = getAdminClient();
      if (supabase) {
        try {
          const { data } = await supabase.from('businesses').select('*');
          if (data && Array.isArray(data)) {
            const records = data.map(normalizeBusiness);
            records.forEach(cacheRecord);
            return records;
          }
        } catch {}
      }
      if (globalStore.__rp_businesses && globalStore.__rp_businesses.size > 0) {
        return Array.from(new Set(Array.from(globalStore.__rp_businesses.values())));
      }
      try {
        const filePath = getCacheFilePath();
        if (filePath && fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return Object.values(data).map(normalizeBusiness);
        }
      } catch {}
      return [];
    },

    findFirst: async (args?: {
      where?: {
        userId?: string | null;
        id?: string | null;
        OR?: Array<{
          userId?: string | null;
          id?: string | null;
          [key: string]: any;
        }>;
        [key: string]: any;
      };
      orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>> | any;
      select?: any;
      include?: any;
      [key: string]: any;
    }): Promise<BusinessRecord | null> => {
      const supabase = getAdminClient();
      const where = args?.where;

      const candidateUserIds: string[] = [];
      const candidateBusinessIds: string[] = [];

      if (where?.userId) candidateUserIds.push(String(where.userId));
      if (where?.clerkUserId) candidateUserIds.push(String(where.clerkUserId));
      if (where?.id) candidateBusinessIds.push(String(where.id));

      if (Array.isArray(where?.OR)) {
        for (const item of where.OR) {
          if (item?.userId) candidateUserIds.push(String(item.userId));
          if (item?.clerkUserId) candidateUserIds.push(String(item.clerkUserId));
          if (item?.id) candidateBusinessIds.push(String(item.id));
        }
      }

      const uniqueUserIds = Array.from(new Set(candidateUserIds.filter(Boolean)));
      const uniqueBusinessIds = Array.from(new Set(candidateBusinessIds.filter(Boolean)));

      if (supabase) {
        // 1. Try querying businesses by business ID
        for (const bId of uniqueBusinessIds) {
          if (UUID_REGEX.test(bId)) {
            try {
              const { data } = await supabase.from('businesses').select('*').eq('id', bId).limit(1);
              if (data && data[0]) {
                const norm = normalizeBusiness(data[0]);
                cacheRecord(norm);
                return norm;
              }
            } catch {}
          }
        }

        // 2. Try querying businesses by userId / clerkUserId / user_id with updatedAt desc ordering
        for (const uId of uniqueUserIds) {
          try {
            const { data: bByUserIdUp } = await supabase
              .from('businesses')
              .select('*')
              .eq('userId', uId)
              .order('updatedAt', { ascending: false })
              .limit(1);
            if (bByUserIdUp && bByUserIdUp[0]) {
              const norm = normalizeBusiness(bByUserIdUp[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByUserIdSnakeUp } = await supabase
              .from('businesses')
              .select('*')
              .eq('user_id', uId)
              .order('updated_at', { ascending: false })
              .limit(1);
            if (bByUserIdSnakeUp && bByUserIdSnakeUp[0]) {
              const norm = normalizeBusiness(bByUserIdSnakeUp[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByClerkSnakeUp } = await supabase
              .from('businesses')
              .select('*')
              .eq('clerk_user_id', uId)
              .order('updated_at', { ascending: false })
              .limit(1);
            if (bByClerkSnakeUp && bByClerkSnakeUp[0]) {
              const norm = normalizeBusiness(bByClerkSnakeUp[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByUserId } = await supabase
              .from('businesses')
              .select('*')
              .eq('userId', uId)
              .order('createdAt', { ascending: false })
              .limit(1);
            if (bByUserId && bByUserId[0]) {
              const norm = normalizeBusiness(bByUserId[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByUserIdSnake } = await supabase
              .from('businesses')
              .select('*')
              .eq('userId', uId)
              .order('created_at', { ascending: false })
              .limit(1);
            if (bByUserIdSnake && bByUserIdSnake[0]) {
              const norm = normalizeBusiness(bByUserIdSnake[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByUser_id } = await supabase
              .from('businesses')
              .select('*')
              .eq('user_id', uId)
              .order('created_at', { ascending: false })
              .limit(1);
            if (bByUser_id && bByUser_id[0]) {
              const norm = normalizeBusiness(bByUser_id[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByClerk } = await supabase
              .from('businesses')
              .select('*')
              .eq('clerkUserId', uId)
              .order('createdAt', { ascending: false })
              .limit(1);
            if (bByClerk && bByClerk[0]) {
              const norm = normalizeBusiness(bByClerk[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          try {
            const { data: bByClerkSnake } = await supabase
              .from('businesses')
              .select('*')
              .eq('clerk_user_id', uId)
              .order('created_at', { ascending: false })
              .limit(1);
            if (bByClerkSnake && bByClerkSnake[0]) {
              const norm = normalizeBusiness(bByClerkSnake[0]);
              cacheRecord(norm);
              return norm;
            }
          } catch {}
          if (UUID_REGEX.test(uId)) {
            try {
              const { data: bById } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', uId)
                .limit(1);
              if (bById && bById[0]) {
                const norm = normalizeBusiness(bById[0]);
                cacheRecord(norm);
                return norm;
              }
            } catch {}
          }
        }
      }

      // 3. Check server-side memory cache
      for (const candId of [...uniqueUserIds, ...uniqueBusinessIds]) {
        if (globalStore.__rp_businesses?.has(candId)) {
          const found = globalStore.__rp_businesses.get(candId);
          if (found) return normalizeBusiness(found);
        }
      }

      // 4. Check disk cache
      for (const candId of [...uniqueUserIds, ...uniqueBusinessIds]) {
        const diskFound = loadFromDisk(candId);
        if (diskFound) {
          cacheRecord(diskFound);
          return normalizeBusiness(diskFound);
        }
      }

      // 5. Fall back to getInitialServerBusiness resolver
      const targetId = uniqueUserIds[0] || uniqueBusinessIds[0];
      if (targetId) {
        const fallbackBiz = await getInitialServerBusiness(targetId);
        if (fallbackBiz) {
          const normalized = normalizeBusiness(fallbackBiz);
          cacheRecord(normalized);
          return normalized;
        }
      }

      return null;
    },

    findUnique: async (args: { where: { id?: string; userId?: string } }) => {
      return db.business.findFirst({ where: args.where });
    },

    update: async (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<BusinessRecord> => {
      const supabase = getAdminClient();
      const targetId = args.where.id;
      const data = args.data;

      // Find existing record to preserve fields
      const existing = await db.business.findFirst({
        where: {
          OR: [
            { id: targetId },
            { userId: targetId },
            { clerkUserId: targetId },
          ],
        },
      });

      const normalizedData = { ...data };
      if (normalizedData.updatedAt instanceof Date) {
        normalizedData.updatedAt = normalizedData.updatedAt.toISOString();
      }

      const merged = normalizeBusiness({
        ...(existing || {}),
        ...normalizedData,
        id: existing?.id || targetId,
        updatedAt: new Date().toISOString(),
      });
      cacheRecord(merged);

      // Prepare partial update for businesses table
      const partialUpdate: Record<string, unknown> = {
        ...normalizedData,
        updated_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Ensure both snake_case and camelCase aliases for Supabase
      if (normalizedData.negativeAlertEmail !== undefined) {
        partialUpdate.negative_alert_email = normalizedData.negativeAlertEmail;
      }
      if (normalizedData.negativeAlertPhone !== undefined) {
        partialUpdate.negative_alert_phone = normalizedData.negativeAlertPhone;
      }
      if (normalizedData.positiveAlertEmail !== undefined) {
        partialUpdate.positive_alert_email = normalizedData.positiveAlertEmail;
      }
      if (normalizedData.positiveAlertPhone !== undefined) {
        partialUpdate.positive_alert_phone = normalizedData.positiveAlertPhone;
      }
      if (normalizedData.googleReviewUrl !== undefined) {
        partialUpdate.google_review_url = normalizedData.googleReviewUrl;
      }
      if (normalizedData.reviewUrl !== undefined) {
        partialUpdate.review_url = normalizedData.reviewUrl;
      }
      if (normalizedData.placeId !== undefined) {
        partialUpdate.place_id = normalizedData.placeId;
      }
      if (normalizedData.isGoogleConnected !== undefined) {
        partialUpdate.is_google_connected = normalizedData.isGoogleConnected;
        partialUpdate.google_connected = normalizedData.isGoogleConnected;
      }

      if (supabase) {
        // Attempt update across matching ID columns
        try {
          await supabase.from('businesses').update(partialUpdate).eq('id', targetId);
        } catch {}
        try {
          await supabase.from('businesses').update(partialUpdate).eq('userId', targetId);
        } catch {}
        try {
          await supabase.from('businesses').update(partialUpdate).eq('user_id', targetId);
        } catch {}

        // Also sync profile and business_settings if targetId matches a user/profile
        try {
          const profileUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (normalizedData.negativeAlertEmail !== undefined) profileUpdates.negative_alert_email = normalizedData.negativeAlertEmail;
          if (normalizedData.negativeAlertPhone !== undefined) profileUpdates.negative_alert_phone = normalizedData.negativeAlertPhone;
          if (normalizedData.positiveAlertEmail !== undefined) profileUpdates.positive_alert_email = normalizedData.positiveAlertEmail;
          if (normalizedData.positiveAlertPhone !== undefined) profileUpdates.positive_alert_phone = normalizedData.positiveAlertPhone;
          if (normalizedData.googleReviewUrl !== undefined) profileUpdates.review_url = normalizedData.googleReviewUrl;
          if (normalizedData.isGoogleConnected !== undefined) profileUpdates.google_connected = normalizedData.isGoogleConnected;
          if (normalizedData.placeId !== undefined) profileUpdates.google_place_id = normalizedData.placeId;

          if (UUID_REGEX.test(targetId)) {
            await supabase.from('profiles').update(profileUpdates).eq('id', targetId);
          } else {
            await supabase.from('profiles').update(profileUpdates).eq('clerk_user_id', targetId);
          }
        } catch {}

        try {
          const settingsUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (normalizedData.negativeAlertEmail !== undefined) settingsUpdates.negative_alert_email = normalizedData.negativeAlertEmail;
          if (normalizedData.negativeAlertPhone !== undefined) settingsUpdates.negative_alert_phone = normalizedData.negativeAlertPhone;
          if (normalizedData.positiveAlertEmail !== undefined) settingsUpdates.positive_alert_email = normalizedData.positiveAlertEmail;
          if (normalizedData.positiveAlertPhone !== undefined) settingsUpdates.positive_alert_phone = normalizedData.positiveAlertPhone;
          if (normalizedData.googleReviewUrl !== undefined) settingsUpdates.google_review_url = normalizedData.googleReviewUrl;
          if (normalizedData.isGoogleConnected !== undefined) settingsUpdates.google_connected = normalizedData.isGoogleConnected;
          if (normalizedData.placeId !== undefined) settingsUpdates.place_id = normalizedData.placeId;

          await supabase.from('business_settings').update(settingsUpdates).eq('user_id', targetId);
        } catch {}
      }

      return merged;
    },

    create: async (args: {
      data: Record<string, unknown>;
    }): Promise<BusinessRecord> => {
      const supabase = getAdminClient();
      const data = args.data;
      const id = (data.id as string) || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bus_${Date.now()}`);
      const payload = normalizeBusiness({
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      });

      cacheRecord(payload);

      if (supabase) {
        try {
          await supabase.from('businesses').insert({
            id,
            userId: data.userId || null,
            user_id: data.userId || null,
            name: data.name || 'RatingPulse',
            google_review_url: data.googleReviewUrl || null,
            review_url: data.reviewUrl || data.googleReviewUrl || null,
            is_google_connected: data.isGoogleConnected ?? true,
            google_connected: data.isGoogleConnected ?? true,
            negative_alert_email: data.negativeAlertEmail || null,
            negative_alert_phone: data.negativeAlertPhone || null,
            positive_alert_email: data.positiveAlertEmail || null,
            positive_alert_phone: data.positiveAlertPhone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch {}
      }

      return payload;
    },
  },
};

export const prisma = db;
export default db;

function normalizeBusiness(raw: any): BusinessRecord {
  const directReviewUrl =
    raw.googleReviewUrl ||
    raw.google_review_url ||
    raw.reviewUrl ||
    raw.review_url ||
    'https://g.page/r/Cc5qbA6YaZ6-EBM/review';

  const cleanReviewUrl = directReviewUrl.includes('http')
    ? directReviewUrl.match(/https?:\/\/[^\s)\]]+/)?.[0] || directReviewUrl
    : directReviewUrl;

  const isGoogleConnected = Boolean(
    raw.isGoogleConnected ??
    raw.is_google_connected ??
    raw.google_connected ??
    raw.isConnected ??
    true
  );

  return {
    id: raw.id || 'default-biz',
    userId: raw.userId || raw.user_id || null,
    name: raw.name || raw.business_name || 'RatingPulse',
    category: raw.category || raw.business_category || 'Local Business',
    address: raw.address || raw.formatted_address || '',
    phone: raw.phone || '',
    email: raw.email || '',
    placeId: raw.placeId || raw.place_id || raw.google_place_id || 'ChIJ30Y_J4pZwokRx0wHl0m6SgQ',
    reviewUrl: cleanReviewUrl,
    googleReviewUrl: cleanReviewUrl,
    rating: Number(raw.rating) || 5.0,
    reviewCount: Number(raw.reviewCount) || 0,
    isGoogleConnected,
    negativeAlertEmail: raw.negativeAlertEmail ?? raw.negative_alert_email ?? null,
    negativeAlertPhone: raw.negativeAlertPhone ?? raw.negative_alert_phone ?? null,
    positiveAlertEmail: raw.positiveAlertEmail ?? raw.positive_alert_email ?? null,
    positiveAlertPhone: raw.positiveAlertPhone ?? raw.positive_alert_phone ?? null,
    negativeAlertsEnabled: raw.negativeAlertsEnabled ?? raw.negative_alerts_enabled ?? true,
    negativeEmailAlertEnabled: raw.negativeEmailAlertEnabled ?? raw.negative_email_alert_enabled ?? true,
    negativeSmsAlertEnabled: raw.negativeSmsAlertEnabled ?? raw.negative_sms_alert_enabled ?? false,
    positiveAlertsEnabled: raw.positiveAlertsEnabled ?? raw.positive_alerts_enabled ?? true,
    positiveEmailAlertEnabled: raw.positiveEmailAlertEnabled ?? raw.positive_email_alert_enabled ?? true,
    positiveSmsAlertEnabled: raw.positiveSmsAlertEnabled ?? raw.positive_sms_alert_enabled ?? false,
    brandVoice: raw.brandVoice ?? raw.brand_voice ?? 'friendly_professional',
    smsTemplate: raw.smsTemplate ?? raw.sms_template ?? null,
    autoPublish5Star: raw.autoPublish5Star ?? raw.auto_publish_5_star ?? false,
    createdAt: raw.createdAt || raw.created_at || new Date(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date(),
  };
}
