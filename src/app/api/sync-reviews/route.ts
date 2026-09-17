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

async function handleSync(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    const rawPlaceId = body.place_id || body.placeId || url.searchParams.get('place_id') || url.searchParams.get('placeId') || '';
    const rawBusinessId = body.business_id || body.businessId || url.searchParams.get('business_id') || url.searchParams.get('businessId') || '';
    const rawUserId = body.user_id || body.userId || url.searchParams.get('user_id') || url.searchParams.get('userId') || '';
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

    // 1. Try Google Business Profile (GBP) OAuth Direct Sync if available
    let gbpSynced = false;
    if (userProfile && (userProfile.google_access_token || userProfile.google_refresh_token) && userProfile.google_account_id && userProfile.google_location_id) {
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
          placeName = gData.result.name || '';
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

    const formattedReviews: any[] = googleReviews.map((rev, index) => {
      const authorName = rev.author_name || rev.reviewer?.displayName || 'Google Customer';
      const firstName = authorName.split(' ')[0] || 'there';
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

      let aiDraftReply = rev.ai_draft_reply || '';
      if (!aiDraftReply) {
        if (rating >= 4) {
          aiDraftReply = `Thank you so much for the 5-star review, ${firstName}! We are thrilled to hear you had such a great experience with our team at ${placeName || 'our business'}. We look forward to seeing you again soon! #friendlyservice #5star`;
        } else if (rating === 3) {
          aiDraftReply = `Thank you for taking the time to share your feedback, ${firstName}. We appreciate your business and are always working to improve. Please feel free to reach out to us directly so we can ensure your next visit is exceptional.`;
        } else {
          aiDraftReply = `Hi ${firstName}, thank you for your feedback. We take all feedback seriously and would love the opportunity to make things right. Please reach out to us directly so we can assist you.`;
        }
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
        keywords_used: ['friendly_service', '5star_experience'],
        created_at: reviewDate,
      };
    });

    const insertedReviews: any[] = [];

    if (supabaseAdmin && formattedReviews.length > 0 && resolvedUserId) {
      // Fetch existing reviews to prevent duplicates and enable clean upsert
      let existingQuery = supabaseAdmin
        .from('reviews')
        .select('id, author_name, review_text, review_date, place_id')
        .eq('user_id', resolvedUserId);

      if (placeId) {
        existingQuery = existingQuery.eq('place_id', placeId);
      }

      const { data: existingDbReviews } = await existingQuery;

      const existingMap = new Map<string, string>();
      (existingDbReviews || []).forEach((r: any) => {
        const key = `${(r.author_name || '').trim().toLowerCase()}::${(r.review_text || '').trim().slice(0, 60).toLowerCase()}`;
        existingMap.set(key, r.id);
      });

      for (const rev of formattedReviews) {
        const key = `${(rev.author_name || '').trim().toLowerCase()}::${(rev.review_text || '').trim().slice(0, 60).toLowerCase()}`;
        const existingId = existingMap.get(key);

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
          keywords_used: ['friendly_service', '5star_experience'],
          ai_model: 'gemini-1.5-flash',
          published_at: rev.published_reply ? (rev.published_at || rev.review_date) : null,
          updated_at: new Date().toISOString(),
        };

        try {
          if (existingId) {
            const { data: updData, error: updError } = await supabaseAdmin
              .from('reviews')
              .update(cleanDbRecord)
              .eq('id', existingId)
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
              existingMap.set(key, insData[0].id);
            } else if (insError) {
              console.error('[Review DB Insert Error]:', insError.message, insError.details, insError.hint);
            }
          }
        } catch (dbErr) {
          console.error('[Review DB Operation Exception]:', dbErr);
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
