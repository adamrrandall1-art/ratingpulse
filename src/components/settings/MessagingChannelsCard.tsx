'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Mail,
  Phone,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Star,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface MessagingChannelsCardProps {
  smsTemplate: string;
  setSmsTemplate: (val: string) => void;
  // Negative Alert States
  notifyNegativeEnabled: boolean;
  setNotifyNegativeEnabled: (val: boolean) => void;
  notifyNegativeEmail: boolean;
  setNotifyNegativeEmail: (val: boolean) => void;
  notifyNegativeSms: boolean;
  setNotifyNegativeSms: (val: boolean) => void;
  negativeEmailAddress: string;
  setNegativeEmailAddress: (val: string) => void;
  negativePhone: string;
  setNegativePhone: (val: string) => void;
  // Positive Alert States
  notifyPositiveEnabled: boolean;
  setNotifyPositiveEnabled: (val: boolean) => void;
  notifyPositiveEmail: boolean;
  setNotifyPositiveEmail: (val: boolean) => void;
  notifyPositiveSms: boolean;
  setNotifyPositiveSms: (val: boolean) => void;
  positiveEmailAddress: string;
  setPositiveEmailAddress: (val: string) => void;
  // Actions
  onSendTestWelcome?: () => Promise<void>;
  sendingTestWelcome?: boolean;
}

export default function MessagingChannelsCard({
  smsTemplate,
  setSmsTemplate,
  notifyNegativeEnabled,
  setNotifyNegativeEnabled,
  notifyNegativeEmail,
  setNotifyNegativeEmail,
  notifyNegativeSms,
  setNotifyNegativeSms,
  negativeEmailAddress,
  setNegativeEmailAddress,
  negativePhone,
  setNegativePhone,
  notifyPositiveEnabled,
  setNotifyPositiveEnabled,
  notifyPositiveEmail,
  setNotifyPositiveEmail,
  notifyPositiveSms,
  setNotifyPositiveSms,
  positiveEmailAddress,
  setPositiveEmailAddress,
  onSendTestWelcome,
  sendingTestWelcome = false,
}: MessagingChannelsCardProps) {
  const insertToken = (token: string) => {
    setSmsTemplate(smsTemplate ? `${smsTemplate} ${token}` : token);
  };

  const charCount = smsTemplate.length;
  const segmentCount = Math.max(1, Math.ceil(charCount / 160));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">SMS &amp; Email Messaging Channels</h3>
            <p className="text-xs text-slate-500">
              Configure invite message templates, carrier delivery channels, and team review alert notifications.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          A2P 10DLC Verified 🟢
        </span>
      </div>

      {/* 1. Carrier & Infrastructure Status Badge */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">SMS Sender</div>
            <div className="text-[11px] text-slate-500 font-mono">+1 (888) 492-7857</div>
            <div className="text-[10px] text-emerald-600 font-semibold">Toll-Free High Throughput</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Email Dispatcher</div>
            <div className="text-[11px] text-slate-500 font-mono">Resend Verified</div>
            <div className="text-[10px] text-blue-600 font-semibold">DKIM &amp; SPF 100% Configured</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">TCPA Guard</div>
            <div className="text-[11px] text-slate-500 font-mono">8:00 AM – 9:00 PM</div>
            <div className="text-[10px] text-purple-600 font-semibold">Quiet Hours Protection Active</div>
          </div>
        </div>
      </div>

      {/* 2. SMS Invite Template Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            Default SMS Invite Template
          </label>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>{charCount} characters</span>
            <span>•</span>
            <span className={segmentCount > 1 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
              {segmentCount} SMS segment{segmentCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <textarea
          rows={3}
          value={smsTemplate}
          onChange={(e) => setSmsTemplate(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono leading-relaxed"
          placeholder="Hi {{customer_name}}, thank you for visiting {{business_name}}! Could you share your quick feedback on Google? {{review_link}}"
        />

        {/* Dynamic Insert Variables */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500">Insert Variable:</span>
          {[
            { token: '{{customer_name}}', label: 'Customer Name' },
            { token: '{{business_name}}', label: 'Business Name' },
            { token: '{{review_link}}', label: '1-Tap Review Link' },
          ].map((item) => (
            <button
              type="button"
              key={item.token}
              onClick={() => insertToken(item.token)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 font-mono font-medium transition-colors border border-slate-200 cursor-pointer"
            >
              + {item.token}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Review Alert Notification Routing */}
      <div className="space-y-4 pt-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Review Alert Notification Routing
          </h4>
          <p className="text-[11px] text-slate-500">
            Route instant alerts to your team members when new customer reviews arrive.
          </p>
        </div>

        {/* Negative Review Alerts (1-3 Stars) */}
        <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  Negative Review Alerts (1–3 Stars)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    High Priority
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Instantly notify management when a customer leaves an unhappy review or low rating.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifyNegativeEnabled}
                onChange={(e) => setNotifyNegativeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {notifyNegativeEnabled && (
            <div className="space-y-3 pt-3 border-t border-rose-100/80 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyNegativeEmail}
                    onChange={(e) => setNotifyNegativeEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Alert</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyNegativeSms}
                    onChange={(e) => setNotifyNegativeSms(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>SMS Urgent Alert</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Negative Alert Email
                  </label>
                  <input
                    type="email"
                    placeholder="manager@business.com"
                    value={negativeEmailAddress}
                    onChange={(e) => setNegativeEmailAddress(e.target.value)}
                    disabled={!notifyNegativeEmail}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Negative Alert SMS Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={negativePhone}
                    onChange={(e) => setNegativePhone(e.target.value)}
                    disabled={!notifyNegativeSms}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Positive Review Alerts (4-5 Stars) */}
        <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/20 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  Positive Review Alerts (4–5 Stars)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Standard
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Receive praise digests when customers leave glowing 4 or 5-star reviews on Google.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notifyPositiveEnabled}
                onChange={(e) => setNotifyPositiveEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {notifyPositiveEnabled && (
            <div className="space-y-3 pt-3 border-t border-amber-100/80 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyPositiveEmail}
                    onChange={(e) => setNotifyPositiveEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Digest</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyPositiveSms}
                    onChange={(e) => setNotifyPositiveSms(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>SMS Alert</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Positive Alert Email
                  </label>
                  <input
                    type="email"
                    placeholder="marketing@business.com"
                    value={positiveEmailAddress}
                    onChange={(e) => setPositiveEmailAddress(e.target.value)}
                    disabled={!notifyPositiveEmail}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding Welcome Email Test Card */}
        {onSendTestWelcome && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/60 to-indigo-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Automated Onboarding Welcome Email
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Test the 3-step quick start onboarding email sent to new users upon account registration.
              </div>
            </div>
            <button
              type="button"
              onClick={onSendTestWelcome}
              disabled={sendingTestWelcome}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {sendingTestWelcome ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Sending Test Email...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Test Welcome Email</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
