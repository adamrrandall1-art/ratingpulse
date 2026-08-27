import React from 'react';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export const metadata = {
  title: 'RatingPulse.co Dashboard | Review Automation & AI Replies',
  description: 'Manage 5-star Google review invites, review approvals, AI reply generation and settings.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
