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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
    const rating = Number(body.rating) || 5;
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
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const prompt = `You are the owner of "${businessName || "Scoop 'n Twist"}".
Write a warm, authentic 2-sentence reply thanking ${reviewerName} for their ${rating || 5}-star review.
Customer review: "${effectiveReviewText}"

Rules:
- Mention at least one specific detail or menu item they wrote about.
- Keep it natural and neighborly.
- Output ONLY the final response text without quotes or commentary.`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];
    let reply = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      // Attempt up to 3 times per model with increasing backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              // @ts-ignore
              thinkingConfig: { thinkingBudget: 0 },
              temperature: 0.75,
              maxOutputTokens: 250,
            },
          });

          const result = await model.generateContent(prompt);
          const rawText = result.response.text();
          if (rawText && rawText.trim().length > 0) {
            reply = rawText.trim().replace(/^["']|["']$/g, '');
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isThrottle =
            err?.status === 429 ||
            err?.status === 503 ||
            err?.message?.includes('429') ||
            err?.message?.includes('503') ||
            err?.message?.includes('high demand') ||
            err?.message?.includes('overloaded') ||
            err?.message?.includes('Resource has been exhausted');

          if (isThrottle && attempt < 3) {
            // Wait 1.2s on first retry, 2.4s on second retry
            console.warn(`[Gemini API] Throttled on ${modelName} (attempt ${attempt}), backing off for ${1200 * attempt}ms...`);
            await sleep(1200 * attempt);
            continue;
          }
          break; // If non-throttle error, move to next model
        }
      }
      if (reply) break;
    }

    if (!reply) {
      console.error('All Gemini attempts failed:', lastError);
      return NextResponse.json({ error: 'Google AI is currently busy. Please wait a few seconds and try again.' }, { status: 503 });
    }

    console.log("Full generated reply from Gemini:", reply);

    return NextResponse.json({ reply, replyText: reply });
  } catch (error: any) {
    console.error('[Gemini Route Error]:', error);
    return NextResponse.json({ error: 'Server error processing reply' }, { status: 500 });
  }
}
