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

    const targetModels = ['gemini-2.5-flash', 'gemini-1.5-flash-latest'];
    let reply = '';
    let lastError: any = null;

    for (const modelName of targetModels) {
      // Attempt up to 2 times per model with backoff
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel(
            {
              model: modelName,
              generationConfig: {
                // @ts-ignore
                thinkingConfig: { thinkingBudget: 0 },
                temperature: 0.75,
                maxOutputTokens: 250,
              },
            },
            { timeout: 8000 }
          );

          // Guarantee 8-second timeout window
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out after 8 seconds')), 8000)
          );

          const result: any = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise,
          ]);

          const rawText = result?.response?.text ? result.response.text() : '';
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
            err?.message?.includes('Resource has been exhausted') ||
            err?.message?.includes('timed out');

          if (isThrottle && attempt < 2) {
            console.warn(`[Gemini API] Retrying ${modelName} after throttle/timeout (attempt ${attempt})...`);
            await sleep(1000 * attempt);
            continue;
          }
          break; // Move to next model
        }
      }
      if (reply) break;
    }

    if (!reply) {
      console.warn('Gemini model calls exhausted or temporarily busy:', lastError?.message || lastError);
      return NextResponse.json(
        { error: 'Google AI servers are momentarily busy. Please try again in a few seconds.' },
        { status: 503 }
      );
    }

    console.log("Full generated reply from Gemini:", reply);

    return NextResponse.json({ reply, replyText: reply });
  } catch (error: any) {
    console.error('[Gemini Route Error]:', error);
    return NextResponse.json(
      { error: 'Google AI servers are momentarily busy. Please try again in a few seconds.' },
      { status: 503 }
    );
  }
}
