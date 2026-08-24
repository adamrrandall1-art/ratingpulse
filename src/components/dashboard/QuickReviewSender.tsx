'use client';

import React, { useState } from 'react';
import { Smartphone, Mail, Send, Sparkles, CheckCircle2, User, PhoneCall, ShieldCheck } from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import confetti from 'canvas-confetti';

export default function QuickReviewSender() {
  const { profile, settings, sendSmsInvite, sendEmailInvite } = useRatingPulseStore();
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
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

    if (channel === 'sms' && !phoneNumber.trim()) return;
    if (channel === 'email' && !emailAddress.trim()) return;

    setIsSending(true);

    if (channel === 'sms') {
      await sendSmsInvite(finalName, phoneNumber, serviceType);
    } else {
      await sendEmailInvite(finalName, emailAddress, serviceType);
    }

    setIsSending(false);
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
  };

  const previewMessage = settings.sms_template
    .replace('{{customer_name}}', customerName.trim() || 'Customer')
    .replace('{{business_name}}', profile.business_name)
    .replace('{{review_link}}', 'ratingpulse.co/rate/...');

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            {channel === 'sms' ? <Smartphone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Send Review Request
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                {channel === 'sms' ? 'Instant SMS' : 'Branded Email (Resend)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {channel === 'sms'
                ? 'Enter customer mobile number to trigger an automated 1-tap Google review SMS.'
                : 'Enter customer email address to send a high-converting branded review invite.'}
            </p>
          </div>
        </div>

        {/* Channel Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              channel === 'sms'
                ? 'bg-blue-600 text-white shadow-xs'
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
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* Interactive Form */}
      <form onSubmit={handleSend} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          
          {/* Target Input: Phone or Email */}
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {channel === 'sms' ? 'Customer Mobile Number *' : 'Customer Email Address *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {channel === 'sms' ? (
                  <PhoneCall className="w-4 h-4 text-blue-400" />
                ) : (
                  <Mail className="w-4 h-4 text-blue-400" />
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
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              ) : (
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="sm:col-span-3 flex flex-col justify-end">
            <button
              type="submit"
              disabled={isSending || (channel === 'sms' ? !phoneNumber : !emailAddress)}
              className={`w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer ${
                sentSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed'
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
                  <Send className="w-4 h-4" />
                  <span>{channel === 'sms' ? 'Send SMS Request' : 'Send Email Request'}</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Live Preview Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-300 font-mono text-[11px] truncate">
              {channel === 'sms'
                ? `SMS Preview: "${previewMessage}"`
                : `Email Subject: "How was your experience with ${profile.business_name}?"`}
            </span>
          </div>
          <span className="text-[11px] text-blue-400 font-semibold shrink-0">
            {channel === 'sms' ? 'Estimated delivery: < 3 seconds' : 'Sent securely via Resend API'}
          </span>
        </div>

      </form>

    </div>
  );
}
