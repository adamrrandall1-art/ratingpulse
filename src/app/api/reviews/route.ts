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
      return NextResponse.json({ success: true, reviews: [] });
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

    const supabase = getSupabaseAdmin();
    let reviews: any[] = [];
    let feedback: any[] = [];

    if (supabase) {
      const candidateIds: string[] = [];
      if (business?.id && UUID_REGEX.test(business.id)) candidateIds.push(business.id);
      if (UUID_REGEX.test(userId)) candidateIds.push(userId);

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', userId)
          .maybeSingle();
        if (prof?.id && UUID_REGEX.test(prof.id)) candidateIds.push(prof.id);
      } catch {}

      for (const candId of candidateIds) {
        try {
          const { data } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', candId);
          if (data && data.length > 0) {
            reviews = data;
            break;
          }
        } catch {}
      }

      for (const candId of candidateIds) {
        try {
          const { data: fbData } = await supabase
            .from('feedback')
            .select('*')
            .or(`user_id.eq.${candId},business_id.eq.${candId}`)
            .order('created_at', { ascending: false });
          if (fbData && fbData.length > 0) {
            feedback = fbData;
            break;
          }
        } catch {}
      }

      if (feedback.length === 0) {
        try {
          const { data: allFb } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (allFb && allFb.length > 0) {
            feedback = allFb;
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      reviews,
      feedback,
    }, { status: 200 });
  } catch (error: any) {
    console.warn('[REVIEWS_API_ERROR]', error);
    return NextResponse.json({ success: true, reviews: [] }, { status: 200 });
  }
}
