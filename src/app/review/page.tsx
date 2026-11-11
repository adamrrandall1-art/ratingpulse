export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import FunnelClient from '@/app/r/[token]/FunnelClient';
import { getFunnelData } from '@/app/r/[token]/getFunnelData';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function ReviewPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const inviteId =
    typeof searchParams?.inviteId === 'string'
      ? searchParams.inviteId
      : typeof searchParams?.id === 'string'
      ? searchParams.id
      : typeof searchParams?.token === 'string'
      ? searchParams.token
      : 'demo';

  const supabaseAdmin = getSupabaseAdmin();
  let settings: {
    place_id?: string | null;
    google_review_url?: string | null;
    business_name?: string | null;
    [key: string]: any;
  } | null = null;

  if (supabaseAdmin && inviteId && inviteId !== 'demo') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteId);
    let inviteQuery = supabaseAdmin.from('review_invites').select('*');
    if (isUuid) {
      inviteQuery = inviteQuery.eq('id', inviteId);
    } else {
      inviteQuery = inviteQuery.or(`id.eq.${inviteId},token.eq.${inviteId}`);
    }
    const { data: invite } = await inviteQuery.maybeSingle();

    if (invite?.user_id) {
      const { data: userSettings } = await supabaseAdmin
        .from('business_settings')
        .select('place_id, google_review_url, business_name')
        .eq('user_id', invite.user_id)
        .maybeSingle();
      if (userSettings) {
        settings = userSettings;
      }
    }
  }

  // Fallback: If settings was not resolved via invite.user_id, check for any configured business_settings
  if (supabaseAdmin && !settings) {
    const { data: fallbackSettings } = await supabaseAdmin
      .from('business_settings')
      .select('place_id, google_review_url, business_name')
      .not('place_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (fallbackSettings) {
      settings = fallbackSettings;
    }
  }

  const data = await getFunnelData(inviteId, searchParams);

  const rawGoogleReviewUrl =
    settings?.google_review_url ||
    data.business.googleReviewUrl ||
    (data.business as any)?.google_review_url ||
    null;

  const validGoogleReviewUrl =
    rawGoogleReviewUrl && typeof rawGoogleReviewUrl === 'string' && rawGoogleReviewUrl.startsWith('http')
      ? rawGoogleReviewUrl.trim()
      : null;

  const rawPlaceId =
    settings?.place_id ||
    data.business.placeId ||
    null;

  const businessName =
    settings?.business_name ||
    data.business.name ||
    'RatingPulse';

  let effectiveDestinationUrl: string;
  if (validGoogleReviewUrl) {
    effectiveDestinationUrl = validGoogleReviewUrl;
  } else if (rawPlaceId) {
    effectiveDestinationUrl = `https://search.google.com/local/writereview?placeid=${rawPlaceId}`;
  } else {
    effectiveDestinationUrl = `https://www.google.com/search?q=${encodeURIComponent(businessName + ' reviews')}`;
  }

  const updatedBusiness = {
    ...data.business,
    name: businessName,
    business_name: businessName,
    placeId: rawPlaceId,
    place_id: rawPlaceId,
    googleReviewUrl: validGoogleReviewUrl || effectiveDestinationUrl,
    google_review_url: validGoogleReviewUrl || null,
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          Loading review funnel...
        </div>
      }
    >
      <FunnelClient
        token={inviteId}
        inviteId={inviteId}
        destinationUrl={effectiveDestinationUrl}
        business={updatedBusiness}
        invite={data.invite}
        settings={settings}
        placeId={rawPlaceId}
      />
    </Suspense>
  );
}
