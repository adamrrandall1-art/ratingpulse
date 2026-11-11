export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import FunnelClient from '@/app/r/[token]/FunnelClient';
import { getFunnelData } from '@/app/r/[token]/getFunnelData';

export default async function ReviewPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const token =
    typeof searchParams?.token === 'string'
      ? searchParams.token
      : typeof searchParams?.id === 'string'
      ? searchParams.id
      : 'demo';

  const data = await getFunnelData(token, searchParams);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          Loading review funnel...
        </div>
      }
    >
      <FunnelClient
        token={token}
        destinationUrl={data.destinationUrl}
        business={data.business}
        invite={data.invite}
      />
    </Suspense>
  );
}
