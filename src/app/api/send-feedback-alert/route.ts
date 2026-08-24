import { NextRequest, NextResponse } from 'next/server';
import { sendFeedbackAlert } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      rating,
      feedbackText,
      customerName,
      customerPhone,
      customerEmail,
      ownerEmail,
      businessOwnerEmail,
      businessName,
    } = body;

    const recipientEmail = ownerEmail || businessOwnerEmail || 'notifications@ratingpulse.co';

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Customer rating is required' },
        { status: 400 }
      );
    }

    const result = await sendFeedbackAlert({
      businessOwnerEmail: recipientEmail,
      customerName: customerName || 'A customer',
      customerPhone,
      customerEmail,
      rating: Number(rating),
      feedbackText: feedbackText || 'No comment provided',
      businessName: businessName || 'RatingPulse Business',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch feedback alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alertId: result.id,
      simulated: result.simulated ?? false,
    });
  } catch (error: any) {
    console.error('[API send-feedback-alert error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}