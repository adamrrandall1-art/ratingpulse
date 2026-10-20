export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import FunnelClient from './FunnelClient';
import { getFunnelData } from './getFunnelData';

export default async function FunnelPage(props: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const data = await getFunnelData(token, searchParams);

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading review funnel...</div>}>
      <FunnelClient
        token={token}
        destinationUrl={data.destinationUrl}
        business={data.business}
        invite={data.invite}
      />
    </Suspense>
  );
}
