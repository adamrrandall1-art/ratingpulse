export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { getInitialServerBusiness } from '@/lib/server-business';
import DashboardClientLayout from '@/components/dashboard/DashboardClientLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkAuth = await auth().catch(() => null);
  const business = await getInitialServerBusiness(clerkAuth?.userId);
  console.log("[DASHBOARD_LOAD] Loaded business for user:", business);

  return (
    <DashboardClientLayout initialBusiness={business}>
      {children}
    </DashboardClientLayout>
  );
}
