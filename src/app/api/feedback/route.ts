export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';
import { sendTwilioSms, formatE164 } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  let dbSaved = false;
  let emailSent = false;
  let smsSent = false;
  let dbErrorDetails: string | null = null;

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
      ownerPhone,
      notificationPhone,
      notification_phone,
      phone,
    } = body;

    const effectiveText = feedback_text || feedbackText || comment || '';
    const effectiveRating = Number(rating) || 3;
    const effectiveName = customer_name || customerName || 'Anonymous';
    const effectiveEmail = customer_email || customerEmail || (customerPhone?.includes('@') ? customerPhone : null);
    const effectiveCustomerPhone = customer_phone || customerPhone || null;
    const effectiveTargetId = invite_id || inviteId || id || '';
    const rawUserId = user_id || userId || business_id || businessId || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedUserId = rawUserId && isUuid.test(rawUserId) ? rawUserId : null;

    let effectiveOwnerEmail =
      ownerEmail ||
      businessOwnerEmail ||
      process.env.ADMIN_ALERT_EMAIL ||
      'arandall79@gmail.com';

    let destinationPhone =
      notification_phone ||
      notificationPhone ||
      ownerPhone ||
      phone ||
      '';

    let isNegativeAlertEnabled = true;
    let isNegativeEmailEnabled = true;
    let isNegativeSmsEnabled = true;

    // 1. Initialize Supabase Admin Client using SUPABASE_SERVICE_ROLE_KEY to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_ADMIN_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        '[Feedback Flow Error]: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. ' +
        'Falling back to available key, which may be restricted by RLS.'
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 2. Resolve User ID from invite ID if provided
    if (effectiveTargetId && isUuid.test(effectiveTargetId)) {
      try {
        const { data: existingInvite, error: inviteLookupErr } = await supabaseAdmin
          .from('review_invites')
          .select('user_id')
          .eq('id', effectiveTargetId)
          .maybeSingle();

        if (existingInvite?.user_id) {
          resolvedUserId = existingInvite.user_id;
        } else if (inviteLookupErr) {
          console.error('[Feedback Flow Error]: Invite lookup error:', inviteLookupErr.message);
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
      } catch (inviteEx: any) {
        console.error('[Feedback Flow Error]: Exception updating review invite:', inviteEx);
      }
    }

    // 3. Fallback resolution of user_id from owner email
    if (!resolvedUserId && effectiveOwnerEmail && !effectiveOwnerEmail.includes('ratingpulse.co')) {
      try {
        const { data: profByEmail } = await supabaseAdmin
          .from('profiles')
          .select('id, email, phone, notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled')
          .or(`email.eq.${effectiveOwnerEmail},notification_email.eq.${effectiveOwnerEmail}`)
          .maybeSingle();

        if (profByEmail?.id) {
          resolvedUserId = profByEmail.id;
        }
      } catch (profEx: any) {
        console.error('[Feedback Flow Error]: Exception searching profiles by email:', profEx);
      }
    }

    // 4. Fetch notification preferences for resolved user
    if (resolvedUserId && isUuid.test(resolvedUserId)) {
      try {
        const [profRes, settRes] = await Promise.allSettled([
          supabaseAdmin
            .from('profiles')
            .select('id, email, phone, notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled')
            .eq('id', resolvedUserId)
            .maybeSingle(),
          supabaseAdmin
            .from('business_settings')
            .select('notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled')
            .eq('user_id', resolvedUserId)
            .maybeSingle(),
        ]);

        if (settRes.status === 'fulfilled' && settRes.value.data) {
          const s = settRes.value.data;
          if (s.notification_email) effectiveOwnerEmail = s.notification_email;
          if (s.notify_negative_phone) destinationPhone = s.notify_negative_phone;
          else if (s.notification_phone && !destinationPhone) destinationPhone = s.notification_phone;

          if (s.notify_negative_enabled !== undefined && s.notify_negative_enabled !== null) {
            isNegativeAlertEnabled = Boolean(s.notify_negative_enabled);
          }
          if (s.notify_negative_sms !== undefined && s.notify_negative_sms !== null) {
            isNegativeSmsEnabled = Boolean(s.notify_negative_sms);
          } else if (s.sms_alerts_enabled !== undefined && s.sms_alerts_enabled !== null) {
            isNegativeSmsEnabled = Boolean(s.sms_alerts_enabled);
          }
          if (s.notify_negative_email !== undefined && s.notify_negative_email !== null) {
            isNegativeEmailEnabled = Boolean(s.notify_negative_email);
          }
        }

        if (profRes.status === 'fulfilled' && profRes.value.data) {
          const p = profRes.value.data;
          if (!effectiveOwnerEmail || effectiveOwnerEmail.includes('ratingpulse.co')) {
            effectiveOwnerEmail = p.notification_email || p.email || effectiveOwnerEmail;
          }
          if (!destinationPhone) {
            destinationPhone = p.notify_negative_phone || p.notification_phone || p.phone || '';
          }
          if (settRes.status !== 'fulfilled' || !settRes.value.data) {
            if (p.notify_negative_enabled !== undefined && p.notify_negative_enabled !== null) {
              isNegativeAlertEnabled = Boolean(p.notify_negative_enabled);
            }
            if (p.notify_negative_sms !== undefined && p.notify_negative_sms !== null) {
              isNegativeSmsEnabled = Boolean(p.notify_negative_sms);
            } else if (p.sms_alerts_enabled !== undefined && p.sms_alerts_enabled !== null) {
              isNegativeSmsEnabled = Boolean(p.sms_alerts_enabled);
            }
            if (p.notify_negative_email !== undefined && p.notify_negative_email !== null) {
              isNegativeEmailEnabled = Boolean(p.notify_negative_email);
            }
          }
        }
      } catch (settingsEx: any) {
        console.error('[Feedback Flow Error]: Error reading notification preferences:', settingsEx);
      }
    }

    // 5. Insert Feedback Row using Admin Client
    let insertedData = null;
    try {
      const insertPayload = {
        customer_name: effectiveName,
        customer_email: effectiveEmail,
        customer_phone: effectiveCustomerPhone,
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
        console.error('[Feedback Flow Error]: DB insert failed:', error.message, error.details);
        dbErrorDetails = error.message;
      } else {
        insertedData = data;
        dbSaved = true;
        console.log('[Feedback DB Insert Success]:', data);
      }
    } catch (insertEx: any) {
      console.error('[Feedback Flow Error]: Database insert exception:', insertEx);
      dbErrorDetails = insertEx?.message || 'Database insert exception';
    }

    // 6. Dispatch Email Alert (if enabled)
    if (isNegativeAlertEnabled && isNegativeEmailEnabled && effectiveOwnerEmail) {
      try {
        const emailResult = await sendFeedbackAlert({
          businessOwnerEmail: effectiveOwnerEmail,
          customerName: effectiveName,
          customerEmail: effectiveEmail || 'Not provided',
          customerPhone: effectiveCustomerPhone || 'Not provided',
          rating: effectiveRating,
          feedbackText: effectiveText,
          businessName,
        });
        emailSent = emailResult?.success ?? false;
        console.log('[Feedback Alert Email]: successfully sent to', effectiveOwnerEmail);
      } catch (mailErr: any) {
        console.error('[Feedback Flow Error]: Email alert dispatch exception:', mailErr);
      }
    }

    // 7. Dispatch SMS Alert using Sanitized E.164 Recipient Phone
    if (isNegativeAlertEnabled && isNegativeSmsEnabled && destinationPhone) {
      try {
        const sanitizedPhone = formatE164(destinationPhone);
        if (sanitizedPhone) {
          const smsText = `⚠️ RatingPulse Alert: ${effectiveName} left a ${effectiveRating}★ review for ${businessName}:\n"${effectiveText.slice(0, 100)}${effectiveText.length > 100 ? '...' : ''}"\nLogin to reply.`;
          const smsResult = await sendTwilioSms(sanitizedPhone, smsText);
          smsSent = smsResult.success;
          if (!smsResult.success) {
            console.error('[Feedback Flow Error]: Twilio SMS alert dispatch failed:', smsResult.error);
          } else {
            console.log('[Feedback Alert SMS]: successfully sent to', sanitizedPhone);
          }
        } else {
          console.error('[Feedback Flow Error]: Destination phone could not be sanitized to E.164:', destinationPhone);
        }
      } catch (smsErr: any) {
        console.error('[Feedback Flow Error]: SMS alert dispatch exception:', smsErr);
      }
    } else {
      console.log('[Feedback Alert SMS]: Skipped', {
        isNegativeAlertEnabled,
        isNegativeSmsEnabled,
        hasDestinationPhone: Boolean(destinationPhone),
        destinationPhone,
      });
    }

    return NextResponse.json({
      success: true,
      data: insertedData,
      dbSaved,
      emailSent,
      smsSent,
      ...(dbErrorDetails ? { dbWarning: dbErrorDetails } : {}),
    });
  } catch (err: any) {
    console.error('[Feedback Flow Error]: Critical route error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


