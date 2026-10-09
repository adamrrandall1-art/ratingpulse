export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  fetchGBPAccounts,
  fetchGBPLocations,
  getValidAccessTokenForProfile,
} from '@/lib/google-gbp';
import { Profile } from '@/lib/supabase/types';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 500 });
    }

    const { data: profileData, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profError || !profileData) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    const profile = profileData as Profile;
    if (!profile.google_connected && !profile.google_access_token) {
      return NextResponse.json({
        success: false,
        error: 'Google Business Profile is not connected. Please authenticate with Google OAuth.',
      }, { status: 400 });
    }

    const accessToken = await getValidAccessTokenForProfile(profile, async (updates) => {
      await supabase.from('profiles').update(updates).eq('id', userId);
    });

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Failed to obtain valid Google access token. Please re-authenticate.',
      }, { status: 401 });
    }

    // Fetch accounts and locations from GBP
    const accounts = await fetchGBPAccounts(accessToken);
    let foundLocation = null;
    let foundPlaceId: string | null = null;
    let foundTitle: string | null = null;
    let foundAddress: string | null = null;

    if (accounts && accounts.length > 0) {
      for (const acc of accounts) {
        const locations = await fetchGBPLocations(acc.name, accessToken);
        if (locations && locations.length > 0) {
          foundLocation = locations[0];
          foundTitle = foundLocation.title || null;
          foundPlaceId = foundLocation.metadata?.placeId || null;

          if (foundLocation.storefrontAddress) {
            const parts = [
              ...(foundLocation.storefrontAddress.addressLines || []),
              foundLocation.storefrontAddress.locality,
              foundLocation.storefrontAddress.administrativeArea,
              foundLocation.storefrontAddress.postalCode,
            ].filter(Boolean);
            foundAddress = parts.join(', ');
          }
          break;
        }
      }
    }

    if (foundPlaceId) {
      const reviewUrl = `https://search.google.com/local/writereview?placeid=${foundPlaceId}`;
      await supabase.from('profiles').update({
        google_place_id: foundPlaceId,
        business_name: foundTitle || profile.business_name,
        formatted_address: foundAddress || profile.formatted_address,
        review_url: reviewUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      return NextResponse.json({
        success: true,
        isPending: false,
        placeId: foundPlaceId,
        businessName: foundTitle || profile.business_name,
        reviewUrl,
        message: 'Google Maps Place ID verified and synced!',
      });
    }

    return NextResponse.json({
      success: true,
      isPending: true,
      businessName: foundTitle || profile.business_name,
      message: 'Listing is still under verification by Google. Place ID will be automatically retrieved once published on Maps.',
    });
  } catch (err: any) {
    console.error('[Google Status Check Exception]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to check Google status' }, { status: 500 });
  }
}
