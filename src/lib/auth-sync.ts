import { auth, currentUser } from '@clerk/nextjs/server';
import db, { getAdminClient, safeUpsertProfile } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function getOrCreateUserSession() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const clerkUser = await currentUser().catch(() => null);
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Business Owner';

  const supabaseAdmin = getAdminClient();

  // 1. Look for profile strictly by clerkUserId
  let profile: any = null;

  if (supabaseAdmin) {
    try {
      const { data: remoteProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (fetchError) {
        console.error('[auth-sync] Failed to fetch profile from Supabase by clerk_user_id:', fetchError);
      } else if (remoteProfile) {
        profile = {
          ...remoteProfile,
          clerkUserId: remoteProfile.clerk_user_id || remoteProfile.clerkUserId,
          email: remoteProfile.email || remoteProfile.notification_email || email,
          fullName: remoteProfile.full_name || remoteProfile.fullName || fullName,
        };
      }
    } catch (err) {
      console.error('[auth-sync] Error querying Supabase for profile:', err);
    }
  }

  // Fallback to db.profile.findFirst if not found via direct Supabase call
  if (!profile) {
    profile = await db.profile.findFirst({
      where: { clerkUserId: clerkUserId },
    }).catch(() => null);
  }

  // 2. If no profile exists for this Clerk user, explicitly upsert a clean row in Supabase profiles
  if (!profile) {
    console.log(`[AUTH-SYNC] Provisioning new isolated profile for Clerk User: ${clerkUserId}`);

    if (supabaseAdmin) {
      try {
        const savedProfile = await safeUpsertProfile(supabaseAdmin, {
          clerkUserId,
          email,
          fullName,
          businessName: '',
          businessCategory: 'Local Business',
        });

        if (savedProfile) {
          profile = {
            ...savedProfile,
            clerkUserId: savedProfile.clerk_user_id || savedProfile.clerkUserId || clerkUserId,
            email: savedProfile.email || savedProfile.notification_email || email,
            fullName: savedProfile.full_name || savedProfile.fullName || fullName,
          };
          console.log(`[AUTH-SYNC] Successfully persisted new profile in Supabase:`, profile.id);
        }
      } catch (err) {
        console.error('[auth-sync] Exception during profile upsert in Supabase:', err);
      }
    }

    // If still not created (e.g. offline dev without Supabase), fall back to db.profile.create
    if (!profile) {
      try {
        profile = await db.profile.create({
          data: {
            clerkUserId: clerkUserId,
            email: email,
            fullName: fullName,
            businessName: '',
            businessCategory: 'Local Business',
          },
        });
      } catch (err) {
        console.error('[auth-sync] db.profile.create failed:', err);
      }
    }
  }

  // Safety fallback for offline/test environments
  if (!profile) {
    const fallbackId = randomUUID();
    profile = {
      id: fallbackId,
      clerkUserId: clerkUserId,
      clerk_user_id: clerkUserId,
      fullName: fullName,
      full_name: fullName,
      email: email,
      business_name: '',
      business_category: 'Local Business',
      google_place_id: '',
      review_url: '',
      google_rating: 0,
      google_review_count: 0,
      google_connected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 3. Find business_settings strictly linked to this user's profile
  let settings: any = null;
  if (profile?.id) {
    if (supabaseAdmin) {
      try {
        const { data: remoteSettings, error: settingsError } = await supabaseAdmin
          .from('business_settings')
          .select('*')
          .eq('user_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (settingsError) {
          console.error('[auth-sync] Failed to fetch business_settings from Supabase:', settingsError);
        } else if (remoteSettings) {
          settings = remoteSettings;
        }
      } catch (err) {
        console.error('[auth-sync] Error querying Supabase for business_settings:', err);
      }
    }

    if (!settings) {
      settings = await db.businessSettings.findFirst({
        where: { userId: profile.id },
      }).catch(() => null);
    }
  }

  // 4. If no settings exist for this user, auto-provision a fresh, clean settings row keyed to profile.id
  if (!settings && profile?.id) {
    console.log(`[AUTH-SYNC] Provisioning default business_settings for Profile: ${profile.id}`);
    const newSettingsId = randomUUID();
    const settingsPayload: any = {
      id: newSettingsId,
      user_id: profile.id,
      business_name: profile.business_name || '',
      brand_voice: 'friendly_professional',
      notify_negative_enabled: true,
      email_alerts_enabled: true,
      notify_negative_email: email || '',
      notify_negative_phone: '',
      google_review_url: '',
      place_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      try {
        const { data: createdSettings, error: settingsInsertError } = await supabaseAdmin
          .from('business_settings')
          .upsert(settingsPayload, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (settingsInsertError) {
          console.error('[auth-sync] business_settings upsert failed:', settingsInsertError);
          // If schema mismatch error (e.g. column does not exist), retry with minimal base columns
          if (settingsInsertError.code === '42703' || settingsInsertError.message?.includes('column')) {
            const minPayload = {
              id: newSettingsId,
              user_id: profile.id,
              business_name: profile.business_name || '',
              brand_voice: 'friendly_professional',
              google_review_url: '',
              place_id: '',
            };
            const { data: retrySettings, error: retryError } = await supabaseAdmin
              .from('business_settings')
              .upsert(minPayload, { onConflict: 'user_id' })
              .select()
              .maybeSingle();
            if (retryError) {
              console.error('[auth-sync] business_settings retry upsert failed:', retryError);
            } else if (retrySettings) {
              settings = retrySettings;
            }
          }
        } else if (createdSettings) {
          settings = createdSettings;
          console.log(`[AUTH-SYNC] Successfully persisted default business_settings in Supabase:`, settings.id);
        }
      } catch (err) {
        console.error('[auth-sync] Exception during business_settings insert in Supabase:', err);
      }
    }

    if (!settings) {
      try {
        settings = await db.businessSettings.create({
          data: {
            id: newSettingsId,
            userId: profile.id,
            businessName: profile.business_name || '',
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
        console.error('[auth-sync] db.businessSettings.create failed:', err);
      }
    }
  }

  if (!settings && profile?.id) {
    const fallbackSettingsId = randomUUID();
    settings = {
      id: fallbackSettingsId,
      userId: profile.id,
      user_id: profile.id,
      businessName: profile.business_name || '',
      business_name: profile.business_name || '',
      brandVoice: 'friendly_professional',
      brand_voice: 'friendly_professional',
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
