'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Smartphone,
  Mail,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Moon,
  Zap,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { checkQuietHours } from '@/lib/compliance/quietHours';
import { useRatingPulseStore } from '@/lib/store';
import { generateGoogleReviewUrl } from '@/lib/google-places';

export type ChannelType = 'sms' | 'email' | 'both';

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

interface QuickSenderCardProps {
  onInviteSent?: () => void;
}

export default function QuickSenderCard({ onInviteSent }: QuickSenderCardProps) {
  const { profile, sendSmsInvite, sendEmailInvite } = useRatingPulseStore();
  const [channel, setChannel] = useState<ChannelType>('sms');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [quietHoursState, setQuietHoursState] = useState<{ isWithinAllowedWindow: boolean; currentHour: number }>({
    isWithinAllowedWindow: true,
    currentHour: 12,
  });

  useEffect(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      setQuietHoursState(checkQuietHours(userTz));
    } catch {
      setQuietHoursState(checkQuietHours('America/New_York'));
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setCustomerPhone(formatted);
  };

  const displayName = customerName.trim() || 'Valued Customer';
  const bizName = profile?.business_name || "Scoop 'n Twist";
  const reviewLink = profile?.review_url || (profile?.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : 'https://ratingpulse.co/rate');

  const noteText = serviceNote.trim() ? ` for ${serviceNote.trim()}` : '';
  const smsMessageText = `Hi ${displayName}, thank you for choosing ${bizName}${noteText}! Would you take 30 seconds to share your experience on Google? ${reviewLink}`;
  const smsCharCount = smsMessageText.length;
  const smsSegments = Math.max(1, Math.ceil(smsCharCount / 160));

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter customer full name.');
      return;
    }

    if ((channel === 'sms' || channel === 'both') && !customerPhone.trim()) {
      toast.error('Please enter a valid mobile phone number.');
      return;
    }

    if ((channel === 'email' || channel === 'both') && !customerEmail.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSending(true);
    try {
      const e164Phone = toE164(customerPhone);
      const recipientName = customerName.trim();
      const serviceType = serviceNote.trim() || 'General Visit';

      if (channel === 'sms' || channel === 'both') {
        await sendSmsInvite(recipientName, e164Phone, serviceType);
      }
      if (channel === 'email' || channel === 'both') {
        await sendEmailInvite(recipientName, customerEmail.trim(), serviceType);
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#06b6d4', '#10b981'],
        });
      } catch {
        // ignore
      }

      if (!quietHoursState.isWithinAllowedWindow) {
        toast.info('Invite Queued for Daylight Delivery', {
          description: `Off-hours quiet guard active. Message queued for ${displayName} at 8:00 AM tomorrow.`,
        });
      } else {
        const desc =
          channel === 'both'
            ? `SMS sent to ${customerPhone} and Email to ${customerEmail}`
            : channel === 'sms'
            ? `SMS invite dispatched to ${customerPhone}`
            : `Email invite sent to ${customerEmail}`;
        toast.success('Review Request Dispatched!', { description: desc });
      }

      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setServiceNote('');

      if (onInviteSent) onInviteSent();
    } catch (err: any) {
      toast.error('Failed to send invite', { description: err?.message || 'Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Header & Quiet Hours Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <span>Single Review Invite</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Send an instant review invitation to a single customer via SMS or Email.
          </p>
        </div>

        {/* Quiet Hours Warning Pill */}
        <div>
          {quietHoursState.isWithinAllowedWindow ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>⚡ Ready: Will deliver instantly</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide animate-pulse">
              <Moon className="w-3.5 h-3.5 text-amber-600" />
              <span>🌙 Off-hours: Will queue and send at 8:00 AM tomorrow</span>
            </span>
          )}
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Delivery Channel:
        </label>
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              channel === 'sms' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>SMS</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              channel === 'email' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel('both')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              channel === 'both' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Both (SMS &amp; Email)</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form Column (7 cols) */}
        <form onSubmit={handleSendInvite} className="lg:col-span-7 space-y-4">
          
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
            />
          </div>

          {/* Mobile Phone (SMS & Both) */}
          {(channel === 'sms' || channel === 'both') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder="(555) 234-5678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
              />
            </div>
          )}

          {/* Email Address (Email & Both) */}
          {(channel === 'email' || channel === 'both') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane.doe@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
              />
            </div>
          )}

          {/* Service / Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Custom Service / Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={serviceNote}
              onChange={(e) => setServiceNote(e.target.value)}
              placeholder="e.g. Table #4, Ice cream catering, Birthday party"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
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

        {/* Live Message Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Live Preview
            </span>
            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              {channel === 'both' ? 'SMS & Email' : channel.toUpperCase()}
            </span>
          </div>

          {(channel === 'sms' || channel === 'both') && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-indigo-600" />
                SMS Content:
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed shadow-2xs">
                Hi <strong className="text-indigo-600">{displayName}</strong>, thank you for choosing <strong className="text-slate-900">{bizName}</strong>{noteText}! Would you take 30 seconds to share your experience on Google? <span className="text-indigo-600 underline truncate">{reviewLink.slice(0, 26)}...</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span>10DLC Opt-out appended</span>
                <span className="font-semibold text-slate-700">
                  {smsSegments} SMS Segment{smsSegments > 1 ? 's' : ''} • {smsCharCount}/160 chars
                </span>
              </div>
            </div>
          )}

          {(channel === 'email' || channel === 'both') && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-indigo-600" />
                Email Content:
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-800 leading-relaxed shadow-2xs">
                <div className="text-[11px] text-slate-500 border-b border-slate-100 pb-1">
                  <strong className="text-slate-700">Subject:</strong> How was your experience with {bizName}?
                </div>
                <p className="text-xs pt-1">
                  Hi <strong className="text-indigo-600">{displayName}</strong>, thank you for visiting us! Please tap below to leave your rating on Google:
                </p>
                <div className="pt-1">
                  <span className="inline-block px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px]">
                    ⭐ Leave Google Review
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
