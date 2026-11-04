import { auth, currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

export async function getOrCreateUserSession() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const clerkUser = await currentUser().catch(() => null);
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Business Owner';

  // 1. Try to find profile by clerkUserId
  let profile = await db.profile.findFirst({
    where: { clerkUserId: clerkUserId },
  }).catch(() => null);

  // 2. If not found, check by email (handles legacy accounts)
  if (!profile && email) {
    profile = await db.profile.findFirst({
      where: { email: email },
    }).catch(() => null);
    if (profile) {
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

  // 3. If still no profile, AUTO-PROVISION a new profile for this new customer:
  if (!profile) {
    console.log(`[AUTH-SYNC] Provisioning new profile for Clerk User: ${clerkUserId} (${email})`);
    try {
      profile = await db.profile.create({
        data: {
          clerkUserId: clerkUserId,
          email: email,
          fullName: fullName,
        },
      });
    } catch (err) {
      console.error('Failed to auto-provision profile:', err);
    }
  }

  if (!profile) {
    console.warn(`[AUTH-SYNC] Could not provision profile, creating fallback in-memory object`);
    profile = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : clerkUserId,
      clerkUserId: clerkUserId,
      email: email,
      fullName: fullName,
    };
  }

  // 4. Ensure business_settings exists for this profile
  let settings = await db.businessSettings.findFirst({
    where: { userId: profile.id },
  }).catch(() => null);

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
