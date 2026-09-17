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
      return NextResponse.json({ success: true, message: 'Local test data reset complete' });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await Promise.allSettled([
        // 1. Delete all review invites / feedback records for this user
        supabase
          .from('review_invites')
          .delete()
          .eq('user_id', rawUserId),

        // 2. Delete all reviews for this user
        supabase
          .from('reviews')
          .delete()
          .eq('user_id', rawUserId),

        // 3. Reset profile business details and OAuth tokens
        supabase
          .from('profiles')
          .update({
            business_name: '',
            business_category: '',
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
            phone: null,
            notification_phone: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rawUserId),

        // 4. Reset business_settings to clean initial defaults
        supabase
          .from('business_settings')
          .update({
            brand_voice: 'friendly_professional',
            auto_publish_5_star: false,
            custom_keywords: [],
            sms_template: 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}',
            google_review_url: null,
            place_id: null,
            notification_phone: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', rawUserId),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Account reset and all test data wiped successfully',
    });
  } catch (err: any) {
    console.error('[API /api/account/reset Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to reset account and test data' },
      { status: 500 }
    );
  }
}
