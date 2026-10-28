export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db'; // Prisma client instance

function sanitizeReviewUrl(url?: string | null): string {
  if (!url) return 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
  if (url.includes('http')) {
    const match = url.match(/https?:\/\/[^\s)\]]+/);
    return match ? match[0] : url;
  }
  return url;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Read the authenticated Clerk user with body fallback
    const clerkAuth = await auth().catch(() => null);
    const effectiveUserId = clerkAuth?.userId || body.userId;

    if (!effectiveUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract settings fields from request body
    const {
      negativeAlertEmail,
      negativeAlertPhone,
      positiveAlertEmail,
      positiveAlertPhone,
      googleReviewUrl,
    } = body;

    // 3. Locate all businesses for this user
    const businesses = await db.business.findMany({
      where: {
        OR: [
          { userId: effectiveUserId },
          { clerkUserId: effectiveUserId },
          { id: effectiveUserId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    }).catch(() => []);

    const incomingBizId = body.businessId || body.activeBusinessId || body.id;
    let targetBusiness = (incomingBizId && incomingBizId !== 'undefined' && incomingBizId !== 'null' && !incomingBizId.startsWith('user_'))
      ? businesses.find(b => b.id === incomingBizId)
      : null;

    if (!targetBusiness) {
      targetBusiness = businesses.find(b => b.negativeAlertEmail || b.negativeAlertPhone) || businesses[0] || null;
    }

    const targetBusinessId = targetBusiness?.id || incomingBizId || effectiveUserId;

    // 4. Sanitize and prepare review URL & placeId
    const rawReviewUrl = googleReviewUrl || body.reviewUrl || targetBusiness?.googleReviewUrl || targetBusiness?.reviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    const cleanReviewUrl = sanitizeReviewUrl(rawReviewUrl);
    const placeId = body.placeId || targetBusiness?.placeId || '';

    // 5. Save directly targeting the exact business record
    let updated;
    if (targetBusiness) {
      updated = await db.business.update({
        where: { id: targetBusiness.id },
        data: {
          negativeAlertEmail: negativeAlertEmail || null,
          negativeAlertPhone: negativeAlertPhone || null,
          positiveAlertEmail: positiveAlertEmail || null,
          positiveAlertPhone: positiveAlertPhone || null,
          isGoogleConnected: true,
          updatedAt: new Date(),
          ...(cleanReviewUrl && { googleReviewUrl: cleanReviewUrl, reviewUrl: cleanReviewUrl }),
          ...(placeId && { placeId }),
          ...(body.negativeAlertsEnabled !== undefined && { negativeAlertsEnabled: Boolean(body.negativeAlertsEnabled) }),
          ...(body.positiveAlertsEnabled !== undefined && { positiveAlertsEnabled: Boolean(body.positiveAlertsEnabled) }),
          ...(body.negativeEmailAlertEnabled !== undefined && { negativeEmailAlertEnabled: Boolean(body.negativeEmailAlertEnabled) }),
          ...(body.negativeSmsAlertEnabled !== undefined && { negativeSmsAlertEnabled: Boolean(body.negativeSmsAlertEnabled) }),
          ...(body.positiveEmailAlertEnabled !== undefined && { positiveEmailAlertEnabled: Boolean(body.positiveEmailAlertEnabled) }),
          ...(body.positiveSmsAlertEnabled !== undefined && { positiveSmsAlertEnabled: Boolean(body.positiveSmsAlertEnabled) }),
          ...(body.brandVoice && { brandVoice: body.brandVoice, aiTone: body.brandVoice }),
          ...(body.aiTone && { aiTone: body.aiTone, brandVoice: body.aiTone }),
          ...(body.aiInstructions !== undefined && { aiInstructions: body.aiInstructions }),
          ...(body.aiSignature !== undefined && { aiSignature: body.aiSignature }),
          ...(body.autoReplyEnabled !== undefined && { autoReplyEnabled: Boolean(body.autoReplyEnabled), autoPublish5Star: Boolean(body.autoReplyEnabled) }),
          ...(body.autoPublish5Star !== undefined && { autoPublish5Star: Boolean(body.autoPublish5Star), autoReplyEnabled: Boolean(body.autoPublish5Star) }),
          ...(body.customKeywords !== undefined && { customKeywords: body.customKeywords }),
          ...(body.keywords && { customKeywords: Array.isArray(body.keywords) ? body.keywords.join(',') : body.keywords }),
          ...(body.smsTemplate !== undefined && { smsTemplate: body.smsTemplate }),
        },
      });
    } else {
      updated = await db.business.upsert({
        where: { id: targetBusinessId },
        update: {
          negativeAlertEmail: negativeAlertEmail || null,
          negativeAlertPhone: negativeAlertPhone || null,
          positiveAlertEmail: positiveAlertEmail || null,
          positiveAlertPhone: positiveAlertPhone || null,
          isGoogleConnected: true,
          updatedAt: new Date(),
          ...(cleanReviewUrl && { googleReviewUrl: cleanReviewUrl, reviewUrl: cleanReviewUrl }),
          ...(placeId && { placeId }),
          ...(body.negativeAlertsEnabled !== undefined && { negativeAlertsEnabled: Boolean(body.negativeAlertsEnabled) }),
          ...(body.positiveAlertsEnabled !== undefined && { positiveAlertsEnabled: Boolean(body.positiveAlertsEnabled) }),
          ...(body.negativeEmailAlertEnabled !== undefined && { negativeEmailAlertEnabled: Boolean(body.negativeEmailAlertEnabled) }),
          ...(body.negativeSmsAlertEnabled !== undefined && { negativeSmsAlertEnabled: Boolean(body.negativeSmsAlertEnabled) }),
          ...(body.positiveEmailAlertEnabled !== undefined && { positiveEmailAlertEnabled: Boolean(body.positiveEmailAlertEnabled) }),
          ...(body.positiveSmsAlertEnabled !== undefined && { positiveSmsAlertEnabled: Boolean(body.positiveSmsAlertEnabled) }),
          ...(body.brandVoice && { brandVoice: body.brandVoice, aiTone: body.brandVoice }),
          ...(body.aiTone && { aiTone: body.aiTone, brandVoice: body.aiTone }),
          ...(body.aiInstructions !== undefined && { aiInstructions: body.aiInstructions }),
          ...(body.aiSignature !== undefined && { aiSignature: body.aiSignature }),
          ...(body.autoReplyEnabled !== undefined && { autoReplyEnabled: Boolean(body.autoReplyEnabled), autoPublish5Star: Boolean(body.autoReplyEnabled) }),
          ...(body.autoPublish5Star !== undefined && { autoPublish5Star: Boolean(body.autoPublish5Star), autoReplyEnabled: Boolean(body.autoPublish5Star) }),
          ...(body.customKeywords !== undefined && { customKeywords: body.customKeywords }),
          ...(body.keywords && { customKeywords: Array.isArray(body.keywords) ? body.keywords.join(',') : body.keywords }),
          ...(body.smsTemplate !== undefined && { smsTemplate: body.smsTemplate }),
        },
        create: {
          id: targetBusinessId,
          userId: effectiveUserId,
          clerkUserId: effectiveUserId,
          negativeAlertEmail: negativeAlertEmail || null,
          negativeAlertPhone: negativeAlertPhone || null,
          positiveAlertEmail: positiveAlertEmail || null,
          positiveAlertPhone: positiveAlertPhone || null,
          isGoogleConnected: true,
          name: 'RatingPulse',
          ...(cleanReviewUrl && { googleReviewUrl: cleanReviewUrl, reviewUrl: cleanReviewUrl }),
          ...(placeId && { placeId }),
          ...(body.brandVoice && { brandVoice: body.brandVoice, aiTone: body.brandVoice }),
          ...(body.aiTone && { aiTone: body.aiTone, brandVoice: body.aiTone }),
          ...(body.aiInstructions !== undefined && { aiInstructions: body.aiInstructions }),
          ...(body.aiSignature !== undefined && { aiSignature: body.aiSignature }),
          ...(body.autoReplyEnabled !== undefined && { autoReplyEnabled: Boolean(body.autoReplyEnabled), autoPublish5Star: Boolean(body.autoReplyEnabled) }),
          ...(body.autoPublish5Star !== undefined && { autoPublish5Star: Boolean(body.autoPublish5Star), autoReplyEnabled: Boolean(body.autoPublish5Star) }),
          ...(body.customKeywords !== undefined && { customKeywords: body.customKeywords }),
          ...(body.keywords && { customKeywords: Array.isArray(body.keywords) ? body.keywords.join(',') : body.keywords }),
          ...(body.smsTemplate !== undefined && { smsTemplate: body.smsTemplate }),
        },
      });
    }

    // 6. Prune / synchronize any other duplicate business records for this user
    if (businesses.length > 1) {
      for (const dup of businesses) {
        if (dup.id !== updated.id) {
          await db.business.update({
            where: { id: dup.id },
            data: {
              negativeAlertEmail: negativeAlertEmail || null,
              negativeAlertPhone: negativeAlertPhone || null,
              positiveAlertEmail: positiveAlertEmail || null,
              positiveAlertPhone: positiveAlertPhone || null,
              isGoogleConnected: true,
              updatedAt: new Date(),
              ...(body.brandVoice && { brandVoice: body.brandVoice, aiTone: body.brandVoice }),
              ...(body.aiTone && { aiTone: body.aiTone, brandVoice: body.aiTone }),
              ...(body.aiInstructions !== undefined && { aiInstructions: body.aiInstructions }),
              ...(body.aiSignature !== undefined && { aiSignature: body.aiSignature }),
              ...(body.autoReplyEnabled !== undefined && { autoReplyEnabled: Boolean(body.autoReplyEnabled), autoPublish5Star: Boolean(body.autoReplyEnabled) }),
              ...(body.autoPublish5Star !== undefined && { autoPublish5Star: Boolean(body.autoPublish5Star), autoReplyEnabled: Boolean(body.autoPublish5Star) }),
              ...(body.customKeywords !== undefined && { customKeywords: body.customKeywords }),
              ...(body.smsTemplate !== undefined && { smsTemplate: body.smsTemplate }),
            },
          }).catch(() => null);
        }
      }
    }

    // 7. Invalidate caches immediately
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/settings');
    } catch {}

    // 8. Return updated business
    return NextResponse.json({ success: true, business: updated });
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
    const userId = clerkAuth?.userId || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const businesses = await db.business.findMany({
      where: {
        OR: [
          { userId },
          { clerkUserId: userId },
          { id: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    const activeBusiness = businesses.find(b => b.negativeAlertEmail || b.negativeAlertPhone) || businesses[0] || null;

    return NextResponse.json({ success: true, business: activeBusiness });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
