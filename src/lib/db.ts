import { createClient } from '@supabase/supabase-js';
import { getInitialServerBusiness } from '@/lib/server-business';
import fs from 'fs';
import path from 'path';

// Server-side persistent business store for robust navigation and resilience
const globalStore = globalThis as unknown as {
  __rp_businesses?: Map<string, BusinessRecord>;
  __rp_business_settings?: Map<string, any>;
  __rp_review_invites?: Map<string, any>;
};
if (!globalStore.__rp_businesses) {
  globalStore.__rp_businesses = new Map<string, BusinessRecord>();
}
if (!globalStore.__rp_business_settings) {
  globalStore.__rp_business_settings = new Map<string, any>();
}
if (!globalStore.__rp_review_invites) {
  globalStore.__rp_review_invites = new Map<string, any>();
}

function getSettingsCacheFilePath(): string | null {
  try {
    const dir = path.join(process.cwd(), 'node_modules', '.cache');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'rp_business_settings.json');
  } catch {
    return null;
  }
}

function saveSettingsToDisk(record: any) {
  try {
    const filePath = getSettingsCacheFilePath();
    if (!filePath) return;
    let data: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    if (record.id) data[record.id] = record;
    if (record.userId) data[record.userId] = record;
    if (record.user_id) data[record.user_id] = record;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

function loadSettingsFromDisk(targetId: string): any | null {
  try {
    const filePath = getSettingsCacheFilePath();
    if (!filePath || !fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data[targetId] || null;
  } catch {
    return null;
  }
}

function cacheBusinessSettings(record: any) {
  if (!record) return;
  if (!globalStore.__rp_business_settings) globalStore.__rp_business_settings = new Map<string, any>();
  if (record.id) globalStore.__rp_business_settings.set(record.id, record);
  if (record.userId) globalStore.__rp_business_settings.set(record.userId, record);
  if (record.user_id) globalStore.__rp_business_settings.set(record.user_id, record);
  saveSettingsToDisk(record);
}

function getReviewInvitesCacheFilePath(): string | null {
  try {
    const dir = path.join(process.cwd(), 'node_modules', '.cache');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'rp_review_invites.json');
  } catch {
    return null;
  }
}

function normalizeReviewInvite(row: any) {
  if (!row) return null;
  const id = String(row.id || row.token || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const token = String(row.token || id);
  const userId = row.userId || row.user_id || null;
  const businessId = row.businessId || row.business_id || null;
  const customerName = row.customerName || row.customer_name || row.recipientName || row.recipient_name || row.name || 'Valued Customer';
  const customerEmail = row.customerEmail || row.customer_email || row.recipientEmail || row.recipient_email || row.email || (typeof row.customer_phone === 'string' && row.customer_phone.includes('@') ? row.customer_phone : null);
  const customerPhone = row.customerPhone || row.customer_phone || row.recipientPhone || row.phone || '';
  const serviceType = row.serviceType || row.service_type || 'General Service';
  const channel = row.channel || (customerEmail && (!customerPhone || customerPhone.includes('@')) ? 'email' : 'sms');
  const status = row.status || 'sent';
  const openedAt = row.openedAt || row.opened_at || null;
  const clickedAt = row.clickedAt || row.clicked_at || null;
  const clicks = typeof row.clicks === 'number'
    ? row.clicks
    : (row.clicks ? Number(row.clicks) : (openedAt || clickedAt || status === 'opened' || status === 'reviewed' ? 1 : 0));
  const sentAt = row.sentAt || row.sent_at || row.createdAt || row.created_at || new Date().toISOString();
  const createdAt = row.createdAt || row.created_at || sentAt;
  const updatedAt = row.updatedAt || row.updated_at || createdAt;
  const placeId = row.placeId || row.place_id || null;
  const businessName = row.businessName || row.business_name || null;
  const reviewLink = row.reviewLink || row.review_link || row.reviewUrl || null;
  const ratingReceived = row.ratingReceived !== undefined ? row.ratingReceived : (row.rating_received !== undefined ? row.rating_received : null);
  const feedbackText = row.feedbackText || row.feedback_text || null;
  const resolutionStatus = row.resolutionStatus || row.resolution_status || (status === 'resolved' ? 'resolved' : 'unresolved');

  return {
    id,
    token,
    userId,
    user_id: userId,
    businessId,
    business_id: businessId,
    customerName,
    customer_name: customerName,
    customerPhone,
    customer_phone: customerPhone,
    phone: customerPhone,
    customerEmail,
    customer_email: customerEmail,
    email: customerEmail,
    serviceType,
    service_type: serviceType,
    channel,
    status,
    openedAt,
    opened_at: openedAt ? (typeof openedAt === 'string' ? openedAt : new Date(openedAt).toISOString()) : null,
    clickedAt,
    clicked_at: clickedAt ? (typeof clickedAt === 'string' ? clickedAt : new Date(clickedAt).toISOString()) : null,
    clicks,
    sentAt,
    sent_at: typeof sentAt === 'string' ? sentAt : new Date(sentAt).toISOString(),
    createdAt,
    created_at: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
    updatedAt,
    updated_at: typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).toISOString(),
    placeId,
    place_id: placeId,
    businessName,
    business_name: businessName,
    reviewLink,
    review_link: reviewLink,
    ratingReceived,
    rating_received: ratingReceived,
    feedbackText,
    feedback_text: feedbackText,
    resolutionStatus,
    resolution_status: resolutionStatus,
  };
}

function saveReviewInviteToDisk(record: any) {
  try {
    const filePath = getReviewInvitesCacheFilePath();
    if (!filePath) return;
    let data: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    const norm = normalizeReviewInvite(record);
    if (!norm) return;
    if (norm.id) data[norm.id] = norm;
    if (norm.token && norm.token !== norm.id) data[norm.token] = norm;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

function cacheReviewInvite(record: any) {
  if (!record) return;
  if (!globalStore.__rp_review_invites) globalStore.__rp_review_invites = new Map<string, any>();
  const norm = normalizeReviewInvite(record);
  if (!norm) return;
  if (norm.id) globalStore.__rp_review_invites.set(norm.id, norm);
  if (norm.token && norm.token !== norm.id) globalStore.__rp_review_invites.set(norm.token, norm);
  saveReviewInviteToDisk(norm);
}

function findCachedBusinessSettings(candidateIds: string[]): any | null {
  for (const cid of candidateIds) {
    if (!cid) continue;
    if (globalStore.__rp_business_settings?.has(cid)) {
      return globalStore.__rp_business_settings.get(cid);
    }
    const fromDisk = loadSettingsFromDisk(cid);
    if (fromDisk) {
      cacheBusinessSettings(fromDisk);
      return fromDisk;
    }
  }
  return null;
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
  aiPersonality?: string | null;
  aiInstructions?: string | null;
  aiSignature?: string | null;
  autoReplyEnabled?: boolean | null;
  autoPublish5Star?: boolean | null;
  customKeywords?: string | null;
  seoKeywords?: string | null;
  selectedModel?: string | null;
  smsTemplate?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

function mapBusinessSettingsData(input: any) {
  if (!input || typeof input !== 'object') return input;
  const mapped: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    if (key === 'brandVoice') mapped.brand_voice = val;
    else if (key === 'notifyNegativePhone') mapped.notify_negative_phone = val;
    else if (key === 'notifyNegativeEmail') mapped.notify_negative_email = val;
    else if (key === 'notifyNegativeEnabled') mapped.notify_negative_enabled = val;
    else if (key === 'emailAlertsEnabled') mapped.email_alerts_enabled = val;
    else if (key === 'googleReviewUrl') mapped.google_review_url = val;
    else if (key === 'placeId') mapped.place_id = val;
    else if (key === 'businessName') mapped.business_name = val;
    else if (key === 'userId') mapped.user_id = val;
    else if (key === 'seoKeywords') mapped.seo_keywords = val;
    else if (key === 'customKeywords') mapped.seo_keywords = val;
    else if (key === 'customInstructions' || key === 'aiInstructions') mapped.custom_instructions = val;
    else if (key === 'replySignature' || key === 'aiSignature' || key === 'signature') mapped.reply_signature = val;
    else if (key === 'updatedAt') mapped.updated_at = val;
    else if (key === 'createdAt') mapped.created_at = val;
    else mapped[key] = val;
  }
  return mapped;
}

function normalizeBusinessSettingsRow(row: any) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    brandVoice: row.brand_voice ?? row.brandVoice,
    notifyNegativePhone: row.notify_negative_phone ?? row.notifyNegativePhone,
    notifyNegativeEmail: row.notify_negative_email ?? row.notifyNegativeEmail,
    notifyNegativeEnabled: row.notify_negative_enabled ?? row.notifyNegativeEnabled,
    emailAlertsEnabled: row.email_alerts_enabled ?? row.emailAlertsEnabled,
    googleReviewUrl: row.google_review_url ?? row.googleReviewUrl,
    placeId: row.place_id ?? row.placeId,
    businessName: row.business_name ?? row.businessName,
    userId: row.user_id ?? row.userId,
    seoKeywords: row.seo_keywords ?? row.seoKeywords ?? row.custom_keywords ?? row.customKeywords ?? '',
    customInstructions: row.custom_instructions ?? row.customInstructions ?? row.ai_instructions ?? row.aiInstructions ?? '',
    replySignature: row.reply_signature ?? row.replySignature ?? row.ai_signature ?? row.aiSignature ?? '',
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
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
      const rawNegEmailAlert =
        normalizedData.negativeAlertEmailEnabled !== undefined
          ? normalizedData.negativeAlertEmailEnabled
          : (normalizedData.negativeEmailAlertEnabled !== undefined
            ? normalizedData.negativeEmailAlertEnabled
            : (normalizedData.emailAlertsEnabled !== undefined ? normalizedData.emailAlertsEnabled : normalizedData.email_alerts_enabled));

      if (rawNegEmailAlert !== undefined) {
        const val = typeof rawNegEmailAlert === 'boolean'
          ? rawNegEmailAlert
          : (rawNegEmailAlert === 'true' || rawNegEmailAlert === 'on' || rawNegEmailAlert === '1');
        partialUpdate.negative_alert_email_enabled = val;
        partialUpdate.negative_email_alert_enabled = val;
        partialUpdate.negativeAlertEmailEnabled = val;
        partialUpdate.negativeEmailAlertEnabled = val;
        partialUpdate.emailAlertsEnabled = val;
        partialUpdate.email_alerts_enabled = val;
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
        partialUpdate.ai_personality = normalizedData.aiTone;
        partialUpdate.aiPersonality = normalizedData.aiTone;
      }
      if (normalizedData.aiPersonality !== undefined) {
        partialUpdate.ai_personality = normalizedData.aiPersonality;
        partialUpdate.aiPersonality = normalizedData.aiPersonality;
        partialUpdate.ai_tone = normalizedData.aiPersonality;
        partialUpdate.aiTone = normalizedData.aiPersonality;
        partialUpdate.brand_voice = normalizedData.aiPersonality;
        partialUpdate.brandVoice = normalizedData.aiPersonality;
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
        partialUpdate.seo_keywords = normalizedData.customKeywords;
        partialUpdate.seoKeywords = normalizedData.customKeywords;
      }
      if (normalizedData.seoKeywords !== undefined) {
        partialUpdate.seo_keywords = normalizedData.seoKeywords;
        partialUpdate.seoKeywords = normalizedData.seoKeywords;
        partialUpdate.custom_keywords = normalizedData.seoKeywords;
        partialUpdate.customKeywords = normalizedData.seoKeywords;
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
              ai_tone: normalizedData.aiTone || normalizedData.aiPersonality || 'Professional & Warm',
              ai_personality: normalizedData.aiPersonality || normalizedData.aiTone || 'Professional & Warm',
              brand_voice: normalizedData.brandVoice || normalizedData.aiPersonality || normalizedData.aiTone || 'Professional & Warm',
              ai_instructions: normalizedData.aiInstructions ?? null,
              ai_signature: normalizedData.aiSignature ?? null,
              auto_reply_enabled: Boolean(normalizedData.autoReplyEnabled),
              auto_publish_5_star: Boolean(normalizedData.autoReplyEnabled),
              custom_keywords: normalizedData.customKeywords || normalizedData.seoKeywords || null,
              seo_keywords: normalizedData.seoKeywords || normalizedData.customKeywords || null,
              selected_model: normalizedData.selectedModel || 'gemini-1.5-flash',
              sms_template: normalizedData.smsTemplate ?? null,
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
          if (normalizedData.positiveAlertEmail !== undefined) {
            const raw = normalizedData.positiveAlertEmail;
            profileUpdates.notify_positive_email = (raw === 'true' || raw === 'false' || typeof raw !== 'string') ? '' : raw;
          }
          if (normalizedData.notifyPositiveEmail !== undefined) {
            const raw = normalizedData.notifyPositiveEmail;
            profileUpdates.notify_positive_email = (raw === 'true' || raw === 'false' || typeof raw !== 'string') ? '' : raw;
          }
          if (normalizedData.notifyPositiveEnabled !== undefined) {
            profileUpdates.notify_positive_enabled = Boolean(normalizedData.notifyPositiveEnabled);
          } else if (normalizedData.positiveAlertEmailEnabled !== undefined) {
            profileUpdates.notify_positive_enabled = Boolean(normalizedData.positiveAlertEmailEnabled);
          }
          if (normalizedData.positiveAlertPhone !== undefined) profileUpdates.positive_alert_phone = normalizedData.positiveAlertPhone;
          if (normalizedData.notifyPositivePhone !== undefined) profileUpdates.notify_positive_phone = normalizedData.notifyPositivePhone;
          if (normalizedData.notifyPositiveSms !== undefined) profileUpdates.notify_positive_sms = Boolean(normalizedData.notifyPositiveSms);
          if (normalizedData.googleReviewUrl !== undefined) profileUpdates.review_url = normalizedData.googleReviewUrl;
          if (normalizedData.isGoogleConnected !== undefined) profileUpdates.google_connected = normalizedData.isGoogleConnected;
          if (normalizedData.placeId !== undefined) profileUpdates.google_place_id = normalizedData.placeId;
          if (normalizedData.aiTone !== undefined || normalizedData.aiPersonality !== undefined) {
            const t = normalizedData.aiPersonality || normalizedData.aiTone;
            profileUpdates.ai_tone = t;
            profileUpdates.ai_personality = t;
          }
          if (normalizedData.brandVoice !== undefined || normalizedData.aiTone !== undefined || normalizedData.aiPersonality !== undefined) {
            profileUpdates.brand_voice = normalizedData.brandVoice || normalizedData.aiPersonality || normalizedData.aiTone;
          }
          if (normalizedData.aiInstructions !== undefined) profileUpdates.ai_instructions = normalizedData.aiInstructions;
          if (normalizedData.autoReplyEnabled !== undefined) profileUpdates.auto_reply_enabled = normalizedData.autoReplyEnabled;
          if (normalizedData.selectedModel !== undefined) profileUpdates.selected_model = normalizedData.selectedModel;
          if (normalizedData.customKeywords !== undefined || normalizedData.seoKeywords !== undefined) {
            profileUpdates.seo_keywords = normalizedData.seoKeywords || normalizedData.customKeywords;
          }

          if (UUID_REGEX.test(targetId)) {
            await supabase.from('profiles').update(profileUpdates).eq('id', targetId);
          } else {
            await supabase.from('profiles').update(profileUpdates).eq('clerk_user_id', targetId);
          }
        } catch {}

        try {
          let profileUuid: string | null = null;
          if (UUID_REGEX.test(targetId)) {
            profileUuid = targetId;
          } else {
            const { data: prof } = await supabase.from('profiles').select('id').eq('clerk_user_id', targetId).maybeSingle();
            if (prof?.id) profileUuid = prof.id;
          }

          const settingsUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (normalizedData.negativeAlertEmail !== undefined || normalizedData.notifyNegativeEmail !== undefined) {
            const em = normalizedData.notifyNegativeEmail ?? normalizedData.negativeAlertEmail ?? null;
            settingsUpdates.negative_alert_email = em;
            settingsUpdates.notify_negative_email = em;
          }
          if (normalizedData.negativeAlertPhone !== undefined || normalizedData.notifyNegativePhone !== undefined) {
            const ph = normalizedData.notifyNegativePhone ?? normalizedData.negativeAlertPhone ?? null;
            settingsUpdates.negative_alert_phone = ph;
            settingsUpdates.notify_negative_phone = ph;
          }
          if (isSmsActive !== undefined) {
            const val = Boolean(isSmsActive);
            settingsUpdates.notify_negative_enabled = val;
            settingsUpdates.notify_negative_sms = val;
            settingsUpdates.negative_alert_sms_enabled = val;
            settingsUpdates.negative_sms_alert_enabled = val;
            settingsUpdates.sms_alerts_enabled = val;
          }
          const rawEmailSet =
            normalizedData.emailAlertsEnabled !== undefined
              ? normalizedData.emailAlertsEnabled
              : (normalizedData.negativeAlertEmailEnabled !== undefined
                ? normalizedData.negativeAlertEmailEnabled
                : (normalizedData.negativeEmailAlertEnabled !== undefined ? normalizedData.negativeEmailAlertEnabled : normalizedData.email_alerts_enabled));

          if (rawEmailSet !== undefined) {
            const val = typeof rawEmailSet === 'boolean'
              ? rawEmailSet
              : (rawEmailSet === 'true' || rawEmailSet === 'on' || rawEmailSet === '1');
            settingsUpdates.email_alerts_enabled = val;
            settingsUpdates.negative_alert_email_enabled = val;
          }
          if (normalizedData.positiveAlertEmail !== undefined) settingsUpdates.positive_alert_email = normalizedData.positiveAlertEmail;
          if (normalizedData.positiveAlertPhone !== undefined) settingsUpdates.positive_alert_phone = normalizedData.positiveAlertPhone;
          if (normalizedData.googleReviewUrl !== undefined) settingsUpdates.google_review_url = normalizedData.googleReviewUrl;
          if (normalizedData.isGoogleConnected !== undefined) settingsUpdates.google_connected = normalizedData.isGoogleConnected;
          if (normalizedData.placeId !== undefined) settingsUpdates.place_id = normalizedData.placeId;

          const rawV = (normalizedData.brandVoice || normalizedData.aiPersonality || normalizedData.aiTone) as string | null | undefined;
          if (rawV !== undefined) {
            const snakeV = toSnakeBrandVoice(typeof rawV === 'string' ? rawV : null);
            const dispV = toDisplayTone(typeof rawV === 'string' ? rawV : null);
            settingsUpdates.brand_voice = snakeV;
            settingsUpdates.ai_tone = dispV;
            settingsUpdates.ai_personality = dispV;
          }
          if (normalizedData.aiInstructions !== undefined) settingsUpdates.ai_instructions = normalizedData.aiInstructions;
          if (normalizedData.aiSignature !== undefined) settingsUpdates.ai_signature = normalizedData.aiSignature;
          if (normalizedData.autoReplyEnabled !== undefined) {
            settingsUpdates.auto_reply_enabled = normalizedData.autoReplyEnabled;
            settingsUpdates.auto_publish_5_star = normalizedData.autoReplyEnabled;
          }
          if (normalizedData.customKeywords !== undefined || normalizedData.seoKeywords !== undefined) {
            const k = normalizedData.seoKeywords || normalizedData.customKeywords;
            settingsUpdates.custom_keywords = k;
            settingsUpdates.seo_keywords = k;
          }
          if (normalizedData.selectedModel !== undefined) settingsUpdates.selected_model = normalizedData.selectedModel;
          if (normalizedData.smsTemplate !== undefined) settingsUpdates.sms_template = normalizedData.smsTemplate;

          if (profileUuid) {
            const { data: existingSettings } = await supabase
              .from('business_settings')
              .select('id')
              .eq('user_id', profileUuid)
              .maybeSingle();

            if (existingSettings?.id) {
              await supabase.from('business_settings').update(settingsUpdates).eq('id', existingSettings.id);
            } else {
              await supabase.from('business_settings').insert({
                user_id: profileUuid,
                ...settingsUpdates,
              });
            }
          }
        } catch (err) {
          console.error('[DB_BUSINESS_SETTINGS_UPDATE_ERROR]', err);
        }
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
            aiTone: data.aiTone || 'Professional & Warm',
            ai_tone: data.aiTone || 'Professional & Warm',
            aiPersonality: data.aiPersonality || data.aiTone || 'Professional & Warm',
            ai_personality: data.aiPersonality || data.aiTone || 'Professional & Warm',
            brandVoice: data.brandVoice || data.aiTone || 'Professional & Warm',
            brand_voice: data.brandVoice || data.aiTone || 'Professional & Warm',
            aiInstructions: data.aiInstructions ?? null,
            ai_instructions: data.aiInstructions ?? null,
            aiSignature: data.aiSignature ?? null,
            ai_signature: data.aiSignature ?? null,
            autoReplyEnabled: Boolean(data.autoReplyEnabled ?? data.autoPublish5Star ?? false),
            auto_reply_enabled: Boolean(data.autoReplyEnabled ?? data.autoPublish5Star ?? false),
            autoPublish5Star: Boolean(data.autoReplyEnabled ?? data.autoPublish5Star ?? false),
            auto_publish_5_star: Boolean(data.autoReplyEnabled ?? data.autoPublish5Star ?? false),
            customKeywords: data.customKeywords || data.seoKeywords || null,
            custom_keywords: data.customKeywords || data.seoKeywords || null,
            seoKeywords: data.seoKeywords || data.customKeywords || null,
            seo_keywords: data.seoKeywords || data.customKeywords || null,
            selectedModel: (data.selectedModel as string) || 'gemini-1.5-flash',
            selected_model: (data.selectedModel as string) || 'gemini-1.5-flash',
            smsTemplate: data.smsTemplate ?? null,
            sms_template: data.smsTemplate ?? null,
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
              ai_tone: data.aiTone || 'Professional & Warm',
              ai_personality: data.aiPersonality || data.aiTone || 'Professional & Warm',
              brand_voice: data.brandVoice || data.aiTone || 'Professional & Warm',
              ai_instructions: data.aiInstructions ?? null,
              ai_signature: data.aiSignature ?? null,
              auto_reply_enabled: Boolean(data.autoReplyEnabled ?? data.autoPublish5Star ?? false),
              auto_publish_5_star: Boolean(data.autoReplyEnabled ?? data.autoPublish5Star ?? false),
              custom_keywords: data.customKeywords || data.seoKeywords || null,
              seo_keywords: data.seoKeywords || data.customKeywords || null,
              selected_model: (data.selectedModel as string) || 'gemini-1.5-flash',
              sms_template: data.smsTemplate ?? null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch {}
      }

      return payload;
    },
  },
  businessSettings: {
    findMany: async (args?: any) => {
      const supabase = getAdminClient();
      if (!supabase) return [];
      try {
        const { data } = await supabase.from('business_settings').select('*');
        return (data || []).map(normalizeBusinessSettingsRow);
      } catch {
        return [];
      }
    },
    findFirst: async (args?: any) => {
      const supabase = getAdminClient();
      let candidateUserIds: string[] = [];
      let candidateIds: string[] = [];

      if (args?.where?.id) candidateIds.push(String(args.where.id));
      if (args?.where?.userId) candidateUserIds.push(String(args.where.userId));
      if (args?.where?.user_id) candidateUserIds.push(String(args.where.user_id));

      if (Array.isArray(args?.where?.OR)) {
        for (const item of args.where.OR) {
          if (item?.id) candidateIds.push(String(item.id));
          if (item?.userId) candidateUserIds.push(String(item.userId));
          if (item?.user_id) candidateUserIds.push(String(item.user_id));
        }
      }

      candidateUserIds = Array.from(new Set(candidateUserIds.filter(Boolean)));
      candidateIds = Array.from(new Set(candidateIds.filter(Boolean)));

      if (supabase) {
        try {
          if (candidateIds.length > 0) {
            const { data, error } = await supabase
              .from('business_settings')
              .select('*')
              .in('id', candidateIds)
              .limit(1);
            if (!error && data && data[0]) {
              const row = normalizeBusinessSettingsRow(data[0]);
              cacheBusinessSettings(row);
              return row;
            }
          }

          const resolvedUserUuids: string[] = [];
          for (const uId of candidateUserIds) {
            if (UUID_REGEX.test(uId)) {
              resolvedUserUuids.push(uId);
            } else {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id')
                .eq('clerk_user_id', uId)
                .maybeSingle();
              if (prof?.id) resolvedUserUuids.push(prof.id);
            }
          }

          if (resolvedUserUuids.length > 0) {
            const { data, error } = await supabase
              .from('business_settings')
              .select('*')
              .in('user_id', resolvedUserUuids)
              .order('updated_at', { ascending: false })
              .limit(1);
            if (!error && data && data[0]) {
              const row = normalizeBusinessSettingsRow(data[0]);
              cacheBusinessSettings(row);
              return row;
            }
          }

          // Fallback to most recent record if orderBy was passed or no candidate IDs matched
          if (candidateIds.length === 0 && resolvedUserUuids.length === 0) {
            const { data, error } = await supabase
              .from('business_settings')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(1);
            if (!error && data && data[0]) {
              const row = normalizeBusinessSettingsRow(data[0]);
              cacheBusinessSettings(row);
              return row;
            }
          }
        } catch (err) {
          console.error('[db.businessSettings.findFirst] error:', err);
        }
      }

      // Memory and disk cache fallback
      const cached = findCachedBusinessSettings([...candidateIds, ...candidateUserIds]);
      if (cached) return normalizeBusinessSettingsRow(cached);

      if (globalStore.__rp_business_settings && globalStore.__rp_business_settings.size > 0) {
        const first = globalStore.__rp_business_settings.values().next().value;
        if (first) return normalizeBusinessSettingsRow(first);
      }

      return null;
    },
    findUnique: async (args?: any) => {
      return db.businessSettings.findFirst(args);
    },
    update: async (args: { where: any; data: any }) => {
      const supabase = getAdminClient();
      const targetId = args.where.id || args.where.userId || args.where.user_id;
      let filterCol = args.where.id ? 'id' : 'user_id';
      let resolvedId = targetId;
      if (filterCol === 'user_id' && !UUID_REGEX.test(targetId) && supabase) {
        const { data: prof } = await supabase.from('profiles').select('id').eq('clerk_user_id', targetId).maybeSingle();
        if (prof?.id) resolvedId = prof.id;
      }
      const payload = mapBusinessSettingsData(args.data);
      if (payload.updated_at === undefined) {
        payload.updated_at = new Date().toISOString();
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('business_settings')
          .update(payload)
          .eq(filterCol, resolvedId)
          .select()
          .maybeSingle();

        if (error) {
          console.error('[db.businessSettings.update] Supabase error:', error);
          if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
            console.warn('[db.businessSettings.update] Retrying without new schema columns...');
            const retryPayload = { ...payload };
            if (error.message?.includes('custom_instructions') || error.code === '42703') delete retryPayload.custom_instructions;
            if (error.message?.includes('reply_signature') || error.code === '42703') delete retryPayload.reply_signature;
            if (error.message?.includes('seo_keywords') || error.code === '42703') delete retryPayload.seo_keywords;
            const { data: retryData, error: retryError } = await supabase
              .from('business_settings')
              .update(retryPayload)
              .eq(filterCol, resolvedId)
              .select()
              .maybeSingle();
            if (!retryError && retryData) {
              const row = normalizeBusinessSettingsRow(retryData);
              cacheBusinessSettings(row);
              return row;
            }
          }
          throw new Error(error.message || 'Database update failed');
        }
        if (data) {
          const row = normalizeBusinessSettingsRow(data);
          cacheBusinessSettings(row);
          return row;
        }
      }

      const row = normalizeBusinessSettingsRow({
        id: args.where.id || resolvedId,
        user_id: resolvedId,
        ...args.data,
        updated_at: new Date().toISOString(),
      });
      cacheBusinessSettings(row);
      return row;
    },
    upsert: async (args: { where: any; update: any; create: any }) => {
      const existing = await db.businessSettings.findFirst({ where: args.where });
      if (existing) {
        return db.businessSettings.update({
          where: { id: existing.id },
          data: args.update,
        });
      } else {
        return db.businessSettings.create({
          data: {
            ...args.create,
            ...(args.where.userId ? { userId: args.where.userId } : {}),
            ...(args.where.user_id ? { user_id: args.where.user_id } : {}),
            ...(args.where.id ? { id: args.where.id } : {}),
          },
        });
      }
    },
    create: async (args: { data: any }) => {
      const supabase = getAdminClient();
      const payload = mapBusinessSettingsData(args.data);
      if (payload.user_id && !UUID_REGEX.test(payload.user_id) && supabase) {
        const { data: prof } = await supabase.from('profiles').select('id').eq('clerk_user_id', payload.user_id).maybeSingle();
        if (prof?.id) payload.user_id = prof.id;
      }
      if (!payload.id) {
        payload.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `settings_${Date.now()}`;
      }
      if (payload.created_at === undefined) {
        payload.created_at = new Date().toISOString();
      }
      if (payload.updated_at === undefined) {
        payload.updated_at = new Date().toISOString();
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('business_settings')
          .insert(payload)
          .select()
          .maybeSingle();

        if (error) {
          console.error('[db.businessSettings.create] Supabase error:', error);
          if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
            console.warn('[db.businessSettings.create] Retrying without new schema columns...');
            const retryPayload = { ...payload };
            if (error.message?.includes('custom_instructions') || error.code === '42703') delete retryPayload.custom_instructions;
            if (error.message?.includes('reply_signature') || error.code === '42703') delete retryPayload.reply_signature;
            if (error.message?.includes('seo_keywords') || error.code === '42703') delete retryPayload.seo_keywords;
            const { data: retryData, error: retryError } = await supabase
              .from('business_settings')
              .insert(retryPayload)
              .select()
              .maybeSingle();
            if (!retryError && retryData) {
              const row = normalizeBusinessSettingsRow(retryData);
              cacheBusinessSettings(row);
              return row;
            }
          }
          throw new Error(error.message || 'Database insert failed');
        }
        if (data) {
          const row = normalizeBusinessSettingsRow(data);
          cacheBusinessSettings(row);
          return row;
        }
      }

      const row = normalizeBusinessSettingsRow(payload);
      cacheBusinessSettings(row);
      return row;
    },
  },
  profile: {
    findFirst: async (args?: {
      where?: {
        clerkUserId?: string | null;
        clerk_user_id?: string | null;
        id?: string | null;
        [key: string]: any;
      };
      orderBy?: any;
      [key: string]: any;
    }) => {
      const supabase = getAdminClient();
      if (!supabase) return null;
      try {
        let candidateClerkIds: string[] = [];
        let candidateIds: string[] = [];

        if (args?.where?.clerkUserId) candidateClerkIds.push(String(args.where.clerkUserId));
        if (args?.where?.clerk_user_id) candidateClerkIds.push(String(args.where.clerk_user_id));
        if (args?.where?.id) candidateIds.push(String(args.where.id));

        if (Array.isArray(args?.where?.OR)) {
          for (const item of args.where.OR) {
            if (item?.clerkUserId) candidateClerkIds.push(String(item.clerkUserId));
            if (item?.clerk_user_id) candidateClerkIds.push(String(item.clerk_user_id));
            if (item?.id) candidateIds.push(String(item.id));
          }
        }

        candidateClerkIds = Array.from(new Set(candidateClerkIds.filter(Boolean)));
        candidateIds = Array.from(new Set(candidateIds.filter(Boolean)));

        const normalizeProfile = (row: any) => {
          if (!row) return null;
          const rawEmail = row.notify_positive_email ?? row.notifyPositiveEmail ?? '';
          const safeEmail = (rawEmail === 'true' || rawEmail === 'false' || typeof rawEmail !== 'string') ? '' : rawEmail;
          const rawEnabled = row.notify_positive_enabled ?? row.notifyPositiveEnabled;
          const safeEnabled = rawEnabled !== undefined && rawEnabled !== null ? Boolean(rawEnabled) : true;
          return {
            ...row,
            clerkUserId: row.clerk_user_id || row.clerkUserId || null,
            notifyPositivePhone: row.notify_positive_phone || row.notifyPositivePhone || '',
            notifyPositiveSms: Boolean(row.notify_positive_sms ?? row.notifyPositiveSms),
            notifyPositiveEmail: safeEmail,
            notifyPositiveEnabled: safeEnabled,
          };
        };

        // 1. Try finding by clerk_user_id
        if (candidateClerkIds.length > 0) {
          const { data: byClerk } = await supabase
            .from('profiles')
            .select('*')
            .in('clerk_user_id', candidateClerkIds)
            .limit(1);
          if (byClerk && byClerk[0]) return normalizeProfile(byClerk[0]);
        }

        // 2. Try finding by profile id
        if (candidateIds.length > 0) {
          const { data: byId } = await supabase
            .from('profiles')
            .select('*')
            .in('id', candidateIds)
            .limit(1);
          if (byId && byId[0]) return normalizeProfile(byId[0]);
        }

        // 3. Check for unassigned profiles (where clerkUserId is null)
        const wantsNullClerk = args?.where?.clerkUserId === null || args?.where?.clerk_user_id === null;
        if (wantsNullClerk) {
          const { data: unassigned } = await supabase
            .from('profiles')
            .select('*')
            .is('clerk_user_id', null)
            .order('created_at', { ascending: false })
            .limit(1);
          if (unassigned && unassigned[0]) return normalizeProfile(unassigned[0]);
        }

        // 4. Fallback: if no criteria specified or fallback requested
        if (candidateClerkIds.length === 0 && candidateIds.length === 0) {
          const { data: fallback } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
          if (fallback && fallback[0]) return normalizeProfile(fallback[0]);
        }

        return null;
      } catch {
        return null;
      }
    },
    update: async (args: { where: { id?: string; [key: string]: any }; data: any }) => {
      const supabase = getAdminClient();
      const id = args?.where?.id;
      const updateData: any = {};
      if (args?.data?.clerkUserId !== undefined) updateData.clerk_user_id = args.data.clerkUserId;
      if (args?.data?.clerk_user_id !== undefined) updateData.clerk_user_id = args.data.clerk_user_id;
      if (args?.data?.businessName !== undefined) updateData.business_name = args.data.businessName;
      if (args?.data?.notifyPositivePhone !== undefined) updateData.notify_positive_phone = args.data.notifyPositivePhone;
      if (args?.data?.notify_positive_phone !== undefined) updateData.notify_positive_phone = args.data.notify_positive_phone;
      if (args?.data?.notifyPositiveSms !== undefined) updateData.notify_positive_sms = Boolean(args.data.notifyPositiveSms);
      if (args?.data?.notify_positive_sms !== undefined) updateData.notify_positive_sms = Boolean(args.data.notify_positive_sms);

      const rawPosEmail = args?.data?.notifyPositiveEmail ?? args?.data?.notify_positive_email;
      if (rawPosEmail !== undefined) {
        updateData.notify_positive_email = (rawPosEmail === 'true' || rawPosEmail === 'false' || typeof rawPosEmail !== 'string')
          ? ''
          : rawPosEmail;
      }
      const rawPosEnabled = args?.data?.notifyPositiveEnabled ?? args?.data?.notify_positive_enabled;
      if (rawPosEnabled !== undefined) {
        updateData.notify_positive_enabled = Boolean(rawPosEnabled);
      }

      if (args?.data?.updatedAt !== undefined) updateData.updated_at = new Date().toISOString();

      if (supabase && id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();
          if (error) {
            console.error('[db.profile.update] Supabase error:', error);
          }
          if (data) {
            const rawEmail = data.notify_positive_email ?? data.notifyPositiveEmail ?? updateData.notify_positive_email ?? '';
            return {
              ...data,
              clerkUserId: data.clerk_user_id || data.clerkUserId,
              notifyPositivePhone: data.notify_positive_phone ?? data.notifyPositivePhone ?? args.data.notifyPositivePhone ?? '',
              notifyPositiveSms: Boolean(data.notify_positive_sms ?? data.notifyPositiveSms ?? args.data.notifyPositiveSms),
              notifyPositiveEmail: (rawEmail === 'true' || rawEmail === 'false' || typeof rawEmail !== 'string') ? '' : rawEmail,
              notifyPositiveEnabled: Boolean(data.notify_positive_enabled ?? data.notifyPositiveEnabled ?? updateData.notify_positive_enabled ?? true),
            };
          }
        } catch (err) {
          console.error('[db.profile.update] error:', err);
        }
      }
      const rawFallbackEmail = args.data.notifyPositiveEmail ?? args.data.notify_positive_email ?? '';
      const rawFallbackEnabled = args.data.notifyPositiveEnabled ?? args.data.notify_positive_enabled;
      return {
        id,
        ...args.data,
        clerkUserId: args.data.clerkUserId || args.data.clerk_user_id,
        notifyPositivePhone: args.data.notifyPositivePhone ?? args.data.notify_positive_phone ?? '',
        notifyPositiveSms: Boolean(args.data.notifyPositiveSms ?? args.data.notify_positive_sms),
        notifyPositiveEmail: (rawFallbackEmail === 'true' || rawFallbackEmail === 'false' || typeof rawFallbackEmail !== 'string') ? '' : rawFallbackEmail,
        notifyPositiveEnabled: rawFallbackEnabled !== undefined && rawFallbackEnabled !== null ? Boolean(rawFallbackEnabled) : true,
      };
    },
    create: async (args: { data: any }) => {
      const supabase = getAdminClient();
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
      const id = args.data.id || generatedId;

      const rawCreateEmail = args.data.notifyPositiveEmail || args.data.notify_positive_email || '';
      const safeCreateEmail = (rawCreateEmail === 'true' || rawCreateEmail === 'false' || typeof rawCreateEmail !== 'string') ? '' : rawCreateEmail;
      const rawCreateEnabled = args.data.notifyPositiveEnabled ?? args.data.notify_positive_enabled;
      const safeCreateEnabled = rawCreateEnabled !== undefined && rawCreateEnabled !== null ? Boolean(rawCreateEnabled) : true;

      const payload: any = {
        clerk_user_id: args.data.clerkUserId || args.data.clerk_user_id || null,
        full_name: args.data.fullName || args.data.full_name || null,
        business_name: args.data.businessName || args.data.business_name || '',
        business_category: args.data.businessCategory || args.data.business_category || '',
        notify_positive_phone: args.data.notifyPositivePhone || args.data.notify_positive_phone || '',
        notify_positive_sms: Boolean(args.data.notifyPositiveSms ?? args.data.notify_positive_sms),
        notify_positive_email: safeCreateEmail,
        notify_positive_enabled: safeCreateEnabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (id) {
        payload.id = id;
      }

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .insert(payload)
            .select()
            .maybeSingle();

          if (error) {
            console.error('[db.profile.create] Supabase error:', error);
          }
          if (data) {
            return {
              ...data,
              clerkUserId: data.clerk_user_id || data.clerkUserId,
              notifyPositivePhone: data.notify_positive_phone ?? data.notifyPositivePhone ?? payload.notify_positive_phone,
              notifyPositiveSms: Boolean(data.notify_positive_sms ?? data.notifyPositiveSms ?? payload.notify_positive_sms),
              notifyPositiveEmail: safeCreateEmail,
              notifyPositiveEnabled: safeCreateEnabled,
            };
          }
        } catch (err) {
          console.error('[db.profile.create] error:', err);
        }
      }

      return {
        id: id || `prof_${Date.now()}`,
        ...args.data,
        clerkUserId: payload.clerk_user_id,
        notifyPositivePhone: payload.notify_positive_phone,
        notifyPositiveSms: payload.notify_positive_sms,
        notifyPositiveEmail: safeCreateEmail,
        notifyPositiveEnabled: safeCreateEnabled,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
      };
    },
    findUnique: async (args?: any) => {
      return (db as any).profile.findFirst(args);
    },
    findMany: async (args?: any) => {
      const supabase = getAdminClient();
      if (!supabase) return [];
      try {
        const { data } = await supabase.from('profiles').select('*');
        return (data || []).map((row: any) => ({
          ...row,
          clerkUserId: row.clerk_user_id || row.clerkUserId || null,
        }));
      } catch {
        return [];
      }
    },
  },
  reviewInvite: {
    create: async (args: { data: any }) => {
      const input = args.data || {};
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `inv_${Date.now()}`;
      const id = input.id || input.token || generatedId;
      const token = input.token || id;

      const norm = normalizeReviewInvite({
        ...input,
        id,
        token,
      });

      if (!norm) {
        throw new Error('Failed to normalize review invite record');
      }

      // Cache to memory and disk immediately
      cacheReviewInvite(norm);

      // Persist to Supabase review_invites table
      const supabase = getAdminClient();
      if (supabase) {
        try {
          // 1. Resolve user_id: if Clerk ID, resolve to Supabase profiles.id (UUID)
          let resolvedUserId = norm.user_id || norm.userId || null;
          if (resolvedUserId && !UUID_REGEX.test(resolvedUserId)) {
            try {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id')
                .eq('clerk_user_id', resolvedUserId)
                .maybeSingle();
              if (prof?.id && UUID_REGEX.test(prof.id)) {
                resolvedUserId = prof.id;
              }
            } catch {}
          }

          // 2. Resolve business_id: must be a valid UUID in profiles.id if constrained
          let resolvedBusinessId = norm.business_id || norm.businessId || null;
          if (resolvedBusinessId && !UUID_REGEX.test(resolvedBusinessId)) {
            resolvedBusinessId = null;
          }

          // Generate or validate UUID for id (Supabase review_invites.id is type uuid)
          const safeId = (norm.id && UUID_REGEX.test(norm.id))
            ? norm.id
            : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null);

          // Build primary payload
          const primaryPayload: Record<string, any> = {
            customer_name: norm.customer_name || 'Customer',
            customer_phone: norm.customer_phone || norm.phone || norm.customer_email || norm.email || '',
            service_type: norm.service_type || 'General Service',
            status: norm.status || 'sent',
            sent_at: norm.sent_at || new Date().toISOString(),
            created_at: norm.created_at || new Date().toISOString(),
          };

          if (safeId) primaryPayload.id = safeId;
          if (resolvedUserId && UUID_REGEX.test(resolvedUserId)) primaryPayload.user_id = resolvedUserId;
          if (resolvedBusinessId && UUID_REGEX.test(resolvedBusinessId)) primaryPayload.business_id = resolvedBusinessId;
          if (norm.customer_email || norm.email) primaryPayload.customer_email = norm.customer_email || norm.email;
          if (norm.channel) primaryPayload.channel = norm.channel;
          if (norm.token) primaryPayload.token = norm.token;
          if (norm.place_id) primaryPayload.place_id = norm.place_id;
          if (norm.business_name) primaryPayload.business_name = norm.business_name;
          if (norm.review_link) primaryPayload.review_link = norm.review_link;

          const { data: insData, error: insError } = await supabase
            .from('review_invites')
            .insert([primaryPayload])
            .select()
            .maybeSingle();

          if (insError) {
            console.warn('[db.reviewInvite.create] Primary insert note:', insError.message, insError.code);

            // Retry 1: If foreign key error on business_id (code 23503), remove business_id
            let retryPayload = { ...primaryPayload };
            if (insError.code === '23503' || insError.message?.includes('business_id')) {
              delete retryPayload.business_id;
            }

            // Retry 2: If column does not exist (code 42703), strip extended columns
            if (insError.code === '42703' || insError.message?.includes('column') || insError.message?.includes('does not exist')) {
              delete retryPayload.token;
              delete retryPayload.review_link;
              delete retryPayload.business_name;
              delete retryPayload.place_id;
              delete retryPayload.customer_email;
              delete retryPayload.channel;
              delete retryPayload.business_id;
            }

            const { data: retryData, error: retryErr } = await supabase
              .from('review_invites')
              .insert([retryPayload])
              .select()
              .maybeSingle();

            if (retryErr) {
              console.warn('[db.reviewInvite.create] Retry note, trying base schema:', retryErr.message);
              // Absolute base schema guaranteed by initial migration:
              const basePayload: Record<string, any> = {
                customer_name: norm.customer_name || 'Customer',
                customer_phone: norm.customer_phone || norm.phone || '',
                service_type: norm.service_type || 'General Service',
                status: norm.status || 'sent',
                sent_at: norm.sent_at || new Date().toISOString(),
                created_at: norm.created_at || new Date().toISOString(),
              };
              if (safeId) basePayload.id = safeId;
              if (resolvedUserId && UUID_REGEX.test(resolvedUserId)) basePayload.user_id = resolvedUserId;

              const { data: baseData, error: baseErr } = await supabase
                .from('review_invites')
                .insert([basePayload])
                .select()
                .maybeSingle();

              if (baseErr) {
                console.error('[db.reviewInvite.create] Base insert error:', baseErr.message);
              } else if (baseData) {
                norm.id = baseData.id;
                cacheReviewInvite(norm);
              }
            } else if (retryData) {
              norm.id = retryData.id;
              cacheReviewInvite(norm);
            }
          } else if (insData) {
            norm.id = insData.id;
            cacheReviewInvite(norm);
          }
        } catch (err) {
          console.warn('[db.reviewInvite.create] Supabase insert note:', err);
        }
      }

      return norm;
    },

    findMany: async (args?: {
      where?: any;
      orderBy?: any;
      take?: number;
      [key: string]: any;
    }) => {
      const supabase = getAdminClient();
      let records: any[] = [];

      // 1. Fetch from Supabase
      if (supabase) {
        try {
          const { data } = await supabase
            .from('review_invites')
            .select('*')
            .order('created_at', { ascending: false });
          if (data && Array.isArray(data)) {
            for (const row of data) {
              const norm = normalizeReviewInvite(row);
              if (norm) {
                records.push(norm);
                cacheReviewInvite(norm);
              }
            }
          }
        } catch {}
      }

      // 2. Merge memory cache records
      if (globalStore.__rp_review_invites && globalStore.__rp_review_invites.size > 0) {
        for (const inv of globalStore.__rp_review_invites.values()) {
          const norm = normalizeReviewInvite(inv);
          if (norm && !records.some(r => r.id === norm.id || (r.token && r.token === norm.token))) {
            records.push(norm);
          }
        }
      }

      // 3. Merge disk cache records
      try {
        const filePath = getReviewInvitesCacheFilePath();
        if (filePath && fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          for (const raw of Object.values(data)) {
            const norm = normalizeReviewInvite(raw);
            if (norm && !records.some(r => r.id === norm.id || (r.token && r.token === norm.token))) {
              records.push(norm);
            }
          }
        }
      } catch {}

      // 4. Apply where filtering if provided
      if (args?.where) {
        if (args.where.id || args.where.token) {
          const tId = String(args.where.id || args.where.token);
          records = records.filter(r => r.id === tId || r.token === tId);
        }

        const candidateUserIds: string[] = [];
        const candidateBusinessIds: string[] = [];
        const candidateIds: string[] = [];

        if (args.where.userId) candidateUserIds.push(String(args.where.userId));
        if (args.where.user_id) candidateUserIds.push(String(args.where.user_id));
        if (args.where.businessId) candidateBusinessIds.push(String(args.where.businessId));
        if (args.where.business_id) candidateBusinessIds.push(String(args.where.business_id));
        if (args.where.business?.userId) candidateUserIds.push(String(args.where.business.userId));

        if (Array.isArray(args.where.OR)) {
          for (const item of args.where.OR) {
            if (item?.id) candidateIds.push(String(item.id));
            if (item?.token) candidateIds.push(String(item.token));
            if (item?.userId) candidateUserIds.push(String(item.userId));
            if (item?.user_id) candidateUserIds.push(String(item.user_id));
            if (item?.businessId) candidateBusinessIds.push(String(item.businessId));
            if (item?.business_id) candidateBusinessIds.push(String(item.business_id));
            if (item?.business?.userId) candidateUserIds.push(String(item.business.userId));
          }
        }

        const validCandIds = new Set(candidateIds.filter(Boolean));
        const validCandUserIds = new Set(candidateUserIds.filter(Boolean));
        const validCandBizIds = new Set(candidateBusinessIds.filter(Boolean));

        if (validCandIds.size > 0) {
          records = records.filter(r => {
            if (r.id && validCandIds.has(String(r.id))) return true;
            if (r.token && validCandIds.has(String(r.token))) return true;
            return false;
          });
        }

        if (validCandUserIds.size > 0 || validCandBizIds.size > 0) {
          records = records.filter(r => {
            if (r.userId && validCandUserIds.has(String(r.userId))) return true;
            if (r.user_id && validCandUserIds.has(String(r.user_id))) return true;
            if (r.businessId && validCandBizIds.has(String(r.businessId))) return true;
            if (r.business_id && validCandBizIds.has(String(r.business_id))) return true;
            if (r.businessId && validCandUserIds.has(String(r.businessId))) return true;
            if (r.userId && validCandBizIds.has(String(r.userId))) return true;
            return false;
          });
        }
      }

      // 5. Deduplicate by id / token
      const seen = new Set<string>();
      records = records.filter(r => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        if (r.token) seen.add(r.token);
        return true;
      });

      // 6. Sort
      const orderProp = args?.orderBy?.createdAt ? 'createdAt' : (args?.orderBy?.sentAt ? 'sentAt' : 'createdAt');
      const isDesc = args?.orderBy ? (args.orderBy[orderProp] !== 'asc') : true;
      records.sort((a, b) => {
        const dateA = a[orderProp] ? new Date(a[orderProp]).getTime() : 0;
        const dateB = b[orderProp] ? new Date(b[orderProp]).getTime() : 0;
        return isDesc ? dateB - dateA : dateA - dateB;
      });

      if (args?.take && args.take > 0) {
        records = records.slice(0, args.take);
      }

      return records;
    },

    update: async (args: {
      where: { id?: string; token?: string; [key: string]: any };
      data: any;
    }) => {
      const targetId = String(args.where.id || args.where.token || '');
      if (!targetId) return null;

      // 1. Fetch current record
      const existing = await db.reviewInvite.findFirst({
        where: {
          OR: [
            { id: targetId },
            { token: targetId },
          ],
        },
      });

      const current = existing || {
        id: targetId,
        token: targetId,
        status: 'sent',
        clicks: 0,
      };

      // 2. Compute updated fields
      let nextStatus = args.data.status !== undefined ? args.data.status : current.status;
      if (current.status === 'reviewed' && args.data.status === 'opened') {
        nextStatus = 'reviewed';
      }

      let nextClicks = typeof current.clicks === 'number' ? current.clicks : 0;
      if (typeof args.data.clicks === 'object' && args.data.clicks !== null && 'increment' in args.data.clicks) {
        nextClicks += Number(args.data.clicks.increment) || 1;
      } else if (typeof args.data.clicks === 'number') {
        nextClicks = args.data.clicks;
      } else if (args.data.clicks) {
        nextClicks += 1;
      } else if (args.data.openedAt || args.data.opened_at || args.data.clickedAt || args.data.clicked_at) {
        nextClicks = Math.max(nextClicks, 1);
      }

      const nextOpenedAt = args.data.openedAt ?? args.data.opened_at ?? current.openedAt ?? current.opened_at ?? new Date().toISOString();
      const nextClickedAt = args.data.clickedAt ?? args.data.clicked_at ?? current.clickedAt ?? current.clicked_at ?? nextOpenedAt;
      const nextUpdatedAt = new Date().toISOString();

      const merged = {
        ...current,
        ...args.data,
        id: current.id || targetId,
        token: current.token || targetId,
        status: nextStatus,
        clicks: nextClicks,
        openedAt: nextOpenedAt,
        opened_at: typeof nextOpenedAt === 'string' ? nextOpenedAt : new Date(nextOpenedAt).toISOString(),
        clickedAt: nextClickedAt,
        clicked_at: typeof nextClickedAt === 'string' ? nextClickedAt : new Date(nextClickedAt).toISOString(),
        updatedAt: nextUpdatedAt,
        updated_at: nextUpdatedAt,
      };

      const norm = normalizeReviewInvite(merged);
      if (norm) {
        cacheReviewInvite(norm);
      }

      // 3. Persist update to Supabase review_invites table
      const supabase = getAdminClient();
      if (supabase) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(norm?.id || targetId);
          const updatePayload: Record<string, any> = {
            status: norm?.status || nextStatus,
            updated_at: nextUpdatedAt,
          };

          if (norm?.opened_at) updatePayload.opened_at = norm.opened_at;
          if (norm?.clicked_at) updatePayload.clicked_at = norm.clicked_at;
          if (norm?.clicks !== undefined) updatePayload.clicks = norm.clicks;
          if (args.data.ratingReceived !== undefined) updatePayload.rating_received = args.data.ratingReceived;
          if (args.data.rating_received !== undefined) updatePayload.rating_received = args.data.rating_received;
          if (args.data.reviewReceivedAt) updatePayload.review_received_at = new Date(args.data.reviewReceivedAt).toISOString();
          if (args.data.review_received_at) updatePayload.review_received_at = new Date(args.data.review_received_at).toISOString();

          let query = supabase.from('review_invites').update(updatePayload);
          if (isUuid) {
            query = query.eq('id', norm?.id || targetId);
          } else {
            query = query.eq('token', targetId);
          }

          const { error: updErr } = await query;
          if (updErr) {
            if (updErr.code === '42703') {
              console.warn('[db.reviewInvite.update] Column mismatch, retrying base status update:', updErr.message);
              const basePayload: Record<string, any> = {
                status: norm?.status || nextStatus,
                updated_at: nextUpdatedAt,
              };
              let retryQuery = supabase.from('review_invites').update(basePayload);
              if (isUuid) {
                retryQuery = retryQuery.eq('id', norm?.id || targetId);
              } else {
                retryQuery = retryQuery.eq('token', targetId);
              }
              const { error: retryErr } = await retryQuery;
              if (retryErr && retryErr.code === '42703') {
                let fallbackQuery = supabase.from('review_invites').update({ status: norm?.status || nextStatus });
                if (isUuid) {
                  fallbackQuery = fallbackQuery.eq('id', norm?.id || targetId);
                } else {
                  fallbackQuery = fallbackQuery.eq('token', targetId);
                }
                await fallbackQuery;
              }
            } else {
              console.error('[db.reviewInvite.update] Supabase error:', updErr.message);
            }
          }
        } catch (dbErr) {
          console.warn('[db.reviewInvite.update] Supabase update warning:', dbErr);
        }
      }

      return norm || merged;
    },

    updateMany: async (args: {
      where?: any;
      data: any;
    }) => {
      if (!args?.data) return { count: 0 };
      let updatedCount = 0;

      // 1. Gather all candidate IDs or tokens from where clause
      const targetIds = new Set<string>();
      if (args?.where?.id) targetIds.add(String(args.where.id));
      if (args?.where?.token) targetIds.add(String(args.where.token));
      if (Array.isArray(args?.where?.OR)) {
        for (const o of args.where.OR) {
          if (o?.id) targetIds.add(String(o.id));
          if (o?.token) targetIds.add(String(o.token));
        }
      }

      // 2. Find matching records across DB and cache
      const recordsToUpdate = await db.reviewInvite.findMany({ where: args?.where });
      for (const rec of recordsToUpdate) {
        if (rec?.id) targetIds.add(String(rec.id));
        if (rec?.token) targetIds.add(String(rec.token));
      }

      // 3. Update each target
      for (const tid of targetIds) {
        if (!tid) continue;
        try {
          const res = await db.reviewInvite.update({
            where: { id: tid, token: tid },
            data: args.data,
          });
          if (res) updatedCount++;
        } catch (e) {
          console.warn('[db.reviewInvite.updateMany] update item note:', e);
        }
      }

      return { count: updatedCount };
    },

    findFirst: async (args?: any) => {
      const records = await db.reviewInvite.findMany(args);
      return records[0] || null;
    },

    count: async (args?: any) => {
      const records = await db.reviewInvite.findMany(args);
      return records.length;
    },
  },
};

