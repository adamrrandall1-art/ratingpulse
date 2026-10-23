export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
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
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveProfile(supabase: ReturnType<typeof getAdminClient>, rawUserId?: string | null) {
  if (!supabase) return null;
  let profile: any = null;

  if (rawUserId) {
    if (UUID_REGEX.test(rawUserId)) {
      try {
        const { data: pById } = await supabase.from('profiles').select('*').eq('id', rawUserId).maybeSingle();
        if (pById) profile = pById;
      } catch (err) {
        console.warn('[Business API] Profile lookup by id warning:', err);
      }
    }

    if (!profile) {
      try {
        const { data: pByClerk } = await supabase.from('profiles').select('*').eq('clerk_user_id', rawUserId).maybeSingle();
        if (pByClerk) profile = pByClerk;
      } catch (err) {
        console.warn('[Business API] Profile lookup by clerk_user_id warning:', err);
      }
    }
  }

  if (!profile) {
    try {
      const clerkAuth = await auth().catch(() => null);
      if (clerkAuth?.userId) {
        const { data: pByAuth } = await supabase.from('profiles').select('*').eq('clerk_user_id', clerkAuth.userId).maybeSingle();
        if (pByAuth) {
          profile = pByAuth;
        } else if (UUID_REGEX.test(clerkAuth.userId)) {
          const { data: pById } = await supabase.from('profiles').select('*').eq('id', clerkAuth.userId).maybeSingle();
          if (pById) profile = pById;
        }
      }
    } catch {}
  }

  return profile;
}

export async function handleUpdateBusiness(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);

    // Whitelist ONLY general business profile details from req body
    // Extract name, phone, address, website, category
    const {
      name,
      business_name,
      phone,
      address,
      formatted_address,
      website,
      category,
      business_category,
      activeBusinessId,
      businessId,
      userId,
      user_id,
      id,
    } = body;

    const targetUserId = activeBusinessId || businessId || userId || user_id || id || clerkAuth?.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Business or User ID is required to update profile' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const profile = await resolveProfile(supabase, targetUserId);
    const profileId = profile?.id || (UUID_REGEX.test(targetUserId) ? targetUserId : null);

    const effectiveName = name !== undefined ? name : business_name;
    const effectivePhone = phone !== undefined ? phone : undefined;
    const effectiveAddress = address !== undefined ? address : formatted_address;
    const effectiveCategory = category !== undefined ? category : business_category;
    const effectiveWebsite = website !== undefined ? website : undefined;

    // Perform safe partial update
    // CRITICAL: Ensure isGoogleConnected, googleReviewUrl, placeId, and placeIdStatus
    // are NOT touched, set to undefined, or overwritten by this endpoint!
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (effectiveName !== undefined) profileUpdates.business_name = effectiveName;
    if (effectivePhone !== undefined) {
      const cleanPhone = effectivePhone ? String(effectivePhone).trim() : null;
      profileUpdates.phone = cleanPhone;
      profileUpdates.notification_phone = cleanPhone;
    }
    if (effectiveAddress !== undefined) profileUpdates.formatted_address = effectiveAddress;
    if (effectiveCategory !== undefined) profileUpdates.business_category = effectiveCategory;
    if (effectiveWebsite !== undefined) profileUpdates.website = effectiveWebsite;

    if (profileId && supabase) {
      const { error: profErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profileId);

      if (profErr) {
        console.error('[Business API] Profile update error:', profErr);
      }

      // Sync general fields to business_settings without touching place_id or google_review_url
      const settingsUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (effectiveName !== undefined) settingsUpdates.business_name = effectiveName;
      if (effectivePhone !== undefined) settingsUpdates.notification_phone = effectivePhone ? String(effectivePhone).trim() : null;

      try {
        await supabase
          .from('business_settings')
          .update(settingsUpdates)
          .eq('user_id', profileId);
      } catch (settErr) {
        console.warn('[Business API] Settings update warning:', settErr);
      }
    }

    // Resolve live business record via unified server business resolver
    const updatedBusiness = await getInitialServerBusiness(profileId || targetUserId);

    // Cache revalidation across dashboard routes
    try {
      revalidatePath('/dashboard/businesses');
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/setup');
      revalidatePath('/dashboard/settings');
    } catch (revErr) {
      console.warn('[Business API] Cache revalidation note:', revErr);
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      message: 'Business profile updated successfully',
    });
  } catch (err: any) {
    console.error('[Business API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update business profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleUpdateBusiness(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdateBusiness(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdateBusiness(req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('id') || clerkAuth?.userId;

    const business = await getInitialServerBusiness(userId);

    return NextResponse.json({
      success: true,
      business,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch business' },
      { status: 500 }
    );
  }
}
