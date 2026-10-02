'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  ShieldCheck,
  Sparkles,
  Smartphone,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Save,
  ExternalLink,
  Plus,
  X,
  Mail,
  AlertTriangle,
  User,
  KeyRound,
  Bell,
  Lock,
  Phone,
  Star
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import BillingSection from '@/components/dashboard/BillingSection';

export default function SettingsPage() {
  const { user } = useAuth();
  const {
    profile,
    settings,
    updateSettings,
    updateProfile,
  } = useRatingPulseStore();

  // Admin Account States
  const [fullName, setFullName] = useState(
    profile.full_name || user?.user_metadata?.full_name || ''
  );
  const [adminEmail, setAdminEmail] = useState(
    user?.email || profile.email || ''
  );

  // Unified Notification Routing States
  const [notifyNegativeEnabled, setNotifyNegativeEnabled] = useState(
    settings.notify_negative_enabled ?? profile.notify_negative_enabled ?? true
  );
  const [notifyNegativeEmail, setNotifyNegativeEmail] = useState(
    settings.notify_negative_email ?? profile.notify_negative_email ?? true
  );
  const [notifyNegativeSms, setNotifyNegativeSms] = useState(
    settings.notify_negative_sms ?? profile.notify_negative_sms ?? true
  );
  const [negativeEmailAddress, setNegativeEmailAddress] = useState(
    settings.notification_email || profile.notification_email || profile.email || user?.email || ''
  );
  const [negativePhoneNumber, setNegativePhoneNumber] = useState(
    settings.notify_negative_phone || settings.notification_phone || profile.notify_negative_phone || profile.notification_phone || profile.phone || ''
  );

  const [notifyPositiveEnabled, setNotifyPositiveEnabled] = useState(
    settings.notify_positive_enabled ?? profile.notify_positive_enabled ?? true
  );
  const [notifyPositiveEmail, setNotifyPositiveEmail] = useState(
    settings.notify_positive_email ?? profile.notify_positive_email ?? true
  );
  const [notifyPositiveSms, setNotifyPositiveSms] = useState(
    settings.notify_positive_sms ?? profile.notify_positive_sms ?? false
  );
  const [positiveEmailAddress, setPositiveEmailAddress] = useState(
    settings.notification_email || profile.notification_email || profile.email || user?.email || ''
  );

  // AI & Automation Preferences
  const [brandVoice, setBrandVoice] = useState(settings.brand_voice);
  const [smsTemplate, setSmsTemplate] = useState(settings.sms_template);
  const [keywords, setKeywords] = useState<string[]>(settings.custom_keywords || []);
  const [newKeyword, setNewKeyword] = useState('');

  // Status & Modal States
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [sendingTestWelcome, setSendingTestWelcome] = useState(false);

  // Hydrate on mount directly from live server/Supabase record
  useEffect(() => {
    async function loadFreshSettings() {
      const activeUserId = user?.id || profile.id;
      if (!activeUserId || activeUserId.startsWith('usr_mock')) {
        // Fallback to store values if not connected
        if (profile.full_name && !fullName) setFullName(profile.full_name);
        if (profile.email && !adminEmail) setAdminEmail(profile.email);
        if (settings) {
          setNotifyNegativeEnabled(settings.notify_negative_enabled ?? profile.notify_negative_enabled ?? true);
          setNotifyNegativeEmail(settings.notify_negative_email ?? profile.notify_negative_email ?? true);
          setNotifyNegativeSms(settings.notify_negative_sms ?? profile.notify_negative_sms ?? true);
          setNegativePhoneNumber(settings.notify_negative_phone || settings.notification_phone || profile.notify_negative_phone || profile.notification_phone || profile.phone || '');
          setNegativeEmailAddress(settings.notification_email || profile.notification_email || profile.email || user?.email || '');
          setPositiveEmailAddress(settings.notification_email || profile.notification_email || profile.email || user?.email || '');
          setNotifyPositiveEnabled(settings.notify_positive_enabled ?? profile.notify_positive_enabled ?? true);
          setNotifyPositiveEmail(settings.notify_positive_email ?? profile.notify_positive_email ?? true);
          setNotifyPositiveSms(settings.notify_positive_sms ?? profile.notify_positive_sms ?? false);
        }
        return;
      }

      try {
        // 1. Try server-side API endpoint for reliable service-role reading
        const res = await fetch(`/api/settings?userId=${encodeURIComponent(activeUserId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const p = json.profile;
            const s = json.settings;

            if (p?.full_name) setFullName(p.full_name);
            if (p?.email) setAdminEmail(p.email);

            const resolvedPhone = json.resolvedPhone || '';
            const resolvedEmail = json.resolvedEmail || user?.email || '';

            setNegativePhoneNumber(resolvedPhone);
            setNegativeEmailAddress(resolvedEmail);
            setPositiveEmailAddress(resolvedEmail);

            if (s?.notify_negative_enabled !== undefined && s?.notify_negative_enabled !== null) {
              setNotifyNegativeEnabled(Boolean(s.notify_negative_enabled));
            } else if (p?.notify_negative_enabled !== undefined && p?.notify_negative_enabled !== null) {
              setNotifyNegativeEnabled(Boolean(p.notify_negative_enabled));
            }

            if (s?.notify_negative_email !== undefined && s?.notify_negative_email !== null) {
              setNotifyNegativeEmail(Boolean(s.notify_negative_email));
            } else if (p?.notify_negative_email !== undefined && p?.notify_negative_email !== null) {
              setNotifyNegativeEmail(Boolean(p.notify_negative_email));
            }

            if (s?.notify_negative_sms !== undefined && s?.notify_negative_sms !== null) {
              setNotifyNegativeSms(Boolean(s.notify_negative_sms));
            } else if (s?.sms_alerts_enabled !== undefined && s?.sms_alerts_enabled !== null) {
              setNotifyNegativeSms(Boolean(s.sms_alerts_enabled));
            } else if (p?.notify_negative_sms !== undefined && p?.notify_negative_sms !== null) {
              setNotifyNegativeSms(Boolean(p.notify_negative_sms));
            } else if (p?.sms_alerts_enabled !== undefined && p?.sms_alerts_enabled !== null) {
              setNotifyNegativeSms(Boolean(p.sms_alerts_enabled));
            }

            if (s?.notify_positive_enabled !== undefined && s?.notify_positive_enabled !== null) {
              setNotifyPositiveEnabled(Boolean(s.notify_positive_enabled));
            } else if (p?.notify_positive_enabled !== undefined && p?.notify_positive_enabled !== null) {
              setNotifyPositiveEnabled(Boolean(p.notify_positive_enabled));
            }

            if (s?.notify_positive_email !== undefined && s?.notify_positive_email !== null) {
              setNotifyPositiveEmail(Boolean(s.notify_positive_email));
            } else if (p?.notify_positive_email !== undefined && p?.notify_positive_email !== null) {
              setNotifyPositiveEmail(Boolean(p.notify_positive_email));
            }

            if (s?.notify_positive_sms !== undefined && s?.notify_positive_sms !== null) {
              setNotifyPositiveSms(Boolean(s.notify_positive_sms));
            } else if (p?.notify_positive_sms !== undefined && p?.notify_positive_sms !== null) {
              setNotifyPositiveSms(Boolean(p.notify_positive_sms));
            }

            if (s?.brand_voice) setBrandVoice(s.brand_voice);
            if (s?.sms_template) setSmsTemplate(s.sms_template);
            if (Array.isArray(s?.custom_keywords)) setKeywords(s.custom_keywords);
            return;
          }
        }

        // 2. Client-side Supabase query fallback
        if (isSupabaseConfigured && supabase) {
          const [profRes, settRes] = await Promise.allSettled([
            supabase.from('profiles').select('*').eq('id', activeUserId).maybeSingle(),
            supabase.from('business_settings').select('*').eq('user_id', activeUserId).maybeSingle(),
          ]);

          const p = profRes.status === 'fulfilled' ? profRes.value.data : null;
          const s = settRes.status === 'fulfilled' ? settRes.value.data : null;

          if (p) {
            if (p.full_name) setFullName(p.full_name);
            if (p.email) setAdminEmail(p.email);
          }

          const resolvedPhone =
            s?.notify_negative_phone ||
            s?.notification_phone ||
            p?.notify_negative_phone ||
            p?.notification_phone ||
            p?.phone ||
            '';

          const resolvedEmail =
            s?.notification_email ||
            p?.notification_email ||
            p?.email ||
            user?.email ||
            '';

          setNegativePhoneNumber(resolvedPhone);
          setNegativeEmailAddress(resolvedEmail);
          setPositiveEmailAddress(resolvedEmail);

          if (s?.notify_negative_enabled !== undefined && s?.notify_negative_enabled !== null) {
            setNotifyNegativeEnabled(Boolean(s.notify_negative_enabled));
          } else if (p?.notify_negative_enabled !== undefined && p?.notify_negative_enabled !== null) {
            setNotifyNegativeEnabled(Boolean(p.notify_negative_enabled));
          }

          if (s?.notify_negative_email !== undefined && s?.notify_negative_email !== null) {
            setNotifyNegativeEmail(Boolean(s.notify_negative_email));
          } else if (p?.notify_negative_email !== undefined && p?.notify_negative_email !== null) {
            setNotifyNegativeEmail(Boolean(p.notify_negative_email));
          }

          if (s?.notify_negative_sms !== undefined && s?.notify_negative_sms !== null) {
            setNotifyNegativeSms(Boolean(s.notify_negative_sms));
          } else if (s?.sms_alerts_enabled !== undefined && s?.sms_alerts_enabled !== null) {
            setNotifyNegativeSms(Boolean(s.sms_alerts_enabled));
          } else if (p?.notify_negative_sms !== undefined && p?.notify_negative_sms !== null) {
            setNotifyNegativeSms(Boolean(p.notify_negative_sms));
          } else if (p?.sms_alerts_enabled !== undefined && p?.sms_alerts_enabled !== null) {
            setNotifyNegativeSms(Boolean(p.sms_alerts_enabled));
          }

          if (s?.notify_positive_enabled !== undefined && s?.notify_positive_enabled !== null) {
            setNotifyPositiveEnabled(Boolean(s.notify_positive_enabled));
          } else if (p?.notify_positive_enabled !== undefined && p?.notify_positive_enabled !== null) {
            setNotifyPositiveEnabled(Boolean(p.notify_positive_enabled));
          }

          if (s?.notify_positive_email !== undefined && s?.notify_positive_email !== null) {
            setNotifyPositiveEmail(Boolean(s.notify_positive_email));
          } else if (p?.notify_positive_email !== undefined && p?.notify_positive_email !== null) {
            setNotifyPositiveEmail(Boolean(p.notify_positive_email));
          }

          if (s?.notify_positive_sms !== undefined && s?.notify_positive_sms !== null) {
            setNotifyPositiveSms(Boolean(s.notify_positive_sms));
          } else if (p?.notify_positive_sms !== undefined && p?.notify_positive_sms !== null) {
            setNotifyPositiveSms(Boolean(p.notify_positive_sms));
          }

          if (s?.brand_voice) setBrandVoice(s.brand_voice);
          if (s?.sms_template) setSmsTemplate(s.sms_template);
          if (Array.isArray(s?.custom_keywords)) setKeywords(s.custom_keywords);
        }
      } catch (err) {
        console.warn('Error loading live settings:', err);
      }
    }

    loadFreshSettings();
  }, [user?.id, profile.id]);

  const handleSendTestWelcome = async () => {
    const targetEmail = negativeEmailAddress || positiveEmailAddress || profile.email || user?.email || 'admin@business.com';
    setSendingTestWelcome(true);

    try {
      const res = await fetch('/api/test-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: fullName || 'Valued Business Owner',
          userId: user?.id || profile.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch test welcome email');
      }

      toast.success('Welcome Email Dispatched! 🚀', {
        description: `A test onboarding welcome email has been delivered to ${targetEmail}.`,
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Test welcome email error:', err);
      toast.error('Could not send test email', {
        description: err.message || 'Please check your connection and Resend configuration.',
      });
    } finally {
      setSendingTestWelcome(false);
    }
  };

  const handlePasswordReset = async () => {
    const emailToReset = adminEmail || user?.email;
    if (!emailToReset) {
      toast.error('No account email found to send reset instructions.');
      return;
    }

    setIsSendingPasswordReset(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
        });
        if (error) throw error;
      }

      toast.success('Password Reset Email Sent', {
        description: `Instructions to reset your password have been sent to ${emailToReset}.`,
      });
    } catch (err: any) {
      toast.error('Password reset failed', {
        description: err?.message || 'Could not send reset email. Please try again.',
      });
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const primaryNotificationEmail = negativeEmailAddress.trim() || positiveEmailAddress.trim() || profile.email || user?.email || '';
      const primaryNotificationPhone = negativePhoneNumber.trim();
      const activeUserId = user?.id || profile.id;

      const payload = {
        userId: activeUserId,
        full_name: fullName,
        notification_email: primaryNotificationEmail,
        notification_phone: primaryNotificationPhone,
        notify_negative_phone: primaryNotificationPhone,
        alert_phone: primaryNotificationPhone,
        phone: primaryNotificationPhone,
        sms_alerts_enabled: notifyNegativeSms || notifyPositiveSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_positive_enabled: notifyPositiveEnabled,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
        brand_voice: brandVoice,
        sms_template: smsTemplate,
        custom_keywords: keywords,
      };

      console.log('[Saving Settings Payload]:', payload);

      // 1. Post to Server-Side Settings API (uses SUPABASE_SERVICE_ROLE_KEY to guarantee persistence)
      const saveRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || !resData.success) {
        throw new Error(resData?.error || 'Server rejected settings update. Please check database permissions.');
      }

      // 2. Synchronize local store state
      await updateProfile({
        full_name: fullName,
        notification_email: primaryNotificationEmail,
        notification_phone: primaryNotificationPhone,
        phone: primaryNotificationPhone || profile.phone,
        sms_alerts_enabled: notifyNegativeSms || notifyPositiveSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_negative_phone: primaryNotificationPhone,
        notify_positive_enabled: notifyPositiveEnabled,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
      });

      await updateSettings({
        brand_voice: brandVoice as any,
        sms_template: smsTemplate,
        custom_keywords: keywords,
        notification_email: primaryNotificationEmail,
        notification_phone: primaryNotificationPhone,
        sms_alerts_enabled: notifyNegativeSms || notifyPositiveSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_negative_phone: primaryNotificationPhone,
        notify_positive_enabled: notifyPositiveEnabled,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
      });

      setIsSaved(true);
      toast.success('Settings saved successfully!', {
        description: primaryNotificationPhone
          ? `Notification phone (${primaryNotificationPhone}) and alert routing have been saved.`
          : 'Account profile, AI preferences, and review notification routing have been updated.',
      });
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      console.error('[Settings Save Error]:', err);
      toast.error('Failed to save settings', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Account Settings &amp; Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your subscription tier, administrative profile, alert notifications, and AI response preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/setup"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Manage Google Integration →
          </Link>

          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </div>
          )}
        </div>
      </div>

      {/* 1. PROMINENT PLAN & SUBSCRIPTION BILLING CARD */}
      <BillingSection />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* 2. ADMIN USER PROFILE & SECURITY CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Administrator Profile &amp; Security</h3>
                <p className="text-xs text-slate-500">Manage account credentials and authentication</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Admin Account
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Login Email
              </label>
              <input
                type="email"
                value={adminEmail}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password Security Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Password &amp; Authentication</div>
                <div className="text-[11px] text-slate-500">
                  Secure your account credentials or request an instant password reset link.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isSendingPasswordReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold whitespace-nowrap shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSendingPasswordReset ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Send Password Reset Email</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. NOTIFICATION ROUTING & ALERTS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Routing &amp; Alerts</h3>
                <p className="text-xs text-slate-500">Route instant review alerts to specific team members based on customer sentiment and star ratings.</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Active Routing Engine 🟢
            </span>
          </div>

          <div className="space-y-6">
            {/* NEGATIVE REVIEW ALERTS (1–3 STARS) */}
            <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-4">
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
                      Instantly alert management when a customer leaves an unhappy review or low rating.
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notifyNegativeEnabled}
                    onChange={(e) => setNotifyNegativeEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {notifyNegativeEnabled && (
                <div className="space-y-4 pt-3 border-t border-rose-100/80 animate-in fade-in duration-150">
                  {/* Channel Checkboxes */}
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyNegativeEmail}
                        onChange={(e) => setNotifyNegativeEmail(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Email Notification</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyNegativeSms}
                        onChange={(e) => setNotifyNegativeSms(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>SMS Urgent Alert</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Notification Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Negative Alert Notification Email
                      </label>
                      <input
                        type="email"
                        placeholder="owner@business.com"
                        value={negativeEmailAddress}
                        onChange={(e) => setNegativeEmailAddress(e.target.value)}
                        disabled={!notifyNegativeEmail}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    {/* Notification Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Notification Phone Number (SMS)
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={negativePhoneNumber}
                        onChange={(e) => setNegativePhoneNumber(e.target.value)}
                        disabled={!notifyNegativeSms}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* POSITIVE REVIEW ALERTS (4–5 STARS) */}
            <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/20 space-y-4">
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

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notifyPositiveEnabled}
                    onChange={(e) => setNotifyPositiveEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {notifyPositiveEnabled && (
                <div className="space-y-4 pt-3 border-t border-amber-100/80 animate-in fade-in duration-150">
                  {/* Channel Checkboxes */}
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyPositiveEmail}
                        onChange={(e) => setNotifyPositiveEmail(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Email Notification</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyPositiveSms}
                        onChange={(e) => setNotifyPositiveSms(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>SMS Alert</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Notification Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Positive Alert Notification Email
                      </label>
                      <input
                        type="email"
                        placeholder="marketing@business.com"
                        value={positiveEmailAddress}
                        onChange={(e) => setPositiveEmailAddress(e.target.value)}
                        disabled={!notifyPositiveEmail}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Welcome Email Trigger Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                onClick={handleSendTestWelcome}
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
          </div>
        </div>

        {/* 4. AI RESPONSE ENGINE & SEO TONE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Response Engine &amp; SEO Keywords</h3>
              <p className="text-xs text-slate-500">Fine-tune how AI crafts review replies</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Brand Voice &amp; Personality
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: 'friendly_professional', label: 'Friendly & Professional' },
                  { key: 'casual_enthusiastic', label: 'Casual & Warm' },
                  { key: 'concise_polite', label: 'Concise & Polite' },
                  { key: 'empathetic', label: 'Empathetic & Caring' },
                ].map((voice) => (
                  <button
                    type="button"
                    key={voice.key}
                    onClick={() => setBrandVoice(voice.key as any)}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      brandVoice === voice.key
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom SEO Keywords */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Local SEO Keywords (Injected into replies to boost Google 3-Pack rankings)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. emergency dentist, dental cleaning..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Keyword
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium"
                  >
                    #{kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-blue-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. SMS INVITE TEMPLATE CONFIGURATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Default SMS Invite Template</h3>
              <p className="text-xs text-slate-500">Default message structure used when sending review invitations</p>
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono leading-relaxed"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
              <span className="font-bold text-slate-700">Available Variables:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">{'{{customer_name}}'}</code>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">{'{{business_name}}'}</code>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">{'{{review_link}}'}</code>
            </div>
          </div>
        </div>
        {/* Save Button Action Bar */}
        <div className="pt-4 pb-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
