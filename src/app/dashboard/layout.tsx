export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getInitialServerBusiness } from '@/lib/server-business';
import DashboardClientLayout from '@/components/dashboard/DashboardClientLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkAuth = await auth().catch(() => null);
  const clerkUserId = clerkAuth?.userId;

  let business = null;

  if (clerkUserId) {
    const businesses = await db.business.findMany({
      where: {
        OR: [
          { clerkUserId: clerkUserId },
          { userId: clerkUserId },
          { id: clerkUserId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    const activeBusiness = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail) || businesses[0];

    if (activeBusiness) {
      business = activeBusiness;
    } else {
      // Check active business cookie fallback before creating
      const cookieStore = await cookies().catch(() => null);
      const activeId =
        cookieStore?.get('activeBusinessId')?.value ||
        cookieStore?.get('rp_active_business_id')?.value;
      if (activeId) {
        const cookieBiz = await db.business.findFirst({
          where: { id: activeId },
          orderBy: { updatedAt: 'desc' },
        });
        if (cookieBiz) {
          business = cookieBiz;
        }
      }

      if (!business) {
        // Only create if NO record exists at all for a brand new user
        business = await db.business.create({
          data: {
            id: clerkUserId,
            userId: clerkUserId,
            clerkUserId: clerkUserId,
            name: 'RatingPulse Business',
            isGoogleConnected: true,
          },
        });
      }
    }
  }

  if (!business && clerkUserId) {
    business = await getInitialServerBusiness(clerkUserId);
  }

  console.log("[DASHBOARD_LOAD] Loaded business for user:", business?.id, business?.name);

  return (
    <DashboardClientLayout initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null}>
      {children}
    </DashboardClientLayout>
  );
}
