export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';
import { sendTwilioSms, formatE164 } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      rating,
      feedbackText,
      comment,
      customerName,
      customerPhone,
      customerEmail,
      ownerEmail,
      businessOwnerEmail,
      business_email,
      owner_email,
      businessName,
      businessId,
      userId,
      inviteId,
      id,
    } = body;

    const effectiveText = feedbackText || comment || 'No comment provided';
    const effectiveRating = Number(rating) || 3;
    const targetUserId = businessId || userId || '';
    const targetInviteId = inviteId || id || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let recipientEmail =
      ownerEmail ||
      businessOwnerEmail ||
      business_email ||
      owner_email ||
      process.env.ADMIN_ALERT_EMAIL ||
      process.env.RESEND_ALERT_EMAIL ||
      '';

    let destinationPhone = '';
    let smsAlertsEnabled = true;
    let dbSuccess = false;

    // 1. Supabase Database Write & Recipient Resolution using Service Role Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        let resolvedUid = targetUserId;

        // If invite ID is given, resolve user_id and update invite record
        if (targetInviteId && isUuid.test(targetInviteId)) {
          const { data: inv } = await supabase
            .from('review_invites')
            .select('*')
            .eq('id', targetInviteId)
            .maybeSingle();

          if (inv?.user_id) resolvedUid = inv.user_id;

          const updatePayload: Record<string, unknown> = {
            rating_received: effectiveRating,
            feedback_text: effectiveText,
            status: 'unresolved',
            resolution_status: 'unresolved',
            review_received_at: new Date().toISOString(),
          };
          if (customerName) updatePayload.customer_name = customerName;
          if (customerPhone) updatePayload.customer_phone = customerPhone;
          if (customerEmail) updatePayload.customer_email = customerEmail;

          const { error: updErr } = await supabase
            .from('review_invites')
            .update(updatePayload)
            .eq('id', targetInviteId);

          if (!updErr) dbSuccess = true;
        }

        // Insert directly into the public.feedback table
        const feedbackDirectRow: Record<string, unknown> = {
          rating: Number(effectiveRating),
          feedback_text: effectiveText,
          customer_name: customerName || 'Anonymous',
          customer_email: customerEmail || (customerPhone?.includes('@') ? customerPhone : null),
          customer_phone: customerPhone || null,
          status: 'unresolved',
          user_id: resolvedUid && isUuid.test(resolvedUid) ? resolvedUid : null,
          business_id: resolvedUid && isUuid.test(resolvedUid) ? resolvedUid : null,
        };

        const { data: fbData, error: fbErr } = await supabase
          .from('feedback')
          .insert([feedbackDirectRow])
          .select();

        if (fbErr) {
          console.error('Failed to save feedback to Supabase:', fbErr);
        } else {
          dbSuccess = true;
          console.log('Saved feedback to Supabase successfully:', fbData);
        }

        // Fetch owner email and phone for notifications
        if (resolvedUid && isUuid.test(resolvedUid)) {
          const [profRes, settRes] = await Promise.allSettled([
            supabase.from('profiles').select('email, phone, notification_email, notification_phone, sms_alerts_enabled').eq('id', resolvedUid).maybeSingle(),
            supabase.from('business_settings').select('notification_email, notification_phone, sms_alerts_enabled').eq('user_id', resolvedUid).maybeSingle(),
          ]);

          let foundNotificationEmail = '';
          let foundNotificationPhone = '';

          if (settRes.status === 'fulfilled' && settRes.value.data) {
            const s = settRes.value.data;
            if (s.notification_email) foundNotificationEmail = s.notification_email;
            if (s.notification_phone) foundNotificationPhone = s.notification_phone;
            if (s.sms_alerts_enabled !== undefined && s.sms_alerts_enabled !== null) {
              smsAlertsEnabled = Boolean(s.sms_alerts_enabled);
            }
          }
          if (profRes.status === 'fulfilled' && profRes.value.data) {
            const p = profRes.value.data;
            if (!foundNotificationEmail) foundNotificationEmail = p.notification_email || p.email || '';
            if (!foundNotificationPhone) foundNotificationPhone = p.notification_phone || p.phone || '';
            if (p.sms_alerts_enabled !== undefined && p.sms_alerts_enabled !== null && settRes.status !== 'fulfilled') {
              smsAlertsEnabled = Boolean(p.sms_alerts_enabled);
            }
          }

          if (foundNotificationEmail) recipientEmail = foundNotificationEmail;
          if (foundNotificationPhone) destinationPhone = foundNotificationPhone;
        }
      } catch (dbErr) {
        console.warn('[DB Error recording feedback or fetching owner details]', dbErr);
      }
    }

    if (!recipientEmail || recipientEmail === 'notifications@ratingpulse.co' || recipientEmail === 'reviews@ratingpulse.co') {
      recipientEmail =
        process.env.ADMIN_ALERT_EMAIL ||
        process.env.RESEND_ALERT_EMAIL ||
        'arandall79@gmail.com';
    }

    // 2. Dispatch Email alert to business owner via Resend
    let emailSuccess = false;
    let alertId = '';
    try {
      const result = await sendFeedbackAlert({
        businessOwnerEmail: recipientEmail,
        customerName: customerName || 'A customer',
        customerPhone,
        customerEmail,
        rating: effectiveRating,
        feedbackText: effectiveText,
        businessName: businessName || 'RatingPulse Business',
      });
      emailSuccess = result.success;
      alertId = result.id || '';
    } catch (e) {
      console.warn('[Resend alert warning]', e);
    }

    // 3. Dispatch Instant SMS text alert to business owner if mobile is configured
    let smsSuccess = false;
    if (destinationPhone && smsAlertsEnabled) {
      try {
        const formattedPhone = formatE164(destinationPhone);
        if (formattedPhone) {
          const smsText = `⚠️ RatingPulse Alert: A customer (${customerName || 'Customer'}) left a ${effectiveRating}-star review with note: '${effectiveText}'. Log into your dashboard to respond.`;
          const smsResult = await sendTwilioSms(formattedPhone, smsText);
          smsSuccess = smsResult.success;
        }
      } catch (smsErr) {
        console.warn('[SMS alert warning]', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      alertId,
      dbUpdated: dbSuccess,
      emailSent: emailSuccess,
      smsSent: smsSuccess,
      recipient: recipientEmail,
    });
  } catch (error: any) {
    console.error('[API send-feedback-alert error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}