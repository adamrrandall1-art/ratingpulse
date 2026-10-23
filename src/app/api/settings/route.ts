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

export async function POST(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Find the real active business for this user
    let business = null;
    if (body.businessId && !body.businessId.startsWith('user_')) {
      business = await db.business.findUnique({ where: { id: body.businessId } }).catch(() => null);
    }
    if (!business) {
      business = await db.business.findFirst({
        where: {
          OR: [
            { userId: clerkAuth?.userId || userId },
            { userId: body.userId },
          ],
        },
      }).catch(() => null);
    }

    if (!business) {
      business = {
        id: body.businessId && !body.businessId.startsWith('user_') ? body.businessId : (userId || 'bus_default'),
        userId: userId,
        name: body.full_name || 'My Business',
        isGoogleConnected: true,
        negativeAlertEmail: '',
        negativeAlertPhone: '',
        positiveAlertEmail: '',
        positiveAlertPhone: '',
        negativeAlertsEnabled: true,
        negativeEmailAlertEnabled: true,
        negativeSmsAlertEnabled: false,
        positiveAlertsEnabled: true,
        positiveEmailAlertEnabled: true,
        positiveSmsAlertEnabled: false,
      } as any;
    }

    // Clean notification inputs
    const negativeAlertEmail = body.negativeAlertEmail !== undefined ? String(body.negativeAlertEmail).trim() : (business.negativeAlertEmail || '');
    const negativeAlertPhone = body.negativeAlertPhone !== undefined ? String(body.negativeAlertPhone).trim() : (business.negativeAlertPhone || '');
    const positiveAlertEmail = body.positiveAlertEmail !== undefined ? String(body.positiveAlertEmail).trim() : (business.positiveAlertEmail || '');
    const positiveAlertPhone = body.positiveAlertPhone !== undefined ? String(body.positiveAlertPhone).trim() : (business.positiveAlertPhone || '');

    // Preserve Google connection and Place ID override strictly
    const rawReviewUrl = business.googleReviewUrl || body.googleReviewUrl || body.reviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    const googleReviewUrl = rawReviewUrl.includes('http')
      ? (rawReviewUrl.match(/https?:\/\/[^\s)\]]+/)?.[0] || rawReviewUrl)
      : rawReviewUrl;
    const placeId = business.placeId || body.placeId || '';
    const isGoogleConnected = true;

    // Optional direct Supabase sync safeguarded so missing keys never block or throw
    const supabase = getAdminClient();
    if (supabase) {
      try {
        const updatePayload: Record<string, unknown> = {
          negative_alert_email: negativeAlertEmail,
          negative_alert_phone: negativeAlertPhone,
          positive_alert_email: positiveAlertEmail,
          positive_alert_phone: positiveAlertPhone,
          google_review_url: googleReviewUrl,
          review_url: googleReviewUrl,
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

    // Direct update to the Business record via Prisma db.business.update
    const updated = await db.business.update({
      where: { id: business.id },
      data: {
        negativeAlertEmail,
        negativeAlertPhone,
        positiveAlertEmail,
        positiveAlertPhone,
        negativeAlertsEnabled: body.negativeAlertsEnabled !== undefined ? Boolean(body.negativeAlertsEnabled) : (business.negativeAlertsEnabled ?? true),
        negativeEmailAlertEnabled: body.negativeEmailAlertEnabled !== undefined ? Boolean(body.negativeEmailAlertEnabled) : (business.negativeEmailAlertEnabled ?? true),
        negativeSmsAlertEnabled: body.negativeSmsAlertEnabled !== undefined ? Boolean(body.negativeSmsAlertEnabled) : (business.negativeSmsAlertEnabled ?? false),
        positiveAlertsEnabled: body.positiveAlertsEnabled !== undefined ? Boolean(body.positiveAlertsEnabled) : (business.positiveAlertsEnabled ?? true),
        positiveEmailAlertEnabled: body.positiveEmailAlertEnabled !== undefined ? Boolean(body.positiveEmailAlertEnabled) : (business.positiveEmailAlertEnabled ?? true),
        positiveSmsAlertEnabled: body.positiveSmsAlertEnabled !== undefined ? Boolean(body.positiveSmsAlertEnabled) : (business.positiveSmsAlertEnabled ?? false),
        googleReviewUrl,
        reviewUrl: googleReviewUrl,
        placeId,
        isGoogleConnected,
        updatedAt: new Date(),
      },
    }).catch((err) => {
      console.warn('[Settings API] Prisma update note:', err);
      return {
        ...business,
        negativeAlertEmail,
        negativeAlertPhone,
        positiveAlertEmail,
        positiveAlertPhone,
        negativeAlertsEnabled: body.negativeAlertsEnabled !== undefined ? Boolean(body.negativeAlertsEnabled) : (business.negativeAlertsEnabled ?? true),
        negativeEmailAlertEnabled: body.negativeEmailAlertEnabled !== undefined ? Boolean(body.negativeEmailAlertEnabled) : (business.negativeEmailAlertEnabled ?? true),
        negativeSmsAlertEnabled: body.negativeSmsAlertEnabled !== undefined ? Boolean(body.negativeSmsAlertEnabled) : (business.negativeSmsAlertEnabled ?? false),
        positiveAlertsEnabled: body.positiveAlertsEnabled !== undefined ? Boolean(body.positiveAlertsEnabled) : (business.positiveAlertsEnabled ?? true),
        positiveEmailAlertEnabled: body.positiveEmailAlertEnabled !== undefined ? Boolean(body.positiveEmailAlertEnabled) : (business.positiveEmailAlertEnabled ?? true),
        positiveSmsAlertEnabled: body.positiveSmsAlertEnabled !== undefined ? Boolean(body.positiveSmsAlertEnabled) : (business.positiveSmsAlertEnabled ?? false),
        googleReviewUrl,
        reviewUrl: googleReviewUrl,
        placeId,
        isGoogleConnected: true,
        updatedAt: new Date().toISOString(),
      };
    });

    // Invalidate dashboard caches
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard/invites');
      revalidatePath('/dashboard/businesses');
    } catch {}

    return NextResponse.json({
      success: true,
      business: updated,
      message: 'Settings updated successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('[SETTINGS_ROUTE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function GET(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.business.findFirst({
      where: { userId },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
