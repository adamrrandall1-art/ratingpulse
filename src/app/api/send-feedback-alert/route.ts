import { NextRequest, NextResponse } from 'next/server';
import { sendFeedbackAlert } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessOwnerEmail,
      customerName,
      customerPhone,
      customerEmail,
      rating,
      feedbackText,
      businessName,
    } = body;

    if (!businessOwnerEmail) {
      return NextResponse.json(
        { error: 'Business owner email address (businessOwnerEmail) is required' },
        { status: 400 }
      );
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Customer rating is required' },
        { status: 400 }
      );
    }

    const result = await sendFeedbackAlert({
      businessOwnerEmail,
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
