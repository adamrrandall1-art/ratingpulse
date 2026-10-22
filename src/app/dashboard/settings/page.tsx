export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { getInitialServerBusiness } from '@/lib/server-business';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const clerkAuth = await auth().catch(() => null);
  const business = await getInitialServerBusiness(clerkAuth?.userId);

  return <SettingsClient initialBusiness={business} />;
}
