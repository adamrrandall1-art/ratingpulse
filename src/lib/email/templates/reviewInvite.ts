import { Resend } from 'resend';

export interface ReviewInviteEmailParams {
  to: string;
  customerName?: string;
  businessName?: string;
  reviewUrl?: string;
  googleReviewUrl?: string;
  isTestPreview?: boolean;
}

export function generateReviewInviteHtml({
  customerName,
  businessName = 'Our Business',
  reviewUrl,
  isTestPreview = false,
}: {
  customerName?: string;
  businessName?: string;
  reviewUrl: string;
  isTestPreview?: boolean;
}): string {
  const greetingName = customerName && customerName.trim() ? customerName.trim().split(' ')[0] : 'there';
  const targetUrl = reviewUrl || 'https://ratingpulse.co';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was your experience with ${businessName}?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          ${
            isTestPreview
              ? `
          <!-- Test Preview Banner -->
          <tr>
            <td style="padding: 10px 20px; background-color: #eff6ff; border-bottom: 1px solid #dbeafe; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #2563eb; letter-spacing: 0.5px; text-transform: uppercase;">
                ✉️ Sample Review Invite Preview (What your customers will receive)
              </span>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Header / Business Brand Banner -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <div style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px; line-height: 44px; text-align: center; color: #ffffff; font-weight: 900; font-size: 20px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
                ★
              </div>
              <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                ${businessName}
              </h1>
            </td>
          </tr>

          <!-- Main Message -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a; font-weight: 600;">
                Hi ${greetingName},
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Thank you for choosing <strong>${businessName}</strong>! We truly appreciate your support and hope you had a wonderful experience with us.
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Your feedback means the world to our team. Could you please take 30 seconds to share your thoughts and rate your experience on Google? It helps our local team continue to improve and helps others in our community discover our business.
              </p>

              <!-- Star Rating Indicator -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 26px; letter-spacing: 4px; color: #f59e0b; margin-bottom: 4px;">
                  ★★★★★
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #64748b;">
                  Rate 1 to 5 Stars
                </div>
              </div>

              <!-- High-Contrast CTA Button -->
              <div style="text-align: center; margin: 0 0 28px 0;">
                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 15px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); text-align: center;">
                  Share Your Experience on Google →
                </a>
              </div>

              <!-- Secondary Plain Text Link -->
              <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
                If the button above does not work, copy and paste this link into your browser:<br />
                <a href="${targetUrl}" style="color: #2563eb; word-break: break-all; text-decoration: underline;">${targetUrl}</a>
              </p>

              <!-- Sign-off -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">
                  Warm regards,
                </p>
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                  The Team at ${businessName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                Sent on behalf of ${businessName}.<br />
                Thank you for helping our local business grow!
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateReviewInvitePlainText({
  customerName,
  businessName = 'Our Business',
  reviewUrl,
}: {
  customerName?: string;
  businessName?: string;
  reviewUrl: string;
}): string {
  const greetingName = customerName && customerName.trim() ? customerName.trim().split(' ')[0] : 'there';
  const targetUrl = reviewUrl || 'https://ratingpulse.co';

  return `Hi ${greetingName},

Thank you for choosing ${businessName}! We truly appreciate your support and hope you had a wonderful experience with us.

Your feedback means the world to our team. Could you please take 30 seconds to share your thoughts and rate your experience on Google? It helps our local team continue to improve and helps others in our community discover our business:

${targetUrl}

Warm regards,
The Team at ${businessName}

---
Sent on behalf of ${businessName}.`;
}

export async function sendReviewInviteEmail({
  to,
  customerName,
  businessName = 'Our Business',
  reviewUrl,
  googleReviewUrl,
  isTestPreview = false,
}: ReviewInviteEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.RESEND_FROM_EMAIL || 'notifications@ratingpulse.co';
  const targetUrl = reviewUrl || googleReviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  const subject = `How was your experience with ${businessName}?`;
  const fromAddress = `${businessName} <${configuredFrom}>`;

  const html = generateReviewInviteHtml({
    customerName,
    businessName,
    reviewUrl: targetUrl,
    isTestPreview,
  });

  const text = generateReviewInvitePlainText({
    customerName,
    businessName,
    reviewUrl: targetUrl,
  });

  if (!resendApiKey) {
    console.log(`[Resend Simulated Review Invite] To: ${to} | Subject: "${subject}" | URL: ${targetUrl}`);
    return {
      success: true,
      simulated: true,
      id: `sim_invite_${Date.now()}`,
      message: `Simulated customer review invite dispatched to ${to}`,
    };
  }

  try {
    const resend = new Resend(resendApiKey);

    let sendResult = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
      text,
    });

    if (sendResult.error && configuredFrom.includes('@ratingpulse.co')) {
      console.warn('[Resend Primary Sender Warning, attempting fallback]:', sendResult.error);
      sendResult = await resend.emails.send({
        from: `${businessName} <onboarding@resend.dev>`,
        to: [to],
        subject,
        html,
        text,
      });
    }

    if (sendResult.error) {
      console.error('[Resend Review Invite Error]:', sendResult.error);
      return { success: false, error: sendResult.error.message };
    }

    return {
      success: true,
      id: sendResult.data?.id,
      message: `Sample customer review invite successfully delivered to ${to}`,
    };
  } catch (err: any) {
    console.error('[sendReviewInviteEmail exception]:', err);
    return { success: false, error: err?.message || 'Failed to dispatch customer review invite email' };
  }
}
