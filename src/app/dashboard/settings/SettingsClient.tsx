'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('gbp');

  // Admin Account States
  const [fullName, setFullName] = useState(
    initialProfile?.full_name || profile.full_name || user?.user_metadata?.full_name || ''
  );
  const [adminEmail, setAdminEmail] = useState(
    initialProfile?.email || user?.email || profile.email || ''
  );

  // Unified Notification Routing Initial Values from Server Loader
  const business = initialBusiness || activeBusiness;

  // Booleans for checkboxes/toggles
  const [negativeAlertsEnabled, setNegativeAlertsEnabled] = useState(
    initialNotificationSettings?.negativeAlertsEnabled ??
    business?.negativeAlertsEnabled ??
    initialSettings?.negative_alerts_enabled ??
    settings.notify_negative_enabled ??
    profile.notify_negative_enabled ??
    true
  );
  const [negativeEmailAlertEnabled, setNegativeEmailAlertEnabled] = useState(
    initialNotificationSettings?.negativeEmailAlertEnabled ??
    business?.negativeEmailAlertEnabled ??
    initialSettings?.negative_email_alert_enabled ??
    settings.notify_negative_email ??
    profile.notify_negative_email ??
    true
  );
  const [negativeSmsAlertEnabled, setNegativeSmsAlertEnabled] = useState(
    initialNotificationSettings?.negativeSmsAlertEnabled ??
    business?.negativeSmsAlertEnabled ??
    initialSettings?.negative_sms_alert_enabled ??
    settings.notify_negative_sms ??
    profile.notify_negative_sms ??
    false
  );

  const [positiveAlertsEnabled, setPositiveAlertsEnabled] = useState(
    initialNotificationSettings?.positiveAlertsEnabled ??
    business?.positiveAlertsEnabled ??
    initialSettings?.positive_alerts_enabled ??
    settings.notify_positive_enabled ??
    profile.notify_positive_enabled ??
    true
  );
  const [positiveEmailAlertEnabled, setPositiveEmailAlertEnabled] = useState(
    initialNotificationSettings?.positiveEmailAlertEnabled ??
    business?.positiveEmailAlertEnabled ??
    initialSettings?.positive_email_alert_enabled ??
    settings.notify_positive_email ??
    profile.notify_positive_email ??
    true
  );
  const [positiveSmsAlertEnabled, setPositiveSmsAlertEnabled] = useState(
    initialNotificationSettings?.positiveSmsAlertEnabled ??
    business?.positiveSmsAlertEnabled ??
    initialSettings?.positive_sms_alert_enabled ??
    settings.notify_positive_sms ??
    profile.notify_positive_sms ??
    false
  );

  // Prioritize stored custom values. Only fallback to user defaults if the custom field is strictly undefined or null on first creation:
  const rawStoredNegEmail =
    initialNotificationSettings?.negativeAlertEmail ??
    business?.negativeAlertEmail ??
    initialSettings?.negative_alert_email ??
    initialProfile?.negative_alert_email;

  const [negativeAlertEmail, setNegativeAlertEmail] = useState<string>(
    rawStoredNegEmail !== undefined && rawStoredNegEmail !== null
      ? String(rawStoredNegEmail)
      : (business?.email || user?.email || '')
  );

  const rawStoredNegPhone =
    initialNotificationSettings?.negativeAlertPhone ??
    business?.negativeAlertPhone ??
    initialSettings?.negative_alert_phone ??
    initialProfile?.negative_alert_phone;

  const [negativeAlertPhone, setNegativeAlertPhone] = useState<string>(
    rawStoredNegPhone !== undefined && rawStoredNegPhone !== null
      ? String(rawStoredNegPhone)
      : (business?.phone || '')
  );

  const rawStoredPosEmail =
    initialNotificationSettings?.positiveAlertEmail ??
    business?.positiveAlertEmail ??
    initialSettings?.positive_alert_email ??
    initialProfile?.positive_alert_email;

  const [positiveAlertEmail, setPositiveAlertEmail] = useState<string>(
    rawStoredPosEmail !== undefined && rawStoredPosEmail !== null
      ? String(rawStoredPosEmail)
      : ''
  );

  const rawStoredPosPhone =
    initialNotificationSettings?.positiveAlertPhone ??
    business?.positiveAlertPhone ??
    initialSettings?.positive_alert_phone ??
    initialProfile?.positive_alert_phone;

  const [positiveAlertPhone, setPositiveAlertPhone] = useState<string>(
    rawStoredPosPhone !== undefined && rawStoredPosPhone !== null
      ? String(rawStoredPosPhone)
      : ''
  );

  // Aliases for full compatibility
  const notifyNegativeEnabled = negativeAlertsEnabled;
  const setNotifyNegativeEnabled = setNegativeAlertsEnabled;
  const notifyNegativeEmail = negativeEmailAlertEnabled;
  const setNotifyNegativeEmail = setNegativeEmailAlertEnabled;
  const notifyNegativeSms = negativeSmsAlertEnabled;
  const setNotifyNegativeSms = setNegativeSmsAlertEnabled;
  const negativeEmailAddress = negativeAlertEmail;
  const setNegativeEmailAddress = setNegativeAlertEmail;
  const negativePhone = negativeAlertPhone;
  const setNegativePhone = setNegativeAlertPhone;

  const notifyPositiveEnabled = positiveAlertsEnabled;
  const setNotifyPositiveEnabled = setPositiveAlertsEnabled;
  const notifyPositiveEmail = positiveEmailAlertEnabled;
  const setNotifyPositiveEmail = setPositiveEmailAlertEnabled;
  const notifyPositiveSms = positiveSmsAlertEnabled;
  const setNotifyPositiveSms = setPositiveSmsAlertEnabled;
  const positiveEmailAddress = positiveAlertEmail;
  const setPositiveEmailAddress = setPositiveAlertEmail;

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

  const freshSettingsLoadedRef = React.useRef(false);

  // Load fresh settings form fields on mount without overwriting active business or populated inputs
  useEffect(() => {
    if (freshSettingsLoadedRef.current) return;
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
            freshSettingsLoadedRef.current = true;
            const p = json.profile;
            const s = json.settings;
            const b = json.business;

            if (p?.full_name) setFullName(p.full_name);
            if (p?.email) setAdminEmail(p.email);

            if (b && isBusinessConnected(b)) {
              setActiveBusiness(b);
            }

            // Strictly string-only resolution for notification routing inputs
            const resolvedNegativePhone =
              (typeof json.notificationSettings?.negativeAlertPhone === 'string' && json.notificationSettings.negativeAlertPhone) ||
              (typeof b?.negativeAlertPhone === 'string' && b.negativeAlertPhone) ||
              (typeof s?.negative_alert_phone === 'string' && s.negative_alert_phone) ||
              (typeof p?.negative_alert_phone === 'string' && p.negative_alert_phone) ||
              '';

            if (resolvedNegativePhone && resolvedNegativePhone.trim().length > 0) {
              setNegativeAlertPhone((prev: string) => (prev ? prev : resolvedNegativePhone));
            }

            const resolvedPositivePhone =
              (typeof json.notificationSettings?.positiveAlertPhone === 'string' && json.notificationSettings.positiveAlertPhone) ||
              (typeof b?.positiveAlertPhone === 'string' && b.positiveAlertPhone) ||
              (typeof s?.positive_alert_phone === 'string' && s.positive_alert_phone) ||
              (typeof p?.positive_alert_phone === 'string' && p.positive_alert_phone) ||
              '';

            if (resolvedPositivePhone && resolvedPositivePhone.trim().length > 0) {
              setPositiveAlertPhone((prev: string) => (prev ? prev : resolvedPositivePhone));
            }

            const resolvedNegEmail =
              (typeof json.notificationSettings?.negativeAlertEmail === 'string' && json.notificationSettings.negativeAlertEmail) ||
              (typeof b?.negativeAlertEmail === 'string' && b.negativeAlertEmail) ||
              (typeof s?.negative_alert_email === 'string' && s.negative_alert_email) ||
              (typeof p?.negative_alert_email === 'string' && p.negative_alert_email) ||
              '';

            if (resolvedNegEmail && resolvedNegEmail.trim().length > 0) {
              setNegativeAlertEmail((prev: string) => (prev ? prev : resolvedNegEmail));
            }

            const resolvedPosEmail =
              (typeof json.notificationSettings?.positiveAlertEmail === 'string' && json.notificationSettings.positiveAlertEmail) ||
              (typeof b?.positiveAlertEmail === 'string' && b.positiveAlertEmail) ||
              (typeof s?.positive_alert_email === 'string' && s.positive_alert_email) ||
              (typeof p?.positive_alert_email === 'string' && p.positive_alert_email) ||
              '';

            if (resolvedPosEmail && resolvedPosEmail.trim().length > 0) {
              setPositiveAlertEmail((prev: string) => (prev ? prev : resolvedPosEmail));
            }

            if (s?.notify_negative_enabled !== undefined && s?.notify_negative_enabled !== null) {
              setNegativeAlertsEnabled(Boolean(s.notify_negative_enabled));
            }
            if (s?.notify_negative_email !== undefined && s?.notify_negative_email !== null) {
              setNegativeEmailAlertEnabled(Boolean(s.notify_negative_email));
            }
            if (s?.notify_negative_sms !== undefined && s?.notify_negative_sms !== null) {
              setNegativeSmsAlertEnabled(Boolean(s.notify_negative_sms));
            }
            if (s?.notify_positive_enabled !== undefined && s?.notify_positive_enabled !== null) {
              setPositiveAlertsEnabled(Boolean(s.notify_positive_enabled));
            }
            if (s?.notify_positive_email !== undefined && s?.notify_positive_email !== null) {
              setPositiveEmailAlertEnabled(Boolean(s.notify_positive_email));
            }
            if (s?.notify_positive_sms !== undefined && s?.notify_positive_sms !== null) {
              setPositiveSmsAlertEnabled(Boolean(s.notify_positive_sms));
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
  const handleSaveNotificationPreferences = async (
    silent = false,
    overrides?: {
      negativeAlertsEnabled?: boolean;
      negativeEmailAlertEnabled?: boolean;
      negativeSmsAlertEnabled?: boolean;
      positiveAlertsEnabled?: boolean;
      positiveEmailAlertEnabled?: boolean;
      positiveSmsAlertEnabled?: boolean;
      negativeAlertPhone?: string;
      negativeAlertEmail?: string;
      positiveAlertPhone?: string;
      positiveAlertEmail?: string;
      notifyNegativeEnabled?: boolean;
      notifyNegativeEmail?: boolean;
      notifyNegativeSms?: boolean;
      notifyPositiveEnabled?: boolean;
      notifyPositiveEmail?: boolean;
      notifyPositiveSms?: boolean;
      negativePhone?: string;
      negativeEmailAddress?: string;
      positiveEmailAddress?: string;
      [key: string]: any;
    }
  ) => {
    if (!silent) setIsSavingNotifications(true);

    try {
      const activeUserId = user?.id || profile.id;
      const targetNegPhone = (overrides?.negativeAlertPhone ?? overrides?.negativePhone ?? negativeAlertPhone ?? '').trim();
      const targetNegEmail = (overrides?.negativeAlertEmail ?? overrides?.negativeEmailAddress ?? negativeAlertEmail ?? '').trim();
      const targetPosPhone = (overrides?.positiveAlertPhone ?? positiveAlertPhone ?? '').trim();
      const targetPosEmail = (overrides?.positiveAlertEmail ?? overrides?.positiveEmailAddress ?? positiveAlertEmail ?? '').trim();

      const effectiveNegativeAlertsEnabled = overrides?.negativeAlertsEnabled !== undefined
        ? overrides.negativeAlertsEnabled
        : (overrides?.notifyNegativeEnabled !== undefined ? overrides.notifyNegativeEnabled : negativeAlertsEnabled);

      const effectiveNegativeEmailAlertEnabled = overrides?.negativeEmailAlertEnabled !== undefined
        ? overrides.negativeEmailAlertEnabled
        : (overrides?.notifyNegativeEmail !== undefined ? overrides.notifyNegativeEmail : negativeEmailAlertEnabled);

      const effectiveNegativeSmsAlertEnabled = overrides?.negativeSmsAlertEnabled !== undefined
        ? overrides.negativeSmsAlertEnabled
        : (overrides?.notifyNegativeSms !== undefined ? overrides.notifyNegativeSms : negativeSmsAlertEnabled);

      const effectivePositiveAlertsEnabled = overrides?.positiveAlertsEnabled !== undefined
        ? overrides.positiveAlertsEnabled
        : (overrides?.notifyPositiveEnabled !== undefined ? overrides.notifyPositiveEnabled : positiveAlertsEnabled);

      const effectivePositiveEmailAlertEnabled = overrides?.positiveEmailAlertEnabled !== undefined
        ? overrides.positiveEmailAlertEnabled
        : (overrides?.notifyPositiveEmail !== undefined ? overrides.notifyPositiveEmail : positiveEmailAlertEnabled);

      const effectivePositiveSmsAlertEnabled = overrides?.positiveSmsAlertEnabled !== undefined
        ? overrides.positiveSmsAlertEnabled
        : (overrides?.notifyPositiveSms !== undefined ? overrides.notifyPositiveSms : positiveSmsAlertEnabled);

      const payload = {
        userId: activeUserId,
        activeBusinessId: activeUserId,
        negativeAlertEmail: targetNegEmail,
        negativeAlertPhone: targetNegPhone,
        negativeAlertsEnabled: effectiveNegativeAlertsEnabled,
        negativeEmailAlertEnabled: effectiveNegativeEmailAlertEnabled,
        negativeSmsAlertEnabled: effectiveNegativeSmsAlertEnabled,
        positiveAlertEmail: targetPosEmail,
        positiveAlertPhone: targetPosPhone,
        positiveAlertsEnabled: effectivePositiveAlertsEnabled,
        positiveEmailAlertEnabled: effectivePositiveEmailAlertEnabled,
        positiveSmsAlertEnabled: effectivePositiveSmsAlertEnabled,
        // snake_case aliases
        notify_negative_phone: targetNegPhone,
        notify_negative_email: effectiveNegativeEmailAlertEnabled,
        notify_negative_sms: effectiveNegativeSmsAlertEnabled,
        notify_negative_enabled: effectiveNegativeAlertsEnabled,
        notify_positive_phone: targetPosPhone,
        notify_positive_email: effectivePositiveEmailAlertEnabled,
        notify_positive_sms: effectivePositiveSmsAlertEnabled,
        notify_positive_enabled: effectivePositiveAlertsEnabled,
        notification_phone: targetNegPhone,
        notification_email: targetNegEmail,
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

      // Do NOT call updateProfile or updateSettings which fire secondary destructive POST requests
      // Update local notification state and business to match returned updatedBusiness:
      const updatedBusiness = resData.business;
      if (updatedBusiness) {
        setActiveBusiness({
          ...(activeBusiness || {}),
          ...updatedBusiness,
          isGoogleConnected: Boolean(activeBusiness?.isGoogleConnected || initialBusiness?.isGoogleConnected || updatedBusiness.isGoogleConnected),
          isConnected: Boolean(activeBusiness?.isConnected || initialBusiness?.isConnected || updatedBusiness.isConnected),
          googleReviewUrl: updatedBusiness.googleReviewUrl || activeBusiness?.googleReviewUrl || initialBusiness?.googleReviewUrl || '',
          reviewUrl: updatedBusiness.reviewUrl || activeBusiness?.reviewUrl || initialBusiness?.reviewUrl || '',
          placeId: updatedBusiness.placeId || activeBusiness?.placeId || initialBusiness?.placeId || '',
        });

        if (updatedBusiness.negativeAlertEmail !== undefined) setNegativeAlertEmail(updatedBusiness.negativeAlertEmail || '');
        if (updatedBusiness.negativeAlertPhone !== undefined) setNegativeAlertPhone(updatedBusiness.negativeAlertPhone || '');
        if (updatedBusiness.positiveAlertEmail !== undefined) setPositiveAlertEmail(updatedBusiness.positiveAlertEmail || '');
        if (updatedBusiness.positiveAlertPhone !== undefined) setPositiveAlertPhone(updatedBusiness.positiveAlertPhone || '');
        if (updatedBusiness.negativeAlertsEnabled !== undefined) setNegativeAlertsEnabled(Boolean(updatedBusiness.negativeAlertsEnabled));
        if (updatedBusiness.negativeEmailAlertEnabled !== undefined) setNegativeEmailAlertEnabled(Boolean(updatedBusiness.negativeEmailAlertEnabled));
        if (updatedBusiness.negativeSmsAlertEnabled !== undefined) setNegativeSmsAlertEnabled(Boolean(updatedBusiness.negativeSmsAlertEnabled));
        if (updatedBusiness.positiveAlertsEnabled !== undefined) setPositiveAlertsEnabled(Boolean(updatedBusiness.positiveAlertsEnabled));
        if (updatedBusiness.positiveEmailAlertEnabled !== undefined) setPositiveEmailAlertEnabled(Boolean(updatedBusiness.positiveEmailAlertEnabled));
        if (updatedBusiness.positiveSmsAlertEnabled !== undefined) setPositiveSmsAlertEnabled(Boolean(updatedBusiness.positiveSmsAlertEnabled));
      } else {
        setActiveBusiness({
          ...(activeBusiness || {}),
          negativeAlertEmail: targetNegEmail,
          negativeAlertPhone: targetNegPhone,
          positiveAlertEmail: targetPosEmail,
          positiveAlertPhone: targetPosPhone,
          negativeAlertsEnabled: effectiveNegativeAlertsEnabled,
          negativeEmailAlertEnabled: effectiveNegativeEmailAlertEnabled,
          negativeSmsAlertEnabled: effectiveNegativeSmsAlertEnabled,
          positiveAlertsEnabled: effectivePositiveAlertsEnabled,
          positiveEmailAlertEnabled: effectivePositiveEmailAlertEnabled,
          positiveSmsAlertEnabled: effectivePositiveSmsAlertEnabled,
          isGoogleConnected: Boolean(activeBusiness?.isGoogleConnected || initialBusiness?.isGoogleConnected),
          isConnected: Boolean(activeBusiness?.isConnected || initialBusiness?.isConnected),
        });
      }

      router.refresh();

      if (silent) {
        toast.success('Notification preferences saved successfully.', { duration: 2000 });
      } else {
        setIsNotificationsSaved(true);
        toast.success('Notification preferences saved successfully.');
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

  const handleToggleNotification = (field: string, value: boolean) => {
    if (field === 'negativeAlertsEnabled' || field === 'notifyNegativeEnabled') setNegativeAlertsEnabled(value);
    if (field === 'negativeEmailAlertEnabled' || field === 'notifyNegativeEmail') setNegativeEmailAlertEnabled(value);
    if (field === 'negativeSmsAlertEnabled' || field === 'notifyNegativeSms') setNegativeSmsAlertEnabled(value);
    if (field === 'positiveAlertsEnabled' || field === 'notifyPositiveEnabled') setPositiveAlertsEnabled(value);
    if (field === 'positiveEmailAlertEnabled' || field === 'notifyPositiveEmail') setPositiveEmailAlertEnabled(value);
    if (field === 'positiveSmsAlertEnabled' || field === 'notifyPositiveSms') setPositiveSmsAlertEnabled(value);

    handleSaveNotificationPreferences(true, { [field]: value });
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
      const cleanNegEmail = (negativeAlertEmail || '').trim();
      const cleanNegPhone = (negativeAlertPhone || '').trim();
      const cleanPosEmail = (positiveAlertEmail || '').trim();
      const cleanPosPhone = (positiveAlertPhone || '').trim();

      const primaryNotificationEmail = cleanNegEmail || cleanPosEmail || profile.email || user?.email || '';
      const primaryNotificationPhone = cleanNegPhone || cleanPosPhone || profile.phone || '';

      const activeUserId = user?.id || profile.id;

      // Post to Server-Side Settings API with protection for review URL & connection state
      const payload: Record<string, unknown> = {
        userId: activeUserId,
        activeBusinessId: activeUserId,
        businessId: activeUserId,
        full_name: fullName,
        notification_email: primaryNotificationEmail,
        notification_phone: primaryNotificationPhone,
        notify_negative_phone: cleanNegPhone,
        notify_positive_phone: cleanPosPhone,
        alert_phone: cleanNegPhone,
        phone: cleanNegPhone || profile.phone,
        smsSenderNumber: cleanNegPhone || profile.phone,
        emailSender: primaryNotificationEmail,
        sms_alerts_enabled: negativeSmsAlertEnabled || positiveSmsAlertEnabled,
        notify_negative_enabled: negativeAlertsEnabled,
        notify_negative_email: negativeEmailAlertEnabled,
        notify_negative_sms: negativeSmsAlertEnabled,
        notify_positive_enabled: positiveAlertsEnabled,
        notify_positive_email: positiveEmailAlertEnabled,
        notify_positive_sms: positiveSmsAlertEnabled,
        negativeAlertEmail: cleanNegEmail,
        negativeAlertPhone: cleanNegPhone,
        negativeAlertsEnabled: negativeAlertsEnabled,
        negativeEmailAlertEnabled: negativeEmailAlertEnabled,
        negativeSmsAlertEnabled: negativeSmsAlertEnabled,
        positiveAlertEmail: cleanPosEmail,
        positiveAlertPhone: cleanPosPhone,
        positiveAlertsEnabled: positiveAlertsEnabled,
        positiveEmailAlertEnabled: positiveEmailAlertEnabled,
        positiveSmsAlertEnabled: positiveSmsAlertEnabled,
        brand_voice: brandVoice,
        auto_publish_5_star: autoPublish5Star,
        sms_template: smsTemplate,
        custom_keywords: keywords,
      };

      const effectiveReviewUrl =
        activeBusiness?.googleReviewUrl ||
        activeBusiness?.reviewUrl ||
        initialBusiness?.googleReviewUrl ||
        initialBusiness?.reviewUrl ||
        '';

      const effectivePlaceId =
        activeBusiness?.placeId ||
        initialBusiness?.placeId ||
        '';

      const isConnected =
        isBusinessConnected(activeBusiness) ||
        isBusinessConnected(initialBusiness);

      if (effectiveReviewUrl) {
        payload.googleReviewUrl = effectiveReviewUrl;
        payload.review_url = effectiveReviewUrl;
      }
      if (effectivePlaceId) {
        payload.place_id = effectivePlaceId;
        payload.google_place_id = effectivePlaceId;
      }
      if (isConnected || effectiveReviewUrl) {
        payload.google_connected = true;
      }

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

      // Also ensure isolated notification fields are saved via dedicated endpoint
      await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});

      const updatedBiz = resData.business;
      if (updatedBiz) {
        setActiveBusiness({
          ...(activeBusiness || {}),
          ...updatedBiz,
          isGoogleConnected: Boolean(activeBusiness?.isGoogleConnected || initialBusiness?.isGoogleConnected || updatedBiz.isGoogleConnected || isConnected),
          isConnected: Boolean(activeBusiness?.isConnected || initialBusiness?.isConnected || updatedBiz.isConnected || isConnected),
          googleReviewUrl: updatedBiz.googleReviewUrl || activeBusiness?.googleReviewUrl || initialBusiness?.googleReviewUrl || effectiveReviewUrl,
          reviewUrl: updatedBiz.reviewUrl || activeBusiness?.reviewUrl || initialBusiness?.reviewUrl || effectiveReviewUrl,
          placeId: updatedBiz.placeId || activeBusiness?.placeId || initialBusiness?.placeId || effectivePlaceId,
          negativeAlertEmail: cleanNegEmail,
          negativeAlertPhone: cleanNegPhone,
          positiveAlertEmail: cleanPosEmail,
          positiveAlertPhone: cleanPosPhone,
          negativeAlertsEnabled,
          negativeEmailAlertEnabled,
          negativeSmsAlertEnabled,
          positiveAlertsEnabled,
          positiveEmailAlertEnabled,
          positiveSmsAlertEnabled,
        });
      } else {
        setActiveBusiness({
          ...(activeBusiness || {}),
          negativeAlertEmail: cleanNegEmail,
          negativeAlertPhone: cleanNegPhone,
          positiveAlertEmail: cleanPosEmail,
          positiveAlertPhone: cleanPosPhone,
          negativeAlertsEnabled,
          negativeEmailAlertEnabled,
          negativeSmsAlertEnabled,
          positiveAlertsEnabled,
          positiveEmailAlertEnabled,
          positiveSmsAlertEnabled,
          phone: primaryNotificationPhone || activeBusiness?.phone || '',
          isGoogleConnected: Boolean(activeBusiness?.isGoogleConnected || initialBusiness?.isGoogleConnected || isConnected),
          isConnected: Boolean(activeBusiness?.isConnected || initialBusiness?.isConnected || isConnected),
          googleReviewUrl: activeBusiness?.googleReviewUrl || initialBusiness?.googleReviewUrl || effectiveReviewUrl,
          reviewUrl: activeBusiness?.reviewUrl || initialBusiness?.reviewUrl || effectiveReviewUrl,
          placeId: activeBusiness?.placeId || initialBusiness?.placeId || effectivePlaceId,
        });
      }

      router.refresh();

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
              negativeAlertsEnabled={negativeAlertsEnabled}
              setNegativeAlertsEnabled={setNegativeAlertsEnabled}
              negativeEmailAlertEnabled={negativeEmailAlertEnabled}
              setNegativeEmailAlertEnabled={setNegativeEmailAlertEnabled}
              negativeSmsAlertEnabled={negativeSmsAlertEnabled}
              setNegativeSmsAlertEnabled={setNegativeSmsAlertEnabled}
              negativeAlertEmail={negativeAlertEmail}
              setNegativeAlertEmail={setNegativeAlertEmail}
              negativeAlertPhone={negativeAlertPhone}
              setNegativeAlertPhone={setNegativeAlertPhone}
              positiveAlertsEnabled={positiveAlertsEnabled}
              setPositiveAlertsEnabled={setPositiveAlertsEnabled}
              positiveEmailAlertEnabled={positiveEmailAlertEnabled}
              setPositiveEmailAlertEnabled={setPositiveEmailAlertEnabled}
              positiveSmsAlertEnabled={positiveSmsAlertEnabled}
              setPositiveSmsAlertEnabled={setPositiveSmsAlertEnabled}
              positiveAlertEmail={positiveAlertEmail}
              setPositiveAlertEmail={setPositiveAlertEmail}
              positiveAlertPhone={positiveAlertPhone}
              setPositiveAlertPhone={setPositiveAlertPhone}
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
              onToggleChange={handleToggleNotification}
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
