'use client';

import React, { useState } from 'react';
import {
  Send,
  Smartphone,
  Star,
  CheckCircle2,
  Clock,
  Search,
  RotateCw,
  TrendingUp,
  Flame,
  Check
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import SendInviteModal from '@/components/dashboard/SendInviteModal';
import QuickReviewSender from '@/components/dashboard/QuickReviewSender';

export default function InvitesPage() {
  const { invites, sendSmsInvite, searchQuery } = useRatingPulseStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  const activeQuery = (search || searchQuery || '').trim().toLowerCase();

  const filteredInvites = invites.filter((inv) => {
    if (!activeQuery) return true;
    return (
      inv.customer_name.toLowerCase().includes(activeQuery) ||
      inv.customer_phone.toLowerCase().includes(activeQuery) ||
      inv.service_type.toLowerCase().includes(activeQuery)
    );
  });

  const handleResend = (id: string, name: string, phone: string, service: string) => {
    setResendingId(id);
    setTimeout(() => {
      sendSmsInvite(name, phone, service);
      setResendingId(null);
    }, 800);
  };

  const reviewedCount = invites.filter((i) => i.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" />
            Instant SMS Invites & Delivery Stream
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate post-appointment review links via high-converting SMS.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all transform active:scale-95 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Send New SMS Invite
        </button>
      </div>

      {/* Interactive Phone Number Box & Send Review Request Card */}
      <QuickReviewSender />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Total Invites Dispatched
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{invites.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unlimited with $25/mo plan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Delivery Rate
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">99.2%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tier 1 SMS Carriers</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Click-to-Review Rate
          </div>
          <div className="text-2xl font-extrabold text-blue-600">68.4%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zero login barrier</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Reviews Generated
          </div>
          <div className="text-2xl font-extrabold text-amber-500 flex items-center gap-1.5">
            {reviewedCount}
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">100% 5-Star Reviews</div>
        </div>
      </div>

      {/* Invites Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Table Search Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredInvites.length} invites
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Sent Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-800">No SMS Invites Found</div>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Use the phone number sender above to send your first SMS invite, or turn on Demo Mode in the header.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {inv.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {inv.customer_phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.service_type}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'reviewed' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          5★ Google Review Left
                        </span>
                      )}
                      {inv.status === 'opened' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Link Opened
                        </span>
                      )}
                      {inv.status === 'delivered' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          <Check className="w-3 h-3 text-slate-500" /> Delivered
                        </span>
                      )}
                      {inv.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          <Clock className="w-3 h-3" /> Sending...
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]" suppressHydrationWarning>
                      {new Date(inv.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleResend(inv.id, inv.customer_name, inv.customer_phone, inv.service_type)}
                        disabled={resendingId === inv.id}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
                      >
                        {resendingId === inv.id ? 'Resending...' : 'Resend SMS'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      <SendInviteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
}
