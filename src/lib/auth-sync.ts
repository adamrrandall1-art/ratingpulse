import { auth, currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

export async function getOrCreateUserSession() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const clerkUser = await currentUser().catch(() => null);
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Business Owner';

  // 1. Look for profile strictly by clerkUserId
  let profile = await db.profile.findFirst({
    where: { clerkUserId: clerkUserId },
  }).catch(() => null);

  // 2. If no profile exists for this Clerk user, auto-provision a fresh, clean profile
  if (!profile) {
    console.log(`[AUTH-SYNC] Provisioning new isolated profile for Clerk User: ${clerkUserId}`);
    try {
      profile = await db.profile.create({
        data: {
          clerkUserId: clerkUserId,
          email: email,
          fullName: fullName,
          businessName: '',
          businessCategory: 'Local Business',
          googlePlaceId: '',
          reviewUrl: '',
          googleRating: 0,
          googleReviewCount: 0,
          googleConnected: false,
        },
      });
    } catch (err) {
      console.error('Failed to auto-provision profile:', err);
    }
  }

  if (!profile) {
    profile = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : clerkUserId,
      clerkUserId: clerkUserId,
      fullName: fullName,
      email: email,
      business_name: '',
      business_category: 'Local Business',
      google_place_id: '',
      review_url: '',
      google_rating: 0,
      google_review_count: 0,
      google_connected: false,
    };
  }

  // 3. Find business_settings strictly linked to this user's profile
  let settings = null;
  if (profile?.id) {
    settings = await db.businessSettings.findFirst({
      where: { userId: profile.id },
    }).catch(() => null);
  }

  // 4. If no settings exist for this user, auto-provision a fresh, clean settings row
  if (!settings && profile?.id) {
    console.log(`[AUTH-SYNC] Provisioning default business_settings for Profile: ${profile.id}`);
    try {
      settings = await db.businessSettings.create({
        data: {
          userId: profile.id,
          businessName: '',
          brandVoice: 'friendly_professional',
          notifyNegativeEnabled: true,
          emailAlertsEnabled: true,
          notifyNegativeEmail: email,
          notifyNegativePhone: '',
          googleReviewUrl: '',
          placeId: '',
          googleConnected: false,
        },
      });
    } catch (err) {
      console.error('Failed to auto-provision business_settings:', err);
    }
  }

  if (!settings) {
    settings = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `settings_${Date.now()}`,
      userId: profile.id,
      brandVoice: 'friendly_professional',
      notifyNegativeEnabled: true,
      emailAlertsEnabled: true,
      notifyNegativeEmail: email,
      notifyNegativePhone: '',
      googleReviewUrl: '',
      placeId: '',
    };
  }

  return { clerkUserId, profile, settings };
}
