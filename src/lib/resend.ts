import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;
export const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@ratingpulse.co';

export const isResendConfigured = Boolean(apiKey && apiKey.startsWith('re_'));

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
  if (!resend || !isResendConfigured) {
    console.log('[Resend Simulated] Email invite sent to:', toEmail, 'for business:', businessName);
    return {
      success: true,
      id: `sim_email_${Date.now()}`,
      simulated: true,
    };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>How was your experience with ${businessName}?</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Accent Banner -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);"></td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                Hi ${customerName}, thank you for choosing ${businessName}!
              </h2>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                We are committed to providing the highest quality service. Could you take 30 seconds to share your feedback and let us know how we did?
              </p>
              
              <!-- Review Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #2563eb;">
                    <a href="${reviewGateUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: -0.01em;">
                      ⭐ Rate Your Experience
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                Your review helps our team improve and helps other customers find us. Thank you for your support!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Sent via <strong style="color: #64748b;">RatingPulse</strong> on behalf of <strong>${businessName}</strong>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `"${businessName}" <${resendFromEmail}>`,
      to: [toEmail],
      subject: `How was your experience with ${businessName}?`,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[Resend Exception]', err);
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
  if (!resend || !isResendConfigured) {
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

  try {
    const { data, error } = await resend.emails.send({
      from: `RatingPulse Alerts <${resendFromEmail}>`,
      to: [businessOwnerEmail],
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
