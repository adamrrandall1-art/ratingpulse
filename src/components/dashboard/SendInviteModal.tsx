'use client';

import React, { useState } from 'react';
import { X, Send, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendInviteModal({ isOpen, onClose }: Props) {
  const { profile, settings, sendSmsInvite } = useRatingPulseStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState('Teeth Whitening');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    setIsSending(true);
    await sendSmsInvite(customerName, customerPhone, serviceType);
    setIsSending(false);
    setSuccess(true);

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#2563eb', '#10b981']
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSuccess(false);
      setCustomerName('');
      setCustomerPhone('');
      onClose();
    }, 1500);
  };

  const rawPreview = (settings.sms_template || 'Hi {{customer_name}}, thanks for visiting {{business_name}}! Could you take 30s to rate your experience on Google? {{review_link}}')
    .replace('{{customer_name}}', customerName || 'Sarah')
    .replace('{{business_name}}', profile.business_name)
    .replace('{{review_link}}', 'g.page/r/apex-review');

  const previewMessage = /stop|unsubscribe/i.test(rawPreview)
    ? rawPreview
    : `${rawPreview}\n\nReply STOP to unsubscribe.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Send Instant SMS Invite</h3>
              <p className="text-xs text-slate-500">Delivers high-converting 1-tap review link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">SMS Invite Dispatched!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Sent to {customerPhone}. Track delivery live in your invite activity stream.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jessica Parker"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service / Treatment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dental Cleaning"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-1.5 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span>SMS MESSAGE PREVIEW</span>
                <span className="text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-Personalized
                </span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-mono">
                {previewMessage}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Sending...' : 'Send SMS Invite'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
