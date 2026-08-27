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

  const previewMessage = settings.sms_template
    .replace('{{customer_name}}', customerName.trim() || 'Customer')
    .replace('{{business_name}}', profile.business_name)
    .replace('{{review_link}}', 'ratingpulse.co/rate/...');

  return (
    <div className="bg-gradient-to-br from-[#111820] via-[#161f26] to-[#111820] text-white rounded-3xl p-6 sm:p-7 border border-[#00d2c4]/25 shadow-2xl relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00d2c4]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#18222a] border border-[#00d2c4]/40 flex items-center justify-center text-[#00d2c4] shadow-md shadow-[#00d2c4]/10">
            {channel === 'sms' ? (
              <Smartphone className="w-5 h-5" />
            ) : channel === 'email' ? (
              <Mail className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Send Review Request
              <span className="text-[10px] font-extrabold text-[#00e676] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded-full">
                {channel === 'sms'
                  ? 'Instant SMS'
                  : channel === 'email'
                  ? 'Branded Email'
                  : 'SMS + Email Multi-Channel'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {channel === 'sms'
                ? 'Enter customer mobile number to trigger an automated 1-tap Google review SMS.'
                : channel === 'email'
                ? 'Enter customer email address to send a high-converting branded review invite.'
                : 'Deliver through both SMS and Email simultaneously for maximum customer conversion.'}
            </p>
          </div>
        </div>

        {/* 3-Way Channel Switcher Pills: [ SMS | Email | Both ] */}
        <div className="flex items-center gap-1 p-1 bg-[#18222a] rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              channel === 'sms'
                ? 'bg-gradient-to-r from-[#00d2c4] to-[#10b981] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              channel === 'email'
                ? 'bg-gradient-to-r from-[#00d2c4] to-[#10b981] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('both')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              channel === 'both'
                ? 'bg-gradient-to-r from-[#00d2c4] to-[#10b981] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white'
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
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Customer Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <PhoneCall className="w-4 h-4 text-[#00d2c4]" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 000-0000"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#18222a] border border-[#00d2c4]/20 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00d2c4] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Customer Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Customer Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-[#00d2c4]" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#18222a] border border-[#00d2c4]/20 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00d2c4] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#18222a] border border-[#00d2c4]/20 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00d2c4] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Button for Both */}
            <button
              type="submit"
              disabled={isSending || !phoneNumber || !emailAddress}
              className={`w-full py-3 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer ${
                sentSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] hover:brightness-110 text-slate-950 shadow-[0_0_20px_rgba(0,210,196,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Dispatching Multi-Channel Invites...</span>
                </>
              ) : sentSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>SMS & Email Invites Sent!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-slate-950" />
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
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {channel === 'sms' ? 'Customer Mobile Number *' : 'Customer Email Address *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {channel === 'sms' ? (
                    <PhoneCall className="w-4 h-4 text-[#00d2c4]" />
                  ) : (
                    <Mail className="w-4 h-4 text-[#00d2c4]" />
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
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#18222a] border border-[#00d2c4]/20 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00d2c4] focus:border-transparent transition-all"
                  />
                ) : (
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#18222a] border border-[#00d2c4]/20 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00d2c4] focus:border-transparent transition-all"
                  />
                )}
              </div>
            </div>

            {/* Customer Name */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">
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
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#18222a] border border-[#00d2c4]/20 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00d2c4] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="sm:col-span-3 flex flex-col justify-end">
              <button
                type="submit"
                disabled={isSending || (channel === 'sms' ? !phoneNumber : !emailAddress)}
                className={`w-full py-3 px-5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer ${
                  sentSuccess
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] hover:brightness-110 text-slate-950 shadow-[0_0_20px_rgba(0,210,196,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : sentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{channel === 'sms' ? 'SMS Sent!' : 'Email Sent!'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-slate-950" />
                    <span>{channel === 'sms' ? 'Send SMS Request' : 'Send Email Invite'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Preview Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-300 font-mono text-[11px] truncate">
              {channel === 'sms'
                ? `SMS Preview: "${previewMessage}"`
                : channel === 'email'
                ? `Email Subject: "How was your experience with ${profile.business_name}?"`
                : `SMS: "${previewMessage.slice(0, 45)}..." • Email: "How was your experience with ${profile.business_name}?"`}
            </span>
          </div>
          <span className="text-[11px] text-blue-400 font-semibold shrink-0">
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
