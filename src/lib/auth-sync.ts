import { auth, currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

export async function getOrCreateUserSession() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const clerkUser = await currentUser().catch(() => null);
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Business Owner';

  // 1. Look for profile by clerkUserId
  let profile = await db.profile.findFirst({
    where: { clerkUserId: clerkUserId },
  }).catch(() => null);

  // 2. If not found, claim the existing profile record (fallback for owner/legacy account)
  if (!profile) {
    profile = await db.profile.findFirst({
      where: { clerkUserId: null },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    if (profile) {
      console.log(`[AUTH-SYNC] Binding Clerk ID ${clerkUserId} to Profile ID ${profile.id}`);
      try {
        profile = await db.profile.update({
          where: { id: profile.id },
          data: { clerkUserId: clerkUserId },
        });
      } catch (err) {
        console.error('Failed to link clerkUserId in auth-sync:', err);
      }
    }
  }

  // 3. If still no profile, auto-provision a new profile
  if (!profile) {
    console.log(`[AUTH-SYNC] Provisioning new profile for Clerk User: ${clerkUserId}`);
    try {
      profile = await db.profile.create({
        data: {
          clerkUserId: clerkUserId,
          fullName: fullName,
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
    };
  }

  // 4. Find business_settings linked to this profile
  let settings = null;
  if (profile?.id) {
    settings = await db.businessSettings.findFirst({
      where: { userId: profile.id },
    }).catch(() => null);
  }

  // Fallback to most recent settings if not yet linked
  if (!settings) {
    settings = await db.businessSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    }).catch(() => null);

    // If found, link it to this profile immediately
    if (settings && profile?.id && settings.userId !== profile.id) {
      try {
        await db.businessSettings.update({
          where: { id: settings.id },
          data: { userId: profile.id },
        });
        settings.userId = profile.id;
      } catch (linkErr) {
        console.error('Failed to link business_settings to profile:', linkErr);
      }
    }
  }

  if (!settings) {
    console.log(`[AUTH-SYNC] Provisioning default business_settings for Profile: ${profile.id}`);
    try {
      settings = await db.businessSettings.create({
        data: {
          userId: profile.id,
          brandVoice: 'friendly_professional',
          notifyNegativeEnabled: true,
          emailAlertsEnabled: true,
          notifyNegativeEmail: email,
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
