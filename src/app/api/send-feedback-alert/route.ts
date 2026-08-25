export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';

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

    // 1. If recipientEmail is not provided or user id / invite id is provided, fetch owner email from Supabase
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

        // If invite ID is given, find its user_id
        if (!resolvedUid && targetInviteId && isUuid.test(targetInviteId)) {
          const { data: inv } = await supabase
            .from('review_invites')
            .select('user_id')
            .eq('id', targetInviteId)
            .maybeSingle();

          if (inv?.user_id) resolvedUid = inv.user_id;
        }

        if (resolvedUid && isUuid.test(resolvedUid)) {
          const [profRes, settRes] = await Promise.allSettled([
            supabase.from('profiles').select('email, notification_email').eq('id', resolvedUid).maybeSingle(),
            supabase.from('business_settings').select('notification_email').eq('user_id', resolvedUid).maybeSingle(),
          ]);

          let foundNotificationEmail = '';
          if (settRes.status === 'fulfilled' && settRes.value.data?.notification_email) {
            foundNotificationEmail = settRes.value.data.notification_email;
          }
          if (!foundNotificationEmail && profRes.status === 'fulfilled') {
            foundNotificationEmail = profRes.value.data?.notification_email || profRes.value.data?.email || '';
          }

          if (foundNotificationEmail) {
            recipientEmail = foundNotificationEmail;
          }
        }
      } catch (dbErr) {
        console.warn('[DB Error fetching owner email for alert]', dbErr);
      }
    }

    if (!recipientEmail || recipientEmail === 'notifications@ratingpulse.co') {
      recipientEmail =
        process.env.ADMIN_ALERT_EMAIL ||
        process.env.RESEND_ALERT_EMAIL ||
        '';
    }

    if (!recipientEmail) {
      console.warn('[Warning] No owner notification email found for feedback alert.');
      return NextResponse.json({
        success: false,
        error: 'No valid recipient email address could be resolved for business owner.',
      }, { status: 400 });
    }

    const result = await sendFeedbackAlert({
      businessOwnerEmail: recipientEmail,
      customerName: customerName || 'A customer',
      customerPhone,
      customerEmail,
      rating: effectiveRating,
      feedbackText: effectiveText,
      businessName: businessName || 'RatingPulse Business',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch feedback alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alertId: result.id,
      recipient: recipientEmail,
      simulated: result.simulated ?? false,
    });
  } catch (error: any) {
    console.error('[API send-feedback-alert error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}