export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const body = await req.json().catch(() => ({}));

    const customerEmail =
      body.recipientEmail ||
      body.customer_email ||
      body.customerEmail ||
      body.toEmail ||
      body.email ||
      body.to;

    const customerName =
      body.recipientName ||
      body.customer_name ||
      body.customerName ||
      body.name ||
      '';

    const serviceType = body.serviceType || body.service_type || 'Email Review Request';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';

    if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid customer email is required' },
        { status: 400 }
      );
    }

    // 1. Resolve authenticated user & business
    const clerkAuth = await auth().catch(() => null);
    const clerkUserId = clerkAuth?.userId || body.userId || body.user_id || null;

    const profile = clerkUserId
      ? await db.profile.findFirst({
          where: {
            OR: [
              { clerkUserId },
              { id: clerkUserId },
            ],
          },
        }).catch(() => null)
      : null;

    const business = await db.business.findFirst({
      where: {
        OR: [
          ...(profile?.id ? [{ userId: profile.id }] : []),
          ...(clerkUserId ? [{ clerkUserId }, { userId: clerkUserId }] : []),
        ],
      },
    }).catch(() => null) || await db.businessSettings.findFirst({
      where: {
        OR: [
          ...(profile?.id ? [{ userId: profile.id }] : []),
        ],
      },
    }).catch(() => null);

    const businessName =
      body.business_name ||
      body.businessName ||
      business?.name ||
      profile?.business_name ||
      'Our Team';

    const inviteToken = crypto.randomUUID();
    const funnelUrl = `${appUrl}/r/${inviteToken}`;
    const reviewGateUrl = funnelUrl;

    // 2. Persist email invite row to review_invites immediately
    const newInvite = await db.reviewInvite.create({
      data: {
        id: inviteToken,
        token: inviteToken,
        userId: profile?.id || clerkUserId || undefined,
        businessId: business?.id,
        customerName: customerName.trim() || 'Customer',
        email: customerEmail.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerEmail.trim(),
        channel: 'email',
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date(),
        reviewLink: funnelUrl,
        businessName,
        serviceType,
      },
    });

    // 3. Dispatch email via Resend
    let resendMessageId = null;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@ratingpulse.co';
        const fromAddress = `${businessName} via RatingPulse <${fromEmail}>`;
        const greetingName = customerName ? customerName.trim() : 'there';
        const subject = `Quick note from ${businessName}`;

        const plainTextContent = `Hi ${greetingName},

Thank you for choosing ${businessName}! We hope everything went well during your recent visit.

If you have 30 seconds, could you please leave us a review? Your feedback helps our local team and helps others in our community:

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
  <p style="margin: 0 0 16px 0;">If you have 30 seconds, could you please leave us a review? Your honest feedback helps our team improve and helps others find us:</p>
  <p style="margin: 0 0 16px 0;">
    <a href="${reviewGateUrl}" style="color: #1a73e8; text-decoration: underline; font-weight: 600;">Leave a review &rarr;</a>
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
          to: [customerEmail.trim()],
          subject,
          text: plainTextContent,
          html: htmlContent,
        });

        if (error) {
          console.warn('[Resend email invite delivery warning]:', error);
        } else {
          resendMessageId = data?.id;
          console.log('[Resend email invite sent successfully]:', resendMessageId);
        }
      } catch (emailEx) {
        console.warn('[Resend dispatch exception]:', emailEx);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: resendMessageId,
      reviewGateUrl,
      invite: newInvite,
    });
  } catch (err: any) {
    console.error('[Fatal send-email-invite error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}