export const prisma = db;
export default db;

export function toSnakeBrandVoice(val?: string | null): string {
  if (!val) return 'friendly_professional';
  const v = val.trim();
  if (v === 'Professional & Warm' || v === 'Friendly & Professional' || v === 'friendly_professional') {
    return 'friendly_professional';
  }
  if (v === 'Casual & Enthusiastic' || v === 'casual_enthusiastic') {
    return 'casual_enthusiastic';
  }
  if (v === 'Concise & Polite' || v === 'concise_polite') {
    return 'concise_polite';
  }
  if (v === 'Empathetic & Caring' || v === 'empathetic') {
    return 'empathetic';
  }
  return v;
}

export function toDisplayTone(val?: string | null): string {
  return toSnakeBrandVoice(val);
}

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
    raw.notifyNegativeEnabled ??
    raw.notify_negative_enabled ??
    raw.negativeAlertSmsEnabled ??
    raw.smsAlertsEnabled ??
    raw.negativeSmsAlertEnabled ??
    raw.sms_alerts_enabled ??
    raw.negative_alert_sms_enabled ??
    raw.negative_sms_alert_enabled ??
    raw.notify_negative_sms ??
    raw.notifySms ??
    raw.enableSmsAlerts ??
    false
  );

  let isEmailActive = true;
  const rawEmailAlert =
    raw.emailAlertsEnabled ??
    raw.email_alerts_enabled ??
    raw.negativeAlertEmailEnabled ??
    raw.negativeEmailAlertEnabled ??
    raw.negative_alert_email_enabled ??
    raw.negative_email_alert_enabled;

  if (typeof rawEmailAlert === 'boolean') {
    isEmailActive = rawEmailAlert;
  } else if (typeof rawEmailAlert === 'string') {
    isEmailActive = rawEmailAlert === 'true' || rawEmailAlert === 'on' || rawEmailAlert === '1';
  } else if (rawEmailAlert !== undefined && rawEmailAlert !== null) {
    isEmailActive = Boolean(rawEmailAlert);
  }

  const rawBrandVoice = raw.brandVoice ?? raw.brand_voice ?? raw.aiTone ?? raw.ai_tone ?? raw.aiPersonality ?? raw.ai_personality ?? 'friendly_professional';
  const snakeVoice = toSnakeBrandVoice(rawBrandVoice);
  const displayTone = snakeVoice;

  const phone = raw.notifyNegativePhone ?? raw.notify_negative_phone ?? raw.negativeAlertPhone ?? raw.negative_alert_phone ?? null;
  const email = raw.notifyNegativeEmail ?? raw.notify_negative_email ?? raw.negativeAlertEmail ?? raw.negative_alert_email ?? null;

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
    negativeAlertEmail: email,
    negativeAlertPhone: phone,
    notifyNegativeEmail: email,
    notifyNegativePhone: phone,
    notify_negative_email: email,
    notify_negative_phone: phone,
    positiveAlertEmail: raw.positiveAlertEmail ?? raw.positive_alert_email ?? null,
    positiveAlertPhone: raw.positiveAlertPhone ?? raw.positive_alert_phone ?? null,
    negativeAlertsEnabled: Boolean(raw.negativeAlertsEnabled ?? raw.negative_alerts_enabled ?? true),
    negativeEmailAlertEnabled: isEmailActive,
    emailAlertsEnabled: isEmailActive,
    email_alerts_enabled: isEmailActive,
    negativeSmsAlertEnabled: isSmsActive,
    positiveAlertsEnabled: Boolean(raw.positiveAlertsEnabled ?? raw.positive_alerts_enabled ?? true),
    positiveEmailAlertEnabled: Boolean(raw.positiveAlertEmailEnabled ?? raw.positiveEmailAlertEnabled ?? raw.positive_alert_email_enabled ?? raw.positive_email_alert_enabled ?? true),
    positiveSmsAlertEnabled: Boolean(raw.positiveAlertSmsEnabled ?? raw.positiveSmsAlertEnabled ?? raw.positive_alert_sms_enabled ?? raw.positive_sms_alert_enabled ?? false),
    negativeAlertSmsEnabled: isSmsActive,
    smsAlertsEnabled: isSmsActive,
    notifyNegativeEnabled: isSmsActive,
    notify_negative_enabled: isSmsActive,
    negativeAlertEmailEnabled: isEmailActive,
    positiveAlertSmsEnabled: Boolean(raw.positiveAlertSmsEnabled ?? raw.positiveSmsAlertEnabled ?? raw.positive_alert_sms_enabled ?? raw.positive_sms_alert_enabled ?? false),
    positiveAlertEmailEnabled: Boolean(raw.positiveAlertEmailEnabled ?? raw.positiveEmailAlertEnabled ?? raw.positive_alert_email_enabled ?? raw.positive_email_alert_enabled ?? true),
    brandVoice: snakeVoice,
    brand_voice: snakeVoice,
    aiTone: snakeVoice,
    ai_tone: snakeVoice,
    aiPersonality: snakeVoice,
    ai_personality: snakeVoice,
    aiInstructions: raw.aiInstructions ?? raw.ai_instructions ?? null,
    aiSignature: raw.aiSignature ?? raw.ai_signature ?? null,
    autoReplyEnabled: Boolean(raw.autoReplyEnabled ?? raw.auto_reply_enabled ?? raw.autoPublish5Star ?? raw.auto_publish_5_star ?? false),
    autoPublish5Star: Boolean(raw.autoPublish5Star ?? raw.auto_publish_5_star ?? raw.autoReplyEnabled ?? raw.auto_reply_enabled ?? false),
    customKeywords: raw.customKeywords ?? raw.custom_keywords ?? raw.seoKeywords ?? raw.seo_keywords ?? null,
    seoKeywords: raw.seoKeywords ?? raw.seo_keywords ?? raw.customKeywords ?? raw.custom_keywords ?? null,
    selectedModel: raw.selectedModel ?? raw.selected_model ?? 'gemini-1.5-flash',
    smsTemplate: raw.smsTemplate ?? raw.sms_template ?? null,
    createdAt: raw.createdAt || raw.created_at || new Date(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date(),
  };
}
