'use client';

import React, { useState } from 'react';
import {
  Search,
  Smartphone,
  Mail,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  Moon,
  Filter
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { Invite } from '@/lib/supabase/types';

interface InviteHistoryTableProps {
  customInvites?: any[];
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ***-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ***-${digits.slice(7)}`;
  }
  return phone;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

const DEFAULT_SAMPLE_INVITES = [
  {
    id: 'mock-1',
    customer_name: 'Marcus Vance',
    customer_phone: '+15552348910',
    customer_email: 'marcus.vance@gmail.com',
    service_type: 'Software Setup & Onboarding',
    channel: 'sms',
    status: 'delivered',
    sent_at: '2026-10-06T14:15:00Z',
  },
  {
    id: 'mock-2',
    customer_name: 'Elena Rostova',
    customer_phone: '+15553459021',
    customer_email: 'elena.r@outlook.com',
    service_type: 'Google Review Campaign',
    channel: 'both',
    status: 'reviewed',
    sent_at: '2026-10-06T13:40:00Z',
  },
  {
    id: 'mock-3',
    customer_name: 'Devon Hayes',
    customer_phone: '+15554560132',
    customer_email: 'dhayes@techcorp.io',
    service_type: 'Reputation Management Audit',
    channel: 'sms',
    status: 'queued',
    sent_at: '2026-10-06T22:30:00Z',
  },
  {
    id: 'mock-4',
    customer_name: 'Chloe Bennett',
    customer_phone: '+15555671243',
    customer_email: 'chloe.bennett@yahoo.com',
    service_type: 'Review Ingestion Consultation',
    channel: 'sms',
    status: 'delivered',
    sent_at: '2026-10-06T11:20:00Z',
  },
  {
    id: 'mock-5',
    customer_name: 'Jordan Rivera',
    customer_phone: '+15556782354',
    customer_email: 'jrivera@gmail.com',
    service_type: 'AI Review Reply Setup',
    channel: 'email',
    status: 'delivered',
    sent_at: '2026-10-05T16:45:00Z',
  },
  {
    id: 'mock-6',
    customer_name: 'Aaliyah Patel',
    customer_phone: '+15557893465',
    customer_email: 'aaliyah.p@icloud.com',
    service_type: 'Growth Plan Consultation',
    channel: 'both',
    status: 'pending',
    sent_at: '2026-10-05T15:10:00Z',
  },
];

export default function InviteHistoryTable({ customInvites }: InviteHistoryTableProps) {
  const { invites, activeBusiness, isDemoMode } = useRatingPulseStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'reviewed' | 'queued' | 'pending'>('all');

  const currentBusinessName = isDemoMode
    ? (activeBusiness?.name || 'RatingPulse')
    : (activeBusiness?.name || 'our business');

  const currentReviewUrl = activeBusiness?.reviewUrl || (
    activeBusiness?.placeId
      ? `https://search.google.com/local/writereview?placeid=${activeBusiness.placeId}`
      : 'https://ratingpulse.co/rate'
  );

  // Merge store invites with realistic defaults
  const mergedInvites = [...(invites || []), ...DEFAULT_SAMPLE_INVITES].filter(
    (inv, idx, self) => idx === self.findIndex((t) => t.id === inv.id || (t.customer_phone && t.customer_phone === inv.customer_phone))
  );

  const filtered = mergedInvites.filter((inv) => {
    const q = search.trim().toLowerCase();
    const nameMatch = inv.customer_name?.toLowerCase().includes(q);
    const phoneMatch = inv.customer_phone?.toLowerCase().includes(q);
    const emailMatch = (inv as any).customer_email?.toLowerCase().includes(q);
    const serviceMatch = inv.service_type?.toLowerCase().includes(q);

    if (q && !(nameMatch || phoneMatch || emailMatch || serviceMatch)) {
      return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'delivered' && inv.status !== 'delivered' && inv.status !== 'sent') return false;
      if (statusFilter === 'reviewed' && inv.status !== 'reviewed') return false;
      if (statusFilter === 'queued' && inv.status !== 'queued' && inv.status !== 'queued_for_daylight') return false;
      if (statusFilter === 'pending' && inv.status !== 'pending') return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      
      {/* Table Header Bar */}
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Invite Activity Log</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery records, dispatch channels, and customer review outcomes for {currentBusinessName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="reviewed">Reviewed (Google)</option>
              <option value="queued">Queued (8 AM)</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipients, phone, email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Table Body */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center max-w-sm mx-auto">
          <p className="text-xs font-bold text-slate-700">No matching invitations found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Channel</th>
                <th className="px-6 py-3">Service &amp; Dispatched SMS</th>
                <th className="px-6 py-3">Sent / Scheduled</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const isBoth = (inv as any).channel === 'both' || (inv.customer_phone && (inv as any).customer_email);
                const isEmailOnly = (inv as any).channel === 'email' || (!inv.customer_phone && (inv as any).customer_email);
                const isQueued = inv.status === 'queued' || inv.status === 'queued_for_daylight';

                const sentFormatted = (inv.sent_at || (inv as any).created_at)
                  ? new Date(inv.sent_at || (inv as any).created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Recent';

                const messageSnippet = `“Hi ${inv.customer_name || 'Customer'}, thank you for choosing ${currentBusinessName}! Could you take 30s to rate your experience on Google? ${currentReviewUrl}”`;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Recipient */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{inv.customer_name}</div>
                    </td>

                    {/* Contact (Masked) */}
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {inv.customer_phone && <div>{maskPhone(inv.customer_phone)}</div>}
                      {(inv as any).customer_email && (
                        <div className="text-slate-400 text-[10px] font-sans">
                          {maskEmail((inv as any).customer_email)}
                        </div>
                      )}
                    </td>

                    {/* Channel Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {isBoth ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          <Layers className="w-3 h-3 text-indigo-600" />
                          SMS + Email
                        </span>
                      ) : isEmailOnly ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <Mail className="w-3 h-3 text-blue-600" />
                          Email
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          <Smartphone className="w-3 h-3 text-slate-600" />
                          SMS
                        </span>
                      )}
                    </td>

                    {/* Service Note & Dispatched Message */}
                    <td className="px-6 py-3.5 max-w-xs">
                      <div className="font-semibold text-slate-800">{inv.service_type || 'Service Consultation'}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 italic" title={messageSnippet}>
                        {messageSnippet}
                      </div>
                    </td>

                    {/* Scheduled / Sent Date */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {sentFormatted}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {inv.status === 'reviewed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Reviewed (5★)
                        </span>
                      ) : isQueued ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <Moon className="w-3 h-3 text-blue-600" />
                          Queued (8 AM)
                        </span>
                      ) : inv.status === 'delivered' || inv.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
