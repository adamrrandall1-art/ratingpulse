import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export interface SendWelcomeEmailParams {
  to: string;
  name?: string;
  userId?: string;
  force?: boolean;
}

export function generateWelcomeEmailHtml(name?: string, appUrl: string = 'https://ratingpulse.co'): string {
  const firstName = name ? name.trim().split(' ')[0] : 'there';
  const dashboardUrl = `${appUrl.replace(/\/$/, '')}/dashboard`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RatingPulse!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 40px 32px 28px 32px; background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563eb; border-radius: 14px; line-height: 48px; text-align: center; color: #ffffff; font-weight: 900; font-size: 24px; margin-bottom: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
                ★
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Welcome to RatingPulse! 🚀
              </h1>
              <p style="margin: 8px 0 0 0; color: #93c5fd; font-size: 14px; font-weight: 500;">
                Let's automate your 5-star Google review growth
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 19px; font-weight: 700;">
                Hi ${firstName},
              </h2>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Thank you for joining <strong style="color: #ffffff;">RatingPulse</strong>! We are excited to help you transform your happy customers into glowing Google reviews on autopilot.
              </p>

              <!-- 3-Step Checklist Card -->
              <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                <h3 style="margin: 0 0 16px 0; color: #38bdf8; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  ⚡ Quick Start Checklist (Takes 2 Minutes)
                </h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" style="width: 28px; padding-bottom: 16px;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #2563eb; color: #ffffff; font-size: 12px; font-weight: bold; line-height: 22px; text-align: center;">
                        1
                      </div>
                    </td>
                    <td style="padding-bottom: 16px; color: #e2e8f0; font-size: 14px; line-height: 1.4;">
                      <strong style="color: #ffffff;">Connect Google Business Profile:</strong> Sync your existing reviews, live ratings, and Place ID.
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" style="width: 28px; padding-bottom: 16px;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #2563eb; color: #ffffff; font-size: 12px; font-weight: bold; line-height: 22px; text-align: center;">
                        2
                      </div>
                    </td>
                    <td style="padding-bottom: 16px; color: #e2e8f0; font-size: 14px; line-height: 1.4;">
                      <strong style="color: #ffffff;">Send Your First Invite:</strong> Dispatch an instant 1-tap SMS or branded Email review invite to a recent customer.
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" style="width: 28px;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #2563eb; color: #ffffff; font-size: 12px; font-weight: bold; line-height: 22px; text-align: center;">
                        3
                      </div>
                    </td>
                    <td style="color: #e2e8f0; font-size: 14px; line-height: 1.4;">
                      <strong style="color: #ffffff;">1-Tap AI Replies:</strong> Let Gemini AI draft local SEO keyword responses to climb Google Maps 3-Pack rankings.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- High Contrast CTA Button -->
              <div style="text-align: center; margin: 0 0 28px 0;">
                <a href="${dashboardUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 18px rgba(37, 99, 235, 0.4); text-align: center;">
                  Open Your Dashboard →
                </a>
              </div>

              <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
                Direct link: <a href="${dashboardUrl}" style="color: #38bdf8; text-decoration: none;">${dashboardUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0b0f17; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">
                Have questions or need help setting up? Simply <strong style="color: #ffffff;">reply directly to this email</strong> — our team is here to help.
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ${new Date().getFullYear()} RatingPulse.co • 1-Tap Google Review Automation & AI SEO Growth
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendWelcomeEmail({ to, name, userId, force }: SendWelcomeEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.RESEND_FROM_EMAIL || 'RatingPulse <notifications@ratingpulse.co>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email' };
  }

  // Check if welcome email has already been sent to this user in Supabase (unless force=true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabaseAdmin = null;

  if (supabaseUrl && supabaseKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

      if (!force && (userId || to)) {
        let query = supabaseAdmin.from('profiles').select('welcome_email_sent');
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          query = query.eq('id', userId);
        } else {
          query = query.eq('email', to);
        }

        const { data: profileData } = await query.maybeSingle();
        if (profileData?.welcome_email_sent) {
          console.log('[Welcome Email] Already sent previously to:', to);
          return { success: true, skipped: true, message: 'Welcome email already sent previously' };
        }
      }
    } catch (checkErr) {
      console.warn('[Welcome Email check warning]:', checkErr);
    }
  }

  let messageId = null;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const emailHtml = generateWelcomeEmailHtml(name, appUrl);

      // Attempt primary sender
      let sendResult = await resend.emails.send({
        from: configuredFrom,
        to: [to],
        subject: "Welcome to RatingPulse! 🚀 Let's automate your 5-star reviews",
        html: emailHtml,
      });

      // If domain unverified, fallback to onboarding@resend.dev
      if (sendResult.error && configuredFrom.includes('@ratingpulse.co')) {
        console.warn('[Resend Primary Sender Warning, attempting fallback]:', sendResult.error);
        sendResult = await resend.emails.send({
          from: 'RatingPulse <onboarding@resend.dev>',
          to: [to],
          subject: "Welcome to RatingPulse! 🚀 Let's automate your 5-star reviews",
          html: emailHtml,
        });
      }

      if (sendResult.error) {
        console.error('[Resend Welcome Email Error]:', sendResult.error);
        return { success: false, error: sendResult.error.message || 'Failed to dispatch email' };
      }

      messageId = sendResult.data?.id;
      console.log('[Resend Welcome Email Dispatched]:', messageId, 'to:', to);
    } catch (err: any) {
      console.error('[Resend Welcome Email Exception]:', err);
      return { success: false, error: err?.message || 'Email dispatch exception' };
    }
  } else {
    console.log('[Demo Mode] RESEND_API_KEY is not set. Mocking successful welcome email send to:', to);
    messageId = `mock_msg_${Date.now()}`;
  }

  // Mark welcome_email_sent = true in Supabase profiles
  if (supabaseAdmin && (userId || to)) {
    try {
      let updateQuery = supabaseAdmin
        .from('profiles')
        .update({ welcome_email_sent: true, updated_at: new Date().toISOString() });

      if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        updateQuery = updateQuery.eq('id', userId);
      } else {
        updateQuery = updateQuery.eq('email', to);
      }

      await updateQuery;
    } catch (updateErr) {
      console.warn('[Profiles welcome_email_sent update warning]:', updateErr);
    }
  }

  return { success: true, messageId, to };
}
