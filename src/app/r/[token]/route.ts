import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(
  request: Request,
  props: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await Promise.resolve(props.params);
  const inviteId = resolvedParams?.token || (props.params as any)?.token || '';
  console.log('[TRACKING REDIRECT] Processing invite ID:', inviteId);

  try {
    // 1. Direct Supabase update using service role client to bypass RLS
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin && inviteId) {
      const { error, data } = await supabaseAdmin
        .from('review_invites')
        .update({ status: 'opened' })
        .eq('id', inviteId)
        .select();

      if (error) {
        console.error('[TRACKING REDIRECT SUPABASE ERROR]:', error);
      } else {
        console.log('[TRACKING REDIRECT SUCCESS]:', data);
      }
    }

    // 2. Also update local cache
    await db.reviewInvite.update({
      where: { id: inviteId },
      data: { status: 'opened' },
    }).catch(() => {});
  } catch (err) {
    console.error('[TRACKING REDIRECT UNCAUGHT ERROR]:', err);
  }

  return NextResponse.redirect(new URL(`/review?inviteId=${inviteId}`, request.url));
}
