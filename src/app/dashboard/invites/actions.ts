'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sendTwilioSms, formatE164, appendComplianceFooter } from '@/lib/twilio';
import { Resend } from 'resend';

export async function sendInviteAction(formData: {
  customerName?: string;
  recipientName?: string;
  phone?: string;
  recipientPhone?: string;
  customerPhone?: string;
  serviceType?: string;
  message?: string;
  channel?: string;
  email?: string;
  recipientEmail?: string;
}) {
  if (formData.channel === 'email' || (!formData.phone && !formData.recipientPhone && (formData.email || formData.recipientEmail))) {
    return sendEmailInviteAction({
      customerName: formData.customerName,
      recipientName: formData.recipientName,
      email: formData.email,
      recipientEmail: formData.recipientEmail,
      serviceType: formData.serviceType,
    });
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { success: false, error: 'Unauthorized' };
  }

  const rawPhone = formData.recipientPhone || formData.phone || formData.customerPhone || '';
  const formattedTo = formatE164(rawPhone.trim());
  if (!formattedTo || formattedTo.length < 10) {
    return { success: false, error: 'Invalid phone number format.' };
  }

  // Resolve Supabase profile and business
  const profile = await db.profile.findFirst({
    where: { clerkUserId },
  });

  const business = await db.business.findFirst({
    where: { userId: profile?.id },
  }) || await db.businessSettings.findFirst({
    where: { userId: profile?.id },
  });

  const customerName = formData.recipientName || formData.customerName || 'Customer';
  const serviceType = formData.serviceType || 'General Service';
  const inviteToken = crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
  const funnelUrl = `${appUrl}/r/${inviteToken}`;

  const messageText = formData.message || `Hi ${customerName}, thanks for visiting ${business?.name || 'our business'}! Could you take 30 seconds to leave us a quick review on Google? ${funnelUrl}`;
  const messageBody = appendComplianceFooter(messageText);

  // Send via Twilio
  const result = await sendTwilioSms(formattedTo, messageBody);

  // Create the review_invites record
  const newInvite = await db.reviewInvite.create({
    data: {
      id: inviteToken,
      token: inviteToken,
      userId: profile?.id,
      businessId: business?.id,
      customerName,
      phone: formattedTo,
      customerPhone: formattedTo,
      channel: 'sms',
      status: 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
      reviewLink: funnelUrl,
      serviceType,
    },
  });

  return {
    success: true,
    invite: newInvite,
    messageId: result.messageId,
  };
}

export async function sendEmailInviteAction(formData: {
  customerName?: string;
  recipientName?: string;
  email?: string;
  recipientEmail?: string;
  customerEmail?: string;
  serviceType?: string;
  businessName?: string;
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { success: false, error: 'Unauthorized' };
  }

  const recipientEmail = (
    formData.recipientEmail ||
    formData.email ||
    formData.customerEmail ||
    ''
  ).trim();

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'Valid customer email is required.' };
  }

  const profile = await db.profile.findFirst({
    where: { clerkUserId },
  });

  const business = await db.business.findFirst({
    where: { userId: profile?.id },
  }) || await db.businessSettings.findFirst({
    where: { userId: profile?.id },
  });

  const customerName = formData.recipientName || formData.customerName || 'Customer';
  const serviceType = formData.serviceType || 'General Service';
  const businessName = formData.businessName || business?.name || profile?.business_name || 'Our Team';
  const inviteToken = crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
  const funnelUrl = `${appUrl}/r/${inviteToken}`;

  // Persist email invite row to review_invites immediately
  const newInvite = await db.reviewInvite.create({
    data: {
      id: inviteToken,
      token: inviteToken,
      userId: profile?.id,
      businessId: business?.id,
      customerName,
      email: recipientEmail,
      customerEmail: recipientEmail,
      customerPhone: recipientEmail,
      channel: 'email',
      status: 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
      reviewLink: funnelUrl,
      businessName,
      serviceType,
    },
  });

  // Send via Resend if configured
  let resendMessageId = null;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@ratingpulse.co';
      const fromAddress = `${businessName} via RatingPulse <${fromEmail}>`;
      const greetingName = customerName ? customerName.trim() : 'there';
      const subject = `Quick note from ${businessName}`;

      const text = `Hi ${greetingName},\n\nThank you for choosing ${businessName}! If you have 30 seconds, could you please leave us a review?\n\n${funnelUrl}\n\nThank you!\n${businessName}`;
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [recipientEmail],
        subject,
        text,
      });
      if (!error && data?.id) {
        resendMessageId = data.id;
      }
    } catch (e) {
      console.warn('[sendEmailInviteAction] Resend note:', e);
    }
  }

  return {
    success: true,
    invite: newInvite,
    messageId: resendMessageId,
  };
}
