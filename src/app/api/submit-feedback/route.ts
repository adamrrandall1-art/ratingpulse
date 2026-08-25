export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';
import { sendTwilioSms, formatE164 } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      inviteId,
      id,
      businessId,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      rating = 3,
      feedbackText,
      comment,
      businessName = 'RatingPulse Business',
      ownerEmail,
      businessOwnerEmail,
    } = body;

    const effectiveText = feedbackText || comment || '';
    const effectiveRating = Number(rating) || 3;
    const effectiveTargetId = inviteId || id || '';
    const effectiveOwnerEmail = ownerEmail || businessOwnerEmail || process.env.ADMIN_ALERT_EMAIL || process.env.RESEND_ALERT_EMAIL || '';
    const effectiveUserId = businessId || userId || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let destinationEmail = effectiveOwnerEmail;
    let destinationPhone = '';
    let smsAlertsEnabled = true;

    // 1. Supabase Database Write using Service Role Key (bypasses RLS for public review gate)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let dbSuccess = false;
    let recordId = effectiveTargetId;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        let resolvedUserId = effectiveUserId;

        if (effectiveTargetId && isUuid.test(effectiveTargetId)) {
          // Fetch existing invite record first to resolve user_id / business_id
          const { data: existingInvite } = await supabaseAdmin
            .from('review_invites')
            .select('*')
            .eq('id', effectiveTargetId)
            .maybeSingle();

          if (existingInvite?.user_id) {
            resolvedUserId = existingInvite.user_id;
          }

          // Update existing review invite record cleanly
          const updatePayload: Record<string, unknown> = {
            rating_received: effectiveRating,
            rating: effectiveRating,
            feedback_text: effectiveText,
            status: 'completed',
            updated_at: new Date().toISOString(),
          };
          if (customerName) updatePayload.customer_name = customerName;
          if (customerPhone) updatePayload.customer_phone = customerPhone;
          if (customerEmail) updatePayload.customer_email = customerEmail;

          const { data, error } = await supabaseAdmin
            .from('review_invites')
            .update(updatePayload)
            .eq('id', effectiveTargetId)
            .select();

          if (error) {
            console.error('[DB Update review_invites error]', error.message, error.details);
          } else {
            dbSuccess = true;
            if (data && data[0]?.user_id) {
              resolvedUserId = data[0].user_id;
            }
          }
        }

        // Insert standard fields into feedback table without manual ID
        const feedbackDirectRow: Record<string, unknown> = {
          business_id: resolvedUserId && isUuid.test(resolvedUserId) ? resolvedUserId : null,
          user_id: resolvedUserId && isUuid.test(resolvedUserId) ? resolvedUserId : null,
          customer_name: customerName || 'Anonymous Customer',
          customer_email: customerEmail || (customerPhone?.includes('@') ? customerPhone : null),
          customer_phone: customerPhone || null,
          rating: Number(effectiveRating),
          feedback_text: effectiveText,
          status: 'unresolved',
        };

        const { data: fbData, error: fbError } = await supabaseAdmin
          .from('feedback')
          .insert([feedbackDirectRow])
          .select();

        if (fbError) {
          console.error('[DB Insert feedback error]:', fbError.message, fbError.details);
        } else {
          dbSuccess = true;
          if (fbData && fbData[0]?.id) recordId = fbData[0].id;
          console.log('[Direct feedback insert success]:', fbData);
        }

        // Check if there is an explicit notification_email, notification_phone, or sms_alerts_enabled configured
        if (resolvedUserId && isUuid.test(resolvedUserId)) {
          const [profRes, settRes] = await Promise.allSettled([
            supabaseAdmin.from('profiles').select('email, phone, notification_email, notification_phone, sms_alerts_enabled').eq('id', resolvedUserId).maybeSingle(),
            supabaseAdmin.from('business_settings').select('notification_email, notification_phone, sms_alerts_enabled').eq('user_id', resolvedUserId).maybeSingle(),
          ]);

          let foundNotificationEmail = '';
          let foundNotificationPhone = '';
          let foundSmsEnabled = true;

          if (settRes.status === 'fulfilled' && settRes.value.data) {
            const s = settRes.value.data;
            if (s.notification_email) foundNotificationEmail = s.notification_email;
            if (s.notification_phone) foundNotificationPhone = s.notification_phone;
            if (s.sms_alerts_enabled !== undefined && s.sms_alerts_enabled !== null) {
              foundSmsEnabled = Boolean(s.sms_alerts_enabled);
            }
          }
          if (profRes.status === 'fulfilled' && profRes.value.data) {
            const p = profRes.value.data;
            if (!foundNotificationEmail) {
              foundNotificationEmail = p.notification_email || p.email || '';
            }
            if (!foundNotificationPhone) {
              foundNotificationPhone = p.notification_phone || p.phone || '';
            }
            if (p.sms_alerts_enabled !== undefined && p.sms_alerts_enabled !== null && settRes.status !== 'fulfilled') {
              foundSmsEnabled = Boolean(p.sms_alerts_enabled);
            }
          }

          if (foundNotificationEmail) destinationEmail = foundNotificationEmail;
          if (foundNotificationPhone) destinationPhone = foundNotificationPhone;
          smsAlertsEnabled = foundSmsEnabled;
        }
      } catch (dbErr) {
        console.error('[DB feedback exception]', dbErr);
      }
    }

    // 2. Dispatch Email alert to business owner via Resend
    let emailSuccess = false;
    try {
      const emailResult = await sendFeedbackAlert({
        businessOwnerEmail: destinationEmail,
        customerName: customerName || 'A customer',
        customerPhone,
        customerEmail,
        rating: effectiveRating,
        feedbackText: effectiveText || 'No comments provided',
        businessName,
      });
      emailSuccess = emailResult.success;
    } catch (emailErr) {
      console.warn('[Resend alert error]', emailErr);
    }

    // 3. Dispatch Instant SMS text alert to business owner if configured
    let smsSuccess = false;
    if (destinationPhone && smsAlertsEnabled) {
      try {
        const formattedPhone = formatE164(destinationPhone);
        if (formattedPhone) {
          const smsText = `⚠️ RatingPulse Alert: A customer (${customerName || 'Customer'}) left a ${effectiveRating}-star review with note: '${effectiveText || 'No comments'}'. Log into your dashboard to respond.`;
          const smsResult = await sendTwilioSms(formattedPhone, smsText);
          smsSuccess = smsResult.success;
          console.log('[SMS Feedback Alert dispatched]:', smsResult);
        }
      } catch (smsErr) {
        console.warn('[SMS alert error]', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      dbUpdated: dbSuccess,
      emailSent: emailSuccess,
      smsSent: smsSuccess,
      recordId,
    });
  } catch (err: any) {
    console.error('[API submit-feedback error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}