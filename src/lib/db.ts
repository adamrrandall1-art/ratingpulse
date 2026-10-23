import { createClient } from '@supabase/supabase-js';
import { getInitialServerBusiness } from '@/lib/server-business';

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
  business: {
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
    }): Promise<BusinessRecord | null> => {
      const supabase = getAdminClient();
      const where = args?.where;

      const candidateUserIds: string[] = [];
      const candidateBusinessIds: string[] = [];

      if (where?.userId) candidateUserIds.push(String(where.userId));
      if (where?.id) candidateBusinessIds.push(String(where.id));

      if (Array.isArray(where?.OR)) {
        for (const item of where.OR) {
          if (item?.userId) candidateUserIds.push(String(item.userId));
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
              const { data } = await supabase.from('businesses').select('*').eq('id', bId).maybeSingle();
              if (data) return normalizeBusiness(data);
            } catch {}
          }
        }

        // 2. Try querying businesses by userId / user_id
        for (const uId of uniqueUserIds) {
          try {
            const { data: bByUserId } = await supabase.from('businesses').select('*').eq('userId', uId).maybeSingle();
            if (bByUserId) return normalizeBusiness(bByUserId);
          } catch {}
          try {
            const { data: bByUser_id } = await supabase.from('businesses').select('*').eq('user_id', uId).maybeSingle();
            if (bByUser_id) return normalizeBusiness(bByUser_id);
          } catch {}
          if (UUID_REGEX.test(uId)) {
            try {
              const { data: bById } = await supabase.from('businesses').select('*').eq('id', uId).maybeSingle();
              if (bById) return normalizeBusiness(bById);
            } catch {}
          }
        }
      }

      // 3. Fall back to getInitialServerBusiness resolver
      const targetId = uniqueUserIds[0] || uniqueBusinessIds[0];
      if (targetId) {
        const fallbackBiz = await getInitialServerBusiness(targetId);
        if (fallbackBiz) return normalizeBusiness(fallbackBiz);
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

      const normalizedData = { ...data };
      if (normalizedData.updatedAt instanceof Date) {
        normalizedData.updatedAt = normalizedData.updatedAt.toISOString();
      }

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

      // Re-fetch or normalize
      const refreshed = await db.business.findFirst({
        where: { id: targetId, userId: targetId },
      });

      if (refreshed) {
        return normalizeBusiness({
          ...refreshed,
          ...data,
          id: refreshed.id || targetId,
        });
      }

      return normalizeBusiness({
        id: targetId,
        name: 'RatingPulse',
        ...data,
      });
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
    createdAt: raw.createdAt || raw.created_at || new Date(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date(),
  };
}
