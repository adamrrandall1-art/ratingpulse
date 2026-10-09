import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioSms, twilioPhoneNumber, formatE164, appendComplianceFooter, SMS_COMPLIANCE_FOOTER } from '@/lib/twilio';
import { checkQuietHours } from '@/lib/compliance/quietHours';

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
      ? "Scoop 'n Twist"
      : (body.businessName || body.business?.name || 'our business');
    const placeId = isDemoMode
      ? 'ChIJawEUC_oN04kRB70LP1wHuPg'
      : (body.placeId || body.google_place_id || '');
    const directReviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : `${appUrl}/rate`;
    const reviewLink = body.reviewGateUrl || body.reviewLink || body.reviewUrl || directReviewUrl;
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

    const defaultTemplate = `Hi ${customerName}, thanks for visiting ${businessName}! Could you take 30 seconds to leave us a quick review on Google? ${reviewLink}`;
    const rawMessage = message || defaultTemplate;
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

    return NextResponse.json(
      {
        success: true,
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
