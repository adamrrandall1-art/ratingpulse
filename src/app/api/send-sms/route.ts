import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioSms, twilioPhoneNumber, formatE164 } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTo = body.to || body.phoneNumber || body.customerPhone || body.recipient || body.phone;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const {
      customerName = 'Valued Customer',
      businessName = 'Our Business',
      reviewLink = body.reviewGateUrl || body.reviewUrl || `${appUrl}/rate`,
      message,
      serviceType,
    } = body;

    if (!rawTo) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    const formattedTo = formatE164(rawTo);
    if (!formattedTo || formattedTo.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format.' },
        { status: 400 }
      );
    }

    const defaultTemplate = `Hi ${customerName}, thanks for visiting ${businessName}! Could you take 30s to rate your experience on Google? ${reviewLink}`;
    const messageBody = message || defaultTemplate;

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
