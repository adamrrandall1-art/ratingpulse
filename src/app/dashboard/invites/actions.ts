'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sendTwilioSms, formatE164, appendComplianceFooter } from '@/lib/twilio';

export async function sendInviteAction(formData: {
  customerName?: string;
  recipientName?: string;
  phone?: string;
  recipientPhone?: string;
  customerPhone?: string;
  serviceType?: string;
  message?: string;
}) {
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
