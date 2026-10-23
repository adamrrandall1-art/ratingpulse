export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db'; // Prisma client instance

function getAdminClient() {
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Settings API] Missing Supabase URL or key, skipping Supabase direct REST client.');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sanitizeReviewUrl(url?: string | null): string {
  if (!url) return 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
  if (url.includes('http')) {
    const match = url.match(/https?:\/\/[^\s)\]]+/);
    return match ? match[0] : url;
  }
  return url;
}

export async function handleSaveSettings(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const body = await req.json().catch(() => ({}));

    // 1. Resolve effective user ID
    const effectiveUserId = clerkAuth?.userId || body.userId;

    if (!effectiveUserId) {
      return NextResponse.json({ success: false, error: 'User unauthorized or missing ID' }, { status: 401 });
    }

    // 2. Try finding by explicit valid business ID if provided and not undefined
    let business = null;
    const incomingBizId = body.businessId || body.activeBusinessId || body.id;
    if (incomingBizId && incomingBizId !== 'undefined' && !incomingBizId.startsWith('user_')) {
      business = await db.business.findUnique({ where: { id: incomingBizId } }).catch(() => null);
    }

    // 3. If not found by ID, find the business owned by this Clerk user
    if (!business) {
      business = await db.business.findFirst({
        where: {
          OR: [
            { userId: effectiveUserId },
            { clerkUserId: effectiveUserId },
          ],
        },
      }).catch(() => null);
    }

    const rawReviewUrl = business?.googleReviewUrl || business?.reviewUrl || body.googleReviewUrl || body.reviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    const cleanReviewUrl = sanitizeReviewUrl(rawReviewUrl);
    const placeId = business?.placeId || body.placeId || '';

    // 4. Fallback: if business record is still missing, auto-create or link it:
    if (!business) {
      business = await db.business.create({
        data: {
          userId: effectiveUserId,
          name: body.full_name || body.name || 'RatingPulse',
          googleReviewUrl: cleanReviewUrl,
          reviewUrl: cleanReviewUrl,
          placeId,
          isGoogleConnected: true,
          negativeAlertEmail: body.negativeAlertEmail !== undefined ? (body.negativeAlertEmail ? String(body.negativeAlertEmail).trim() : null) : null,
          negativeAlertPhone: body.negativeAlertPhone !== undefined ? (body.negativeAlertPhone ? String(body.negativeAlertPhone).trim() : null) : null,
          positiveAlertEmail: body.positiveAlertEmail !== undefined ? (body.positiveAlertEmail ? String(body.positiveAlertEmail).trim() : null) : null,
          positiveAlertPhone: body.positiveAlertPhone !== undefined ? (body.positiveAlertPhone ? String(body.positiveAlertPhone).trim() : null) : null,
          negativeAlertsEnabled: body.negativeAlertsEnabled !== undefined ? Boolean(body.negativeAlertsEnabled) : true,
          positiveAlertsEnabled: body.positiveAlertsEnabled !== undefined ? Boolean(body.positiveAlertsEnabled) : true,
          negativeEmailAlertEnabled: body.negativeEmailAlertEnabled !== undefined ? Boolean(body.negativeEmailAlertEnabled) : true,
          negativeSmsAlertEnabled: body.negativeSmsAlertEnabled !== undefined ? Boolean(body.negativeSmsAlertEnabled) : false,
          positiveEmailAlertEnabled: body.positiveEmailAlertEnabled !== undefined ? Boolean(body.positiveEmailAlertEnabled) : true,
          positiveSmsAlertEnabled: body.positiveSmsAlertEnabled !== undefined ? Boolean(body.positiveSmsAlertEnabled) : false,
        },
      });
    } else {
      // Direct update to existing business:
      business = await db.business.update({
        where: { id: business.id },
        data: {
          negativeAlertEmail: body.negativeAlertEmail !== undefined ? (body.negativeAlertEmail ? String(body.negativeAlertEmail).trim() : null) : business.negativeAlertEmail,
          negativeAlertPhone: body.negativeAlertPhone !== undefined ? (body.negativeAlertPhone ? String(body.negativeAlertPhone).trim() : null) : business.negativeAlertPhone,
          positiveAlertEmail: body.positiveAlertEmail !== undefined ? (body.positiveAlertEmail ? String(body.positiveAlertEmail).trim() : null) : business.positiveAlertEmail,
          positiveAlertPhone: body.positiveAlertPhone !== undefined ? (body.positiveAlertPhone ? String(body.positiveAlertPhone).trim() : null) : business.positiveAlertPhone,
          negativeAlertsEnabled: body.negativeAlertsEnabled !== undefined ? Boolean(body.negativeAlertsEnabled) : (business.negativeAlertsEnabled ?? true),
          positiveAlertsEnabled: body.positiveAlertsEnabled !== undefined ? Boolean(body.positiveAlertsEnabled) : (business.positiveAlertsEnabled ?? true),
          negativeEmailAlertEnabled: body.negativeEmailAlertEnabled !== undefined ? Boolean(body.negativeEmailAlertEnabled) : (business.negativeEmailAlertEnabled ?? true),
          negativeSmsAlertEnabled: body.negativeSmsAlertEnabled !== undefined ? Boolean(body.negativeSmsAlertEnabled) : (business.negativeSmsAlertEnabled ?? false),
          positiveEmailAlertEnabled: body.positiveEmailAlertEnabled !== undefined ? Boolean(body.positiveEmailAlertEnabled) : (business.positiveEmailAlertEnabled ?? true),
          positiveSmsAlertEnabled: body.positiveSmsAlertEnabled !== undefined ? Boolean(body.positiveSmsAlertEnabled) : (business.positiveSmsAlertEnabled ?? false),
          googleReviewUrl: cleanReviewUrl,
          reviewUrl: cleanReviewUrl,
          placeId,
          isGoogleConnected: true,
          updatedAt: new Date(),
        },
      });
    }

    // Optional direct Supabase sync safeguarded so missing keys never block or throw
    const supabase = getAdminClient();
    if (supabase && business) {
      try {
        const updatePayload: Record<string, unknown> = {
          negative_alert_email: business.negativeAlertEmail,
          negative_alert_phone: business.negativeAlertPhone,
          positive_alert_email: business.positiveAlertEmail,
          positive_alert_phone: business.positiveAlertPhone,
          google_review_url: cleanReviewUrl,
          review_url: cleanReviewUrl,
          place_id: placeId,
          is_google_connected: true,
          google_connected: true,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('businesses').update(updatePayload).eq('id', business.id);
      } catch (sbErr) {
        console.warn('[Settings API] Non-blocking Supabase direct sync note:', sbErr);
      }
    }

    // Invalidate dashboard caches
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard/invites');
      revalidatePath('/dashboard/businesses');
    } catch {}

    return NextResponse.json({
      success: true,
      business,
      message: 'Settings updated successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('[SETTINGS_ROUTE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleSaveSettings(req);
}

export async function PUT(req: NextRequest) {
  return handleSaveSettings(req);
}

export async function GET(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.business.findFirst({
      where: {
        OR: [
          { userId },
          { clerkUserId: userId },
        ],
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
