export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import FunnelClient from '@/app/r/[token]/FunnelClient';
import { getFunnelData } from '@/app/r/[token]/getFunnelData';

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

  const data = await getFunnelData(inviteId, searchParams);

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
        destinationUrl={data.destinationUrl}
        business={data.business}
        invite={data.invite}
      />
    </Suspense>
  );
}
