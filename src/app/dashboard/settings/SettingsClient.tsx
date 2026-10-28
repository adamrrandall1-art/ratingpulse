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
import { saveSettingsAction, updateAiPersonaAction } from './actions';

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

  // Form input states mapped directly from initialBusiness
  const [negativeAlertEmail, setNegativeAlertEmail] = useState<string>(
    initialBusiness?.negativeAlertEmail || ''
  );

  const [negativeAlertPhone, setNegativeAlertPhone] = useState<string>(
    initialBusiness?.negativeAlertPhone || ''
  );

  const [positiveAlertEmail, setPositiveAlertEmail] = useState<string>(
    initialBusiness?.positiveAlertEmail || ''
  );

  const [positiveAlertPhone, setPositiveAlertPhone] = useState<string>(
    initialBusiness?.positiveAlertPhone || ''
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
    (initialBusiness?.brandVoice as BrandVoiceType) ||
    (initialBusiness?.aiTone as BrandVoiceType) ||
    (initialSettings?.brand_voice as BrandVoiceType) ||
    (settings.brand_voice as BrandVoiceType) ||
    'friendly_professional'
  );
  const [aiTone, setAiTone] = useState<string>(
    initialBusiness?.aiTone || initialBusiness?.brandVoice || 'friendly_professional'
  );
  const [aiInstructions, setAiInstructions] = useState<string>(
    initialBusiness?.aiInstructions || ''
  );
  const [aiSignature, setAiSignature] = useState<string>(
    initialBusiness?.aiSignature || ''
  );
  const [autoPublish5Star, setAutoPublish5Star] = useState(
    initialBusiness?.autoPublish5Star ??
    initialBusiness?.autoReplyEnabled ??
    initialSettings?.auto_publish_5_star ??
    settings.auto_publish_5_star ??
    false
  );
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(
    initialBusiness?.autoReplyEnabled ??
    initialBusiness?.autoPublish5Star ??
    false
  );
  const [smsTemplate, setSmsTemplate] = useState(
    initialBusiness?.smsTemplate ||
    initialSettings?.sms_template ||
    settings.sms_template ||
    'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}'
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    initialBusiness?.selectedModel || 'gemini-3.8-flash'
  );
  const [keywords, setKeywords] = useState<string[]>(
    initialBusiness?.customKeywords
      ? initialBusiness.customKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : (initialSettings?.custom_keywords || settings.custom_keywords || [])
  );

  // Status & Modal States
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isNotificationsSaved, setIsNotificationsSaved] = useState(false);
  const [isSavingAiPersona, setIsSavingAiPersona] = useState(false);
  const [isAiPersonaSaved, setIsAiPersonaSaved] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [sendingTestWelcome, setSendingTestWelcome] = useState(false);

  // 1. Initial mount fallback to localStorage if local state is empty
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cachedPhone = localStorage.getItem('rp_alert_phone') || localStorage.getItem('rp_negative_alert_phone');
      const cachedEmail = localStorage.getItem('rp_alert_email') || localStorage.getItem('rp_negative_alert_email');
      const cachedPosPhone = localStorage.getItem('rp_pos_alert_phone') || localStorage.getItem('rp_positive_alert_phone');
      const cachedPosEmail = localStorage.getItem('rp_pos_alert_email') || localStorage.getItem('rp_positive_alert_email');

      if (!negativeAlertPhone && cachedPhone) {
        setNegativeAlertPhone(cachedPhone);
      }
      if (!negativeAlertEmail && cachedEmail) {
        setNegativeAlertEmail(cachedEmail);
      }
      if (!positiveAlertPhone && cachedPosPhone) {
        setPositiveAlertPhone(cachedPosPhone);
      }
      if (!positiveAlertEmail && cachedPosEmail) {
        setPositiveAlertEmail(cachedPosEmail);
      }

      const cachedTone = localStorage.getItem('rp_ai_tone') as BrandVoiceType | null;
      if (cachedTone && !initialBusiness?.brandVoice && !initialBusiness?.aiTone) {
        setBrandVoice(cachedTone);
        setAiTone(cachedTone);
      }
      const cachedInstr = localStorage.getItem('rp_ai_instructions');
      if (cachedInstr && !aiInstructions) {
        setAiInstructions(cachedInstr);
      }
      const cachedSig = localStorage.getItem('rp_ai_signature');
      if (cachedSig && !aiSignature) {
        setAiSignature(cachedSig);
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage:', e);
    }
  }, []);

  // 2. Hydrate active business in store and synchronize form state with localStorage
  useEffect(() => {
    if (initialBusiness) {
      setActiveBusiness((prev: any) => ({
        ...(prev || {}),
        ...initialBusiness,
        isGoogleConnected: true,
        google_connected: true,
        isConnected: true,
      }));

      const serverNegEmail = initialBusiness.negativeAlertEmail || initialBusiness.negative_alert_email || '';
      const serverNegPhone = initialBusiness.negativeAlertPhone || initialBusiness.negative_alert_phone || '';
      const serverPosEmail = initialBusiness.positiveAlertEmail || initialBusiness.positive_alert_email || '';
      const serverPosPhone = initialBusiness.positiveAlertPhone || initialBusiness.positive_alert_phone || '';

      if (serverNegEmail) {
        setNegativeAlertEmail(serverNegEmail);
        try { localStorage.setItem('rp_alert_email', serverNegEmail); } catch {}
      } else if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('rp_alert_email') || localStorage.getItem('rp_negative_alert_email');
          if (cached) setNegativeAlertEmail(cached);
        } catch {}
      }

      if (serverNegPhone) {
        setNegativeAlertPhone(serverNegPhone);
        try { localStorage.setItem('rp_alert_phone', serverNegPhone); } catch {}
      } else if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('rp_alert_phone') || localStorage.getItem('rp_negative_alert_phone');
          if (cached) setNegativeAlertPhone(cached);
        } catch {}
      }

      if (serverPosEmail) {
        setPositiveAlertEmail(serverPosEmail);
        try { localStorage.setItem('rp_pos_alert_email', serverPosEmail); } catch {}
      } else if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('rp_pos_alert_email') || localStorage.getItem('rp_positive_alert_email');
          if (cached) setPositiveAlertEmail(cached);
        } catch {}
      }

      if (serverPosPhone) {
        setPositiveAlertPhone(serverPosPhone);
        try { localStorage.setItem('rp_pos_alert_phone', serverPosPhone); } catch {}
      } else if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('rp_pos_alert_phone') || localStorage.getItem('rp_positive_alert_phone');
          if (cached) setPositiveAlertPhone(cached);
        } catch {}
      }

      if (initialBusiness.negativeAlertsEnabled !== undefined) {
        setNegativeAlertsEnabled(Boolean(initialBusiness.negativeAlertsEnabled));
      }
      if (initialBusiness.negativeEmailAlertEnabled !== undefined) {
        setNegativeEmailAlertEnabled(Boolean(initialBusiness.negativeEmailAlertEnabled));
      }
      if (initialBusiness.negativeSmsAlertEnabled !== undefined) {
        setNegativeSmsAlertEnabled(Boolean(initialBusiness.negativeSmsAlertEnabled));
      }
      if (initialBusiness.positiveAlertsEnabled !== undefined) {
        setPositiveAlertsEnabled(Boolean(initialBusiness.positiveAlertsEnabled));
      }
      if (initialBusiness.positiveEmailAlertEnabled !== undefined) {
        setPositiveEmailAlertEnabled(Boolean(initialBusiness.positiveEmailAlertEnabled));
      }
      if (initialBusiness.positiveSmsAlertEnabled !== undefined) {
        setPositiveSmsAlertEnabled(Boolean(initialBusiness.positiveSmsAlertEnabled));
      }
      if (initialBusiness.brandVoice || initialBusiness.aiTone) {
        const tone = (initialBusiness.brandVoice || initialBusiness.aiTone) as BrandVoiceType;
        setBrandVoice(tone);
        setAiTone(tone);
        try { localStorage.setItem('rp_ai_tone', tone); } catch {}
      }
      if (initialBusiness.aiInstructions !== undefined) {
        setAiInstructions(initialBusiness.aiInstructions || '');
        try { localStorage.setItem('rp_ai_instructions', initialBusiness.aiInstructions || ''); } catch {}
      }
      if (initialBusiness.aiSignature !== undefined) {
        setAiSignature(initialBusiness.aiSignature || '');
        try { localStorage.setItem('rp_ai_signature', initialBusiness.aiSignature || ''); } catch {}
      }
      if (initialBusiness.autoReplyEnabled !== undefined || initialBusiness.autoPublish5Star !== undefined) {
        const auto = Boolean(initialBusiness.autoReplyEnabled ?? initialBusiness.autoPublish5Star);
        setAutoReplyEnabled(auto);
        setAutoPublish5Star(auto);
        try { localStorage.setItem('rp_auto_reply', String(auto)); } catch {}
      }
      if (initialBusiness.customKeywords) {
        setKeywords(initialBusiness.customKeywords.split(',').map((k: string) => k.trim()).filter(Boolean));
      }
      if (initialBusiness.selectedModel) {
        setSelectedModel(initialBusiness.selectedModel);
      }
      if (initialBusiness.smsTemplate) {
        setSmsTemplate(initialBusiness.smsTemplate);
      }
    }
  }, [initialBusiness, setActiveBusiness]);

  // Direct Server Action save executor
  const executeSave = async (overrides?: Record<string, any>) => {
    console.log('[CLIENT] Submitting settings form with values:', {
      negativeAlertEmail,
      negativeAlertPhone,
      brandVoice,
      aiInstructions,
    });

    const cleanNegEmail = (overrides?.negativeAlertEmail || overrides?.negativeEmailAddress || negativeAlertEmail || initialBusiness?.negativeAlertEmail || '').trim();
    const cleanNegPhone = (overrides?.negativeAlertPhone || overrides?.negativePhone || negativeAlertPhone || initialBusiness?.negativeAlertPhone || '').trim();
    const cleanPosEmail = (overrides?.positiveAlertEmail || overrides?.positiveEmailAddress || positiveAlertEmail || initialBusiness?.positiveAlertEmail || '').trim();
    const cleanPosPhone = (overrides?.positiveAlertPhone || positiveAlertPhone || initialBusiness?.positiveAlertPhone || '').trim();

    const currentReviewUrl =
      activeBusiness?.googleReviewUrl ||
      initialBusiness?.googleReviewUrl ||
      'https://g.page/r/Cc5qbA6YaZ6-EBM/review';

    const currentPlaceId =
      activeBusiness?.placeId ||
      initialBusiness?.placeId ||
      '';

    const targetBusinessId = activeBusiness?.id || initialBusiness?.id || '';

    const formData = new FormData();
    if (targetBusinessId) {
      formData.append('businessId', targetBusinessId);
      formData.append('id', targetBusinessId);
    }
    formData.append('negativeAlertEmail', cleanNegEmail);
    formData.append('negativeAlertPhone', cleanNegPhone);
    formData.append('positiveAlertEmail', cleanPosEmail);
    formData.append('positiveAlertPhone', cleanPosPhone);
    formData.append('googleReviewUrl', currentReviewUrl);

    const effectiveNegAlerts = overrides?.negativeAlertsEnabled ?? overrides?.notifyNegativeEnabled ?? negativeAlertsEnabled;
    const effectiveNegEmail = overrides?.negativeEmailAlertEnabled ?? overrides?.notifyNegativeEmail ?? negativeEmailAlertEnabled;
    const effectiveNegSms = overrides?.negativeSmsAlertEnabled ?? overrides?.notifyNegativeSms ?? negativeSmsAlertEnabled;
    const effectivePosAlerts = overrides?.positiveAlertsEnabled ?? overrides?.notifyPositiveEnabled ?? positiveAlertsEnabled;
    const effectivePosEmail = overrides?.positiveEmailAlertEnabled ?? overrides?.notifyPositiveEmail ?? positiveEmailAlertEnabled;
    const effectivePosSms = overrides?.positiveSmsAlertEnabled ?? overrides?.notifyPositiveSms ?? positiveSmsAlertEnabled;

    formData.append('negativeAlertsEnabled', String(effectiveNegAlerts));
    formData.append('negativeEmailAlertEnabled', String(effectiveNegEmail));
    formData.append('negativeSmsAlertEnabled', String(effectiveNegSms));
    formData.append('positiveAlertsEnabled', String(effectivePosAlerts));
    formData.append('positiveEmailAlertEnabled', String(effectivePosEmail));
    formData.append('positiveSmsAlertEnabled', String(effectivePosSms));

    const effectiveVoice = overrides?.brandVoice || overrides?.aiTone || brandVoice || aiTone;
    formData.append('brandVoice', effectiveVoice);
    formData.append('aiTone', effectiveVoice);
    formData.append('aiInstructions', overrides?.aiInstructions ?? aiInstructions);
    formData.append('aiSignature', overrides?.aiSignature ?? aiSignature);

    const effectiveAutoReply = overrides?.autoReplyEnabled ?? overrides?.autoPublish5Star ?? autoReplyEnabled ?? autoPublish5Star;
    formData.append('autoPublish5Star', String(effectiveAutoReply));
    formData.append('autoReplyEnabled', String(effectiveAutoReply));

    const effectiveModel = overrides?.selectedModel || selectedModel || 'gemini-3.8-flash';
    formData.append('selectedModel', effectiveModel);
    formData.append('smsTemplate', smsTemplate);
    const effectiveKeywords = overrides?.keywords || keywords;
    formData.append('customKeywords', Array.isArray(effectiveKeywords) ? effectiveKeywords.join(',') : String(effectiveKeywords || ''));

    const res = await saveSettingsAction(formData);
    const savedBiz = res?.business || {};

    // Safety net: persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        if (cleanNegPhone) {
          localStorage.setItem('rp_alert_phone', cleanNegPhone);
          localStorage.setItem('rp_negative_alert_phone', cleanNegPhone);
        }
        if (cleanNegEmail) {
          localStorage.setItem('rp_alert_email', cleanNegEmail);
          localStorage.setItem('rp_negative_alert_email', cleanNegEmail);
        }
        if (cleanPosPhone) {
          localStorage.setItem('rp_pos_alert_phone', cleanPosPhone);
          localStorage.setItem('rp_positive_alert_phone', cleanPosPhone);
        }
        if (cleanPosEmail) {
          localStorage.setItem('rp_pos_alert_email', cleanPosEmail);
          localStorage.setItem('rp_positive_alert_email', cleanPosEmail);
        }
        if (effectiveVoice) localStorage.setItem('rp_ai_tone', effectiveVoice);
        if (aiInstructions) localStorage.setItem('rp_ai_instructions', aiInstructions);
        if (aiSignature) localStorage.setItem('rp_ai_signature', aiSignature);
        localStorage.setItem('rp_auto_reply', String(effectiveAutoReply));
      } catch {}
    }

    // Keep active business connected and retain values in memory
    setActiveBusiness((prev: any) => ({
      ...(initialBusiness || {}),
      ...(prev || {}),
      ...(savedBiz || {}),
      isGoogleConnected: true,
      google_connected: true,
      isConnected: true,
      googleReviewUrl: currentReviewUrl,
      reviewUrl: currentReviewUrl,
      reviewLink: currentReviewUrl,
      placeId: currentPlaceId || savedBiz?.placeId || '',
      negativeAlertEmail: cleanNegEmail || prev?.negativeAlertEmail || savedBiz?.negativeAlertEmail || '',
      negativeAlertPhone: cleanNegPhone || prev?.negativeAlertPhone || savedBiz?.negativeAlertPhone || '',
      positiveAlertEmail: cleanPosEmail || prev?.positiveAlertEmail || savedBiz?.positiveAlertEmail || '',
      positiveAlertPhone: cleanPosPhone || prev?.positiveAlertPhone || savedBiz?.positiveAlertPhone || '',
      negativeAlertsEnabled: effectiveNegAlerts,
      negativeEmailAlertEnabled: effectiveNegEmail,
      negativeSmsAlertEnabled: effectiveNegSms,
      positiveAlertsEnabled: effectivePosAlerts,
      positiveEmailAlertEnabled: effectivePosEmail,
      positiveSmsAlertEnabled: effectivePosSms,
      brandVoice: effectiveVoice,
      aiTone: effectiveVoice,
      aiInstructions: overrides?.aiInstructions ?? aiInstructions,
      aiSignature: overrides?.aiSignature ?? aiSignature,
      autoPublish5Star: effectiveAutoReply,
      autoReplyEnabled: effectiveAutoReply,
    }));
  };

  const handleSaveAiPersona = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }
    setIsSavingAiPersona(true);
    try {
      const targetBusinessId = activeBusiness?.id || initialBusiness?.id;
      const res = await updateAiPersonaAction({
        businessId: targetBusinessId,
        aiTone: brandVoice || aiTone,
        brandVoice: brandVoice || aiTone,
        aiInstructions,
        aiSignature,
        autoReplyEnabled,
        autoPublish5Star: autoReplyEnabled,
        selectedModel,
        keywords,
      });
      if (res?.business) {
        setActiveBusiness((prev: any) => ({
          ...(prev || {}),
          ...res.business,
          isGoogleConnected: true,
          google_connected: true,
          isConnected: true,
        }));
      }
      setIsAiPersonaSaved(true);
      router.refresh();
      toast.success('AI Reply Persona preferences saved successfully.');
      setTimeout(() => setIsAiPersonaSaved(false), 2500);
    } catch (err: any) {
      console.error('[Save AI Persona Error]:', err);
      toast.error('Failed to save AI persona preferences', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSavingAiPersona(false);
    }
  };

  const handleSaveNotificationPreferences = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }
    console.log('[CLIENT] Submitting settings form with values:', {
      negativeAlertEmail,
      negativeAlertPhone,
    });
    setIsSavingNotifications(true);

    try {
      await executeSave();
      setIsNotificationsSaved(true);
      toast.success('Notification preferences saved successfully.');
      setTimeout(() => setIsNotificationsSaved(false), 2500);
    } catch (err: any) {
      console.error('[Save Notifications Error]:', err);
      toast.error('Failed to save notification preferences', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleToggleNotification = (field: string, value: boolean) => {
    if (field === 'negativeAlertsEnabled' || field === 'notifyNegativeEnabled') setNegativeAlertsEnabled(value);
    if (field === 'negativeEmailAlertEnabled' || field === 'notifyNegativeEmail') setNegativeEmailAlertEnabled(value);
    if (field === 'negativeSmsAlertEnabled' || field === 'notifyNegativeSms') setNegativeSmsAlertEnabled(value);
    if (field === 'positiveAlertsEnabled' || field === 'notifyPositiveEnabled') setPositiveAlertsEnabled(value);
    if (field === 'positiveEmailAlertEnabled' || field === 'notifyPositiveEmail') setPositiveEmailAlertEnabled(value);
    if (field === 'positiveSmsAlertEnabled' || field === 'notifyPositiveSms') setPositiveSmsAlertEnabled(value);
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

  // Explicit Save Handler - Invokes Next.js Server Action directly
  const handleSaveSettings = async (e?: React.FormEvent | React.MouseEvent | unknown) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }
    console.log('[CLIENT] Submitting settings form with values:', {
      negativeAlertEmail,
      negativeAlertPhone,
    });
    setIsSaving(true);
    setIsSavingNotifications(true);

    try {
      await executeSave();
      setIsSaved(true);
      setIsNotificationsSaved(true);
      toast.success('Settings Saved Successfully!', {
        description: 'Your business profile, channels, and delivery preferences have been synced to the database.',
      });
      setTimeout(() => {
        setIsSaved(false);
        setIsNotificationsSaved(false);
      }, 2500);
    } catch (err: any) {
      console.error('[Settings Save Error]:', err);
      toast.error('Failed to save settings', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSaving(false);
      setIsSavingNotifications(false);
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
            onClick={handleSaveSettings}
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
            <GbpIntegrationCard business={initialBusiness} initialBusiness={initialBusiness} />
          </div>
        )}

        {/* TAB 2: AI REPLY PERSONA */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <AiPersonaCard
              business={initialBusiness}
              initialBusiness={initialBusiness}
              brandVoice={brandVoice}
              setBrandVoice={setBrandVoice}
              aiTone={aiTone}
              setAiTone={setAiTone}
              aiInstructions={aiInstructions}
              setAiInstructions={setAiInstructions}
              aiSignature={aiSignature}
              setAiSignature={setAiSignature}
              keywords={keywords}
              setKeywords={setKeywords}
              autoPublish5Star={autoPublish5Star}
              setAutoPublish5Star={setAutoPublish5Star}
              autoReplyEnabled={autoReplyEnabled}
              setAutoReplyEnabled={setAutoReplyEnabled}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              businessName={profile.business_name}
              onSaveAiPersona={handleSaveAiPersona}
              isSavingAiPersona={isSavingAiPersona || isSaving}
              isAiPersonaSaved={isAiPersonaSaved || isSaved}
            />
          </div>
        )}

        {/* TAB 3: SMS & EMAIL CHANNELS */}
        {activeTab === 'channels' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <MessagingChannelsCard
              business={initialBusiness}
              initialBusiness={initialBusiness}
              smsTemplate={smsTemplate}
              setSmsTemplate={setSmsTemplate}
              negativeAlertsEnabled={negativeAlertsEnabled}
              setNegativeAlertsEnabled={setNegativeAlertsEnabled}
              negativeEmailAlertEnabled={negativeEmailAlertEnabled}
              setNegativeEmailAlertEnabled={setNegativeEmailAlertEnabled}
              negativeSmsAlertEnabled={negativeSmsAlertEnabled}
              setNegativeSmsAlertEnabled={setNegativeSmsAlertEnabled}
              negativeAlertEmail={negativeAlertEmail || initialBusiness?.negativeAlertEmail || ''}
              setNegativeAlertEmail={setNegativeAlertEmail}
              negativeAlertPhone={negativeAlertPhone || initialBusiness?.negativeAlertPhone || ''}
              setNegativeAlertPhone={setNegativeAlertPhone}
              positiveAlertsEnabled={positiveAlertsEnabled}
              setPositiveAlertsEnabled={setPositiveAlertsEnabled}
              positiveEmailAlertEnabled={positiveEmailAlertEnabled}
              setPositiveEmailAlertEnabled={setPositiveEmailAlertEnabled}
              positiveSmsAlertEnabled={positiveSmsAlertEnabled}
              setPositiveSmsAlertEnabled={setPositiveSmsAlertEnabled}
              positiveAlertEmail={positiveAlertEmail || initialBusiness?.positiveAlertEmail || ''}
              setPositiveAlertEmail={setPositiveAlertEmail}
              positiveAlertPhone={positiveAlertPhone || initialBusiness?.positiveAlertPhone || ''}
              setPositiveAlertPhone={setPositiveAlertPhone}
              notifyNegativeEnabled={notifyNegativeEnabled}
              setNotifyNegativeEnabled={setNotifyNegativeEnabled}
              notifyNegativeEmail={notifyNegativeEmail}
              setNotifyNegativeEmail={setNotifyNegativeEmail}
              notifyNegativeSms={notifyNegativeSms}
              setNotifyNegativeSms={setNotifyNegativeSms}
              negativeEmailAddress={negativeEmailAddress || initialBusiness?.negativeAlertEmail || ''}
              setNegativeEmailAddress={setNegativeEmailAddress}
              negativePhone={negativePhone || initialBusiness?.negativeAlertPhone || ''}
              setNegativePhone={setNegativePhone}
              notifyPositiveEnabled={notifyPositiveEnabled}
              setNotifyPositiveEnabled={setNotifyPositiveEnabled}
              notifyPositiveEmail={notifyPositiveEmail}
              setNotifyPositiveEmail={setNotifyPositiveEmail}
              notifyPositiveSms={notifyPositiveSms}
              setNotifyPositiveSms={setNotifyPositiveSms}
              positiveEmailAddress={positiveEmailAddress || initialBusiness?.positiveAlertEmail || ''}
              setPositiveEmailAddress={setPositiveEmailAddress}
              onSendTestWelcome={handleSendTestWelcome}
              sendingTestWelcome={sendingTestWelcome}
              onSaveNotificationPreferences={handleSaveNotificationPreferences}
              isSavingNotifications={isSavingNotifications || isSaving}
              isNotificationsSaved={isNotificationsSaved || isSaved}
              onToggleChange={handleToggleNotification}
            />
          </div>
        )}

        {/* TAB 4: LEGAL & QUIET HOURS */}
        {activeTab === 'compliance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <ComplianceSettingsCard business={initialBusiness} initialBusiness={initialBusiness} />
          </div>
        )}

        {/* TAB 5: ACCOUNT & BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <BillingSection business={initialBusiness} initialBusiness={initialBusiness} />

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
          onClick={handleSaveSettings}
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
