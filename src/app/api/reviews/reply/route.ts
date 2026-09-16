export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidAccessTokenForProfile, replyToGBPReview } from '@/lib/google-gbp';
import { Profile } from '@/lib/supabase/types';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { reviewId, replyText, userId } = body;

    if (!reviewId || !replyText || typeof replyText !== 'string' || !replyText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Both reviewId and a non-empty replyText are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let profile: Profile | null = null;
    let localReviewRecord: any = null;

    if (supabase) {
      // 1. Locate review in local database
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId);
      if (isUuid) {
        const { data: revData } = await supabase
          .from('reviews')
          .select('*')
          .eq('id', reviewId)
          .maybeSingle();
        localReviewRecord = revData;
      }

      const targetUserId = userId || localReviewRecord?.user_id;

      if (targetUserId) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();
        profile = profData as Profile;
      }
    }

    const effectiveAccountId = profile?.google_account_id;
    const effectiveLocationId = profile?.google_location_id;
    const cleanGoogleReviewId = reviewId.replace(/^rev_gbp_/, '').replace(/^rev_google_/, '').replace(/^rev_/, '');

    // 2. Publish to Google Business Profile via API if OAuth is connected
    let gbpPublished = false;
    let publishError: string | null = null;

    if (profile && profile.google_access_token && effectiveAccountId && effectiveLocationId) {
      const accessToken = await getValidAccessTokenForProfile(profile, async (updates) => {
        if (supabase && profile?.id) {
          await supabase.from('profiles').update(updates).eq('id', profile.id);
        }
      });

      if (accessToken) {
        const gbpResult = await replyToGBPReview(
          effectiveAccountId,
          effectiveLocationId,
          cleanGoogleReviewId,
          replyText.trim(),
          accessToken
        );

        if (gbpResult.success) {
          gbpPublished = true;
        } else {
          publishError = gbpResult.error || 'Failed to publish to Google Business Profile API';
          console.warn('[GBP Reply Warning]:', publishError);
        }
      }
    }

    // 3. Update local database record
    const repliedAt = new Date().toISOString();
    if (supabase && localReviewRecord?.id) {
      await supabase
        .from('reviews')
        .update({
          status: 'published',
          published_reply: replyText.trim(),
          published_at: repliedAt,
          updated_at: repliedAt,
        })
        .eq('id', localReviewRecord.id);
    }

    return NextResponse.json({
      success: true,
      published_to_google: gbpPublished,
      reply_text: replyText.trim(),
      replied_at: repliedAt,
      warning: publishError || undefined,
    });
  } catch (err: any) {
    console.error('[API /api/reviews/reply Exception]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to publish review reply' },
      { status: 500 }
    );
  }
}
