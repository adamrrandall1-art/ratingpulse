import { Resend } from 'resend';

export const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@ratingpulse.co';

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith('re_')) return null;
  return new Resend(apiKey);
}

export const isResendConfigured = Boolean(
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')
);

export interface EmailInviteParams {
  toEmail: string;
  customerName: string;
  businessName: string;
  reviewGateUrl: string;
}

export interface FeedbackAlertParams {
  businessOwnerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  rating: number;
  feedbackText: string;
  businessName?: string;
}

/**
 * Send a clean, branded email review invite to a customer
 */
export async function sendEmailInvite({
  toEmail,
  customerName,
  businessName,
  reviewGateUrl,
}: EmailInviteParams) {
  const resend = getResendClient();

  if (!resend) {
    console.log('[Resend Simulated] Email invite sent to:', toEmail, 'for business:', businessName);
    return {
      success: true,
      id: `sim_email_${Date.now()}`,
      simulated: true,
    };
  }

  const greetingName = customerName ? customerName.trim() : 'there';
  const subject = `Quick note from ${businessName}`;
  const fromAddress = `${businessName} via RatingPulse <${resendFromEmail}>`;

  const text = `Hi ${greetingName},

Thank you for choosing ${businessName}! We hope everything went well during your recent visit.

If you have 30 seconds, could you please leave us a quick review on Google? Your feedback helps our local team and helps others in our community:

${reviewGateUrl}

Thank you so much for your support!

Best regards,
${businessName}`;

  const html = `<!DOCTYPE html>
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

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      text,
      html,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return { success: false, error: error.message };
    }

    console.log('Resend Success Data:', data);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Resend API Exception:', err);
    return { success: false, error: err?.message || 'Failed to dispatch email' };
  }
}

/**
 * Send an urgent negative feedback alert to the business owner
 */
export async function sendFeedbackAlert({
  businessOwnerEmail,
  customerName,
  customerPhone,
  customerEmail,
  rating,
  feedbackText,
  businessName = 'RatingPulse Business',
}: FeedbackAlertParams) {
  const resend = getResendClient();

  if (!resend) {
    console.log('[Resend Alert Simulated] Alert to:', businessOwnerEmail, 'Rating:', rating, 'Feedback:', feedbackText);
    return {
      success: true,
      id: `sim_alert_${Date.now()}`,
      simulated: true,
    };
  }

  const starIcons = '⭐'.repeat(Math.max(1, Math.min(5, rating)));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Urgent: Negative Feedback Received</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fff1f2; margin: 0; padding: 32px 16px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #fecdd3; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.08);">
          <!-- Alert Header Banner -->
          <tr>
            <td style="background-color: #e11d48; padding: 18px 28px; color: #ffffff;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                ⚠️ Private Customer Feedback Alert (Intercepted)
              </h3>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">
              <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 18px; font-weight: 700; color: #9f1239; margin-bottom: 4px;">
                  ${starIcons} (${rating}/5 Stars)
                </div>
                <div style="font-size: 13px; color: #be123c; font-weight: 600;">
                  Intercepted Privately • Not posted to Google
                </div>
              </div>

              <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                Customer Feedback:
              </h4>
              <blockquote style="margin: 0 0 24px 0; padding: 14px 16px; background-color: #f8fafc; border-left: 4px solid #e11d48; border-radius: 4px; font-size: 14px; color: #334155; font-style: italic; line-height: 1.5;">
                "${feedbackText || 'No comments provided'}"
              </blockquote>

              <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                Customer Contact Details:
              </h4>
              <table border="0" cellpadding="6" cellspacing="0" width="100%" style="font-size: 14px; color: #334155; margin-bottom: 24px;">
                <tr>
                  <td width="30%" style="font-weight: 600; color: #64748b;">Customer Name:</td>
                  <td style="font-weight: 700; color: #0f172a;">${customerName || 'Anonymous Customer'}</td>
                </tr>
                ${customerPhone ? `
                <tr>
                  <td style="font-weight: 600; color: #64748b;">Phone Number:</td>
                  <td><a href="tel:${customerPhone}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${customerPhone}</a></td>
                </tr>` : ''}
                ${customerEmail ? `
                <tr>
                  <td style="font-weight: 600; color: #64748b;">Email Address:</td>
                  <td><a href="mailto:${customerEmail}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${customerEmail}</a></td>
                </tr>` : ''}
              </table>

              <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 14px; color: #166534; font-size: 13px; line-height: 1.4;">
                💡 <strong>Pro Tip:</strong> Reaching out within 15 minutes turns 70% of dissatisfied customers into loyal advocates!
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 28px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                RatingPulse Private Review Protection Engine
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const fallbackRecipient = process.env.ADMIN_ALERT_EMAIL || 'arandall79@gmail.com';
  let targetRecipient = businessOwnerEmail;
  if (!targetRecipient || targetRecipient === 'notifications@ratingpulse.co' || targetRecipient === 'reviews@ratingpulse.co') {
    targetRecipient = fallbackRecipient;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'RatingPulse Alerts <notifications@ratingpulse.co>',
      to: [targetRecipient],
      subject: `⚠️ Negative Feedback Alert: ${customerName || 'A customer'} left a ${rating}-star rating`,
      html,
    });

    if (error) {
      console.error('[Resend Alert Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[Resend Alert Exception]', err);
    return { success: false, error: err?.message || 'Failed to dispatch feedback alert' };
  }
}