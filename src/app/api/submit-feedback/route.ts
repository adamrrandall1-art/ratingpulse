export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeedbackAlert } from '@/lib/resend';

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
    const effectiveOwnerEmail = ownerEmail || businessOwnerEmail || 'notifications@ratingpulse.co';
    const effectiveUserId = businessId || userId || '';

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

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (effectiveTargetId && isUuid.test(effectiveTargetId)) {
          // Update existing review invite record
          const updatePayload: Record<string, unknown> = {
            rating_received: effectiveRating,
            feedback_text: effectiveText,
            status: 'feedback_submitted',
            resolution_status: 'needs_follow_up',
            review_received_at: new Date().toISOString(),
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
            console.error('[DB Update feedback error]', error);
          } else {
            dbSuccess = true;
            console.log('[DB Update feedback success]', data);
          }
        } else if (effectiveUserId && isUuid.test(effectiveUserId)) {
          // Insert new feedback record for this business/user
          const insertPayload: Record<string, unknown> = {
            user_id: effectiveUserId,
            customer_name: customerName || 'Valued Customer',
            customer_phone: customerPhone || customerEmail || '',
            customer_email: customerEmail || (customerPhone?.includes('@') ? customerPhone : null),
            service_type: 'Urgent Customer Feedback',
            status: 'feedback_submitted',
            rating_received: effectiveRating,
            feedback_text: effectiveText,
            resolution_status: 'needs_follow_up',
            sent_at: new Date().toISOString(),
            review_received_at: new Date().toISOString(),
          };

          const { data, error } = await supabaseAdmin
            .from('review_invites')
            .insert([insertPayload])
            .select();

          if (error) {
            console.error('[DB Insert feedback error]', error);
          } else {
            dbSuccess = true;
            if (data && data[0]?.id) recordId = data[0].id;
            console.log('[DB Insert feedback success]', data);
          }
        }
      } catch (dbErr) {
        console.error('[DB feedback exception]', dbErr);
      }
    }

    // 2. Dispatch Email alert to business owner via Resend
    let emailSuccess = false;
    try {
      const emailResult = await sendFeedbackAlert({
        businessOwnerEmail: effectiveOwnerEmail,
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

    return NextResponse.json({
      success: true,
      dbUpdated: dbSuccess,
      emailSent: emailSuccess,
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