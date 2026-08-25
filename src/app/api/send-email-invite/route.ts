export const dynamic = 'force-dynamic';

import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    const body = await req.json();
    const customerEmail = body.customerEmail || body.toEmail;
    const customerName = body.customerName || 'there';
    const businessName = body.businessName || 'our team';
    const inviteId = body.inviteId || body.id || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    
    // Construct the RatingPulse Review Gate URL (NOT direct Google link)
    let reviewGateUrl = body.reviewGateUrl || body.reviewUrl || '';
    if (!reviewGateUrl || reviewGateUrl.includes('google.com') || reviewGateUrl.includes('writereview')) {
      const qParams = new URLSearchParams();
      if (businessName) qParams.set('business', businessName);
      if (body.placeId) qParams.set('placeId', body.placeId);
      if (body.ownerEmail || body.businessOwnerEmail) qParams.set('ownerEmail', body.ownerEmail || body.businessOwnerEmail);
      if (body.reviewUrl && (body.reviewUrl.includes('google.com') || body.reviewUrl.includes('writereview'))) {
        qParams.set('reviewUrl', body.reviewUrl);
      }
      const queryStr = qParams.toString() ? `?${qParams.toString()}` : '';
      reviewGateUrl = inviteId
        ? `${appUrl}/rate/${inviteId}${queryStr}`
        : `${appUrl}/rate${queryStr}`;
    }
    const userId = body.userId;
    const serviceType = body.serviceType || 'General Service';

    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'RatingPulse <reviews@ratingpulse.co>',
      to: customerEmail,
      subject: `How was your experience with ${businessName || 'us'}?`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Hi ${customerName || 'there'},</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for choosing <strong>${businessName || 'our team'}</strong>! We would love to hear your feedback so we can continue providing the best possible service.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${reviewGateUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
              ⭐ Rate Your Experience
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
            Takes less than 30 seconds. Thank you!
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    console.log('Resend success:', data);

    // Optional Supabase tracking
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const payload: Record<string, unknown> = {
          customer_name: customerName,
          customer_phone: customerEmail,
          service_type: serviceType,
          status: 'sent',
          sent_at: new Date().toISOString(),
        };
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          payload.user_id = userId;
        }
        await supabase.from('review_invites').insert([payload]);
      } catch (dbErr) {
        console.warn('[DB Error recording email invite]', dbErr);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}