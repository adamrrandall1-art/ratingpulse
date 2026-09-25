'use client';

import React, { useState } from 'react';
import {
  Send,
  Smartphone,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function InvitesPage() {
  const { invites, sendSmsInvite, sendEmailInvite, profile } = useRatingPulseStore();
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [customerName, setCustomerName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientContact.trim()) return;

    setIsSending(true);
    try {
      if (channel === 'sms') {
        await sendSmsInvite(customerName || 'Valued Customer', recipientContact, 'General Visit');
      } else {
        await sendEmailInvite(customerName || 'Valued Customer', recipientContact, 'General Visit');
      }

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }

      toast.success('Review Request Dispatched!', {
        description: `1-tap review link sent to ${recipientContact}`,
      });

      setCustomerName('');
      setRecipientContact('');
    } catch (err: any) {
      toast.error('Failed to send invite', { description: err?.message || 'Please try again' });
    } finally {
      setIsSending(false);
    }
  };

  const filteredInvites = invites.filter((inv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.customer_name.toLowerCase().includes(q) ||
      inv.customer_phone.toLowerCase().includes(q) ||
      (inv as any).customer_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      
      {/* 1. SEND REVIEW REQUEST FORM CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Send Review Request
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatch an automated, 1-tap Google rating link directly to your customer.
            </p>
          </div>

          {/* Channel Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                channel === 'sms' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS Text</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                channel === 'email' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSendInvite} className="mt-5 space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {channel === 'sms' ? 'Mobile Phone Number' : 'Email Address'} <span className="text-rose-500">*</span>
              </label>
              <input
                type={channel === 'sms' ? 'tel' : 'email'}
                required
                value={recipientContact}
                onChange={(e) => setRecipientContact(e.target.value)}
                placeholder={channel === 'sms' ? '(555) 234-5678' : 'jane@example.com'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Includes automated 1-3★ smart filter protection & direct 5★ Google routing.
            </span>
            <button
              type="submit"
              disabled={isSending || !recipientContact.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 fill-white" />
                  <span>Send 1-Tap Invite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. RECENT INVITES LOG TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Invites Log</h3>
            <p className="text-xs text-slate-500">History of outbound customer review invitations</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipients..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Table Content */}
        {filteredInvites.length === 0 ? (
          <div className="px-6 py-16 text-center max-w-sm mx-auto">
            <p className="text-sm font-medium text-slate-600">No invitations sent yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the form above to send your first review request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase px-6 py-3 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Recipient</th>
                  <th scope="col" className="px-6 py-3">Sent Date</th>
                  <th scope="col" className="px-6 py-3">Channel</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvites.map((inv) => {
                  const sentDate = (inv.sent_at || (inv as any).created_at)
                    ? new Date(inv.sent_at || (inv as any).created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Recipient */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{inv.customer_phone}</div>
                      </td>

                      {/* Sent Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {sentDate}
                      </td>

                      {/* Channel */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          SMS
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inv.status === 'reviewed' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Reviewed
                          </span>
                        ) : inv.status === 'opened' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                            Clicked
                          </span>
                        ) : inv.status === 'delivered' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
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

    </div>
  );
}
