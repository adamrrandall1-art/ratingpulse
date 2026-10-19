export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

function getSupabaseAdmin() {
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
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);
    const userId = body.userId || body.user_id || clerkAuth?.userId;
    const businessId = body.businessId || body.business_id || userId;

    const supabase = getSupabaseAdmin();
    if (supabase && (userId || businessId)) {
      const targetId = userId || businessId;

      await Promise.allSettled([
        supabase
          .from('profiles')
          .update({
            business_name: null,
            google_place_id: null,
            formatted_address: null,
            review_url: null,
            google_rating: null,
            google_review_count: 0,
            google_connected: false,
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            google_account_id: null,
            google_location_id: null,
            google_account_name: null,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${targetId},clerk_user_id.eq.${targetId}`),

        supabase
          .from('business_settings')
          .update({
            place_id: null,
            business_name: null,
            google_review_url: null,
            google_access_token: null,
            google_refresh_token: null,
            connected_at: null,
            updated_at: new Date().toISOString(),
          })
          .or(`user_id.eq.${targetId},id.eq.${targetId}`),

        supabase
          .from('reviews')
          .delete()
          .or(`user_id.eq.${targetId},business_id.eq.${targetId}`),
      ]);
    }

    // Purge the layout cache immediately so every page syncs
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/setup');
      revalidatePath('/dashboard/businesses');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/reviews');
      revalidatePath('/dashboard/invites');
      revalidatePath('/dashboard/settings');
    } catch (revErr) {
      console.warn('[Disconnect] Cache revalidation note:', revErr);
    }

    return NextResponse.json({
      success: true,
      isGoogleConnected: false,
      isConnected: false,
      message: 'Business successfully disconnected',
    });
  } catch (err: any) {
    console.error('[API /api/business/disconnect Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to disconnect business' },
      { status: 500 }
    );
  }
}
