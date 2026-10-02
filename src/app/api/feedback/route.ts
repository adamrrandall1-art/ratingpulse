export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';
import { sendTwilioSms, formatE164 } from '@/lib/twilio';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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
      rating,
      stars,
      rating_received,
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
      token,
      id,
      businessName = 'RatingPulse Business',
      ownerEmail,
      businessOwnerEmail,
      ownerPhone,
      notificationPhone,
      notification_phone,
      phone,
    } = body;

    // 1. Star Rating Parsing & Numeric Coercion (if <= 3 or absent, treat as negative)
    const rawRating = rating ?? stars ?? rating_received ?? body.effectiveRating;
    const numericRating = rawRating !== undefined && rawRating !== null && rawRating !== '' ? Number(rawRating) : null;
    const isNegative = numericRating === null || isNaN(numericRating) || numericRating <= 3;
    const effectiveRating = numericRating !== null && !isNaN(numericRating) ? numericRating : 3;

    const effectiveText = feedback_text || feedbackText || comment || '';
    const effectiveName = customer_name || customerName || 'Anonymous Customer';
    const effectiveEmail = customer_email || customerEmail || (customerPhone?.includes('@') ? customerPhone : null);
    const effectiveCustomerPhone = customer_phone || customerPhone || null;

    // 2. Initialize Supabase Admin Client using SUPABASE_SERVICE_ROLE_KEY to bypass RLS
    const supabaseAdmin = getAdminClient();

    // 3. Trace User / Owner ID from invite_id, token, business_id, or user_id
    const targetInviteId = invite_id || inviteId || token || id || '';
    const targetBusinessId = business_id || businessId || '';
    const rawUserId = user_id || userId || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let resolvedUserId: string | null = null;
    if (rawUserId && isUuid.test(rawUserId)) {
      resolvedUserId = rawUserId;
    }

    // Lookup via review_invites table if invite ID/token is present
    if (!resolvedUserId && targetInviteId) {
      try {
        let inviteQuery = supabaseAdmin
          .from('review_invites')
          .select('id, user_id, business_id, customer_name, customer_phone');

        if (isUuid.test(targetInviteId)) {
          inviteQuery = inviteQuery.eq('id', targetInviteId);
        } else {
          inviteQuery = inviteQuery.or(`id.eq.${targetInviteId},token.eq.${targetInviteId}`);
        }

        const { data: inviteData, error: inviteErr } = await inviteQuery.maybeSingle();

        if (inviteData?.user_id) {
          resolvedUserId = inviteData.user_id;
        } else if (inviteData?.business_id) {
          resolvedUserId = inviteData.business_id;
        } else if (inviteErr) {
          console.warn('[Feedback Flow]: Invite lookup warning:', inviteErr.message);
        }

        // Update invite record if found
        if (targetInviteId && isUuid.test(targetInviteId)) {
          await supabaseAdmin
            .from('review_invites')
            .update({
              rating_received: effectiveRating,
              rating: effectiveRating,
              feedback_text: effectiveText,
              status: 'feedback_submitted',
              resolution_status: 'needs_follow_up',
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetInviteId);
        }
      } catch (invEx: any) {
        console.warn('[Feedback Flow]: Exception querying review_invites:', invEx?.message);
      }
    }

    // Lookup via businesses or profiles if business_id is passed
    if (!resolvedUserId && targetBusinessId) {
      if (isUuid.test(targetBusinessId)) {
        resolvedUserId = targetBusinessId;
      } else {
        try {
          const { data: bData } = await supabaseAdmin
            .from('businesses')
            .select('user_id')
            .eq('id', targetBusinessId)
            .maybeSingle();

          if (bData?.user_id) {
            resolvedUserId = bData.user_id;
          }
        } catch {
          // businesses table may not exist, continue
        }
      }
    }

    // Lookup by owner email if provided
    let effectiveOwnerEmail =
      ownerEmail ||
      businessOwnerEmail ||
      process.env.ADMIN_ALERT_EMAIL ||
      '';

    if (!resolvedUserId && effectiveOwnerEmail && !effectiveOwnerEmail.includes('ratingpulse.co')) {
      try {
        const { data: profByEmail } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .or(`email.eq.${effectiveOwnerEmail},notification_email.eq.${effectiveOwnerEmail}`)
          .maybeSingle();

        if (profByEmail?.id) {
          resolvedUserId = profByEmail.id;
        }
      } catch (emailEx: any) {
        console.warn('[Feedback Flow]: Email lookup exception:', emailEx?.message);
      }
    }

    // 4. Query Profiles & Business Settings using Service Role
    let profile: any = null;
    let settings: any = null;

    if (resolvedUserId && isUuid.test(resolvedUserId)) {
      try {
        const [profRes, settRes] = await Promise.allSettled([
          supabaseAdmin.from('profiles').select('*').eq('id', resolvedUserId).maybeSingle(),
          supabaseAdmin.from('business_settings').select('*').eq('user_id', resolvedUserId).maybeSingle(),
        ]);
        profile = profRes.status === 'fulfilled' ? profRes.value.data : null;
        settings = settRes.status === 'fulfilled' ? settRes.value.data : null;
      } catch (loadErr: any) {
        console.warn('[Feedback Flow]: Error querying user profile/settings:', loadErr?.message);
      }
    }

    // 5. Fallback / Single-Tenant Graceful Resolution: Fetch the first active profile
    if (!profile) {
      try {
        const { data: firstProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (firstProfile) {
          profile = firstProfile;
          resolvedUserId = firstProfile.id;
          const { data: firstSettings } = await supabaseAdmin
            .from('business_settings')
            .select('*')
            .eq('user_id', firstProfile.id)
            .maybeSingle();
          settings = firstSettings;
        }
      } catch (firstErr: any) {
        console.warn('[Feedback Flow]: Could not fetch fallback profile:', firstErr?.message);
      }
    }

    console.log('[Alert Settings Loaded]:', { profile, settings });
    console.log('[Resolved Profile for Alert]:', {
      id: profile?.id,
      phone: profile?.notify_negative_phone || profile?.notification_phone || profile?.phone,
    });

    // 6. Resolve Destination Phone & Email with Hierarchy
    let destinationPhone =
      settings?.notify_negative_phone ||
      settings?.notification_phone ||
      profile?.notify_negative_phone ||
      profile?.notification_phone ||
      profile?.phone ||
      notification_phone ||
      notificationPhone ||
      ownerPhone ||
      phone ||
      '';

    if (settings?.notification_email || profile?.notification_email || profile?.email) {
      const candidateEmail = settings?.notification_email || profile?.notification_email || profile?.email;
      if (candidateEmail && !candidateEmail.includes('ratingpulse.co')) {
        effectiveOwnerEmail = candidateEmail;
      }
    }

    let isNegativeAlertEnabled = true;
    let isNegativeSmsEnabled = true;
    let isNegativeEmailEnabled = true;

    if (settings?.notify_negative_enabled === false || (settings?.notify_negative_enabled === undefined && profile?.notify_negative_enabled === false)) {
      isNegativeAlertEnabled = false;
    }
    if (settings?.notify_negative_sms === false || (settings?.notify_negative_sms === undefined && profile?.notify_negative_sms === false && profile?.sms_alerts_enabled === false)) {
      isNegativeSmsEnabled = false;
    }
    if (settings?.notify_negative_email === false || (settings?.notify_negative_email === undefined && profile?.notify_negative_email === false)) {
      isNegativeEmailEnabled = false;
    }

    // 7. Insert Feedback Row using Admin Client
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

    // 8. Dispatch Email Alert
    if (isNegative && isNegativeAlertEnabled && isNegativeEmailEnabled && effectiveOwnerEmail) {
      try {
        const emailResult = await sendFeedbackAlert({
          businessOwnerEmail: effectiveOwnerEmail,
          customerName: effectiveName,
          customerEmail: effectiveEmail || 'Not provided',
          customerPhone: effectiveCustomerPhone || 'Not provided',
          rating: effectiveRating,
          feedbackText: effectiveText,
          businessName: profile?.business_name || businessName,
        });
        emailSent = emailResult?.success ?? false;
        console.log('[Feedback Alert Email]: successfully sent to', effectiveOwnerEmail);
      } catch (mailErr: any) {
        console.error('[Feedback Flow Error]: Email alert dispatch exception:', mailErr);
      }
    }

    // 9. Dispatch SMS Alert (E.164)
    if (isNegative && destinationPhone) {
      try {
        const sanitizedPhone = formatE164(destinationPhone);
        if (sanitizedPhone) {
          const bizTitle = profile?.business_name || businessName || 'Your Business';
          const commentText = effectiveText ? (effectiveText.length > 120 ? `${effectiveText.slice(0, 120)}...` : effectiveText) : 'No comment left';
          const smsText = `⚠️ RatingPulse Alert: ${effectiveName} left a ${effectiveRating}★ review for ${bizTitle}:\n"${commentText}"\n\nView & reply:\nhttps://ratingpulse.co/dashboard/feedback\n\nReply STOP to unsubscribe.`;
          const smsResult = await sendTwilioSms(sanitizedPhone, smsText);
          smsSent = smsResult.success;
          if (!smsResult.success) {
            console.error('[Feedback Flow Error]: Twilio SMS alert dispatch failed:', smsResult.error);
          } else {
            console.log('[Feedback Alert SMS]: Dispatched to', sanitizedPhone);
          }
        } else {
          console.error('[Feedback Flow Error]: Destination phone could not be sanitized to E.164:', destinationPhone);
        }
      } catch (smsErr: any) {
        console.error('[Feedback Flow Error]: SMS alert dispatch exception:', smsErr);
      }
    } else {
      console.log('[Feedback Alert SMS]: Skipped', {
        isNegative,
        effectiveRating,
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



