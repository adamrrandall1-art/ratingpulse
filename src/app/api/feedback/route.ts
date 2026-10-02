export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';
import { sendTwilioSms, formatE164 } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      customer_name,
      customerName,
      customer_email,
      customerEmail,
      customer_phone,
      customerPhone,
      rating = 3,
      feedback_text,
      feedbackText,
      comment,
      status = 'unresolved',
      user_id,
      userId,
      business_id,
      businessId,
      invite_id,
      inviteId,
      id,
      businessName = 'RatingPulse Business',
      ownerEmail,
      businessOwnerEmail,
    } = body;

    const effectiveText = feedback_text || feedbackText || comment || '';
    const effectiveRating = Number(rating) || 3;
    const effectiveName = customer_name || customerName || 'Anonymous';
    const effectiveEmail = customer_email || customerEmail || (customerPhone?.includes('@') ? customerPhone : null);
    const effectivePhone = customer_phone || customerPhone || null;
    const effectiveTargetId = invite_id || inviteId || id || '';
    const rawUserId = user_id || userId || business_id || businessId || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedUserId = rawUserId && isUuid.test(rawUserId) ? rawUserId : null;
    let effectiveOwnerEmail = ownerEmail || businessOwnerEmail || process.env.ADMIN_ALERT_EMAIL || 'arandall79@gmail.com';
    let destinationPhone = '';
    let smsAlertsEnabled = true;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabaseAdmin = null;
    if (supabaseUrl && supabaseKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
    }

    let insertedData = null;
    let dbError = null;

    if (supabaseAdmin) {
      try {
        // If invite ID provided, resolve user_id and update invite record
        if (effectiveTargetId && isUuid.test(effectiveTargetId)) {
          const { data: existingInvite } = await supabaseAdmin
            .from('review_invites')
            .select('user_id')
            .eq('id', effectiveTargetId)
            .maybeSingle();

          if (existingInvite?.user_id) {
            resolvedUserId = existingInvite.user_id;
          }

          await supabaseAdmin
            .from('review_invites')
            .update({
              rating_received: effectiveRating,
              rating: effectiveRating,
              feedback_text: effectiveText,
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', effectiveTargetId);
        }

        // If user_id not resolved yet, attempt lookup by owner email
        if (!resolvedUserId && effectiveOwnerEmail && !effectiveOwnerEmail.includes('ratingpulse.co')) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('id, email, phone, notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled')
            .or(`email.eq.${effectiveOwnerEmail},notification_email.eq.${effectiveOwnerEmail}`)
            .maybeSingle();

          if (prof?.id) {
            resolvedUserId = prof.id;
            if (prof.notification_email) effectiveOwnerEmail = prof.notification_email;
            if (prof.notify_negative_phone || prof.notification_phone || prof.phone) {
              destinationPhone = prof.notify_negative_phone || prof.notification_phone || prof.phone;
            }
            if (prof.notify_negative_sms !== undefined && prof.notify_negative_sms !== null) {
              smsAlertsEnabled = Boolean(prof.notify_negative_sms);
            } else if (prof.sms_alerts_enabled !== undefined && prof.sms_alerts_enabled !== null) {
              smsAlertsEnabled = Boolean(prof.sms_alerts_enabled);
            }
          }
        }

        // Insert into public.feedback table
        const insertPayload = {
          customer_name: effectiveName,
          customer_email: effectiveEmail,
          customer_phone: effectivePhone,
          rating: effectiveRating,
          feedback_text: effectiveText,
          status: 'unresolved',
          user_id: resolvedUserId,
          business_id: resolvedUserId,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from('feedback')
          .insert([insertPayload])
          .select();

        if (error) {
          console.error('Feedback insert error:', error.message, error.details, error.hint);
          dbError = error;
        } else {
          insertedData = data;
          console.log('Feedback inserted successfully into Supabase:', data);
        }

        // Fetch notification settings for owner if available
        if (resolvedUserId) {
          const [profRes, settRes] = await Promise.allSettled([
            supabaseAdmin.from('profiles').select('id, email, phone, notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled').eq('id', resolvedUserId).maybeSingle(),
            supabaseAdmin.from('business_settings').select('notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled').eq('user_id', resolvedUserId).maybeSingle(),
          ]);

          let foundNotificationEmail = '';
          let foundNotificationPhone = '';
          let foundNegativeSms = true;
          let foundNegativeEnabled = true;

          if (settRes.status === 'fulfilled' && settRes.value.data) {
            const s = settRes.value.data;
            if (s.notification_email) foundNotificationEmail = s.notification_email;
            if (s.notify_negative_phone) foundNotificationPhone = s.notify_negative_phone;
            else if (s.notification_phone) foundNotificationPhone = s.notification_phone;

            if (s.notify_negative_enabled !== undefined && s.notify_negative_enabled !== null) {
              foundNegativeEnabled = Boolean(s.notify_negative_enabled);
            }
            if (s.notify_negative_sms !== undefined && s.notify_negative_sms !== null) {
              foundNegativeSms = Boolean(s.notify_negative_sms);
            } else if (s.sms_alerts_enabled !== undefined && s.sms_alerts_enabled !== null) {
              foundNegativeSms = Boolean(s.sms_alerts_enabled);
            }
          }

          if (profRes.status === 'fulfilled' && profRes.value.data) {
            const p = profRes.value.data;
            if (!foundNotificationEmail) {
              foundNotificationEmail = p.notification_email || p.email || '';
            }
            if (!foundNotificationPhone) {
              foundNotificationPhone = p.notify_negative_phone || p.notification_phone || p.phone || '';
            }
            if (settRes.status !== 'fulfilled' || !settRes.value.data) {
              if (p.notify_negative_enabled !== undefined && p.notify_negative_enabled !== null) {
                foundNegativeEnabled = Boolean(p.notify_negative_enabled);
              }
              if (p.notify_negative_sms !== undefined && p.notify_negative_sms !== null) {
                foundNegativeSms = Boolean(p.notify_negative_sms);
              } else if (p.sms_alerts_enabled !== undefined && p.sms_alerts_enabled !== null) {
                foundNegativeSms = Boolean(p.sms_alerts_enabled);
              }
            }
          }

          if (foundNotificationEmail) effectiveOwnerEmail = foundNotificationEmail;
          if (foundNotificationPhone) destinationPhone = foundNotificationPhone;
          smsAlertsEnabled = foundNegativeEnabled && foundNegativeSms;
        }
      } catch (err: any) {
        console.error('Feedback database exception:', err);
        dbError = err;
      }
    }

    // Dispatch Resend Email Alert
    try {
      await sendFeedbackAlert({
        businessOwnerEmail: effectiveOwnerEmail,
        customerName: effectiveName,
        customerEmail: effectiveEmail || 'Not provided',
        customerPhone: effectivePhone || 'Not provided',
        rating: effectiveRating,
        feedbackText: effectiveText,
        businessName,
      });
    } catch (mailErr) {
      console.warn('Resend feedback alert warning:', mailErr);
    }

    // Dispatch Twilio SMS Alert if enabled
    if (smsAlertsEnabled && destinationPhone) {
      try {
        const formattedPhone = formatE164(destinationPhone);
        if (formattedPhone) {
          const smsText = `⚠️ RatingPulse Alert: ${effectiveName} left a ${effectiveRating}★ review for ${businessName}:\n"${effectiveText.slice(0, 100)}${effectiveText.length > 100 ? '...' : ''}"\nLogin to reply.`;
          const smsResult = await sendTwilioSms(formattedPhone, smsText);
          if (!smsResult.success) {
            console.error('[SMS Dispatch Error]: Failed to send SMS review alert:', smsResult.error);
          } else {
            console.log('[SMS Dispatch Success]: Sent review alert to', formattedPhone, smsResult);
          }
        } else {
          console.error('[SMS Dispatch Error]: Recipient phone could not be formatted into E.164:', destinationPhone);
        }
      } catch (smsErr) {
        console.error('[SMS Dispatch Error]:', smsErr);
      }
    }

    if (dbError && !insertedData) {
      return NextResponse.json({
        success: false,
        error: dbError?.message || 'Database insert failed',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: insertedData,
    });
  } catch (err: any) {
    console.error('Feedback route critical error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
