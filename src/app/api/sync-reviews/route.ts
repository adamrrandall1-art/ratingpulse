export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchGBPReviews, getValidAccessTokenForProfile } from '@/lib/google-gbp';
import { Profile } from '@/lib/supabase/types';

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

/**
 * Generate a unique, contextual AI reply for a review.
 * Uses Gemini AI directly with fallback to contextual synthesis.
 */
async function generateUniqueAIReply({
  authorName,
  rating,
  reviewText,
  businessName,
  businessCategory,
}: {
  authorName: string;
  rating: number;
  reviewText: string;
  businessName: string;
  businessCategory?: string;
}): Promise<string> {
  const firstName = authorName.trim().split(' ')[0] || 'Valued Customer';
  const bizName = businessName || 'our business';
  const cleanReviewText = (reviewText || '').trim();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are the owner of "${bizName}". Write a genuine, warm 2-sentence response to this Google review.

Reviewer: ${authorName}
Rating: ${rating} Stars
Review Content: "${cleanReviewText || 'Great service!'}"

STRICT GUIDELINES:
1. HIGHLIGHT SPECIFIC ITEMS: If the reviewer mentions specific menu items, products, or service highlights (for example: ice cream flavors, tacos, slices, portion sizes, staff names), you MUST explicitly mention those exact items/details in your reply. Do not give generic compliments when specific items were praised.
2. NATURAL & AUTHENTIC TONE: Write casually and warmly as a local shop owner. Avoid corporate jargon like "our team puts a lot of passion into crafting every order".
3. NO HASHTAGS: Strictly forbidden. Do not include any # tags.
4. FRESH DIVERSITY: Provide a distinct and creative phrasing variation each time this runs.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 250,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim()) {
          const cleaned = generated
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/#\w+/g, '')
            .trim();
          if (cleaned) return cleaned;
        }
      }
    } catch (apiErr) {
      console.warn('[Gemini Sync Generation Warning]:', apiErr);
    }
  }

  // Intelligent fallback generator dynamically matching the customer's actual words
  return buildIntelligentContextualReply({
    firstName,
    authorName,
    rating,
    reviewText: cleanReviewText,
    businessName: bizName,
  });
}

