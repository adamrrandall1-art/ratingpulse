export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import db from '@/lib/db';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const inviteId = body.inviteId || body.id || body.token;
    const status = body.status || 'reviewed';

    if (!inviteId || inviteId === 'demo') {
      return NextResponse.json({ success: true, message: 'Demo or missing inviteId' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteId);
      let query = supabaseAdmin
        .from('review_invites')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        });

      if (isUuid) {
        query = query.eq('id', inviteId);
      } else {
        query = query.or(`id.eq.${inviteId},token.eq.${inviteId}`);
      }

      const { error } = await query;
      if (error) {
        // Fallback: If reviewed_at column does not exist, update status alone
        await supabaseAdmin
          .from('review_invites')
          .update({ status })
          .eq('id', inviteId);
      }
    }

    // Also update local cache
    try {
      await db.reviewInvite.updateMany({
        where: {
          OR: [{ id: inviteId }, { token: inviteId }],
        },
        data: {
          status: 'reviewed',
        },
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/review/status] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
