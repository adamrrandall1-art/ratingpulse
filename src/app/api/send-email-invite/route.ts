export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const body = await req.json().catch(() => ({}));

    const customerEmail = body.customer_email || body.customerEmail || body.toEmail || body.email;
    const customerName = body.customer_name || body.customerName || body.name || '';
    const businessName = body.business_name || body.businessName || 'Our Team';
    const rawBusinessId = body.business_id || body.businessId || '';
    const rawUserId = body.user_id || body.userId || '';
    const placeId = body.place_id || body.placeId || '';
    const inviteId = body.invite_id || body.inviteId || body.id || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';

    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid customer email is required' },
        { status: 400 }
      );
    }

    const businessId = rawBusinessId || rawUserId || (inviteId && isUuid.test(inviteId) ? inviteId : 'review');
    const resolvedUserId = (rawUserId && isUuid.test(rawUserId)) ? rawUserId : (rawBusinessId && isUuid.test(rawBusinessId)) ? rawBusinessId : null;

    // Generate unique review URL
    let reviewGateUrl = body.reviewGateUrl || body.reviewUrl || '';
    if (!reviewGateUrl || reviewGateUrl.includes('google.com') || reviewGateUrl.includes('writereview')) {
      const qParams = new URLSearchParams();
      if (businessName) qParams.set('business', businessName);
      if (placeId) qParams.set('placeId', placeId);
      if (body.ownerEmail) qParams.set('ownerEmail', body.ownerEmail);
      const queryStr = qParams.toString() ? `?${qParams.toString()}` : '';
      reviewGateUrl = `${appUrl}/rate/${businessId}${queryStr}`;
    }

    // 1. Send High-Converting Mobile-Responsive HTML Email via Resend
    let resendMessageId = null;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: 'RatingPulse Reviews <reviews@ratingpulse.co>',
        to: [customerEmail],
        subject: `How was your experience with ${businessName}?`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was your experience with ${businessName}?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; background-color: #2563eb; border-radius: 12px; line-height: 44px; text-align: center; color: #ffffff; font-weight: 800; font-size: 20px; margin-bottom: 12px;">
                ★
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                ${businessName}
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
                Verified Customer Feedback
              </p>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                Hi ${customerName ? customerName : 'there'},
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for choosing <strong>${businessName}</strong>! We strive to provide the best service possible.
              </p>
              <p style="margin: 0 0 28px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Could you please take <strong>30 seconds</strong> to share your experience with our team? Your honest feedback helps us improve and helps others in our community.
              </p>

              <!-- Star Graphic Preview -->
              <div style="text-align: center; margin: 24px 0 16px 0;">
                <span style="font-size: 28px; letter-spacing: 6px; color: #f59e0b;">★ ★ ★ ★ ★</span>
              </div>

              <!-- High Contrast CTA Button -->
              <div style="text-align: center; margin: 0 0 28px 0;">
                <a href="${reviewGateUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 15px 36px; border-radius: 12px; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); text-align: center;">
                  Rate Your Experience →
                </a>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; font-style: italic;">
                Takes less than 30 seconds • No login required
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px;">
                Sent on behalf of <strong>${businessName}</strong>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Powered by <a href="https://ratingpulse.co" style="color: #2563eb; text-decoration: none; font-weight: 600;">RatingPulse.co</a> • Automated Review Growth
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error('[Resend email invite error]:', error);
        return NextResponse.json({ success: false, error }, { status: 400 });
      }

      resendMessageId = data?.id;
      console.log('[Resend email invite sent successfully]:', resendMessageId);
    }

    // 2. Record Outgoing Invite in Supabase review_invites table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        const insertRecord: Record<string, unknown> = {
          recipient_email: customerEmail,
          recipient_name: customerName || null,
          customer_email: customerEmail,
          customer_name: customerName || 'Valued Customer',
          customer_phone: customerEmail,
          channel: 'email',
          service_type: body.serviceType || body.service_type || 'Email Review Request',
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        if (resolvedUserId) {
          insertRecord.user_id = resolvedUserId;
          insertRecord.business_id = resolvedUserId;
        }

        const { data: dbData, error: dbError } = await supabaseAdmin
          .from('review_invites')
          .insert([insertRecord])
          .select();

        if (dbError) {
          console.error('[Supabase review_invites insert error]:', dbError.message, dbError.details);
        } else {
          console.log('[Supabase review_invites recorded]:', dbData);
        }
      } catch (dbEx) {
        console.warn('[Supabase tracking exception]:', dbEx);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: resendMessageId,
      reviewGateUrl,
    });
  } catch (err: any) {
    console.error('[Fatal send-email-invite error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}