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

    // 1. Send Clean Plain-Text Style Email via Resend (Optimized for Primary Inbox Deliverability)
    let resendMessageId = null;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@ratingpulse.co';
      const fromAddress = `${businessName} via RatingPulse <${fromEmail}>`;
      const greetingName = customerName ? customerName.trim() : 'there';
      const subject = `Quick note from ${businessName}`;

      const plainTextContent = `Hi ${greetingName},

Thank you for choosing ${businessName}! We hope everything went well during your recent visit.

If you have 30 seconds, could you please leave us a quick review on Google? Your feedback helps our local team and helps others in our community:

${reviewGateUrl}

Thank you so much for your support!

Best regards,
${businessName}`;

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #222222; background-color: #ffffff;">
  <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
  <p style="margin: 0 0 16px 0;">Thank you for choosing <strong>${businessName}</strong>! We hope everything went well during your recent visit.</p>
  <p style="margin: 0 0 16px 0;">If you have 30 seconds, could you please leave us a quick review on Google? Your honest feedback helps our team improve and helps others find us:</p>
  <p style="margin: 0 0 16px 0;">
    <a href="${reviewGateUrl}" style="color: #1a73e8; text-decoration: underline; font-weight: 600;">Leave a quick Google review &rarr;</a>
  </p>
  <p style="margin: 0 0 16px 0; font-size: 13px; color: #555555;">
    Or click here: <a href="${reviewGateUrl}" style="color: #1a73e8; word-break: break-all;">${reviewGateUrl}</a>
  </p>
  <p style="margin: 0 0 16px 0;">Thank you so much for your support!</p>
  <p style="margin: 0 0 6px 0;">Best regards,</p>
  <p style="margin: 0 0 24px 0; font-weight: 600; color: #111111;">${businessName}</p>
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0 12px 0;" />
  <p style="margin: 0; font-size: 11px; color: #888888;">
    Sent via RatingPulse on behalf of ${businessName}.
  </p>
</body>
</html>`;

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [customerEmail],
        subject,
        text: plainTextContent,
        html: htmlContent,
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