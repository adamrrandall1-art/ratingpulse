export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const placeId = body.place_id || body.placeId || url.searchParams.get('place_id') || url.searchParams.get('placeId') || '';
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

    let googleReviews: any[] = [];
    let placeRating = 5.0;
    let totalRatings = 0;
    let placeName = '';

    if (placeId && apiKey) {
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
      const authorName = rev.author_name || 'Google Customer';
      const firstName = authorName.split(' ')[0] || 'there';
      const rating = Number(rev.rating) || 5;
      const text = rev.text || '';
      const reviewDate = rev.time ? new Date(rev.time * 1000).toISOString() : new Date().toISOString();
      const authorAvatar = rev.profile_photo_url || null;

      let aiDraftReply = '';
      if (rating >= 4) {
        aiDraftReply = `Thank you so much for the 5-star review, ${firstName}! We are thrilled to hear you had such a great experience with our team at ${placeName || 'our business'}. We look forward to seeing you again soon! #friendlyservice #5star`;
      } else if (rating === 3) {
        aiDraftReply = `Thank you for taking the time to share your feedback, ${firstName}. We appreciate your business and are always working to improve. Please feel free to reach out to us directly so we can ensure your next visit is exceptional.`;
      } else {
        aiDraftReply = `Hi ${firstName}, thank you for your feedback. We take all feedback seriously and would love the opportunity to make things right. Please reach out to us directly so we can ensure your next visit is exceptional.`;
      }

      return {
        id: `rev_google_${placeId.slice(-6)}_${rev.time || Date.now()}_${index}`,
        user_id: resolvedUserId || 'usr_mock_001',
        author_name: authorName,
        author_avatar: authorAvatar,
        rating,
        review_text: text,
        review_date: reviewDate,
        ai_draft_reply: aiDraftReply,
        status: 'pending_approval',
        sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
        keywords_used: ['#friendly_service', '#5star_experience'],
        created_at: reviewDate,
      };
    });

    const insertedReviews: any[] = [];

    if (supabaseAdmin && formattedReviews.length > 0 && resolvedUserId) {
      for (const rev of formattedReviews) {
        const reviewRecord = {
          user_id: resolvedUserId,
          author_name: rev.author_name,
          author_avatar: rev.author_avatar,
          rating: rev.rating,
          review_text: rev.review_text,
          review_date: rev.review_date,
          ai_draft_reply: rev.ai_draft_reply,
          status: 'pending_approval',
          sentiment: rev.sentiment,
          keywords_used: rev.keywords_used,
          created_at: rev.created_at,
        };

        try {
          const { data: insData, error: insError } = await supabaseAdmin.from('reviews').insert([reviewRecord]).select();
          if (!insError && insData && insData.length > 0) {
            insertedReviews.push(insData[0]);
          }
        } catch (dbErr) {
          console.warn('[Review insert error]:', dbErr);
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
