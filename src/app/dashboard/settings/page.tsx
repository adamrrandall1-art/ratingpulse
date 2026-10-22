export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { getInitialServerBusiness, getInitialServerSettings } from '@/lib/server-business';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;
  const business = await getInitialServerBusiness(userId);
  const serverSettings = await getInitialServerSettings(userId);

  const bAny = business as any;
  // Read negativeAlertEmail and negativeAlertPhone directly from the business record and inject into form state
  const negativeAlertEmail =
    (typeof bAny?.negativeAlertEmail === 'string' && bAny.negativeAlertEmail) ||
    (typeof bAny?.negative_alert_email === 'string' && bAny.negative_alert_email) ||
    serverSettings?.notificationSettings?.negativeAlertEmail ||
    '';

  const negativeAlertPhone =
    (typeof bAny?.negativeAlertPhone === 'string' && bAny.negativeAlertPhone) ||
    (typeof bAny?.negative_alert_phone === 'string' && bAny.negative_alert_phone) ||
    serverSettings?.notificationSettings?.negativeAlertPhone ||
    '';

  const positiveAlertEmail =
    (typeof bAny?.positiveAlertEmail === 'string' && bAny.positiveAlertEmail) ||
    (typeof bAny?.positive_alert_email === 'string' && bAny.positive_alert_email) ||
    serverSettings?.notificationSettings?.positiveAlertEmail ||
    '';

  const positiveAlertPhone =
    (typeof bAny?.positiveAlertPhone === 'string' && bAny.positiveAlertPhone) ||
    (typeof bAny?.positive_alert_phone === 'string' && bAny.positive_alert_phone) ||
    serverSettings?.notificationSettings?.positiveAlertPhone ||
    '';

  const notificationSettings = {
    ...(serverSettings?.notificationSettings || {}),
    negativeAlertEmail,
    negativeAlertPhone,
    positiveAlertEmail,
    positiveAlertPhone,
    negativeAlertsEnabled: business?.negativeAlertsEnabled ?? serverSettings?.notificationSettings?.negativeAlertsEnabled ?? true,
    negativeEmailAlertEnabled: business?.negativeEmailAlertEnabled ?? serverSettings?.notificationSettings?.negativeEmailAlertEnabled ?? true,
    negativeSmsAlertEnabled: business?.negativeSmsAlertEnabled ?? serverSettings?.notificationSettings?.negativeSmsAlertEnabled ?? false,
    positiveAlertsEnabled: business?.positiveAlertsEnabled ?? serverSettings?.notificationSettings?.positiveAlertsEnabled ?? true,
    positiveEmailAlertEnabled: business?.positiveEmailAlertEnabled ?? serverSettings?.notificationSettings?.positiveEmailAlertEnabled ?? true,
    positiveSmsAlertEnabled: business?.positiveSmsAlertEnabled ?? serverSettings?.notificationSettings?.positiveSmsAlertEnabled ?? false,
  };

  return (
    <SettingsClient
      initialBusiness={business}
      initialNotificationSettings={notificationSettings}
      initialSettings={serverSettings?.settings}
      initialProfile={serverSettings?.profile}
    />
  );
}
