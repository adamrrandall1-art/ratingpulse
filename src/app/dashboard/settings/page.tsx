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
  Store,
  User,
  KeyRound,
  Lock,
  Flame,
  Globe,
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

import GbpIntegrationCard from '@/components/settings/GbpIntegrationCard';
import AiPersonaCard, { BrandVoiceType } from '@/components/settings/AiPersonaCard';
import MessagingChannelsCard from '@/components/settings/MessagingChannelsCard';
import ComplianceSettingsCard from '@/components/settings/ComplianceSettingsCard';
import BillingSection from '@/components/dashboard/BillingSection';

type TabKey = 'gbp' | 'ai' | 'channels' | 'compliance' | 'billing';

const SETTINGS_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'gbp', label: 'Google Business Profile', icon: Store },
  { key: 'ai', label: 'AI Reply Persona', icon: Sparkles },
  { key: 'channels', label: 'SMS & Email Channels', icon: Smartphone },
  { key: 'compliance', label: 'Legal & Quiet Hours', icon: ShieldCheck },
  { key: 'billing', label: 'Account & Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const {
    profile,
    settings,
    updateSettings,
    updateProfile,
    isDemoMode,
    toggleDemoMode,
  } = useRatingPulseStore();

  const [activeTab, setActiveTab] = useState<TabKey>('gbp');

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
  const [negativePhone, setNegativePhone] = useState(
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
  const [brandVoice, setBrandVoice] = useState<BrandVoiceType>(
    (settings.brand_voice as BrandVoiceType) || 'friendly_professional'
  );
  const [autoPublish5Star, setAutoPublish5Star] = useState(
    settings.auto_publish_5_star ?? false
  );
  const [smsTemplate, setSmsTemplate] = useState(
    settings.sms_template || 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}'
  );
  const [keywords, setKeywords] = useState<string[]>(settings.custom_keywords || []);

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
        if (profile.full_name && !fullName) setFullName(profile.full_name);
        if (profile.email && !adminEmail) setAdminEmail(profile.email);
        if (settings) {
          setNotifyNegativeEnabled(settings.notify_negative_enabled ?? profile.notify_negative_enabled ?? true);
          setNotifyNegativeEmail(settings.notify_negative_email ?? profile.notify_negative_email ?? true);
          setNotifyNegativeSms(settings.notify_negative_sms ?? profile.notify_negative_sms ?? true);
          setNegativePhone(settings.notify_negative_phone || settings.notification_phone || profile.notify_negative_phone || profile.notification_phone || profile.phone || '');
          setNegativeEmailAddress(settings.notification_email || profile.notification_email || profile.email || user?.email || '');
          setPositiveEmailAddress(settings.notification_email || profile.notification_email || profile.email || user?.email || '');
          setNotifyPositiveEnabled(settings.notify_positive_enabled ?? profile.notify_positive_enabled ?? true);
          setNotifyPositiveEmail(settings.notify_positive_email ?? profile.notify_positive_email ?? true);
          setNotifyPositiveSms(settings.notify_positive_sms ?? profile.notify_positive_sms ?? false);
          if (settings.auto_publish_5_star !== undefined) setAutoPublish5Star(settings.auto_publish_5_star);
        }
        return;
      }

      try {
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

            setNegativePhone(resolvedPhone);
            setNegativeEmailAddress(resolvedEmail);
            setPositiveEmailAddress(resolvedEmail);

            if (s?.notify_negative_enabled !== undefined && s?.notify_negative_enabled !== null) {
              setNotifyNegativeEnabled(Boolean(s.notify_negative_enabled));
            }
            if (s?.notify_negative_email !== undefined && s?.notify_negative_email !== null) {
              setNotifyNegativeEmail(Boolean(s.notify_negative_email));
            }
            if (s?.notify_negative_sms !== undefined && s?.notify_negative_sms !== null) {
              setNotifyNegativeSms(Boolean(s.notify_negative_sms));
            }
            if (s?.notify_positive_enabled !== undefined && s?.notify_positive_enabled !== null) {
              setNotifyPositiveEnabled(Boolean(s.notify_positive_enabled));
            }
            if (s?.notify_positive_email !== undefined && s?.notify_positive_email !== null) {
              setNotifyPositiveEmail(Boolean(s.notify_positive_email));
            }
            if (s?.notify_positive_sms !== undefined && s?.notify_positive_sms !== null) {
              setNotifyPositiveSms(Boolean(s.notify_positive_sms));
            }
            if (s?.auto_publish_5_star !== undefined) {
              setAutoPublish5Star(Boolean(s.auto_publish_5_star));
            }

            if (s?.brand_voice) setBrandVoice(s.brand_voice as BrandVoiceType);
            if (s?.sms_template) setSmsTemplate(s.sms_template);
            if (Array.isArray(s?.custom_keywords)) setKeywords(s.custom_keywords);
            return;
          }
        }

        // Client-side Supabase query fallback
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

          setNegativePhone(resolvedPhone);
          setNegativeEmailAddress(resolvedEmail);
          setPositiveEmailAddress(resolvedEmail);

          if (s?.brand_voice) setBrandVoice(s.brand_voice as BrandVoiceType);
          if (s?.auto_publish_5_star !== undefined) setAutoPublish5Star(Boolean(s.auto_publish_5_star));
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

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const primaryNotificationEmail = negativeEmailAddress.trim() || positiveEmailAddress.trim() || profile.email || user?.email || '';
      const primaryNotificationPhone = (negativePhone || '').trim();

      let activeUserId = user?.id || profile.id;
      if (isSupabaseConfigured && supabase) {
        try {
          const authUserRes = await supabase.auth.getUser();
          if (authUserRes?.data?.user?.id) {
            activeUserId = authUserRes.data.user.id;
          }
        } catch (authErr) {
          console.warn('[Settings Auth Check Warning]:', authErr);
        }
      }

      // Explicitly update profiles table
      if (isSupabaseConfigured && supabase && activeUserId && !activeUserId.startsWith('usr_mock')) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            notify_negative_phone: primaryNotificationPhone || null,
            notify_negative_email: notifyNegativeEmail,
            notify_negative_sms: notifyNegativeSms,
            notify_negative_enabled: notifyNegativeEnabled,
            notify_positive_phone: primaryNotificationPhone || null,
            notify_positive_email: notifyPositiveEmail,
            notify_positive_sms: notifyPositiveSms,
            notify_positive_enabled: notifyPositiveEnabled,
            notification_email: primaryNotificationEmail || null,
            notification_phone: primaryNotificationPhone || null,
            phone: primaryNotificationPhone || profile.phone || null,
            sms_alerts_enabled: notifyNegativeSms || notifyPositiveSms,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeUserId);

        try {
          await supabase
            .from('business_settings')
            .upsert({
              user_id: activeUserId,
              notify_negative_phone: primaryNotificationPhone || null,
              notify_negative_email: notifyNegativeEmail,
              notify_negative_sms: notifyNegativeSms,
              notify_negative_enabled: notifyNegativeEnabled,
              notify_positive_email: notifyPositiveEmail,
              notify_positive_sms: notifyPositiveSms,
              notify_positive_enabled: notifyPositiveEnabled,
              notification_email: primaryNotificationEmail || null,
              notification_phone: primaryNotificationPhone || null,
              sms_alerts_enabled: notifyNegativeSms || notifyPositiveSms,
              brand_voice: brandVoice,
              auto_publish_5_star: autoPublish5Star,
              sms_template: smsTemplate,
              custom_keywords: keywords,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        } catch (settingsCatchErr) {
          console.warn('[Supabase Business Settings Save Warning]:', settingsCatchErr);
        }
      }

      // Post to Server-Side Settings API
      const payload = {
        userId: activeUserId,
        full_name: fullName,
        notification_email: primaryNotificationEmail,
        notification_phone: primaryNotificationPhone,
        notify_negative_phone: primaryNotificationPhone,
        notify_positive_phone: primaryNotificationPhone,
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
        auto_publish_5_star: autoPublish5Star,
        sms_template: smsTemplate,
        custom_keywords: keywords,
      };

      const saveRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || !resData.success) {
        const errorMsg = resData?.error || 'Server rejected settings update.';
        throw new Error(errorMsg);
      }

      // Synchronize local store state
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
        brand_voice: brandVoice,
        auto_publish_5_star: autoPublish5Star,
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
      toast.success('Settings Saved Successfully!', {
        description: 'Your Google integration, AI persona, and delivery preferences have been synced.',
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
    <div className="space-y-6 max-w-5xl pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-600" />
            Business Settings &amp; Integrations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage connected Google profiles, customize AI reply personality, and configure delivery channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Prominent Environment Mode Alert & Toggle Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/70 border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Environment Mode</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isDemoMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                {isDemoMode ? '🟢 Demo Sandbox Active' : '⚪ Live Google Production'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Switch between interactive Demo Mode (safe sandbox with sample reviews &amp; simulated publishing) and Live Google Production.
            </p>
          </div>
        </div>

        {/* Segmented Pill Control */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-white/95 p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!isDemoMode) {
                toggleDemoMode(true);
                toast.success('Switched to Demo Sandbox', {
                  description: 'Safe sandbox active with sample reviews and simulated dispatches.',
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDemoMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'}`}></span>
            <span>🟢 Demo Mode Active</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isDemoMode) {
                toggleDemoMode(false);
                toast.success('Switched to Live Google Profile', {
                  description: 'Live profile active. Real Google API connections and live dispatch enabled.',
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isDemoMode
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${!isDemoMode ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
            <span>⚪ Live Google Profile</span>
          </button>
        </div>
      </div>

      {/* 3. Modern Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}
      <div className="space-y-6">
        {/* TAB 1: GOOGLE BUSINESS PROFILE */}
        {activeTab === 'gbp' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <GbpIntegrationCard />
          </div>
        )}

        {/* TAB 2: AI REPLY PERSONA */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <AiPersonaCard
              brandVoice={brandVoice}
              setBrandVoice={setBrandVoice}
              keywords={keywords}
              setKeywords={setKeywords}
              autoPublish5Star={autoPublish5Star}
              setAutoPublish5Star={setAutoPublish5Star}
              businessName={profile.business_name}
            />
          </div>
        )}

        {/* TAB 3: SMS & EMAIL CHANNELS */}
        {activeTab === 'channels' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <MessagingChannelsCard
              smsTemplate={smsTemplate}
              setSmsTemplate={setSmsTemplate}
              notifyNegativeEnabled={notifyNegativeEnabled}
              setNotifyNegativeEnabled={setNotifyNegativeEnabled}
              notifyNegativeEmail={notifyNegativeEmail}
              setNotifyNegativeEmail={setNotifyNegativeEmail}
              notifyNegativeSms={notifyNegativeSms}
              setNotifyNegativeSms={setNotifyNegativeSms}
              negativeEmailAddress={negativeEmailAddress}
              setNegativeEmailAddress={setNegativeEmailAddress}
              negativePhone={negativePhone}
              setNegativePhone={setNegativePhone}
              notifyPositiveEnabled={notifyPositiveEnabled}
              setNotifyPositiveEnabled={setNotifyPositiveEnabled}
              notifyPositiveEmail={notifyPositiveEmail}
              setNotifyPositiveEmail={setNotifyPositiveEmail}
              notifyPositiveSms={notifyPositiveSms}
              setNotifyPositiveSms={setNotifyPositiveSms}
              positiveEmailAddress={positiveEmailAddress}
              setPositiveEmailAddress={setPositiveEmailAddress}
              onSendTestWelcome={handleSendTestWelcome}
              sendingTestWelcome={sendingTestWelcome}
            />
          </div>
        )}

        {/* TAB 4: LEGAL & QUIET HOURS */}
        {activeTab === 'compliance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <ComplianceSettingsCard />
          </div>
        )}

        {/* TAB 5: ACCOUNT & BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <BillingSection />

            {/* Administrator Profile & Security Card */}
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

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
          </div>
        )}
      </div>

      {/* Floating / Bottom Save Bar */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Changes will apply across all review reply generators and invite channels immediately.
        </div>
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
