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
    const authData = await auth().catch(() => null);
    const clerkUserId = authData?.userId || (body.userId as string) || null;
    if (!clerkUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve Supabase profile and business
    const profile = await db.profile.findFirst({
      where: {
        OR: [
          { clerkUserId },
          { id: clerkUserId },
        ],
      },
    }).catch(() => null);

    const business = await db.business.findFirst({
      where: {
        OR: [
          { userId: profile?.id },
          { clerkUserId },
        ],
      },
    }).catch(() => null) || await db.businessSettings.findFirst({
      where: {
        OR: [
          { userId: profile?.id },
        ],
      },
    }).catch(() => null);

    // Create the review_invites record
    const newInvite = await db.reviewInvite.create({
      data: {
        id: inviteToken,
        token: inviteToken,
        userId: profile?.id,
        businessId: business?.id,
        customerName: (body.recipientName as string) || (body.customerName as string) || customerName || 'Customer',
        phone: formattedTo,
        customerPhone: formattedTo,
        channel: 'sms',
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date(),
        placeId: placeId || null,
        businessName: businessName,
        reviewLink: funnelUrl,
        serviceType: serviceType || 'General Service',
      },
    });

    return NextResponse.json(
      {
        success: true,
        invite: newInvite,
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
