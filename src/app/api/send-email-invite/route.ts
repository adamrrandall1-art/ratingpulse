import { NextRequest, NextResponse } from 'next/server';
import { sendEmailInvite } from '@/lib/resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerEmail = body.customerEmail || body.toEmail;
    const customerName = body.customerName || 'Valued Customer';
    const businessName = body.businessName || 'Our Business';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const reviewUrl = body.reviewUrl || body.reviewGateUrl || `${appUrl}/rate/demo`;
    const userId = body.userId;
    const serviceType = body.serviceType || 'General Service';

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email address (customerEmail or toEmail) is required' },
        { status: 400 }
      );
    }

    // 1. Dispatch Email via Resend
    const result = await sendEmailInvite({
      toEmail: customerEmail,
      customerName,
      businessName,
      reviewGateUrl: reviewUrl,
    });

    if (!result.success) {
      console.error('Resend API Error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch email' },
        { status: 500 }
      );
    }

    console.log('Resend Success Data:', result);

    // 2. Insert into Supabase review_invites table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && userId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('review_invites').insert({
          user_id: userId,
          customer_name: customerName,
          customer_phone: customerEmail, // stored as contact channel
          service_type: serviceType,
          status: 'sent',
          rating_received: null,
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