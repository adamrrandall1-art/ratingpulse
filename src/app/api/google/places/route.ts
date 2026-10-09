import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleReviewUrl } from '@/lib/google-places';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const placeId = searchParams.get('placeId') || '';

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
      'AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY';

    // 1. Fetch Place Details if placeId is provided
    if (placeId) {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&fields=place_id,name,formatted_address,rating,user_ratings_total,url,photos&key=${apiKey}`;

      const res = await fetch(detailsUrl);
      const data = await res.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        return NextResponse.json({
          success: true,
          place: {
            placeId: place.place_id,
            businessName: place.name,
            formattedAddress: place.formatted_address || '',
            rating: place.rating || 5.0,
            reviewCount: place.user_ratings_total || 0,
            reviewUrl: generateGoogleReviewUrl(place.place_id),
            googleMapsUrl: place.url || '',
          },
        });
      }

      return NextResponse.json(
        { success: false, error: data.error_message || data.status || 'Place details not found' },
        { status: 404 }
      );
    }

    // 2. Search Autocomplete / TextSearch if query is provided
    if (query) {
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${apiKey}`;

      const res = await fetch(autocompleteUrl);
      const data = await res.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        const predictions = data.predictions.map((p: any) => ({
          placeId: p.place_id,
          businessName: p.structured_formatting?.main_text || p.description,
          formattedAddress: p.structured_formatting?.secondary_text || p.description,
          description: p.description,
        }));

        return NextResponse.json({ success: true, predictions });
      }

      // Fallback: Query Google Places Text Search for complex or full-address queries
      try {
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${apiKey}`;

        const textRes = await fetch(textSearchUrl);
        const textData = await textRes.json();

        if (textData.status === 'OK' && Array.isArray(textData.results) && textData.results.length > 0) {
          const predictions = textData.results.map((r: any) => ({
            placeId: r.place_id,
            businessName: r.name,
            formattedAddress: r.formatted_address || '',
            description: `${r.name} - ${r.formatted_address || ''}`,
            rating: r.rating || 5.0,
            reviewCount: r.user_ratings_total || 0,
          }));

          return NextResponse.json({ success: true, predictions });
        }
      } catch (textErr) {
        console.warn('[Places TextSearch fallback exception]:', textErr);
      }

      return NextResponse.json({
        success: true,
        predictions: [],
        status: data.status,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either query (q) or placeId is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Google Places API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
