export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawUserId = body.userId || body.user_id;

    const isUuid = rawUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);
    if (!isUuid) {
      return NextResponse.json({ success: true, message: 'Local profile disconnected' });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await Promise.allSettled([
        supabase
          .from('profiles')
          .update({
            business_name: '',
            google_place_id: '',
            formatted_address: null,
            review_url: null,
            google_rating: 0,
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
          .eq('id', rawUserId),

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
          .eq('user_id', rawUserId),

        supabase
          .from('reviews')
          .delete()
          .eq('user_id', rawUserId),
      ]);
    }

    return NextResponse.json({ success: true, message: 'Business successfully disconnected' });
  } catch (err: any) {
    console.error('[API /api/business/disconnect Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to disconnect business' },
      { status: 500 }
    );
  }
}
