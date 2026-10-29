'use client';

import React, { useState, useEffect } from 'react';
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
  business?: any;
  smsTemplate?: string;
  setSmsTemplate?: (val: string) => void;

  // Discrete String and Boolean States (Primary)
  negativeAlertsEnabled?: boolean;
  setNegativeAlertsEnabled?: (val: boolean) => void;
  negativeEmailAlertEnabled?: boolean;
  setNegativeEmailAlertEnabled?: (val: boolean) => void;
  negativeSmsAlertEnabled?: boolean;
  setNegativeSmsAlertEnabled?: (val: boolean) => void;
  negativeAlertSmsEnabled?: boolean;
  setNegativeAlertSmsEnabled?: (val: boolean) => void;
  smsAlertsEnabled?: boolean;
  setSmsAlertsEnabled?: (val: boolean) => void;
  settingsState?: any;
  setSettingsState?: React.Dispatch<React.SetStateAction<any>>;
  negativeAlertEmailEnabled?: boolean;
  setNegativeAlertEmailEnabled?: (val: boolean) => void;
  positiveAlertSmsEnabled?: boolean;
  setPositiveAlertSmsEnabled?: (val: boolean) => void;
  positiveAlertEmailEnabled?: boolean;
  setPositiveAlertEmailEnabled?: (val: boolean) => void;
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
    smsTemplate = '',
    setSmsTemplate,
    negativeAlertsEnabled,
    setNegativeAlertsEnabled,
    negativeEmailAlertEnabled,
    setNegativeEmailAlertEnabled,
    negativeSmsAlertEnabled,
    setNegativeSmsAlertEnabled,
    positiveAlertsEnabled,
    setPositiveAlertsEnabled,
    positiveEmailAlertEnabled,
    setPositiveEmailAlertEnabled,
    positiveSmsAlertEnabled,
    setPositiveSmsAlertEnabled,
    notifyNegativeEnabled,
    setNotifyNegativeEnabled,
    notifyNegativeEmail,
    setNotifyNegativeEmail,
    notifyNegativeSms,
    setNotifyNegativeSms,
    notifyPositiveEnabled,
    setNotifyPositiveEnabled,
    notifyPositiveEmail,
    setNotifyPositiveEmail,
    notifyPositiveSms,
    setNotifyPositiveSms,
    initialBusiness,
    business,
    onSendTestWelcome,
    sendingTestWelcome = false,
    onSaveNotificationPreferences,
    isSavingNotifications = false,
    isNotificationsSaved = false,
    onAutoSaveNotifications,
    onToggleChange,
  } = props;

  const initialBiz = initialBusiness || business || props.initialBusiness || props.business;

  // Initialize input state directly from initialBusiness
  const [negativeAlertEmail, setNegativeAlertEmail] = useState(
    initialBiz?.negativeAlertEmail ||
    initialBiz?.negative_alert_email ||
    props.negativeAlertEmail ||
    props.negativeEmailAddress ||
    ''
  );
  const [negativeAlertPhone, setNegativeAlertPhone] = useState(
    initialBiz?.negativeAlertPhone ||
    initialBiz?.negative_alert_phone ||
    props.negativeAlertPhone ||
    props.negativePhone ||
    ''
  );
  const [positiveAlertEmail, setPositiveAlertEmail] = useState(
    initialBiz?.positiveAlertEmail ||
    initialBiz?.positive_alert_email ||
    props.positiveAlertEmail ||
    props.positiveEmailAddress ||
    ''
  );
  const [positiveAlertPhone, setPositiveAlertPhone] = useState(
    initialBiz?.positiveAlertPhone ||
    initialBiz?.positive_alert_phone ||
    props.positiveAlertPhone ||
    ''
  );

  // Sync state if initialBusiness changes
  useEffect(() => {
    const biz = initialBusiness || business || props.initialBusiness || props.business;
    if (biz) {
      if (biz.negativeAlertEmail) {
        setNegativeAlertEmail(biz.negativeAlertEmail);
        props.setNegativeAlertEmail?.(biz.negativeAlertEmail);
        props.setNegativeEmailAddress?.(biz.negativeAlertEmail);
      }
      if (biz.negativeAlertPhone) {
        setNegativeAlertPhone(biz.negativeAlertPhone);
        props.setNegativeAlertPhone?.(biz.negativeAlertPhone);
        props.setNegativePhone?.(biz.negativeAlertPhone);
      }
      if (biz.positiveAlertEmail) {
        setPositiveAlertEmail(biz.positiveAlertEmail);
        props.setPositiveAlertEmail?.(biz.positiveAlertEmail);
        props.setPositiveEmailAddress?.(biz.positiveAlertEmail);
      }
      if (biz.positiveAlertPhone) {
        setPositiveAlertPhone(biz.positiveAlertPhone);
        props.setPositiveAlertPhone?.(biz.positiveAlertPhone);
      }
    }
  }, [initialBusiness, business, props.initialBusiness, props.business]);

  // Sync if parent updates props directly
  useEffect(() => {
    if (props.negativeAlertEmail !== undefined && props.negativeAlertEmail !== negativeAlertEmail) {
      setNegativeAlertEmail(props.negativeAlertEmail);
    }
  }, [props.negativeAlertEmail]);

  useEffect(() => {
    if (props.negativeAlertPhone !== undefined && props.negativeAlertPhone !== negativeAlertPhone) {
      setNegativeAlertPhone(props.negativeAlertPhone);
    }
  }, [props.negativeAlertPhone]);

  useEffect(() => {
    if (props.positiveAlertEmail !== undefined && props.positiveAlertEmail !== positiveAlertEmail) {
      setPositiveAlertEmail(props.positiveAlertEmail);
    }
  }, [props.positiveAlertEmail]);

  useEffect(() => {
    if (props.positiveAlertPhone !== undefined && props.positiveAlertPhone !== positiveAlertPhone) {
      setPositiveAlertPhone(props.positiveAlertPhone);
    }
  }, [props.positiveAlertPhone]);

  const effectiveNegativeAlertsEnabled =
    props.negativeAlertsEnabled !== undefined
      ? props.negativeAlertsEnabled
      : (negativeAlertsEnabled ?? notifyNegativeEnabled ?? initialBiz?.negativeAlertsEnabled ?? true);

  const effectiveNegativeEmailAlertEnabled =
    props.negativeAlertEmailEnabled !== undefined
      ? props.negativeAlertEmailEnabled
      : (props.negativeEmailAlertEnabled !== undefined
        ? props.negativeEmailAlertEnabled
        : (negativeEmailAlertEnabled ?? notifyNegativeEmail ?? initialBiz?.negativeAlertEmailEnabled ?? initialBiz?.negativeEmailAlertEnabled ?? true));

  const effectiveNegativeSmsAlertEnabled = Boolean(
    props.settingsState?.negativeAlertSmsEnabled ??
    props.settingsState?.smsAlertsEnabled ??
    props.negativeAlertSmsEnabled ??
    props.smsAlertsEnabled ??
    props.negativeSmsAlertEnabled ??
    negativeSmsAlertEnabled ??
    notifyNegativeSms ??
    initialBiz?.negativeAlertSmsEnabled ??
    initialBiz?.smsAlertsEnabled ??
    initialBiz?.negativeSmsAlertEnabled ??
    false
  );

  const effectivePositiveAlertsEnabled =
    props.positiveAlertsEnabled !== undefined
      ? props.positiveAlertsEnabled
      : (positiveAlertsEnabled ?? notifyPositiveEnabled ?? initialBiz?.positiveAlertsEnabled ?? true);

  const effectivePositiveEmailAlertEnabled =
    props.positiveAlertEmailEnabled !== undefined
      ? props.positiveAlertEmailEnabled
      : (props.positiveEmailAlertEnabled !== undefined
        ? props.positiveEmailAlertEnabled
        : (positiveEmailAlertEnabled ?? notifyPositiveEmail ?? initialBiz?.positiveAlertEmailEnabled ?? initialBiz?.positiveEmailAlertEnabled ?? true));

  const effectivePositiveSmsAlertEnabled =
    props.positiveAlertSmsEnabled !== undefined
      ? props.positiveAlertSmsEnabled
      : (props.positiveSmsAlertEnabled !== undefined
        ? props.positiveSmsAlertEnabled
        : (positiveSmsAlertEnabled ?? notifyPositiveSms ?? initialBiz?.positiveAlertSmsEnabled ?? initialBiz?.positiveSmsAlertEnabled ?? false));

  const handleNegEmailChange = (val: string) => {
    setNegativeAlertEmail(val);
    if (props.setNegativeAlertEmail) props.setNegativeAlertEmail(val);
    if (props.setNegativeEmailAddress) props.setNegativeEmailAddress(val);
  };
  const handleNegPhoneChange = (val: string) => {
    setNegativeAlertPhone(val);
    if (props.setNegativeAlertPhone) props.setNegativeAlertPhone(val);
    if (props.setNegativePhone) props.setNegativePhone(val);
  };
  const handlePosEmailChange = (val: string) => {
    setPositiveAlertEmail(val);
    if (props.setPositiveAlertEmail) props.setPositiveAlertEmail(val);
    if (props.setPositiveEmailAddress) props.setPositiveEmailAddress(val);
  };
  const handlePosPhoneChange = (val: string) => {
    setPositiveAlertPhone(val);
    if (props.setPositiveAlertPhone) props.setPositiveAlertPhone(val);
  };
  const insertToken = (token: string) => {
    if (setSmsTemplate) setSmsTemplate(smsTemplate ? `${smsTemplate} ${token}` : token);
  };

  const charCount = (smsTemplate || '').length;
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
          onChange={(e) => setSmsTemplate?.(e.target.value)}
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
                      if (props.setNegativeAlertEmailEnabled) props.setNegativeAlertEmailEnabled(checked);
                      if (setNotifyNegativeEmail) setNotifyNegativeEmail(checked);
                      onToggleChange?.('negativeAlertEmailEnabled', checked);
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
                    checked={Boolean(
                      props.settingsState
                        ? props.settingsState.negativeAlertSmsEnabled
                        : (props.negativeAlertSmsEnabled !== undefined
                          ? props.negativeAlertSmsEnabled
                          : effectiveNegativeSmsAlertEnabled)
                    )}
                    onChange={(e) => {
                      const val = e.target.checked;
                      if (props.setSettingsState) {
                        props.setSettingsState((prev: any) => ({
                          ...prev,
                          negativeAlertSmsEnabled: val,
                          smsAlertsEnabled: val,
                        }));
                      }
                      if (props.setNegativeAlertSmsEnabled) {
                        props.setNegativeAlertSmsEnabled(val);
                      }
                      if (setNegativeSmsAlertEnabled) setNegativeSmsAlertEnabled(val);
                      if (props.setSmsAlertsEnabled) props.setSmsAlertsEnabled(val);
                      if (setNotifyNegativeSms) setNotifyNegativeSms(val);
                      onToggleChange?.('negativeAlertSmsEnabled', val);
                      onToggleChange?.('smsAlertsEnabled', val);
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
                    name="negativeAlertEmail"
                    value={props.negativeAlertEmail !== undefined ? props.negativeAlertEmail : negativeAlertEmail}
                    onChange={(e) => handleNegEmailChange(e.target.value)}
                    disabled={!effectiveNegativeEmailAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="manager@business.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Negative Alert SMS Phone
                  </label>
                  <input
                    type="tel"
                    name="negativeAlertPhone"
                    value={props.negativeAlertPhone !== undefined ? props.negativeAlertPhone : negativeAlertPhone}
                    onChange={(e) => handleNegPhoneChange(e.target.value)}
                    disabled={!effectiveNegativeSmsAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="+1 (555) 000-0000"
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
                      if (props.setPositiveAlertEmailEnabled) props.setPositiveAlertEmailEnabled(checked);
                      if (setNotifyPositiveEmail) setNotifyPositiveEmail(checked);
                      onToggleChange?.('positiveAlertEmailEnabled', checked);
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
                      if (props.setPositiveAlertSmsEnabled) props.setPositiveAlertSmsEnabled(checked);
                      if (setNotifyPositiveSms) setNotifyPositiveSms(checked);
                      onToggleChange?.('positiveAlertSmsEnabled', checked);
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
                    name="positiveAlertEmail"
                    value={props.positiveAlertEmail !== undefined ? props.positiveAlertEmail : positiveAlertEmail}
                    onChange={(e) => handlePosEmailChange(e.target.value)}
                    disabled={!effectivePositiveEmailAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="marketing@business.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Positive Alert SMS Phone
                  </label>
                  <input
                    type="tel"
                    name="positiveAlertPhone"
                    value={props.positiveAlertPhone !== undefined ? props.positiveAlertPhone : positiveAlertPhone}
                    onChange={(e) => handlePosPhoneChange(e.target.value)}
                    disabled={!effectivePositiveSmsAlertEnabled}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="+1 (555) 000-0000"
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
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSaveNotificationPreferences?.(); }}
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

export const ChannelsTab = MessagingChannelsCard;
export const NotificationsTab = MessagingChannelsCard;
