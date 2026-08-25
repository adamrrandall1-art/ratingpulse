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
            .select('id, notification_email, notification_phone, sms_alerts_enabled')
            .or(`email.eq.${effectiveOwnerEmail},notification_email.eq.${effectiveOwnerEmail}`)
            .maybeSingle();

          if (prof?.id) {
            resolvedUserId = prof.id;
            if (prof.notification_email) effectiveOwnerEmail = prof.notification_email;
            if (prof.notification_phone) destinationPhone = prof.notification_phone;
            if (prof.sms_alerts_enabled !== undefined) smsAlertsEnabled = prof.sms_alerts_enabled;
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
          const { data: sett } = await supabaseAdmin
            .from('business_settings')
            .select('notification_email, notification_phone, sms_alerts_enabled')
            .eq('user_id', resolvedUserId)
            .maybeSingle();

          if (sett) {
            if (sett.notification_email) effectiveOwnerEmail = sett.notification_email;
            if (sett.notification_phone) destinationPhone = sett.notification_phone;
            if (sett.sms_alerts_enabled !== undefined) smsAlertsEnabled = sett.sms_alerts_enabled;
          }
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
        const smsText = `⚠️ RatingPulse Alert: ${effectiveName} left a ${effectiveRating}★ review for ${businessName}:\n"${effectiveText.slice(0, 100)}${effectiveText.length > 100 ? '...' : ''}"\nLogin to reply.`;
        await sendTwilioSms(formattedPhone, smsText);
      } catch (smsErr) {
        console.warn('Twilio alert warning:', smsErr);
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
