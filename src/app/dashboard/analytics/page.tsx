export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import db from '@/lib/db';
import ReportsClientView from '@/app/dashboard/reports/ReportsClientView';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function AnalyticsPage() {
  // Resolve Clerk ID to Supabase Profile UUID
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const supabase = getSupabaseAdmin();

  // Find profile by clerkUserId or id
  let profile = await db.profile.findFirst({
    where: {
      OR: [
        { clerkUserId: clerkUserId },
        { id: clerkUserId },
      ],
    },
  });

  // If no profile found by Clerk ID, fallback to direct Supabase query
  if (!profile && supabase) {
    const { data: profByClerk } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (profByClerk) {
      profile = profByClerk;
    } else {
      const { data: firstProf } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (firstProf && firstProf[0]) {
        profile = firstProf[0];
        try {
          await supabase
            .from('profiles')
            .update({ clerk_user_id: clerkUserId })
            .eq('id', profile.id);
        } catch {}
      }
    }
  }

  const targetUserId = profile?.id || clerkUserId;

  // Fetch all invites for current user
  let invites = await db.reviewInvite.findMany({
    where: {
      OR: [
        { userId: targetUserId },
        { user_id: targetUserId },
        { userId: clerkUserId },
        { user_id: clerkUserId },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  // Direct Supabase fallback if query returned 0 rows
  if (invites.length === 0 && supabase) {
    const { data: sInvites } = await supabase
      .from('review_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (sInvites && sInvites.length > 0) {
      const userMatches = sInvites.filter((r) => r.user_id === targetUserId || r.user_id === clerkUserId);
      const chosenInvites = userMatches.length > 0 ? userMatches : sInvites;
      invites = chosenInvites.map((r) => ({
        id: r.id,
        token: r.id,
        userId: r.user_id,
        user_id: r.user_id,
        customerName: r.customer_name || 'Customer',
        customerPhone: r.customer_phone || '',
        customer_phone: r.customer_phone || '',
        status: r.status || 'sent',
        createdAt: r.created_at,
        sentAt: r.sent_at || r.created_at,
      }));
    }
  }

  console.log('[ANALYTICS] Found invites for user:', invites.length);

  // Differentiate SMS vs Email by checking for '@' in customer_phone / customerPhone
  const emailInvites = invites.filter((i: any) => {
    const contact = i.customerPhone || i.customer_phone || i.phone || i.customerEmail || i.customer_email || i.email || '';
    return contact.includes('@');
  });

  const smsInvites = invites.filter((i: any) => {
    const contact = i.customerPhone || i.customer_phone || i.phone || '';
    return contact && !contact.includes('@');
  });

  // Calculate SMS Metrics
  const smsSent = smsInvites.length;
  const smsOpened = smsInvites.filter((i: any) => i.status === 'opened' || i.status === 'reviewed').length;
  const smsCTR = smsSent > 0 ? ((smsOpened / smsSent) * 100).toFixed(1) : '0.0';

  // Calculate Email Metrics
  const emailSent = emailInvites.length;
  const emailOpened = emailInvites.filter((i: any) => i.status === 'opened' || i.status === 'reviewed').length;
  const emailOpenRate = emailSent > 0 ? ((emailOpened / emailSent) * 100).toFixed(1) : '0.0';

  return (
    <ReportsClientView
      initialInvites={invites}
      channelMetrics={{
        smsSent,
        smsOpened,
        smsCTR,
        emailSent,
        emailOpened,
        emailOpenRate,
      }}
    />
  );
}
