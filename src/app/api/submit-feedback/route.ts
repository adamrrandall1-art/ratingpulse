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
      business_name,
      businessName,
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
    let inviteBusinessName: string | null = null;
    let profileBusinessName: string | null = null;

    // 1. Supabase Database Write using Service Role Key (bypasses RLS for public review gate)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_ADMIN_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    const supabaseKey = supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let dbSuccess = false;
    let recordId = effectiveTargetId;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
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
          if (existingInvite?.business_name) {
            inviteBusinessName = existingInvite.business_name;
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

        if ((!resolvedUserId || !isUuid.test(resolvedUserId)) && effectiveOwnerEmail && !effectiveOwnerEmail.includes('ratingpulse.co')) {
          const { data: profByEmail } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .or(`email.eq.${effectiveOwnerEmail},notification_email.eq.${effectiveOwnerEmail}`)
            .maybeSingle();

          if (profByEmail?.id) resolvedUserId = profByEmail.id;
        }

        // Insert standard fields into feedback table without manual ID
        const feedbackDirectRow: Record<string, unknown> = {
          rating: Number(effectiveRating),
          feedback_text: effectiveText,
          customer_name: customerName || 'Anonymous',
          customer_email: customerEmail || (customerPhone?.includes('@') ? customerPhone : null),
          status: 'unresolved',
          user_id: resolvedUserId && isUuid.test(resolvedUserId) ? resolvedUserId : null,
          business_id: resolvedUserId && isUuid.test(resolvedUserId) ? resolvedUserId : null,
        };

        const { data: fbData, error: fbError } = await supabaseAdmin
          .from('feedback')
          .insert([feedbackDirectRow])
          .select();

        if (fbError) {
          console.error('Failed to save feedback to Supabase:', fbError);
        } else {
          dbSuccess = true;
          if (fbData && fbData[0]?.id) recordId = fbData[0].id;
          console.log('Saved feedback to Supabase successfully:', fbData);
        }

        // Check if there is an explicit notification_email, notification_phone, or sms_alerts_enabled configured
        if (resolvedUserId && isUuid.test(resolvedUserId)) {
          const [profRes, settRes] = await Promise.allSettled([
            supabaseAdmin.from('profiles').select('id, business_name, email, phone, notification_email, notification_phone, notify_negative_enabled, notify_negative_email, notify_negative_sms, notify_negative_phone, sms_alerts_enabled').eq('id', resolvedUserId).maybeSingle(),
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
            if (p.business_name) {
              profileBusinessName = p.business_name;
            }
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

          if (foundNotificationEmail) destinationEmail = foundNotificationEmail;
          if (foundNotificationPhone) destinationPhone = foundNotificationPhone;
          smsAlertsEnabled = foundNegativeEnabled && foundNegativeSms;
        }
      } catch (dbErr) {
        console.error('[DB feedback exception]', dbErr);
      }
    }

    // Dynamic resolution of business name: prioritize body & invite over static profile
    const resolvedBusinessName =
      (business_name && business_name !== 'RatingPulse Business')
        ? business_name
        : (businessName && businessName !== 'RatingPulse Business')
          ? businessName
          : inviteBusinessName ||
            profileBusinessName ||
            'your business';

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
        businessName: resolvedBusinessName,
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
          const commentText = effectiveText ? (effectiveText.length > 120 ? `${effectiveText.slice(0, 120)}...` : effectiveText) : 'No comment left';
          const smsText = `⚠️ RatingPulse Alert: ${customerName || 'A customer'} left a ${effectiveRating}★ review for ${resolvedBusinessName}:\n"${commentText}"\n\nView & reply:\nhttps://ratingpulse.co/dashboard/reviews\n\nReply STOP to unsubscribe.`;
          const smsResult = await sendTwilioSms(formattedPhone, smsText);
          smsSuccess = smsResult.success;
          if (!smsResult.success) {
            console.error('[SMS Dispatch Error]: Failed to dispatch SMS feedback alert:', smsResult.error);
          } else {
            console.log('[SMS Dispatch Success]: Sent feedback alert to', formattedPhone, smsResult);
          }
        } else {
          console.error('[SMS Dispatch Error]: Invalid formatted destination phone for feedback alert:', destinationPhone);
        }
      } catch (smsErr) {
        console.error('[SMS Dispatch Error]: Exception while dispatching SMS:', smsErr);
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