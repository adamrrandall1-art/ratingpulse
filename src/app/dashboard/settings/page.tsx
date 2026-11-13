import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import SettingsClient, { SettingsClientView } from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function SettingsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const supabaseAdmin = getSupabaseAdmin();
  let profile: any = null;
  let settings: any = null;

  try {
    profile = await db.profile.findFirst({
      where: { clerkUserId: clerkUserId },
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
  }

  if (!profile && supabaseAdmin) {
    try {
      const { data: profByClerk } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();
      if (profByClerk) {
        profile = profByClerk;
      }
    } catch {}
  }

  if (profile?.id) {
    try {
      settings = await db.businessSettings.findFirst({
        where: { userId: profile.id },
      });
    } catch (err) {
      console.error('Error fetching business_settings by userId:', err);
    }
  }

  // Also query directly via Supabase Admin to ensure live google_review_url & place_id are loaded
  if (supabaseAdmin && profile?.id) {
    try {
      const { data: sbSettings } = await supabaseAdmin
        .from('business_settings')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (sbSettings) {
        settings = {
          ...(settings || {}),
          ...sbSettings,
          googleReviewUrl: sbSettings.google_review_url || sbSettings.googleReviewUrl || settings?.googleReviewUrl || '',
          placeId: sbSettings.place_id || sbSettings.placeId || settings?.placeId || '',
          businessName: sbSettings.business_name || sbSettings.businessName || settings?.businessName || '',
          brandVoice: sbSettings.brand_voice || sbSettings.brandVoice || settings?.brandVoice || 'friendly_professional',
        };
      }
    } catch (sbErr) {
      console.warn('SupabaseAdmin business_settings lookup note:', sbErr);
    }
  }

  const rawPositiveEmail = profile?.notifyPositiveEmail || profile?.notify_positive_email || '';
  const safePositiveEmail =
    typeof rawPositiveEmail === 'string' && rawPositiveEmail !== 'true' && rawPositiveEmail !== 'false'
      ? rawPositiveEmail
      : '';

  const rawPositiveEmailEnabled = profile?.notifyPositiveEnabled ?? profile?.notify_positive_enabled;
  const safePositiveEmailEnabled =
    rawPositiveEmailEnabled !== undefined && rawPositiveEmailEnabled !== null
      ? Boolean(rawPositiveEmailEnabled)
      : true;

  const rawKeywords = settings?.seoKeywords || settings?.seo_keywords || '';
  const safeKeywords = typeof rawKeywords === 'string' ? rawKeywords : '';

  const safeCustomInstructions = settings?.customInstructions || settings?.custom_instructions || '';
  const safeReplySignature = settings?.replySignature || settings?.reply_signature || '';

  const safeSettings = {
    id: settings?.id || '',
    userId: profile?.id || settings?.userId || '',
    brandVoice: settings?.brandVoice || settings?.brand_voice || 'friendly_professional',
    googleReviewUrl: settings?.googleReviewUrl || settings?.google_review_url || profile?.review_url || profile?.google_review_url || '',
    placeId: settings?.placeId || settings?.place_id || profile?.google_place_id || profile?.place_id || '',
    businessName: settings?.businessName || settings?.business_name || profile?.businessName || profile?.business_name || '',
    // Negative alerts
    notifyNegativePhone: settings?.notifyNegativePhone || '',
    notifyNegativeEmail: settings?.notifyNegativeEmail || '',
    emailAlertsEnabled: settings?.emailAlertsEnabled ?? true,
    notifyNegativeEnabled: settings?.notifyNegativeEnabled ?? true,
    // Positive alerts
    notifyPositivePhone: profile?.notifyPositivePhone || profile?.notify_positive_phone || '',
    notifyPositiveSms: Boolean(profile?.notifyPositiveSms ?? profile?.notify_positive_sms),
    positiveAlertPhone: profile?.notifyPositivePhone || profile?.notify_positive_phone || '',
    positiveAlertSmsEnabled: Boolean(profile?.notifyPositiveSms ?? profile?.notify_positive_sms),
    notifyPositiveEmail: safePositiveEmail,
    positiveAlertEmail: safePositiveEmail,
    notifyPositiveEmailEnabled: safePositiveEmailEnabled,
    notifyPositiveEnabled: safePositiveEmailEnabled,
    positiveAlertEmailEnabled: safePositiveEmailEnabled,
    positiveEmailAlertEnabled: safePositiveEmailEnabled,
    // SEO Keywords
    seoKeywords: safeKeywords,
    customKeywords: safeKeywords,
    keywords: safeKeywords
      ? safeKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : [],
    // AI Custom Instructions & Signature
    customInstructions: safeCustomInstructions,
    aiInstructions: safeCustomInstructions,
    replySignature: safeReplySignature,
    aiSignature: safeReplySignature,
    signature: safeReplySignature,
  };

  // Safe fallback for business object required by settings tabs (GBP, Billing, etc.)
  let business: any = null;
  try {
    const businesses = await db.business.findMany({
      where: {
        OR: [
          { clerkUserId: clerkUserId },
          { userId: profile?.id || clerkUserId },
          { id: clerkUserId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    }).catch(() => []);
    business = businesses[0] || null;
  } catch (err) {
    console.error('Error fetching business:', err);
  }

  if (!business) {
    business = {
      id: settings?.id || profile?.id || clerkUserId,
      userId: profile?.id || clerkUserId,
      clerkUserId: clerkUserId,
      name: settings?.businessName || profile?.businessName || profile?.business_name || 'My Business',
      brandVoice: safeSettings.brandVoice,
      aiTone: safeSettings.brandVoice,
      aiPersonality: safeSettings.brandVoice,
      negativeAlertEmail: safeSettings.notifyNegativeEmail,
      notifyNegativeEmail: safeSettings.notifyNegativeEmail,
      negativeAlertPhone: safeSettings.notifyNegativePhone,
      notifyNegativePhone: safeSettings.notifyNegativePhone,
      emailAlertsEnabled: safeSettings.emailAlertsEnabled,
      negativeAlertEmailEnabled: safeSettings.emailAlertsEnabled,
      negativeEmailAlertEnabled: safeSettings.emailAlertsEnabled,
      negativeAlertSmsEnabled: safeSettings.notifyNegativeEnabled,
      smsAlertsEnabled: safeSettings.notifyNegativeEnabled,
      googleReviewUrl: safeSettings.googleReviewUrl,
      placeId: safeSettings.placeId,
      positiveAlertPhone: safeSettings.notifyPositivePhone,
      positiveAlertSmsEnabled: safeSettings.notifyPositiveSms,
      positiveAlertEmail: safePositiveEmail,
      notifyPositiveEmail: safePositiveEmail,
      positiveAlertEmailEnabled: safePositiveEmailEnabled,
      positiveEmailAlertEnabled: safePositiveEmailEnabled,
      notifyPositiveEmailEnabled: safePositiveEmailEnabled,
      seoKeywords: safeKeywords,
      customKeywords: safeKeywords,
      customInstructions: safeCustomInstructions,
      aiInstructions: safeCustomInstructions,
      replySignature: safeReplySignature,
      aiSignature: safeReplySignature,
    };
  } else {
    business.positiveAlertPhone = safeSettings.notifyPositivePhone;
    business.positiveAlertSmsEnabled = safeSettings.notifyPositiveSms;
    business.positiveAlertEmail = safePositiveEmail;
    business.notifyPositiveEmail = safePositiveEmail;
    business.positiveAlertEmailEnabled = safePositiveEmailEnabled;
    business.positiveEmailAlertEnabled = safePositiveEmailEnabled;
    business.notifyPositiveEmailEnabled = safePositiveEmailEnabled;
    business.seoKeywords = safeKeywords;
    business.customKeywords = safeKeywords;
    business.customInstructions = safeCustomInstructions;
    business.aiInstructions = safeCustomInstructions;
    business.replySignature = safeReplySignature;
    business.aiSignature = safeReplySignature;
  }

  return (
    <SettingsClient
      key="settings-client"
      initialSettings={safeSettings}
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null}
      initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
      settingsId={settings?.id}
    />
  );
}

export { SettingsClientView };

