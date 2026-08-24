import { NextRequest, NextResponse } from 'next/server';
import { sendEmailInvite } from '@/lib/resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      toEmail,
      customerName,
      businessName,
      reviewGateUrl,
      userId,
      serviceType = 'General Service',
    } = body;

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Recipient email address (toEmail) is required' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const finalReviewUrl = reviewGateUrl || `${appUrl}/dashboard`;

    // 1. Dispatch Email via Resend
    const result = await sendEmailInvite({
      toEmail,
      customerName: customerName || 'Valued Customer',
      businessName: businessName || 'Our Business',
      reviewGateUrl: finalReviewUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch email' },
        { status: 500 }
      );
    }

    // 2. Optionally record invite in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && userId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('review_invites').insert({
          user_id: userId,
          customer_name: customerName || 'Valued Customer',
          customer_phone: toEmail, // storing email in customer_phone / channel
          service_type: serviceType,
          status: 'sent',
          rating: null,
          sent_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('[DB Error recording email invite]', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
      simulated: result.simulated ?? false,
    });
  } catch (error: any) {
    console.error('[API send-email-invite error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