function buildIntelligentContextualReply({
  firstName,
  authorName,
  rating,
  reviewText,
  businessName,
}: {
  firstName: string;
  authorName: string;
  rating: number;
  reviewText: string;
  businessName: string;
}): string {
  const textLower = reviewText.toLowerCase();

  // No text (star rating only)
  if (!reviewText) {
    if (rating >= 5) {
      const star5Pool = [
        `Hi ${firstName}, thank you so much for the 5-star rating! We truly appreciate your support and look forward to welcoming you back to ${businessName}.`,
        `Thank you for the wonderful 5-star rating, ${firstName}! We are honored to have your trust and can't wait to see you again soon at ${businessName}.`,
        `Hello ${firstName}, we really appreciate your top rating! Serving you is always a pleasure, and our entire team thanks you for your support.`,
      ];
      return star5Pool[Math.floor(Math.random() * star5Pool.length)];
    }
    if (rating === 4) {
      return `Hi ${firstName}, thank you for the positive 4-star rating! We appreciate your support and look forward to serving you again at ${businessName}.`;
    }
    return `Hi ${firstName}, thank you for taking the time to rate us. We always strive to provide a 5-star experience, so please reach out to us directly if there is anything we can do to assist you.`;
  }

  // Contextual topic matching directly based on review keywords
  if (rating >= 5) {
    // Specific item detection (e.g. ice cream tacos, tacos, ice cream, pizza, burger, etc.)
    const itemMatch = textLower.match(/(?:ice cream tacos?|ice cream|tacos?|pizza|slices?|burgers?|pasta|fries|coffee|latte|sandwiches?|wings?|sushi|salad|shakes?|desserts?|specials?)/i);
    if (itemMatch) {
      const item = itemMatch[0];
      const itemVariants = [
        `Hi ${firstName}, thank you so much for the 5-star review! We're so glad you loved the ${item} at ${businessName}. Can't wait to see you again soon!`,
        `Thanks for the awesome review, ${firstName}! Hearing how much you enjoyed the ${item} made our day here at ${businessName}. See you next time!`,
        `Hi ${firstName}, we really appreciate your 5-star review! The ${item} is definitely one of our favorites too. Hope to have you back at ${businessName} soon!`,
      ];
      return itemVariants[Math.floor(Math.random() * itemVariants.length)];
    }

    // Food / Dining / Drinks
    if (
      textLower.includes('delicious') || textLower.includes('tasty') || textLower.includes('food') ||
      textLower.includes('meal') || textLower.includes('flavor') || textLower.includes('drink') || textLower.includes('dish')
    ) {
      const foodPool = [
        `Hi ${firstName}, thank you so much for the 5-star review! We're thrilled you enjoyed your visit to ${businessName}. See you again soon!`,
        `Thanks a million, ${firstName}! We love hearing that you had a great experience at ${businessName}.`,
      ];
      return foodPool[Math.floor(Math.random() * foodPool.length)];
    }

    // Ambiance / Cleanliness / Atmosphere
    if (textLower.includes('clean') || textLower.includes('modern') || textLower.includes('atmosphere') || textLower.includes('vibe') || textLower.includes('space') || textLower.includes('beautiful')) {
      const cleanPool = [
        `Thank you so much, ${firstName}! We are so pleased you enjoyed our clean, welcoming space and had a wonderful visit to ${businessName}.`,
        `Hi ${firstName}, hearing that you enjoyed our atmosphere made our day! We put a lot of care into creating a great environment for our guests. See you next time!`,
      ];
      return cleanPool[Math.floor(Math.random() * cleanPool.length)];
    }

    // Family / Kids
    if (textLower.includes('kid') || textLower.includes('daughter') || textLower.includes('son') || textLower.includes('child') || textLower.includes('family')) {
      return `Thank you for such a kind note, ${firstName}! Creating a warm, welcoming experience for families is what we love most at ${businessName}. Please send our warmest regards to your family!`;
    }

    // Staff / Prompt service / Friendly team
    if (textLower.includes('fast') || textLower.includes('quick') || textLower.includes('prompt') || textLower.includes('friendly') || textLower.includes('staff') || textLower.includes('team') || textLower.includes('service') || textLower.includes('recommend')) {
      const servicePool = [
        `Hi ${firstName}, thank you for highlighting our prompt service and friendly team! We respect your time and love making every visit to ${businessName} as seamless as possible.`,
        `Hello ${firstName}! Your recommendation means the world to everyone at ${businessName}. Providing attentive, high-standard service is what drives us every single day.`,
      ];
      return servicePool[Math.floor(Math.random() * servicePool.length)];
    }

    // General high praise (non-dental)
    const generic5Pool = [
      `Thank you so much for the 5-star review, ${firstName}! We are dedicated to providing an outstanding experience and can't wait to welcome you back to ${businessName}.`,
      `Hi ${firstName}, we truly appreciate your generous feedback! Knowing you had a great visit inspires our whole team at ${businessName} to keep setting the standard.`,
      `Wonderful feedback like yours makes our day, ${firstName}! Thank you for choosing ${businessName} and taking the time to share your experience.`,
    ];
    return generic5Pool[Math.floor(Math.random() * generic5Pool.length)];
  }

  if (rating === 4) {
    if (textLower.includes('parking') || textLower.includes('wait') || textLower.includes('busy') || textLower.includes('line')) {
      return `Hi ${firstName}, thank you for your honest 4-star review and praise for our team! We appreciate your feedback regarding the busy peak hours and are constantly working to make your experience at ${businessName} even smoother.`;
    }
    return `Hi ${firstName}, thank you for your kind 4-star review! We're glad you had a great experience overall, and we look forward to welcoming you back to ${businessName}.`;
  }

  // 1-3 Stars
  return `Dear ${firstName}, thank you for bringing this to our attention. We hold ourselves to high standards and sincerely apologize that your experience at ${businessName} did not reflect that. Please reach out to us directly so we can make things right.`;
}

