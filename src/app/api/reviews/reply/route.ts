export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { getValidAccessTokenForProfile, replyToGBPReview } from '@/lib/google-gbp';
import { Profile } from '@/lib/supabase/types';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      reviewId,
      replyText,
      userId,
      action,
    } = body;

    const reviewerName = body.reviewerName || body.authorName || 'Valued Customer';
    const effectiveReviewText = body.reviewText || body.text || '';
    const businessName = body.businessName || 'our business';

    // If publishing an existing approved reply:
    if (replyText && action !== 'regenerate' && action !== 'generate') {
      if (!reviewId || typeof replyText !== 'string' || !replyText.trim()) {
        return NextResponse.json(
          { success: false, error: 'Both reviewId and a non-empty replyText are required.' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      let profile: Profile | null = null;
      let localReviewRecord: any = null;

      if (supabase) {
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
    }

    // Call Gemini to generate a response
    if (!process.env.GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY in environment');
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    const prompt = `You are the owner of "${businessName || 'our business'}". Write a warm, genuine 2-sentence reply to this review. Do not use generic corporate language or rigid templates. Celebrate specific things they mentioned (like menu items or atmosphere).

Reviewer: ${reviewerName}
Review: "${effectiveReviewText}"`;

    const modelCandidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
    let reply = '';
    let lastError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.95 },
        });
        const result = await model.generateContent(prompt);
        reply = result.response.text().trim();
        if (reply) break;
      } catch (e: any) {
        lastError = e;
        console.warn(`[Gemini API] Candidate model ${modelName} failed:`, e?.message || e);
      }
    }

    if (!reply && lastError) {
      throw lastError;
    }

    return NextResponse.json({ reply, replyText: reply });
  } catch (err: any) {
    console.error('Gemini API execution error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate reply' }, { status: 500 });
  }
}
