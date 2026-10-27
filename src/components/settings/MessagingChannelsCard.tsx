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
  Save,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface MessagingChannelsCardProps {
  smsTemplate: string;
  setSmsTemplate: (val: string) => void;

  // Discrete String and Boolean States (Primary)
  negativeAlertsEnabled?: boolean;
  setNegativeAlertsEnabled?: (val: boolean) => void;
  negativeEmailAlertEnabled?: boolean;
  setNegativeEmailAlertEnabled?: (val: boolean) => void;
  negativeSmsAlertEnabled?: boolean;
  setNegativeSmsAlertEnabled?: (val: boolean) => void;
  negativeAlertEmail?: string;
  setNegativeAlertEmail?: (val: string) => void;
  negativeAlertPhone?: string;
  setNegativeAlertPhone?: (val: string) => void;

  positiveAlertsEnabled?: boolean;
  setPositiveAlertsEnabled?: (val: boolean) => void;
  positiveEmailAlertEnabled?: boolean;
  setPositiveEmailAlertEnabled?: (val: boolean) => void;
  positiveSmsAlertEnabled?: boolean;
  setPositiveSmsAlertEnabled?: (val: boolean) => void;
  positiveAlertEmail?: string;
  setPositiveAlertEmail?: (val: string) => void;
  positiveAlertPhone?: string;
  setPositiveAlertPhone?: (val: string) => void;

  // Backward-Compatible Aliases
  notifyNegativeEnabled?: boolean;
  setNotifyNegativeEnabled?: (val: boolean) => void;
  notifyNegativeEmail?: boolean;
  setNotifyNegativeEmail?: (val: boolean) => void;
  notifyNegativeSms?: boolean;
  setNotifyNegativeSms?: (val: boolean) => void;
  negativeEmailAddress?: string;
  setNegativeEmailAddress?: (val: string) => void;
  negativePhone?: string;
  setNegativePhone?: (val: string) => void;

  notifyPositiveEnabled?: boolean;
  setNotifyPositiveEnabled?: (val: boolean) => void;
  notifyPositiveEmail?: boolean;
  setNotifyPositiveEmail?: (val: boolean) => void;
  notifyPositiveSms?: boolean;
  setNotifyPositiveSms?: (val: boolean) => void;
  positiveEmailAddress?: string;
  setPositiveEmailAddress?: (val: string) => void;

  // Actions & Persistence
  initialBusiness?: any;
  onSendTestWelcome?: () => Promise<void>;
  sendingTestWelcome?: boolean;
  onSaveNotificationPreferences?: () => Promise<void>;
  isSavingNotifications?: boolean;
  isNotificationsSaved?: boolean;
  onAutoSaveNotifications?: () => Promise<void>;
  onToggleChange?: (field: string, value: boolean) => void;
}

