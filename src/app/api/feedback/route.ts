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

    // 1. Initialize Supabase Admin Client using Service Role Key (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_ADMIN_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    const supabaseKey = supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseServiceRoleKey) {
      console.warn(
        '[Supabase Config Warning] SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. ' +
        'Database operations will run with anon key and may require permissive RLS policies.'
      );
    }

    let supabaseAdmin = null;
    if (supabaseUrl && supabaseKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }

    // 2. Resolve User ID & Notification Routing Settings BEFORE DB insert
    if (supabaseAdmin) {
      try {
        // A. If invite ID is provided, resolve user_id and update invite status
        if (effectiveTargetId && isUuid.test(effectiveTargetId)) {
          const { data: existingInvite, error: inviteLookupErr } = await supabaseAdmin
            .from('review_invites')
            .select('user_id')
            .eq('id', effectiveTargetId)
            .maybeSingle();

          if (existingInvite?.user_id) {
            resolvedUserId = existingInvite.user_id;
          } else if (inviteLookupErr) {
            console.warn('[Invite Lookup Warning]:', inviteLookupErr.message);
          }

          // Update invite record
          try {
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
          } catch (e: any) {
            console.warn('[Invite Update Warning]:', e);
          }
        }

        // B. If user_id is still unknown, search profiles by owner email
        if (!resolvedUserId && effectiveOwnerEmail && !effectiveOwnerEmail.includes('ratingpulse.co')) {
          const { data: profByEmail } = await supabaseAdmin
            .from('profiles')
            .select('id, email, phone, notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled')
            .or(`email.eq.${effectiveOwnerEmail},notification_email.eq.${effectiveOwnerEmail}`)
            .maybeSingle();

          if (profByEmail?.id) {
            resolvedUserId = profByEmail.id;
          }
        }

        // C. Fetch notification routing settings for the business owner
        if (resolvedUserId && isUuid.test(resolvedUserId)) {
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
        }
      } catch (lookupErr: any) {
        console.warn('[Notification Lookup Warning]:', lookupErr?.message || lookupErr);
      }
    }

    // 3. Insert into public.feedback table (Non-blocking: Alert dispatch continues regardless)
    let insertedData = null;
    if (supabaseAdmin) {
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
          console.error('[Feedback DB Insert Error]:', error.message, error.details, error.hint);
          dbErrorDetails = error.message;
        } else {
          insertedData = data;
          dbSaved = true;
          console.log('[Feedback DB Insert Success]:', data);
        }
      } catch (insertEx: any) {
        console.error('[Feedback DB Exception]:', insertEx?.message || insertEx);
        dbErrorDetails = insertEx?.message || 'Database insert exception';
      }
    }

    // 4. Dispatch Resend Email Alert (if enabled)
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
        console.log('[Email Feedback Alert Dispatched]:', { recipient: effectiveOwnerEmail, success: emailSent });
      } catch (mailErr: any) {
        console.error('[Email Dispatch Error]:', mailErr?.message || mailErr);
      }
    }

    // 5. Dispatch Twilio SMS Alert (if enabled)
    if (isNegativeAlertEnabled && isNegativeSmsEnabled && destinationPhone) {
      try {
        const formattedPhone = formatE164(destinationPhone);
        if (formattedPhone) {
          const smsText = `⚠️ RatingPulse Alert: ${effectiveName} left a ${effectiveRating}★ review for ${businessName}:\n"${effectiveText.slice(0, 100)}${effectiveText.length > 100 ? '...' : ''}"\nLogin to reply.`;
          const smsResult = await sendTwilioSms(formattedPhone, smsText);
          smsSent = smsResult.success;
          if (!smsResult.success) {
            console.error('[SMS Dispatch Error]: Twilio SMS alert failed:', smsResult.error);
          } else {
            console.log('[SMS Dispatch Success]: Sent review alert to', formattedPhone, smsResult);
          }
        } else {
          console.error('[SMS Dispatch Error]: Destination phone could not be formatted into E.164:', destinationPhone);
        }
      } catch (smsErr: any) {
        console.error('[SMS Dispatch Error]: Exception while dispatching SMS:', smsErr?.message || smsErr);
      }
    } else {
      console.log('[SMS Alert Skipped]:', {
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
    console.error('[Feedback Route Critical Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

