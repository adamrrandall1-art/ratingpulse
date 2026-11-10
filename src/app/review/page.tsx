export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function ReviewPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const inviteId =
    typeof searchParams?.id === 'string'
      ? searchParams.id
      : typeof searchParams?.inviteId === 'string'
      ? searchParams.inviteId
      : '';
  const token = typeof searchParams?.token === 'string' ? searchParams.token : inviteId;
  const email = typeof searchParams?.email === 'string' ? searchParams.email : '';
  const phone = typeof searchParams?.phone === 'string' ? searchParams.phone : '';

  if (inviteId || token || email || phone) {
    await db.reviewInvite.updateMany({
      where: {
        OR: [
          ...(inviteId ? [{ id: inviteId }, { token: inviteId }] : []),
          ...(token ? [{ token }, { id: token }] : []),
          ...(email ? [{ customerEmail: email }, { customer_email: email }, { email }] : []),
          ...(phone ? [{ customerPhone: phone }, { customer_phone: phone }, { phone }] : []),
        ],
      },
      data: {
        status: 'opened',
        openedAt: new Date(),
        clicks: { increment: 1 },
      },
    }).catch(() => {});
  }

  const destination = token || inviteId || 'demo';
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') query.set(k, v);
  }
  const qStr = query.toString() ? `?${query.toString()}` : '';
  redirect(`/r/${destination}${qStr}`);
}