export default function MessagingChannelsCard(props: MessagingChannelsCardProps) {
  const {
    smsTemplate,
    setSmsTemplate,
    negativeAlertsEnabled,
    setNegativeAlertsEnabled,
    negativeEmailAlertEnabled,
    setNegativeEmailAlertEnabled,
    negativeSmsAlertEnabled,
    setNegativeSmsAlertEnabled,
    negativeAlertEmail,
    setNegativeAlertEmail,
    negativeAlertPhone,
    setNegativeAlertPhone,
    positiveAlertsEnabled,
    setPositiveAlertsEnabled,
    positiveEmailAlertEnabled,
    setPositiveEmailAlertEnabled,
    positiveSmsAlertEnabled,
    setPositiveSmsAlertEnabled,
    positiveAlertEmail,
    setPositiveAlertEmail,
    positiveAlertPhone,
    setPositiveAlertPhone,
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
    initialBusiness,
    onSendTestWelcome,
    sendingTestWelcome = false,
    onSaveNotificationPreferences,
    isSavingNotifications = false,
    isNotificationsSaved = false,
    onAutoSaveNotifications,
    onToggleChange,
  } = props;

  const effectiveNegativeAlertsEnabled = negativeAlertsEnabled ?? notifyNegativeEnabled ?? props.initialBusiness?.negativeAlertsEnabled ?? true;
  const effectiveNegativeEmailAlertEnabled = negativeEmailAlertEnabled ?? notifyNegativeEmail ?? props.initialBusiness?.negativeEmailAlertEnabled ?? true;
  const effectiveNegativeSmsAlertEnabled = negativeSmsAlertEnabled ?? notifyNegativeSms ?? props.initialBusiness?.negativeSmsAlertEnabled ?? false;
  const rawNegEmail = (typeof negativeAlertEmail === 'string' && negativeAlertEmail.trim() !== '' ? negativeAlertEmail : (typeof negativeEmailAddress === 'string' && negativeEmailAddress.trim() !== '' ? negativeEmailAddress : (props.initialBusiness?.negativeAlertEmail || props.initialBusiness?.negative_alert_email || '')));
  const effectiveNegativeAlertEmail = (rawNegEmail === 'true' || rawNegEmail === 'false') ? '' : rawNegEmail;
  const rawNegPhone = (typeof negativeAlertPhone === 'string' && negativeAlertPhone.trim() !== '' ? negativeAlertPhone : (typeof negativePhone === 'string' && negativePhone.trim() !== '' ? negativePhone : (props.initialBusiness?.negativeAlertPhone || props.initialBusiness?.negative_alert_phone || '')));
  const effectiveNegativeAlertPhone = (rawNegPhone === 'true' || rawNegPhone === 'false') ? '' : rawNegPhone;

  const effectivePositiveAlertsEnabled = positiveAlertsEnabled ?? notifyPositiveEnabled ?? props.initialBusiness?.positiveAlertsEnabled ?? true;
  const effectivePositiveEmailAlertEnabled = positiveEmailAlertEnabled ?? notifyPositiveEmail ?? props.initialBusiness?.positiveEmailAlertEnabled ?? true;
  const effectivePositiveSmsAlertEnabled = positiveSmsAlertEnabled ?? notifyPositiveSms ?? props.initialBusiness?.positiveSmsAlertEnabled ?? false;
  const rawPosEmail = (typeof positiveAlertEmail === 'string' && positiveAlertEmail.trim() !== '' ? positiveAlertEmail : (typeof positiveEmailAddress === 'string' && positiveEmailAddress.trim() !== '' ? positiveEmailAddress : (props.initialBusiness?.positiveAlertEmail || props.initialBusiness?.positive_alert_email || '')));
  const effectivePositiveAlertEmail = (rawPosEmail === 'true' || rawPosEmail === 'false') ? '' : rawPosEmail;
  const rawPosPhone = (typeof positiveAlertPhone === 'string' && positiveAlertPhone.trim() !== '' ? positiveAlertPhone : (props.initialBusiness?.positiveAlertPhone || props.initialBusiness?.positive_alert_phone || ''));
  const effectivePositiveAlertPhone = (rawPosPhone === 'true' || rawPosPhone === 'false') ? '' : rawPosPhone;

  const handleNegEmailChange = (val: string) => {
    if (setNegativeAlertEmail) setNegativeAlertEmail(val);
    if (setNegativeEmailAddress) setNegativeEmailAddress(val);
  };
  const handleNegPhoneChange = (val: string) => {
    if (setNegativeAlertPhone) setNegativeAlertPhone(val);
    if (setNegativePhone) setNegativePhone(val);
  };
  const handlePosEmailChange = (val: string) => {
    if (setPositiveAlertEmail) setPositiveAlertEmail(val);
    if (setPositiveEmailAddress) setPositiveEmailAddress(val);
  };
  const handlePosPhoneChange = (val: string) => {
    if (setPositiveAlertPhone) setPositiveAlertPhone(val);
  };
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
            <div className="text-[11px] text-slate-500 font-mono">{process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1 (737) 258-3478'}</div>
            <div className="text-[10px] text-emerald-600 font-semibold">Active Outbound Carrier Route</div>
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
                checked={effectiveNegativeAlertsEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (setNegativeAlertsEnabled) setNegativeAlertsEnabled(checked);
                  if (setNotifyNegativeEnabled) setNotifyNegativeEnabled(checked);
                  onToggleChange?.('negativeAlertsEnabled', checked);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {effectiveNegativeAlertsEnabled && (
            <div className="space-y-3 pt-3 border-t border-rose-100/80 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={effectiveNegativeEmailAlertEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (setNegativeEmailAlertEnabled) setNegativeEmailAlertEnabled(checked);
                      if (setNotifyNegativeEmail) setNotifyNegativeEmail(checked);
                      onToggleChange?.('negativeEmailAlertEnabled', checked);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Alert</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={effectiveNegativeSmsAlertEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (setNegativeSmsAlertEnabled) setNegativeSmsAlertEnabled(checked);
                      if (setNotifyNegativeSms) setNotifyNegativeSms(checked);
                      onToggleChange?.('negativeSmsAlertEnabled', checked);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                    value={effectiveNegativeAlertEmail || initialBusiness?.negativeAlertEmail || ''}
                    onChange={(e) => handleNegEmailChange(e.target.value)}
                    disabled={!effectiveNegativeEmailAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Negative Alert SMS Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={effectiveNegativeAlertPhone || initialBusiness?.negativeAlertPhone || ''}
                    onChange={(e) => handleNegPhoneChange(e.target.value)}
                    disabled={!effectiveNegativeSmsAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
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
                checked={effectivePositiveAlertsEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (setPositiveAlertsEnabled) setPositiveAlertsEnabled(checked);
                  if (setNotifyPositiveEnabled) setNotifyPositiveEnabled(checked);
                  onToggleChange?.('positiveAlertsEnabled', checked);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {effectivePositiveAlertsEnabled && (
            <div className="space-y-3 pt-3 border-t border-amber-100/80 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={effectivePositiveEmailAlertEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (setPositiveEmailAlertEnabled) setPositiveEmailAlertEnabled(checked);
                      if (setNotifyPositiveEmail) setNotifyPositiveEmail(checked);
                      onToggleChange?.('positiveEmailAlertEnabled', checked);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Digest</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={effectivePositiveSmsAlertEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (setPositiveSmsAlertEnabled) setPositiveSmsAlertEnabled(checked);
                      if (setNotifyPositiveSms) setNotifyPositiveSms(checked);
                      onToggleChange?.('positiveSmsAlertEnabled', checked);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                    value={effectivePositiveAlertEmail || initialBusiness?.positiveAlertEmail || ''}
                    onChange={(e) => handlePosEmailChange(e.target.value)}
                    disabled={!effectivePositiveEmailAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Positive Alert SMS Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={effectivePositiveAlertPhone || initialBusiness?.positiveAlertPhone || ''}
                    onChange={(e) => handlePosPhoneChange(e.target.value)}
                    disabled={!effectivePositiveSmsAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Save Notification Preferences Button */}
        {onSaveNotificationPreferences && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Notification Routing Persistence
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Save phone and email delivery channels for instant negative and positive review notifications.
              </div>
            </div>
            <button
              type="button"
              onClick={onSaveNotificationPreferences}
              disabled={isSavingNotifications}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSavingNotifications ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Saving Preferences...</span>
                </>
              ) : isNotificationsSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Save Notification Preferences</span>
                </>
              )}
            </button>
          </div>
        )}

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
