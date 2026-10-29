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
  negativeAlertSmsEnabled?: boolean;
  smsAlertsEnabled?: boolean;
  negativeAlertEmailEnabled?: boolean;
  positiveAlertSmsEnabled?: boolean;
  positiveAlertEmailEnabled?: boolean;
  brandVoice?: string | null;
  aiTone?: string | null;
  aiInstructions?: string | null;
  aiSignature?: string | null;
  autoReplyEnabled?: boolean | null;
  autoPublish5Star?: boolean | null;
  customKeywords?: string | null;
  selectedModel?: string | null;
  smsTemplate?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

export const db = {
  $disconnect: async () => {},
  business: {
    findMany: async (args?: {
      where?: any;
      orderBy?: any;
      [key: string]: any;
    }): Promise<BusinessRecord[]> => {
      const supabase = getAdminClient();
      let records: BusinessRecord[] = [];

      if (supabase) {
        try {
          const { data } = await supabase.from('businesses').select('*');
          if (data && Array.isArray(data)) {
            records = data.map(normalizeBusiness);
            records.forEach(cacheRecord);
          }
        } catch {}
      }

      // Merge memory cache records
      if (globalStore.__rp_businesses && globalStore.__rp_businesses.size > 0) {
        for (const biz of globalStore.__rp_businesses.values()) {
          const norm = normalizeBusiness(biz);
          if (!records.some(r => r.id === norm.id)) {
            records.push(norm);
          }
        }
      }

      // Merge disk cache records
      try {
        const filePath = getCacheFilePath();
        if (filePath && fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          for (const raw of Object.values(data)) {
            const norm = normalizeBusiness(raw);
            if (!records.some(r => r.id === norm.id)) {
              records.push(norm);
            }
          }
        }
      } catch {}

      // Apply where filtering if provided
      if (args?.where) {
        const candidateUserIds: string[] = [];
        const candidateBusinessIds: string[] = [];

        if (args.where.userId) candidateUserIds.push(String(args.where.userId));
        if (args.where.clerkUserId) candidateUserIds.push(String(args.where.clerkUserId));
        if (args.where.id) candidateBusinessIds.push(String(args.where.id));

        if (Array.isArray(args.where.OR)) {
          for (const item of args.where.OR) {
            if (item?.userId) candidateUserIds.push(String(item.userId));
            if (item?.clerkUserId) candidateUserIds.push(String(item.clerkUserId));
            if (item?.id) candidateBusinessIds.push(String(item.id));
          }
        }

        const validCandUserIds = new Set(candidateUserIds.filter(Boolean));
        const validCandBizIds = new Set(candidateBusinessIds.filter(Boolean));

        if (validCandUserIds.size > 0 || validCandBizIds.size > 0) {
          records = records.filter(r => {
            if (r.id && validCandBizIds.has(String(r.id))) return true;
            if (r.userId && validCandUserIds.has(String(r.userId))) return true;
            if (r.clerkUserId && validCandUserIds.has(String(r.clerkUserId))) return true;
            if (r.user_id && validCandUserIds.has(String(r.user_id))) return true;
            if (r.clerk_user_id && validCandUserIds.has(String(r.clerk_user_id))) return true;
            if (r.id && validCandUserIds.has(String(r.id))) return true;
            return false;
          });
        }
      }

      // Deduplicate records by id
      const seen = new Set<string>();
      records = records.filter(r => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      // Sort by updatedAt desc if specified
      if (args?.orderBy) {
        const orderProp = args.orderBy.updatedAt ? 'updatedAt' : (args.orderBy.createdAt ? 'createdAt' : null);
        if (orderProp) {
          const isDesc = args.orderBy[orderProp] === 'desc';
          records.sort((a, b) => {
            const dateA = a[orderProp] ? new Date(a[orderProp]).getTime() : 0;
            const dateB = b[orderProp] ? new Date(b[orderProp]).getTime() : 0;
            return isDesc ? dateB - dateA : dateA - dateB;
          });
        }
      }

      return records;
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

    upsert: async (args: {
      where: { id?: string; userId?: string; clerkUserId?: string; [key: string]: any };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }): Promise<BusinessRecord> => {
      const existing = await db.business.findFirst({ where: args.where });
      if (existing) {
        return db.business.update({
          where: { id: existing.id },
          data: args.update,
        });
      } else {
        const createData = { ...args.create };
        if (args.where.id && !createData.id) {
          createData.id = args.where.id;
        }
        return db.business.create({
          data: createData,
        });
      }
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
      if (normalizedData.negativeAlertsEnabled !== undefined) {
        partialUpdate.negative_alerts_enabled = normalizedData.negativeAlertsEnabled;
        partialUpdate.negativeAlertsEnabled = normalizedData.negativeAlertsEnabled;
      }
      const isSmsActive =
        normalizedData.negativeAlertSmsEnabled !== undefined
          ? normalizedData.negativeAlertSmsEnabled
          : (normalizedData.smsAlertsEnabled !== undefined
            ? normalizedData.smsAlertsEnabled
            : (normalizedData.negativeSmsAlertEnabled !== undefined
              ? normalizedData.negativeSmsAlertEnabled
              : (normalizedData.notifySms !== undefined
                ? normalizedData.notifySms
                : normalizedData.enableSmsAlerts)));

      if (isSmsActive !== undefined) {
        const val = Boolean(isSmsActive);
        partialUpdate.negative_alert_sms_enabled = val;
        partialUpdate.negative_sms_alert_enabled = val;
        partialUpdate.negativeAlertSmsEnabled = val;
        partialUpdate.negativeSmsAlertEnabled = val;
        partialUpdate.smsAlertsEnabled = val;
        partialUpdate.sms_alerts_enabled = val;
      }
      if (normalizedData.negativeAlertEmailEnabled !== undefined || normalizedData.negativeEmailAlertEnabled !== undefined) {
        const val = Boolean(normalizedData.negativeAlertEmailEnabled ?? normalizedData.negativeEmailAlertEnabled);
        partialUpdate.negative_alert_email_enabled = val;
        partialUpdate.negative_email_alert_enabled = val;
        partialUpdate.negativeAlertEmailEnabled = val;
        partialUpdate.negativeEmailAlertEnabled = val;
      }
      if (normalizedData.positiveAlertsEnabled !== undefined) {
        partialUpdate.positive_alerts_enabled = normalizedData.positiveAlertsEnabled;
        partialUpdate.positiveAlertsEnabled = normalizedData.positiveAlertsEnabled;
      }
      if (normalizedData.positiveAlertSmsEnabled !== undefined || normalizedData.positiveSmsAlertEnabled !== undefined) {
        const val = Boolean(normalizedData.positiveAlertSmsEnabled ?? normalizedData.positiveSmsAlertEnabled);
        partialUpdate.positive_alert_sms_enabled = val;
        partialUpdate.positive_sms_alert_enabled = val;
        partialUpdate.positiveAlertSmsEnabled = val;
        partialUpdate.positiveSmsAlertEnabled = val;
      }
      if (normalizedData.positiveAlertEmailEnabled !== undefined || normalizedData.positiveEmailAlertEnabled !== undefined) {
        const val = Boolean(normalizedData.positiveAlertEmailEnabled ?? normalizedData.positiveEmailAlertEnabled);
        partialUpdate.positive_alert_email_enabled = val;
        partialUpdate.positive_email_alert_enabled = val;
        partialUpdate.positiveAlertEmailEnabled = val;
        partialUpdate.positiveEmailAlertEnabled = val;
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
      if (normalizedData.brandVoice !== undefined) {
        partialUpdate.brand_voice = normalizedData.brandVoice;
        partialUpdate.brandVoice = normalizedData.brandVoice;
      }
      if (normalizedData.aiTone !== undefined) {
        partialUpdate.ai_tone = normalizedData.aiTone;
        partialUpdate.aiTone = normalizedData.aiTone;
        partialUpdate.brand_voice = normalizedData.aiTone;
        partialUpdate.brandVoice = normalizedData.aiTone;
      }
      if (normalizedData.aiInstructions !== undefined) {
        partialUpdate.ai_instructions = normalizedData.aiInstructions;
        partialUpdate.aiInstructions = normalizedData.aiInstructions;
      }
      if (normalizedData.aiSignature !== undefined) {
        partialUpdate.ai_signature = normalizedData.aiSignature;
        partialUpdate.aiSignature = normalizedData.aiSignature;
      }
      if (normalizedData.autoReplyEnabled !== undefined) {
        partialUpdate.auto_reply_enabled = normalizedData.autoReplyEnabled;
        partialUpdate.autoReplyEnabled = normalizedData.autoReplyEnabled;
        partialUpdate.auto_publish_5_star = normalizedData.autoReplyEnabled;
        partialUpdate.autoPublish5Star = normalizedData.autoReplyEnabled;
      }
      if (normalizedData.autoPublish5Star !== undefined) {
        partialUpdate.auto_publish_5_star = normalizedData.autoPublish5Star;
        partialUpdate.autoPublish5Star = normalizedData.autoPublish5Star;
      }
      if (normalizedData.customKeywords !== undefined) {
        partialUpdate.custom_keywords = normalizedData.customKeywords;
        partialUpdate.customKeywords = normalizedData.customKeywords;
      }
      if (normalizedData.selectedModel !== undefined) {
        partialUpdate.selected_model = normalizedData.selectedModel;
        partialUpdate.selectedModel = normalizedData.selectedModel;
      }
      if (normalizedData.smsTemplate !== undefined) {
        partialUpdate.sms_template = normalizedData.smsTemplate;
        partialUpdate.smsTemplate = normalizedData.smsTemplate;
      }

      if (supabase) {
        // Attempt update across matching ID columns
        try {
          const res1 = await supabase.from('businesses').update(partialUpdate).eq('id', targetId);
          if (res1.error) {
            const snakeUpdate: Record<string, unknown> = {
              negative_alert_email: normalizedData.negativeAlertEmail || null,
              negative_alert_phone: normalizedData.negativeAlertPhone || null,
              positive_alert_email: normalizedData.positiveAlertEmail || null,
              positive_alert_phone: normalizedData.positiveAlertPhone || null,
              google_review_url: normalizedData.googleReviewUrl || null,
              review_url: normalizedData.googleReviewUrl || null,
              is_google_connected: normalizedData.isGoogleConnected ?? true,
              google_connected: normalizedData.isGoogleConnected ?? true,
              updated_at: new Date().toISOString(),
            };
            await supabase.from('businesses').update(snakeUpdate).eq('id', targetId);
            await supabase.from('businesses').update(snakeUpdate).eq('user_id', targetId);
            await supabase.from('businesses').update(snakeUpdate).eq('userId', targetId);
          }
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
          const insertPayload: Record<string, unknown> = {
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
            negativeAlertEmail: data.negativeAlertEmail || null,
            negativeAlertPhone: data.negativeAlertPhone || null,
            positiveAlertEmail: data.positiveAlertEmail || null,
            positiveAlertPhone: data.positiveAlertPhone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error: insErr } = await supabase.from('businesses').insert(insertPayload);
          if (insErr) {
            await supabase.from('businesses').insert({
              id,
              user_id: data.userId || null,
              name: data.name || 'RatingPulse',
              google_review_url: data.googleReviewUrl || null,
              review_url: data.reviewUrl || data.googleReviewUrl || null,
              is_google_connected: data.isGoogleConnected ?? true,
              negative_alert_email: data.negativeAlertEmail || null,
              negative_alert_phone: data.negativeAlertPhone || null,
              positive_alert_email: data.positiveAlertEmail || null,
              positive_alert_phone: data.positiveAlertPhone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
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

  const isSmsActive = Boolean(
    raw.negativeAlertSmsEnabled ??
    raw.smsAlertsEnabled ??
    raw.negativeSmsAlertEnabled ??
    raw.sms_alerts_enabled ??
    raw.negative_alert_sms_enabled ??
    raw.negative_sms_alert_enabled ??
    raw.notifySms ??
    raw.enableSmsAlerts ??
    false
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
    negativeAlertsEnabled: Boolean(raw.negativeAlertsEnabled ?? raw.negative_alerts_enabled ?? true),
    negativeEmailAlertEnabled: Boolean(raw.negativeAlertEmailEnabled ?? raw.negativeEmailAlertEnabled ?? raw.negative_alert_email_enabled ?? raw.negative_email_alert_enabled ?? true),
    negativeSmsAlertEnabled: isSmsActive,
    positiveAlertsEnabled: Boolean(raw.positiveAlertsEnabled ?? raw.positive_alerts_enabled ?? true),
    positiveEmailAlertEnabled: Boolean(raw.positiveAlertEmailEnabled ?? raw.positiveEmailAlertEnabled ?? raw.positive_alert_email_enabled ?? raw.positive_email_alert_enabled ?? true),
    positiveSmsAlertEnabled: Boolean(raw.positiveAlertSmsEnabled ?? raw.positiveSmsAlertEnabled ?? raw.positive_alert_sms_enabled ?? raw.positive_sms_alert_enabled ?? false),
    negativeAlertSmsEnabled: isSmsActive,
    smsAlertsEnabled: isSmsActive,
    negativeAlertEmailEnabled: Boolean(raw.negativeAlertEmailEnabled ?? raw.negativeEmailAlertEnabled ?? raw.negative_alert_email_enabled ?? raw.negative_email_alert_enabled ?? true),
    positiveAlertSmsEnabled: Boolean(raw.positiveAlertSmsEnabled ?? raw.positiveSmsAlertEnabled ?? raw.positive_alert_sms_enabled ?? raw.positive_sms_alert_enabled ?? false),
    positiveAlertEmailEnabled: Boolean(raw.positiveAlertEmailEnabled ?? raw.positiveEmailAlertEnabled ?? raw.positive_alert_email_enabled ?? raw.positive_email_alert_enabled ?? true),
    brandVoice: raw.brandVoice ?? raw.brand_voice ?? raw.aiTone ?? raw.ai_tone ?? 'friendly_professional',
    aiTone: raw.aiTone ?? raw.ai_tone ?? raw.brandVoice ?? raw.brand_voice ?? 'friendly_professional',
    aiInstructions: raw.aiInstructions ?? raw.ai_instructions ?? null,
    aiSignature: raw.aiSignature ?? raw.ai_signature ?? null,
    autoReplyEnabled: Boolean(raw.autoReplyEnabled ?? raw.auto_reply_enabled ?? raw.autoPublish5Star ?? raw.auto_publish_5_star ?? false),
    autoPublish5Star: Boolean(raw.autoPublish5Star ?? raw.auto_publish_5_star ?? raw.autoReplyEnabled ?? raw.auto_reply_enabled ?? false),
    customKeywords: raw.customKeywords ?? raw.custom_keywords ?? null,
    selectedModel: raw.selectedModel ?? raw.selected_model ?? 'gemini-3.8-flash',
    smsTemplate: raw.smsTemplate ?? raw.sms_template ?? null,
    createdAt: raw.createdAt || raw.created_at || new Date(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date(),
  };
}
