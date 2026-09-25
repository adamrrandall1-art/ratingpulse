'use client';

import React, { useState } from 'react';
import { Smartphone, Mail, Send, Sparkles, CheckCircle2, User, PhoneCall, Layers } from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function QuickReviewSender() {
  const { profile, settings, sendSmsInvite, sendEmailInvite } = useRatingPulseStore();
  const [channel, setChannel] = useState<'sms' | 'email' | 'both'>('sms');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [serviceType, setServiceType] = useState('Dental Cleaning');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Phone number auto-formatter: (XXX) XXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;

    if (raw.length > 0) {
      if (raw.length <= 3) {
        formatted = `(${raw}`;
      } else if (raw.length <= 6) {
        formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
      } else {
        formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6, 10)}`;
      }
    }
    setPhoneNumber(formatted);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerName.trim() || 'Valued Customer';

    if (channel === 'sms' && !phoneNumber.trim()) {
      toast.error('Please enter a mobile phone number');
      return;
    }
    if (channel === 'email' && !emailAddress.trim()) {
      toast.error('Please enter a valid customer email address');
      return;
    }
    if (channel === 'both') {
      if (!phoneNumber.trim()) {
        toast.error('Please enter a mobile phone number for SMS delivery');
        return;
      }
      if (!emailAddress.trim()) {
        toast.error('Please enter an email address for Email delivery');
        return;
      }
    }

    setIsSending(true);

    try {
      if (channel === 'sms') {
        await sendSmsInvite(finalName, phoneNumber, serviceType);
        toast.success('Review invite sent successfully via SMS!', {
          description: `Delivered to ${phoneNumber}`,
        });
      } else if (channel === 'email') {
        await sendEmailInvite(finalName, emailAddress, serviceType);
        toast.success('Review invite sent successfully to email!', {
          description: `Delivered to ${emailAddress}`,
        });
      } else {
        // Mode 'both': send concurrently
        await Promise.allSettled([
          sendSmsInvite(finalName, phoneNumber, serviceType),
          sendEmailInvite(finalName, emailAddress, serviceType),
        ]);
        toast.success('Invites successfully dispatched via SMS and Email!', {
          description: `Delivered to ${phoneNumber} and ${emailAddress}`,
        });
      }

      setSentSuccess(true);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24']
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        setSentSuccess(false);
        setCustomerName('');
        setPhoneNumber('');
        setEmailAddress('');
      }, 2800);
    } catch (err: any) {
      toast.error('Failed to send invite', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const rawPreview = (settings.sms_template || 'Hi {{customer_name}}, thanks for visiting {{business_name}}! Could you take 30s to rate your experience on Google? {{review_link}}')
    .replace('{{customer_name}}', customerName.trim() || 'Customer')
    .replace('{{business_name}}', profile.business_name)
    .replace('{{review_link}}', 'ratingpulse.co/rate/...');

  const previewMessage = /stop|unsubscribe/i.test(rawPreview)
    ? rawPreview
    : `${rawPreview}\n\nReply STOP to unsubscribe.`;

  return (
    <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            {channel === 'sms' ? (
              <Smartphone className="w-5 h-5" />
            ) : channel === 'email' ? (
              <Mail className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Send Review Request
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {channel === 'sms'
                  ? 'Instant SMS'
                  : channel === 'email'
                  ? 'Branded Email'
                  : 'SMS + Email Multi-Channel'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {channel === 'sms'
                ? 'Enter customer mobile number to trigger an automated 1-tap Google review SMS.'
                : channel === 'email'
                ? 'Enter customer email address to send a high-converting branded review invite.'
                : 'Deliver through both SMS and Email simultaneously for maximum customer conversion.'}
            </p>
          </div>
        </div>

        {/* 3-Way Channel Switcher Pills: [ SMS | Email | Both ] */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              channel === 'sms'
                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              channel === 'email'
                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('both')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              channel === 'both'
                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Both</span>
          </button>
        </div>
      </div>

      {/* Interactive Form */}
      <form onSubmit={handleSend} className="mt-5 space-y-4">
        {channel === 'both' ? (
          /* Multi-Channel 'Both' Grid Layout */
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Customer Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <PhoneCall className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 000-0000"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Customer Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Name (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Jessica Parker"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Button for Both */}
            <button
              type="submit"
              disabled={isSending || !phoneNumber || !emailAddress}
              className={`w-full py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98 cursor-pointer ${
                sentSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Multi-Channel Invites...</span>
                </>
              ) : sentSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>SMS & Email Invites Sent!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-white" />
                  <span>Send SMS & Email Invite</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Single Channel (SMS or Email) Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Target Input: Phone or Email */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {channel === 'sms' ? 'Customer Mobile Number *' : 'Customer Email Address *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {channel === 'sms' ? (
                    <PhoneCall className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                {channel === 'sms' ? (
                  <input
                    type="tel"
                    required
                    placeholder="(555) 000-0000"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                ) : (
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                )}
              </div>
            </div>

            {/* Customer Name */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Jessica Parker"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="sm:col-span-3 flex flex-col justify-end">
              <button
                type="submit"
                disabled={isSending || (channel === 'sms' ? !phoneNumber : !emailAddress)}
                className={`w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98 cursor-pointer ${
                  sentSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : sentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{channel === 'sms' ? 'SMS Sent!' : 'Email Sent!'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-white" />
                    <span>{channel === 'sms' ? 'Send SMS Request' : 'Send Email Invite'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Preview Strip */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-700 font-mono text-[11px] truncate">
              {channel === 'sms'
                ? `SMS Preview: "${previewMessage}"`
                : channel === 'email'
                ? `Email Subject: "Quick note from ${profile.business_name || 'Our Team'}"`
                : `SMS: "${previewMessage.slice(0, 45)}..." • Email: "Quick note from ${profile.business_name || 'Our Team'}"`}
            </span>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold shrink-0">
            {channel === 'sms'
              ? 'Estimated delivery: < 3 seconds'
              : channel === 'email'
              ? 'Sent securely via Resend API'
              : 'Dispatched via Twilio SMS & Resend API'}
          </span>
        </div>

      </form>

    </div>
  );
}
