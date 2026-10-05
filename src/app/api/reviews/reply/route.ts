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
    const {
      reviewId,
      replyText,
      userId,
      action,
      businessCategory = 'Local Business',
      tone = 'friendly_professional',
      keywords = [],
    } = body;

    const reviewerName = body.reviewerName || body.authorName || 'Valued Customer';
    const effectiveReviewText = body.reviewText || body.text || '';
    const rating = Number(body.rating) || 5;
    const businessName = body.businessName || 'our business';

    // If generation/regeneration is requested (or replyText is omitted):
    if (action === 'generate' || action === 'regenerate' || (!replyText && (effectiveReviewText || reviewId))) {
      const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY;

      if (apiKey) {
        try {
          const prompt = `You are the owner of "${businessName}". Write a genuine, warm 2-sentence response to this Google review.

Reviewer: ${reviewerName}
Rating: ${rating} Stars
Review Content: "${effectiveReviewText || 'Great service!'}"

STRICT GUIDELINES:
1. HIGHLIGHT SPECIFIC ITEMS: If the reviewer mentions specific menu items, products, or service highlights, explicitly mention them.
2. NATURAL & AUTHENTIC TONE: Write casually and warmly as a genuine local business owner.
3. NO HASHTAGS: Strictly forbidden.
4. FRESH DIVERSITY: Provide a distinct, creative phrasing variation each time.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.9,
                  maxOutputTokens: 250,
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText && generatedText.trim()) {
              const cleaned = generatedText
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
          }
        } catch (geminiErr) {
          console.warn('[API /api/reviews/reply Gemini Exception]:', geminiErr);
        }
      }

      // Dynamic Contextual Fallback Generator (No static modulo rotation)
      const firstName = reviewerName.split(' ')[0] || 'there';
      const fallbackTemplates = [
        `Hi ${firstName}, thank you so much for taking the time to share your feedback with us! We appreciate your support of ${businessName} and look forward to welcoming you back soon.`,
        `Hello ${firstName}! We are thrilled to hear you had a great experience with our team at ${businessName}. Thank you for your support and see you next time!`,
        `Hi ${firstName}, thanks a million for the positive rating! Hearing from wonderful customers like you truly makes our day at ${businessName}.`,
        `Thanks for visiting ${businessName}, ${firstName}! We are grateful for your review and can't wait to provide you with another 5-star experience on your next visit.`,
      ];
      const randomFallback = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
      return NextResponse.json({
        success: true,
        reply: randomFallback,
        replyText: randomFallback,
        model: 'dynamic-fallback',
      });
    }

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
