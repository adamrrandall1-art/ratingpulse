import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sendTwilioSms, twilioPhoneNumber, formatE164, appendComplianceFooter, SMS_COMPLIANCE_FOOTER } from '@/lib/twilio';
import { checkQuietHours } from '@/lib/compliance/quietHours';
import { resolveReviewUrl } from '@/lib/google-places';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTo =
      body.toPhone ||
      body.phone ||
      body.recipientPhone ||
      body.to ||
      body.phoneNumber ||
      body.customerPhone ||
      body.recipient ||
      body.customer_phone ||
      body.phone_number ||
      body.mobile;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const isDemoMode = Boolean(body.isDemoMode ?? body.isSimulationMode ?? body.demoMode ?? false);
    const customerName = body.customerName || body.name || 'Valued Customer';
    const businessName = isDemoMode
      ? "RatingPulse"
      : (body.businessName || body.business?.name || 'our business');
    const placeId = isDemoMode
      ? 'ChIJawEUC_oN04kRB70LP1wHuPg'
      : (body.placeId || body.google_place_id || '');
    const activeGoogleReviewUrl =
      resolveReviewUrl(body.googleReviewUrl as string) ||
      resolveReviewUrl(placeId) ||
      '';
    const inviteToken = crypto.randomUUID();
    const funnelUrl = `${appUrl}/r/${inviteToken}`;
    const {
      message,
      serviceType,
    } = body;

    if (!rawTo || typeof rawTo !== 'string' || !rawTo.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    const formattedTo = formatE164(rawTo.trim());
    if (!formattedTo || formattedTo.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format.' },
        { status: 400 }
      );
    }

    // TCPA Quiet Hours Compliance Check (8:00 AM - 9:00 PM local time)
    const timeZone = body.timeZone || body.timezone || 'America/New_York';
    const { isWithinAllowedWindow, currentHour } = checkQuietHours(timeZone);
    if (!isWithinAllowedWindow) {
      return NextResponse.json(
        {
          success: false,
          error: `SMS delivery is restricted during TCPA quiet hours (current local hour: ${currentHour}:00). Allowed delivery window is 8:00 AM – 9:00 PM local time.`,
          quietHoursBlocked: true,
          currentHour,
        },
        { status: 403 }
      );
    }

    let rawMessage: string;
    if (message && typeof message === 'string') {
      let customMsg = message;
      if (/\{\{review_link\}\}|\{review_link\}|\[review_link\]/i.test(customMsg)) {
        customMsg = customMsg.replace(/\{\{review_link\}\}|\{review_link\}|\[review_link\]/gi, funnelUrl);
      } else if (activeGoogleReviewUrl && customMsg.includes(activeGoogleReviewUrl)) {
        customMsg = customMsg.replace(activeGoogleReviewUrl, funnelUrl);
      } else if (!customMsg.includes('/r/')) {
        customMsg = `${customMsg.trim()} ${funnelUrl}`;
      }
      rawMessage = customMsg;
    } else {
      rawMessage = `Hi ${customerName}, thanks for visiting ${businessName}! Could you take 30 seconds to leave us a quick review on Google? ${funnelUrl}`;
    }
    const messageBody = appendComplianceFooter(rawMessage);

    const result = await sendTwilioSms(formattedTo, messageBody);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch SMS through carrier.',
        },
        { status: 500 }
      );
    }

    // Explicit DB insert: Resolve authenticated user & business, then persist to review_invites
    let targetUserId: string | null = null;
    let targetBusinessId: string | null = null;

    try {
      const authData = await auth().catch(() => null);
      const clerkUserId = authData?.userId || null;
      const effectiveUserId = clerkUserId || body.userId;

      if (effectiveUserId) {
        const profile = await db.profile.findFirst({
          where: {
            OR: [
              { clerkUserId: effectiveUserId },
              { id: effectiveUserId },
            ],
          },
        }).catch(() => null);

        if (profile?.id) {
          targetUserId = profile.id;
        } else if (effectiveUserId) {
          targetUserId = effectiveUserId;
        }

        const business = await db.business.findFirst({
          where: {
            OR: [
              { userId: targetUserId || effectiveUserId },
              { clerkUserId: effectiveUserId },
              { id: targetUserId || effectiveUserId },
            ],
          },
        }).catch(() => null) || await db.businessSettings.findFirst({
          where: {
            OR: [
              { userId: targetUserId || effectiveUserId },
            ],
          },
        }).catch(() => null);

        if (business?.id) {
          targetBusinessId = business.id;
        } else {
          targetBusinessId = targetUserId;
        }
      }
    } catch (authErr) {
      console.warn('[send-sms] Error resolving user/business:', authErr);
    }

    let createdInvite: any = null;
    try {
      createdInvite = await db.reviewInvite.create({
        data: {
          id: inviteToken,
          token: inviteToken,
          userId: targetUserId || body.userId || undefined,
          user_id: targetUserId || body.userId || undefined,
          businessId: targetBusinessId || targetUserId || undefined,
          business_id: targetBusinessId || targetUserId || undefined,
          customerName: customerName,
          customerPhone: formattedTo,
          phone: formattedTo,
          channel: 'sms',
          status: 'sent',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          placeId: placeId || null,
          businessName: businessName,
          reviewLink: funnelUrl,
          serviceType: serviceType || 'General Service',
        },
      });
    } catch (dbErr) {
      console.error('[send-sms] db.reviewInvite.create error:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        invite: createdInvite || {
          id: inviteToken,
          token: inviteToken,
          customer_name: customerName,
          customer_phone: formattedTo,
          status: 'sent',
          funnelUrl,
        },
        messageId: result.messageId,
        status: result.status,
        from: twilioPhoneNumber,
        to: formattedTo,
        simulated: result.simulated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API SMS send error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while sending SMS' },
      { status: 500 }
    );
  }
}
