export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTwilioSms } from '@/lib/twilio';
import { getResendClient, resendFromEmail } from '@/lib/resend';
import { db } from '@/lib/db';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron secret if configured
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[Cron Follow-up] Unauthorized access attempt blocked');
      return new Response('Unauthorized', { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('[Cron Follow-up] Missing Supabase admin credentials');
      return NextResponse.json(
        { success: false, error: 'Database service role client unavailable' },
        { status: 500 }
      );
    }

    // 2. Compute ISO timestamps: sent <= 48 hours ago AND sent >= 7 days ago
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('[Cron Follow-up] Querying unopened invites sent between', sevenDaysAgo, 'and', fortyEightHoursAgo);

    // 3. Query eligible invites: status = 'sent', reminder_sent_at is null, sent between 48h and 7d ago, limit 50
    const { data: eligibleInvites, error: queryError } = await supabaseAdmin
      .from('review_invites')
      .select('id, user_id, customer_name, customer_phone, status, sent_at, created_at, reminder_sent_at')
      .eq('status', 'sent')
      .is('reminder_sent_at', null)
      .lte('sent_at', fortyEightHoursAgo)
      .gte('sent_at', sevenDaysAgo)
      .order('sent_at', { ascending: true })
      .limit(50);

    if (queryError) {
      console.error('[Cron Follow-up] Supabase query error:', queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (!eligibleInvites || eligibleInvites.length === 0) {
      console.log('[Cron Follow-up] No eligible invites found needing reminders');
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        errors: 0,
        message: 'No unopened invites eligible for 48-hour follow-up',
      });
    }

    console.log(`[Cron Follow-up] Found ${eligibleInvites.length} eligible invites to process`);

    // 4. Batch fetch business names from business_settings for invites' user_ids
    const candidateUserIds = Array.from(
      new Set(eligibleInvites.map((i: any) => i.user_id).filter(Boolean))
    );

    const businessNameMap = new Map<string, string>();
    if (candidateUserIds.length > 0) {
      const { data: settingsData } = await supabaseAdmin
        .from('business_settings')
        .select('user_id, business_name')
        .in('user_id', candidateUserIds);

      if (settingsData && Array.isArray(settingsData)) {
        for (const s of settingsData) {
          if (s.user_id && s.business_name) {
            businessNameMap.set(s.user_id, s.business_name);
          }
        }
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const resend = getResendClient();

    let sentCount = 0;
    let errorCount = 0;
    const details: any[] = [];

    // 5. Dispatch channel-appropriate reminder & stamp reminder_sent_at
    for (const invite of eligibleInvites) {
      const inviteId = invite.id;
      const recipientTarget = (invite.customer_phone || '').trim();
      const firstName = invite.customer_name?.split(' ')[0]?.trim() || 'there';

      // Query business_settings by user_id to resolve business_name
      let businessName = (invite.user_id ? businessNameMap.get(invite.user_id) : null) || '';
      if (!businessName && invite.user_id) {
        const { data: settings } = await supabaseAdmin
          .from('business_settings')
          .select('business_name')
          .eq('user_id', invite.user_id)
          .maybeSingle();

        businessName = settings?.business_name || 'our team';
        businessNameMap.set(invite.user_id, businessName);
      } else if (!businessName) {
        businessName = 'our team';
      }

      const trackingUrl = `${appUrl}/r/${inviteId}`;
      const isEmail = recipientTarget.includes('@');

      try {
        let dispatchSuccess = false;
        let dispatchDetails: any = null;

        if (isEmail) {
          // Send follow-up Email
          const subject = `Quick follow-up from ${businessName}`;
          const fromAddress = `${businessName} via RatingPulse <${resendFromEmail}>`;

          const textContent = `Hi ${firstName},

Just following up on our previous note! We know life gets busy, but if you have 30 seconds, we'd greatly appreciate your feedback on your recent experience with ${businessName}:

${trackingUrl}

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
  <p style="margin: 0 0 16px 0;">Hi ${firstName},</p>
  <p style="margin: 0 0 16px 0;">Just following up on our previous note! We know life gets busy, but if you have 30 seconds, we would love your quick feedback on your recent experience with <strong>${businessName}</strong>:</p>
  <p style="margin: 0 0 16px 0;">
    <a href="${trackingUrl}" style="color: #1a73e8; text-decoration: underline; font-weight: 600;">Share your feedback &rarr;</a>
  </p>
  <p style="margin: 0 0 16px 0; font-size: 13px; color: #555555;">
    Or click here: <a href="${trackingUrl}" style="color: #1a73e8; word-break: break-all;">${trackingUrl}</a>
  </p>
  <p style="margin: 0 0 16px 0;">Thank you so much for your time and support!</p>
  <p style="margin: 0 0 6px 0;">Best regards,</p>
  <p style="margin: 0 0 24px 0; font-weight: 600; color: #111111;">${businessName}</p>
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0 12px 0;" />
  <p style="margin: 0; font-size: 11px; color: #888888;">
    Sent via RatingPulse on behalf of ${businessName}.
  </p>
</body>
</html>`;

          if (resend) {
            const { data, error } = await resend.emails.send({
              from: fromAddress,
              to: [recipientTarget],
              subject,
              text: textContent,
              html: htmlContent,
            });

            if (error) {
              console.error(`[Cron Follow-up] Resend email failed for invite ${inviteId}:`, error);
              dispatchSuccess = false;
              dispatchDetails = { error: error.message };
            } else {
              dispatchSuccess = true;
              dispatchDetails = { messageId: data?.id, channel: 'email' };
            }
          } else {
            console.log(`[Cron Follow-up Simulated] Email reminder dispatched to ${recipientTarget} for ${businessName}`);
            dispatchSuccess = true;
            dispatchDetails = { simulated: true, channel: 'email' };
          }
        } else {
          // Send follow-up SMS
          const smsBody = `Hi ${firstName}, just a quick reminder from ${businessName}—we'd love your quick feedback on your recent visit: ${trackingUrl}`;
          const smsResult = await sendTwilioSms(recipientTarget, smsBody);

          if (smsResult.success) {
            dispatchSuccess = true;
            dispatchDetails = { messageId: smsResult.messageId, status: smsResult.status, channel: 'sms' };
          } else {
            console.error(`[Cron Follow-up] Twilio SMS failed for invite ${inviteId}:`, smsResult.error);
            dispatchSuccess = false;
            dispatchDetails = { error: smsResult.error };
          }
        }

        // 6. If dispatch succeeded, stamp reminder_sent_at in Supabase and local cache
        if (dispatchSuccess) {
          const stampedAt = new Date().toISOString();
          const { error: stampError } = await supabaseAdmin
            .from('review_invites')
            .update({ reminder_sent_at: stampedAt })
            .eq('id', inviteId);

          if (stampError) {
            console.error(`[Cron Follow-up] Failed to stamp reminder_sent_at for ${inviteId}:`, stampError);
          }

          // Also update local cache
          await db.reviewInvite.update({
            where: { id: inviteId },
            data: { reminder_sent_at: stampedAt },
          }).catch(() => {});

          sentCount++;
          details.push({
            id: inviteId,
            recipient: recipientTarget,
            channel: isEmail ? 'email' : 'sms',
            status: 'sent',
            stampedAt,
            dispatchDetails,
          });
        } else {
          errorCount++;
          details.push({
            id: inviteId,
            recipient: recipientTarget,
            channel: isEmail ? 'email' : 'sms',
            status: 'failed',
            dispatchDetails,
          });
        }
      } catch (err: any) {
        console.error(`[Cron Follow-up] Exception processing invite ${inviteId}:`, err);
        errorCount++;
        details.push({
          id: inviteId,
          status: 'exception',
          error: err.message || 'Unknown processing error',
        });
      }
    }

    console.log(`[Cron Follow-up Finished] Processed: ${eligibleInvites.length}, Sent: ${sentCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      processed: eligibleInvites.length,
      sent: sentCount,
      errors: errorCount,
      details,
    });
  } catch (err: any) {
    console.error('[Cron Follow-up Fatal Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error in follow-up cron' },
      { status: 500 }
    );
  }
}
