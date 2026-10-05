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

    // If generation or regeneration is requested (or replyText is omitted):
    if (action === 'generate' || action === 'regenerate' || (!replyText && (effectiveReviewText || reviewId || reviewerName))) {
      const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY ||
        '';

      if (!apiKey) {
        console.error('[Gemini API] GEMINI_API_KEY environment variable is not set! Missing API Key.');
      }

      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
              temperature: 0.9, // Ensures creative and diverse phrasing on every regeneration
              maxOutputTokens: 150,
            },
          });

          const prompt = `You are the owner of "${businessName || 'our business'}". Write a natural, warm, and authentic 2-sentence response to this customer review.

Reviewer: ${reviewerName}
Rating: ${rating || 5} Stars
Review: "${effectiveReviewText || 'Great experience!'}"

MANDATORY RULES:
1. NEVER use generic templates or robotic formulas (e.g., do NOT say "We are grateful for your review and can't wait to provide you with another 5-star experience").
2. CONCRETE SPECIFICS: Look at what the reviewer actually wrote. If they mention specific items, flavors, portion sizes, prices, or details (like "ice cream tacos", "Dole whip", "gelato", "creative twists", "slices", "tacos", "coffee"), you MUST mention those exact highlights.
3. NO HASHTAGS: Do not include hashtags.
4. PERSONAL TONE: Speak casually and genuinely, like a proud local business owner speaking to a valued neighbor.`;

          const result = await model.generateContent(prompt);
          const rawReply = result.response.text();
          if (rawReply && rawReply.trim()) {
            const cleaned = rawReply
              .trim()
              .replace(/^["']|["']$/g, '')
              .replace(/#\w+/g, '')
              .trim();

            return NextResponse.json({
              success: true,
              reply: cleaned,
              replyText: cleaned,
              model: 'gemini-1.5-flash',
            });
          }
        } catch (geminiError: any) {
          console.error('[Gemini API Error]:', geminiError);
        }
      }

      // Dynamic Contextual Item-Aware Generator (Guarantees specific detail extraction even if API key is not active)
      const firstName = reviewerName.split(' ')[0] || 'there';
      const textLower = effectiveReviewText.toLowerCase();

      // Specific item matcher (e.g., ice cream tacos, dole whip, gelato, flavors, tacos, pizza, etc.)
      const itemMatch = textLower.match(/(?:ice cream tacos?|dole whip|gelato|sorbet|ice cream|twist|waffle cones?|sundaes?|tacos?|pizza|slices?|burgers?|pasta|fries|coffee|latte|sandwiches?|wings?|sushi|salad|shakes?|desserts?|specials?)/i);
      
      let fallbackReply = '';
      if (itemMatch) {
        const item = itemMatch[0];
        const itemVariants = [
          `Hi ${firstName}, thank you so much for the review! We're thrilled that you loved the ${item} at ${businessName}, and we can't wait to have you back for more soon!`,
          `Thanks for stopping by, ${firstName}! Hearing how much you enjoyed the ${item} totally made our day here at ${businessName}. See you next time!`,
          `Hi ${firstName}, we really appreciate your support! The ${item} is a huge favorite around ${businessName} too—so glad it hit the spot for you!`,
        ];
        fallbackReply = itemVariants[Math.floor(Math.random() * itemVariants.length)];
      } else if (rating >= 5) {
        const fiveStarPool = [
          `Hi ${firstName}, thank you so much for the fantastic 5-star rating! Everyone at ${businessName} appreciates your support and we're looking forward to seeing you again soon.`,
          `Thanks a ton, ${firstName}! We love making every visit special at ${businessName} and truly appreciate you taking the time to share your experience.`,
          `Hello ${firstName}! Your kind words mean the world to our team at ${businessName}. We can't wait to welcome you back!`,
        ];
        fallbackReply = fiveStarPool[Math.floor(Math.random() * fiveStarPool.length)];
      } else {
        fallbackReply = `Hi ${firstName}, thank you for your feedback. We always strive to give everyone the best experience at ${businessName}, and we'd love the opportunity to welcome you back soon.`;
      }

      return NextResponse.json({
        success: true,
        reply: fallbackReply,
        replyText: fallbackReply,
        model: 'dynamic-contextual-fallback',
      });
    }

    // Handle Review Publishing to GBP and Database
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
  } catch (error: any) {
    console.error('[API /api/reviews/reply Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process review reply' },
      { status: 500 }
    );
  }
}
