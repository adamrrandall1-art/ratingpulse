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
import { useRatingPulseStore, isBusinessConnected } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useUser } from '@clerk/nextjs';
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

interface SettingsClientProps {
  initialBusiness?: any;
  initialNotificationSettings?: any;
  initialSettings?: any;
  initialProfile?: any;
}

export default function SettingsClient({
  initialBusiness,
  initialNotificationSettings,
  initialSettings,
  initialProfile,
}: SettingsClientProps) {
  const { user: clerkUser } = useUser();
  const { user: supabaseUser } = useAuth();
  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        user_metadata: { full_name: clerkUser.fullName || '' },
      }
    : supabaseUser;

  const {
    activeBusiness,
    setActiveBusiness,
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
    initialProfile?.full_name || profile.full_name || user?.user_metadata?.full_name || ''
  );
  const [adminEmail, setAdminEmail] = useState(
    initialProfile?.email || user?.email || profile.email || ''
  );

  // Unified Notification Routing Initial Values from Server Loader
  const initialNegPhone =
    initialNotificationSettings?.negativeAlertPhone ||
    initialNotificationSettings?.notify_negative_phone ||
    initialSettings?.negative_alert_phone ||
    initialSettings?.notify_negative_phone ||
    initialProfile?.negative_alert_phone ||
    initialProfile?.notify_negative_phone ||
    settings.notify_negative_phone ||
    profile.notify_negative_phone ||
    settings.notification_phone ||
    profile.notification_phone ||
    '';

  const initialNegEmail =
    initialNotificationSettings?.negativeAlertEmail ||
    initialNotificationSettings?.notify_negative_email ||
    initialSettings?.negative_alert_email ||
    initialProfile?.negative_alert_email ||
    settings.notification_email ||
    profile.notification_email ||
    profile.email ||
    user?.email ||
    '';

  const initialPosEmail =
    initialNotificationSettings?.positiveAlertEmail ||
    initialNotificationSettings?.notify_positive_email ||
    initialSettings?.positive_alert_email ||
    initialProfile?.positive_alert_email ||
    settings.notification_email ||
    profile.notification_email ||
    profile.email ||
    user?.email ||
    '';

  const [notifyNegativeEnabled, setNotifyNegativeEnabled] = useState(
    initialNotificationSettings?.negativeAlertsEnabled ??
    initialNotificationSettings?.notify_negative_enabled ??
    initialSettings?.negative_alerts_enabled ??
    initialSettings?.notify_negative_enabled ??
    settings.notify_negative_enabled ??
    profile.notify_negative_enabled ??
    true
  );
  const [notifyNegativeEmail, setNotifyNegativeEmail] = useState(
    initialNotificationSettings?.negativeEmailAlertEnabled ??
    initialNotificationSettings?.notify_negative_email ??
    initialSettings?.negative_email_alert_enabled ??
    initialSettings?.notify_negative_email ??
    settings.notify_negative_email ??
    profile.notify_negative_email ??
    true
  );
  const [notifyNegativeSms, setNotifyNegativeSms] = useState(
    initialNotificationSettings?.negativeSmsAlertEnabled ??
    initialNotificationSettings?.notify_negative_sms ??
    initialSettings?.negative_sms_alert_enabled ??
    initialSettings?.notify_negative_sms ??
    settings.notify_negative_sms ??
    profile.notify_negative_sms ??
    true
  );

  const [negativeEmailAddress, setNegativeEmailAddress] = useState(initialNegEmail);
  const [negativePhone, setNegativePhone] = useState(initialNegPhone);

  const [notifyPositiveEnabled, setNotifyPositiveEnabled] = useState(
    initialNotificationSettings?.positiveAlertsEnabled ??
    initialNotificationSettings?.notify_positive_enabled ??
    initialSettings?.positive_alerts_enabled ??
    initialSettings?.notify_positive_enabled ??
    settings.notify_positive_enabled ??
    profile.notify_positive_enabled ??
    true
  );
  const [notifyPositiveEmail, setNotifyPositiveEmail] = useState(
    initialNotificationSettings?.positiveEmailAlertEnabled ??
    initialNotificationSettings?.notify_positive_email ??
    initialSettings?.positive_email_alert_enabled ??
    initialSettings?.notify_positive_email ??
    settings.notify_positive_email ??
    profile.notify_positive_email ??
    true
  );
  const [notifyPositiveSms, setNotifyPositiveSms] = useState(
    initialNotificationSettings?.positiveSmsAlertEnabled ??
    initialNotificationSettings?.notify_positive_sms ??
    initialSettings?.positive_sms_alert_enabled ??
    initialSettings?.notify_positive_sms ??
    settings.notify_positive_sms ??
    profile.notify_positive_sms ??
    false
  );
  const [positiveEmailAddress, setPositiveEmailAddress] = useState(initialPosEmail);

  // AI & Automation Preferences
  const [brandVoice, setBrandVoice] = useState<BrandVoiceType>(
    (initialSettings?.brand_voice as BrandVoiceType) || (settings.brand_voice as BrandVoiceType) || 'friendly_professional'
  );
  const [autoPublish5Star, setAutoPublish5Star] = useState(
    initialSettings?.auto_publish_5_star ?? settings.auto_publish_5_star ?? false
  );
  const [smsTemplate, setSmsTemplate] = useState(
    initialSettings?.sms_template || settings.sms_template || 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}'
  );
  const [keywords, setKeywords] = useState<string[]>(initialSettings?.custom_keywords || settings.custom_keywords || []);

  // Status & Modal States
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isNotificationsSaved, setIsNotificationsSaved] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [sendingTestWelcome, setSendingTestWelcome] = useState(false);

  // Hydrate initial business if connected and store is not yet connected
  useEffect(() => {
    if (initialBusiness && isBusinessConnected(initialBusiness)) {
      if (!isBusinessConnected(activeBusiness)) {
        setActiveBusiness(initialBusiness);
      }
    }
  }, [initialBusiness, activeBusiness, setActiveBusiness]);

  // Load fresh settings form fields on mount without overwriting active business or populated inputs
  useEffect(() => {
    async function loadFreshSettings() {
      const activeUserId = clerkUser?.id || supabaseUser?.id || profile.id;
      if (!activeUserId || activeUserId.startsWith('usr_mock')) return;

      try {
        const res = await fetch(`/api/settings?userId=${encodeURIComponent(activeUserId)}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const p = json.profile;
            const s = json.settings;
            const b = json.business;

            if (p?.full_name) setFullName(p.full_name);
            if (p?.email) setAdminEmail(p.email);

            if (b && isBusinessConnected(b)) {
              setActiveBusiness(b);
            }

            // Only update negative phone if resolved from alert routing settings
            const resolvedNegativePhone =
              json.notificationSettings?.negativeAlertPhone ||
              json.notificationSettings?.notify_negative_phone ||
              json.negativeAlertPhone ||
              s?.negative_alert_phone ||
              s?.notify_negative_phone ||
              p?.negative_alert_phone ||
              p?.notify_negative_phone ||
              s?.notification_phone ||
              p?.notification_phone ||
              '';

            if (resolvedNegativePhone && resolvedNegativePhone.trim().length > 0) {
              setNegativePhone((prev: string) => (prev ? prev : resolvedNegativePhone));
            }

            const resolvedEmail =
              json.notificationSettings?.negativeAlertEmail ||
              json.notificationSettings?.notify_negative_email ||
              json.resolvedEmail ||
              s?.negative_alert_email ||
              p?.negative_alert_email ||
              s?.notification_email ||
              p?.notification_email ||
              p?.email ||
              user?.email ||
              '';

            if (resolvedEmail && resolvedEmail.trim().length > 0) {
              setNegativeEmailAddress((prev: string) => (prev ? prev : resolvedEmail));
              setPositiveEmailAddress((prev: string) => (prev ? prev : resolvedEmail));
            }

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
          }
        }
      } catch (err) {
        console.warn('Error loading live settings:', err);
      }
    }

    loadFreshSettings();
  }, [user?.id, profile.id]);

  // Dedicated Notification Routing Save Handler
  const handleSaveNotificationPreferences = async (silent = false) => {
    if (!silent) setIsSavingNotifications(true);

    try {
      const activeUserId = user?.id || profile.id;
      const targetPhone = (negativePhone || '').trim();
      const targetEmail = (negativeEmailAddress || positiveEmailAddress || profile.email || user?.email || '').trim();

      const payload = {
        userId: activeUserId,
        activeBusinessId: activeUserId,
        negativeAlertEmail: targetEmail,
        negativeAlertPhone: targetPhone,
        negativeAlertsEnabled: notifyNegativeEnabled,
        negativeEmailAlertEnabled: notifyNegativeEmail,
        negativeSmsAlertEnabled: notifyNegativeSms,
        positiveAlertEmail: targetEmail,
        positiveAlertPhone: targetPhone,
        positiveAlertsEnabled: notifyPositiveEnabled,
        positiveEmailAlertEnabled: notifyPositiveEmail,
        positiveSmsAlertEnabled: notifyPositiveSms,
        notify_negative_phone: targetPhone,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_positive_phone: targetPhone,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
        notify_positive_enabled: notifyPositiveEnabled,
        notification_phone: targetPhone,
        notification_email: targetEmail,
      };

      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.success) {
        throw new Error(resData?.error || 'Failed to save notification routing preferences.');
      }

      await updateProfile({
        notify_negative_phone: targetPhone,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_positive_phone: targetPhone,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
        notify_positive_enabled: notifyPositiveEnabled,
        notification_phone: targetPhone,
        notification_email: targetEmail,
        phone: targetPhone || profile.phone,
      });

      await updateSettings({
        notify_negative_phone: targetPhone,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
        notify_positive_enabled: notifyPositiveEnabled,
        notification_phone: targetPhone,
        notification_email: targetEmail,
      });

      if (silent) {
        toast.success('Preferences saved', { duration: 2000 });
      } else {
        setIsNotificationsSaved(true);
        toast.success('Notification Preferences Saved! 🔔', {
          description: `Alert notifications routed to ${targetPhone || targetEmail}.`,
        });
        setTimeout(() => setIsNotificationsSaved(false), 2500);
      }
    } catch (err: any) {
      console.error('[Save Notifications Error]:', err);
      if (!silent) {
        toast.error('Failed to save notification preferences', {
          description: err?.message || 'Please check your connection and try again.',
        });
      }
    } finally {
      if (!silent) setIsSavingNotifications(false);
    }
  };

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

  // Explicit Save Handler - Forms ONLY write upon explicit submit event
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const primaryNotificationEmail = negativeEmailAddress.trim() || positiveEmailAddress.trim() || profile.email || user?.email || '';
      const primaryNotificationPhone = (negativePhone || '').trim();

      const activeUserId = user?.id || profile.id;

      // Post to Server-Side Settings API with protection for review URL & connection state
      const payload: Record<string, unknown> = {
        userId: activeUserId,
        activeBusinessId: activeUserId,
        businessId: activeUserId,
        full_name: fullName,
        notification_email: primaryNotificationEmail,
        notification_phone: primaryNotificationPhone,
        notify_negative_phone: primaryNotificationPhone,
        notify_positive_phone: primaryNotificationPhone,
        alert_phone: primaryNotificationPhone,
        phone: primaryNotificationPhone,
        smsSenderNumber: primaryNotificationPhone,
        emailSender: primaryNotificationEmail,
        sms_alerts_enabled: notifyNegativeSms || notifyPositiveSms,
        notify_negative_enabled: notifyNegativeEnabled,
        notify_negative_email: notifyNegativeEmail,
        notify_negative_sms: notifyNegativeSms,
        notify_positive_enabled: notifyPositiveEnabled,
        notify_positive_email: notifyPositiveEmail,
        notify_positive_sms: notifyPositiveSms,
        negativeAlertEmail: primaryNotificationEmail,
        negativeAlertPhone: primaryNotificationPhone,
        negativeAlertsEnabled: notifyNegativeEnabled,
        negativeEmailAlertEnabled: notifyNegativeEmail,
        negativeSmsAlertEnabled: notifyNegativeSms,
        positiveAlertEmail: primaryNotificationEmail,
        positiveAlertPhone: primaryNotificationPhone,
        positiveAlertsEnabled: notifyPositiveEnabled,
        positiveEmailAlertEnabled: notifyPositiveEmail,
        positiveSmsAlertEnabled: notifyPositiveSms,
        brand_voice: brandVoice,
        auto_publish_5_star: autoPublish5Star,
        sms_template: smsTemplate,
        custom_keywords: keywords,
      };

      if (activeBusiness?.googleReviewUrl || activeBusiness?.reviewUrl) {
        payload.googleReviewUrl = activeBusiness.googleReviewUrl || activeBusiness.reviewUrl;
        payload.review_url = activeBusiness.googleReviewUrl || activeBusiness.reviewUrl;
      }
      if (activeBusiness?.placeId) {
        payload.place_id = activeBusiness.placeId;
        payload.google_place_id = activeBusiness.placeId;
      }
      if (isBusinessConnected(activeBusiness)) {
        payload.google_connected = true;
      }

      const [saveRes] = await Promise.all([
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        fetch('/api/settings/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      ]);

      const resData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || !resData.success) {
        const errorMsg = resData?.error || 'Server rejected settings update.';
        throw new Error(errorMsg);
      }

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

      if (resData.business && isBusinessConnected(resData.business)) {
        setActiveBusiness(resData.business);
      } else {
        setActiveBusiness({
          ...activeBusiness,
          phone: primaryNotificationPhone || activeBusiness.phone,
        });
      }

      setIsSaved(true);
      toast.success('Settings Saved Successfully!', {
        description: 'Your business profile, channels, and delivery preferences have been synced to the database.',
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

      {/* Demo Sandbox Alert (only if demo mode is active) */}
      {isDemoMode && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-amber-900">Preview Demo Sandbox Active</h3>
              <p className="text-[11px] text-amber-700">You are browsing sample preview data. Click exit to return to Live Production mode.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              toggleDemoMode(false);
              toast.success('Switched to Live Production');
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition cursor-pointer"
          >
            Exit Demo
          </button>
        </div>
      )}

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
              onSaveNotificationPreferences={() => handleSaveNotificationPreferences(false)}
              isSavingNotifications={isSavingNotifications}
              isNotificationsSaved={isNotificationsSaved}
              onAutoSaveNotifications={() => handleSaveNotificationPreferences(true)}
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
