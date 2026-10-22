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

  return (
    <SettingsClient
      initialBusiness={business}
      initialNotificationSettings={serverSettings?.notificationSettings}
      initialSettings={serverSettings?.settings}
      initialProfile={serverSettings?.profile}
    />
  );
}