function isStaleGenericDraft(draft: string | null | undefined): boolean {
  if (!draft || !draft.trim()) return true;
  const lower = draft.toLowerCase();
  if (lower.includes('#5star') || lower.includes('#friendlyservice') || lower.includes('#friendly_service')) return true;
  if (lower.includes('we are thrilled to hear you had such a great experience with our team')) return true;
  return false;
}

async function handleSync(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    const rawPlaceId = body.place_id || body.placeId || url.searchParams.get('place_id') || url.searchParams.get('placeId') || '';
    const rawBusinessId = body.business_id || body.businessId || url.searchParams.get('business_id') || url.searchParams.get('businessId') || '';
    const rawUserId = body.user_id || body.userId || url.searchParams.get('user_id') || url.searchParams.get('userId') || '';
    const regenerateAll = Boolean(
      body.regenerateAll ||
      body.regenerate_all ||
      url.searchParams.get('regenerateAll') === 'true' ||
      url.searchParams.get('regenerate_all') === 'true'
    );

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      'AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY';

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const resolvedUserId = (rawUserId && isUuid.test(rawUserId)) ? rawUserId : (rawBusinessId && isUuid.test(rawBusinessId)) ? rawBusinessId : null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseAdmin = (supabaseUrl && supabaseKey)
      ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
      : null;

    let userProfile: Profile | null = null;
    if (supabaseAdmin && resolvedUserId) {
      const { data: pData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', resolvedUserId)
        .maybeSingle();
      userProfile = pData as Profile;
    }

    const placeId = rawPlaceId || userProfile?.google_place_id || '';
    let googleReviews: any[] = [];
    let placeRating = userProfile?.google_rating || 5.0;
    let totalRatings = userProfile?.google_review_count || 0;
    let placeName = userProfile?.business_name || '';

    // 1. Try Google Business Profile (GBP) OAuth Direct Sync if available and matching target place
    let gbpSynced = false;
    const isPlaceMatch = !rawPlaceId || !userProfile?.google_place_id || rawPlaceId === userProfile.google_place_id;
    if (isPlaceMatch && userProfile && (userProfile.google_access_token || userProfile.google_refresh_token) && userProfile.google_account_id && userProfile.google_location_id) {
      try {
        const accessToken = await getValidAccessTokenForProfile(userProfile, async (updates) => {
          if (supabaseAdmin && userProfile?.id) {
            await supabaseAdmin.from('profiles').update(updates).eq('id', userProfile.id);
          }
        });

        if (accessToken) {
          const gbpData = await fetchGBPReviews(userProfile.google_account_id, userProfile.google_location_id, accessToken);
          if (gbpData.reviews && gbpData.reviews.length > 0) {
            googleReviews = gbpData.reviews;
            if (gbpData.averageRating) placeRating = gbpData.averageRating;
            if (gbpData.totalReviewCount) totalRatings = gbpData.totalReviewCount;
            gbpSynced = true;
          }
        }
      } catch (gbpErr) {
        console.warn('[GBP Sync Warning, falling back to Places API]:', gbpErr);
      }
    }

    // 2. Fallback to Google Places API if GBP OAuth is not connected or returned no reviews
    if (!gbpSynced && placeId && apiKey) {
      try {
        const placesEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId
        )}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;

        const gRes = await fetch(placesEndpoint);
        const gData = await gRes.json();

        if (gData.status === 'OK' && gData.result) {
          placeName = gData.result.name || placeName;
          placeRating = Number(gData.result.rating) || 5.0;
          totalRatings = Number(gData.result.user_ratings_total) || 0;
          googleReviews = gData.result.reviews || [];
        } else {
          console.warn('[Google Places API returned status]:', gData.status, gData.error_message);
        }
      } catch (gErr) {
        console.error('[Google Places API fetch error]:', gErr);
      }
    }

    // Generate unique AI replies for all reviews asynchronously
    const formattedReviews: any[] = await Promise.all(
      googleReviews.map(async (rev, index) => {
        const authorName = rev.author_name || rev.reviewer?.displayName || 'Google Customer';
        const rating = Math.max(1, Math.min(5, Math.round(Number(rev.rating)) || 5));
        const text = rev.review_text || rev.text || rev.comment || '';

        let reviewDate: string;
        if (typeof rev.time === 'number') {
          reviewDate = new Date(rev.time > 1e11 ? rev.time : rev.time * 1000).toISOString();
        } else if (rev.review_date || rev.createTime) {
          const parsed = new Date(rev.review_date || rev.createTime);
          reviewDate = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
        } else {
          reviewDate = new Date().toISOString();
        }

        const authorAvatar = rev.author_avatar || rev.profile_photo_url || rev.reviewer?.profilePhotoUrl || null;
        const publishedReply = rev.published_reply || rev.review_reply || rev.reviewReply?.comment || null;
        const repliedAt = rev.replied_at || rev.reviewReply?.updateTime || (publishedReply ? reviewDate : null);
        const googleResourceReviewId = rev.review_id || rev.reviewId || `rev_google_${(placeId || 'loc').slice(-6)}_${rev.time || Date.now()}_${index}`;

        // Automatically generate unique contextual reply if missing or stale generic template
        let aiDraftReply = rev.ai_draft_reply || '';
        if (!aiDraftReply || isStaleGenericDraft(aiDraftReply) || regenerateAll) {
          aiDraftReply = await generateUniqueAIReply({
            authorName,
            rating,
            reviewText: text,
            businessName: placeName || userProfile?.business_name || 'our business',
            businessCategory: userProfile?.business_category,
          });
        }

        return {
          id: rev.id || `rev_${googleResourceReviewId}`,
          user_id: resolvedUserId || 'usr_mock_001',
          business_id: resolvedUserId || null,
          place_id: placeId || null,
          review_id: googleResourceReviewId,
          author_name: authorName,
          author_avatar: authorAvatar,
          rating,
          review_text: text,
          review_date: reviewDate,
          ai_draft_reply: aiDraftReply,
          review_reply: publishedReply,
          published_reply: publishedReply,
          replied_at: repliedAt,
          published_at: repliedAt,
          status: publishedReply ? 'published' : (rev.status || 'pending_approval'),
          sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
          keywords_used: ['personalized_care', '5star_experience'],
          created_at: reviewDate,
        };
      })
    );

    const insertedReviews: any[] = [];

    if (supabaseAdmin && resolvedUserId) {
      // 1. Upsert / update newly synced reviews
      if (formattedReviews.length > 0) {
        let existingQuery = supabaseAdmin
          .from('reviews')
          .select('id, author_name, review_text, review_date, place_id, ai_draft_reply')
          .eq('user_id', resolvedUserId);

        if (placeId) {
          existingQuery = existingQuery.eq('place_id', placeId);
        }

        const { data: existingDbReviews } = await existingQuery;

        const existingMap = new Map<string, { id: string; ai_draft_reply?: string }>();
        (existingDbReviews || []).forEach((r: any) => {
          const key = `${(r.author_name || '').trim().toLowerCase()}::${(r.review_text || '').trim().slice(0, 60).toLowerCase()}`;
          existingMap.set(key, { id: r.id, ai_draft_reply: r.ai_draft_reply });
        });

        for (const rev of formattedReviews) {
          const key = `${(rev.author_name || '').trim().toLowerCase()}::${(rev.review_text || '').trim().slice(0, 60).toLowerCase()}`;
          const existingRecord = existingMap.get(key);

          const cleanDbRecord: Record<string, unknown> = {
            user_id: resolvedUserId,
            business_id: resolvedUserId,
            place_id: placeId || null,
            author_name: rev.author_name || 'Google Customer',
            author_avatar: rev.author_avatar || null,
            rating: Math.max(1, Math.min(5, Math.round(Number(rev.rating)) || 5)),
            review_text: rev.review_text || '',
            review_date: rev.review_date,
            ai_draft_reply: rev.ai_draft_reply || '',
            published_reply: rev.published_reply || null,
            status: rev.published_reply ? 'published' : (rev.status || 'pending_approval'),
            sentiment: rev.sentiment || (rev.rating >= 4 ? 'positive' : rev.rating === 3 ? 'neutral' : 'negative'),
            keywords_used: ['personalized_care', '5star_experience'],
            ai_model: 'gemini-1.5-flash',
            published_at: rev.published_reply ? (rev.published_at || rev.review_date) : null,
            updated_at: new Date().toISOString(),
          };

          try {
            if (existingRecord?.id) {
              const { data: updData, error: updError } = await supabaseAdmin
                .from('reviews')
                .update(cleanDbRecord)
                .eq('id', existingRecord.id)
                .select();

              if (!updError && updData && updData.length > 0) {
                insertedReviews.push(updData[0]);
              } else if (updError) {
                console.error('[Review DB Update Error]:', updError.message, updError.details, updError.hint);
              }
            } else {
              const { data: insData, error: insError } = await supabaseAdmin
                .from('reviews')
                .insert([cleanDbRecord])
                .select();

              if (!insError && insData && insData.length > 0) {
                insertedReviews.push(insData[0]);
                existingMap.set(key, { id: insData[0].id, ai_draft_reply: cleanDbRecord.ai_draft_reply as string });
              } else if (insError) {
                console.error('[Review DB Insert Error]:', insError.message, insError.details, insError.hint);
              }
            }
          } catch (dbErr) {
            console.error('[Review DB Operation Exception]:', dbErr);
          }
        }
      }

      // 2. If regenerateAll is true, scan all existing reviews in the DB and update any generic or stale drafts
      if (regenerateAll) {
        const { data: allStoredReviews } = await supabaseAdmin
          .from('reviews')
          .select('id, author_name, review_text, rating, ai_draft_reply, published_reply')
          .eq('user_id', resolvedUserId);

        if (allStoredReviews && allStoredReviews.length > 0) {
          for (const sRev of allStoredReviews) {
            if (!sRev.published_reply) {
              const freshDraft = await generateUniqueAIReply({
                authorName: sRev.author_name || 'Google Customer',
                rating: sRev.rating || 5,
                reviewText: sRev.review_text || '',
                businessName: placeName || userProfile?.business_name || 'our business',
                businessCategory: userProfile?.business_category,
              });

              await supabaseAdmin
                .from('reviews')
                .update({
                  ai_draft_reply: freshDraft,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', sRev.id);
            }
          }
        }
      }

      // Update business settings and profile stats in Supabase
      try {
        await Promise.allSettled([
          supabaseAdmin.from('profiles').update({
            google_rating: placeRating,
            google_review_count: totalRatings,
            google_place_id: placeId,
            google_connected: true,
            updated_at: new Date().toISOString(),
          }).eq('id', resolvedUserId),
          supabaseAdmin.from('business_settings').update({
            google_review_url: `https://search.google.com/local/writereview?placeid=${placeId}`,
            place_id: placeId,
            updated_at: new Date().toISOString(),
          }).eq('user_id', resolvedUserId),
        ]);
      } catch (updateErr) {
        console.warn('[Profile stats update error]:', updateErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: formattedReviews.length,
      synced_records: insertedReviews.length,
      reviews: formattedReviews,
      stats: {
        place_name: placeName,
        average_rating: placeRating,
        total_reviews: totalRatings,
      },
    });
  } catch (err: any) {
    console.error('[Fatal sync-reviews error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to sync Google reviews' },
      { status: 500 }
    );
  }
}

