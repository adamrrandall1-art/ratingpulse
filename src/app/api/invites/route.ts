export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

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
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: true, invites: [] });
    }

    // Resolve Clerk user via Prisma db.business.findMany
    const businesses = await db.business.findMany({
      where: {
        OR: [
          { userId },
          { clerkUserId: userId },
          { id: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    }).catch(() => []);
    const business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail) || businesses[0] || null;

    // Resolve profile ID if available
    let profileId: string | null = null;
    try {
      const profile = await db.profile.findFirst({
        where: {
          OR: [
            { clerkUserId: userId },
            { clerk_user_id: userId },
            { id: userId },
          ],
        },
      });
      if (profile?.id) profileId = profile.id;
    } catch {}

    const orConditions: any[] = [
      { userId },
      { user_id: userId },
    ];
    if (profileId) {
      orConditions.push({ userId: profileId });
      orConditions.push({ user_id: profileId });
    }
    if (business?.id) {
      orConditions.push({ businessId: business.id });
      orConditions.push({ business_id: business.id });
    }

    const invites = await db.reviewInvite.findMany({
      where: {
        OR: orConditions,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      invites,
    }, { status: 200 });
  } catch (error: any) {
    console.warn('[INVITES_API_ERROR]', error);
    return NextResponse.json({ success: true, invites: [] }, { status: 200 });
  }
}
