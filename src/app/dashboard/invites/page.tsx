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
  Sparkles,
  Layers,
  MessageSquare
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

type ChannelType = 'sms' | 'email' | 'both';

export default function InvitesPage() {
  const { invites, sendSmsInvite, sendEmailInvite, profile } = useRatingPulseStore();
  const [channel, setChannel] = useState<ChannelType>('sms');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');

  const displayName = customerName.trim() || 'valued customer';
  const bizName = profile.business_name || 'our business';
  const reviewLink = profile.review_url || 'https://g.page/r/YOUR_LINK/review';

  // Live message content calculations
  const smsMessageText = `Hi ${displayName}, thank you for choosing ${bizName}! Would you take 30 seconds to share your experience? ${reviewLink}`;
  const smsCharCount = smsMessageText.length;
  const smsSegments = Math.max(1, Math.ceil(smsCharCount / 160));

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (channel === 'sms' && !customerPhone.trim()) {
      toast.error('Please enter a valid mobile phone number.');
      return;
    }
    if (channel === 'email' && !customerEmail.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (channel === 'both' && (!customerPhone.trim() || !customerEmail.trim())) {
      toast.error('Please provide both mobile phone and email address.');
      return;
    }

    setIsSending(true);
    try {
      const recipientName = customerName.trim() || 'Valued Customer';

      if (channel === 'sms' || channel === 'both') {
        await sendSmsInvite(recipientName, customerPhone.trim(), 'General Visit');
      }
      if (channel === 'email' || channel === 'both') {
        await sendEmailInvite(recipientName, customerEmail.trim(), 'General Visit');
      }

      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }

      const channelLabel =
        channel === 'both'
          ? `SMS & Email sent to ${customerPhone} and ${customerEmail}`
          : channel === 'sms'
          ? `1-tap SMS sent to ${customerPhone}`
          : `Email sent to ${customerEmail}`;

      toast.success('Review Request Dispatched!', {
        description: channelLabel,
      });

      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
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
      
      {/* 1. SEND REVIEW REQUEST FORM & LIVE PREVIEW CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Card Header & 3-Segment Channel Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Send Review Request
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatch automated, 1-tap Google rating links via SMS, Email, or both.
            </p>
          </div>

          {/* 3 Clear Segment Buttons: [ SMS ] [ Email ] [ Both (SMS & Email) ] */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                channel === 'sms' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                channel === 'email' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                channel === 'both' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Both (SMS & Email)</span>
            </button>
          </div>
        </div>

        {/* Two-Column Grid: Left (Inputs Form) | Right (Interactive Live Message Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form (6 cols) */}
          <form onSubmit={handleSendInvite} className="lg:col-span-6 space-y-4">
            
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans"
              />
            </div>

            {/* Mobile Phone Input (Shown for SMS or Both) */}
            {(channel === 'sms' || channel === 'both') && (
              <div className="animate-in fade-in duration-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 234-5678"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans"
                />
              </div>
            )}

            {/* Email Address Input (Shown for Email or Both) */}
            {(channel === 'email' || channel === 'both') && (
              <div className="animate-in fade-in duration-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jane.doe@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans"
                />
              </div>
            )}

            {/* Dynamic Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 fill-white" />
                    <span>
                      {channel === 'sms'
                        ? 'Send 1-Tap SMS Invite'
                        : channel === 'email'
                        ? 'Send Email Invite'
                        : 'Send SMS & Email Invites'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right: Live Interactive Message Preview Box (6 cols) */}
          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs font-mono text-slate-700 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 font-sans">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Live Message Preview
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {channel === 'both' ? 'SMS & Email' : channel.toUpperCase()}
              </span>
            </div>

            {/* Live SMS Preview */}
            {(channel === 'sms' || channel === 'both') && (
              <div className="space-y-1.5 animate-in fade-in duration-100">
                <div className="text-[11px] font-bold text-slate-500 font-sans flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  SMS Message:
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-[11px] leading-relaxed text-slate-800 shadow-2xs font-sans">
                  Hi <strong className="text-blue-600">{displayName}</strong>, thank you for choosing <strong className="text-slate-900">{bizName}</strong>! Would you take 30 seconds to share your experience? <span className="text-blue-600 underline truncate">{reviewLink.slice(0, 30)}...</span>
                </div>
                
                {/* Character & Segment Counter */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans pt-0.5">
                  <span>Smart routing filter attached</span>
                  <span className="font-semibold text-slate-600">
                    {smsSegments} SMS Segment{smsSegments > 1 ? 's' : ''} • {smsCharCount}/160 characters
                  </span>
                </div>
              </div>
            )}

            {/* Live Email Preview */}
            {(channel === 'email' || channel === 'both') && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-100">
                <div className="text-[11px] font-bold text-slate-500 font-sans flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" />
                  Email Message:
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 text-[11px] leading-relaxed text-slate-800 shadow-2xs font-sans">
                  <div className="border-b border-slate-100 pb-1.5 text-slate-500 text-[10px]">
                    <strong className="text-slate-700">Subject:</strong> How was your experience with <span className="text-slate-900 font-semibold">{bizName}</span>?
                  </div>
                  <div className="space-y-2 pt-1">
                    <p>
                      Hi <strong className="text-blue-600">{displayName}</strong>, we appreciate your business. Please let us know how we did:
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-3 py-1.5 rounded-md bg-blue-600 text-white font-bold text-[10px] shadow-2xs">
                        Leave a Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

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
