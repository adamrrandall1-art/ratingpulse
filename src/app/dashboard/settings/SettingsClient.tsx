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
import { saveAllSettingsAction, saveSettingsAction } from './actions';

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

  // Unified Atomic Settings State
  const [settingsState, setSettingsState] = useState({
    negativeAlertEmail: initialBusiness?.negativeAlertEmail || '',
    negativeAlertPhone: initialBusiness?.negativeAlertPhone || '',
    positiveAlertEmail: initialBusiness?.positiveAlertEmail || '',
    positiveAlertPhone: initialBusiness?.positiveAlertPhone || '',
    negativeAlertSmsEnabled: initialBusiness?.negativeAlertSmsEnabled ?? initialBusiness?.smsAlertsEnabled ?? initialBusiness?.negativeSmsAlertEnabled ?? false,
    smsAlertsEnabled: initialBusiness?.negativeAlertSmsEnabled ?? initialBusiness?.smsAlertsEnabled ?? initialBusiness?.negativeSmsAlertEnabled ?? false,
    negativeAlertEmailEnabled: initialBusiness?.negativeAlertEmailEnabled ?? initialBusiness?.negativeEmailAlertEnabled ?? true,
    positiveAlertSmsEnabled: initialBusiness?.positiveAlertSmsEnabled ?? initialBusiness?.positiveSmsAlertEnabled ?? false,
    positiveAlertEmailEnabled: initialBusiness?.positiveAlertEmailEnabled ?? initialBusiness?.positiveEmailAlertEnabled ?? true,
    negativeAlertsEnabled: initialBusiness?.negativeAlertsEnabled ?? true,
    positiveAlertsEnabled: initialBusiness?.positiveAlertsEnabled ?? true,
    aiTone: initialBusiness?.aiTone || initialBusiness?.brandVoice || 'friendly_professional',
    aiInstructions: initialBusiness?.aiInstructions || '',
    autoReplyEnabled: initialBusiness?.autoReplyEnabled ?? initialBusiness?.autoPublish5Star ?? false,
    selectedModel: initialBusiness?.selectedModel || 'gemini-3.8-flash',
  });

  const updateSettingsField = (field: string, value: any) => {
    setSettingsState((prev) => ({ ...prev, [field]: value }));
  };

  // Synchronize unified state on initialBusiness change without wiping entered state
  useEffect(() => {
    if (initialBusiness) {
      setSettingsState((prev) => {
        const isSms = initialBusiness.negativeAlertSmsEnabled ?? initialBusiness.smsAlertsEnabled ?? initialBusiness.negativeSmsAlertEnabled ?? prev.negativeAlertSmsEnabled;
        return {
          ...prev,
          negativeAlertEmail: prev.negativeAlertEmail || initialBusiness.negativeAlertEmail || '',
          negativeAlertPhone: prev.negativeAlertPhone || initialBusiness.negativeAlertPhone || '',
          positiveAlertEmail: prev.positiveAlertEmail || initialBusiness.positiveAlertEmail || '',
          positiveAlertPhone: prev.positiveAlertPhone || initialBusiness.positiveAlertPhone || '',
          negativeAlertSmsEnabled: isSms,
          smsAlertsEnabled: isSms,
          negativeAlertEmailEnabled: initialBusiness.negativeAlertEmailEnabled ?? initialBusiness.negativeEmailAlertEnabled ?? prev.negativeAlertEmailEnabled ?? true,
          positiveAlertSmsEnabled: initialBusiness.positiveAlertSmsEnabled ?? initialBusiness.positiveSmsAlertEnabled ?? prev.positiveAlertSmsEnabled ?? false,
          positiveAlertEmailEnabled: initialBusiness.positiveAlertEmailEnabled ?? initialBusiness.positiveEmailAlertEnabled ?? prev.positiveAlertEmailEnabled ?? true,
          negativeAlertsEnabled: initialBusiness.negativeAlertsEnabled ?? prev.negativeAlertsEnabled ?? true,
          positiveAlertsEnabled: initialBusiness.positiveAlertsEnabled ?? prev.positiveAlertsEnabled ?? true,
          aiTone: prev.aiTone || initialBusiness.aiTone || initialBusiness.brandVoice || 'friendly_professional',
          aiInstructions: prev.aiInstructions || initialBusiness.aiInstructions || '',
          autoReplyEnabled: prev.autoReplyEnabled ?? initialBusiness.autoReplyEnabled ?? initialBusiness.autoPublish5Star ?? false,
          selectedModel: prev.selectedModel || initialBusiness.selectedModel || 'gemini-3.8-flash',
        };
      });
    }
  }, [initialBusiness]);

  // Unified Notification Routing Initial Values from Server Loader
  const business = initialBusiness || activeBusiness;

  // Booleans for checkboxes/toggles bound directly to unified settingsState
  const negativeAlertsEnabled = settingsState.negativeAlertsEnabled;
  const setNegativeAlertsEnabled = (val: boolean) => updateSettingsField('negativeAlertsEnabled', val);

  const negativeEmailAlertEnabled = settingsState.negativeAlertEmailEnabled;
  const setNegativeEmailAlertEnabled = (val: boolean) => {
    updateSettingsField('negativeAlertEmailEnabled', val);
    updateSettingsField('negativeEmailAlertEnabled', val);
  };

  const negativeSmsAlertEnabled = Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled);
  const setNegativeSmsAlertEnabled = (val: boolean) => {
    setSettingsState((prev) => ({
      ...prev,
      negativeAlertSmsEnabled: val,
      smsAlertsEnabled: val,
      negativeSmsAlertEnabled: val,
    }));
  };

  const positiveAlertsEnabled = settingsState.positiveAlertsEnabled;
  const setPositiveAlertsEnabled = (val: boolean) => updateSettingsField('positiveAlertsEnabled', val);

  const positiveEmailAlertEnabled = settingsState.positiveAlertEmailEnabled;
  const setPositiveEmailAlertEnabled = (val: boolean) => {
    updateSettingsField('positiveAlertEmailEnabled', val);
    updateSettingsField('positiveEmailAlertEnabled', val);
  };

  const positiveSmsAlertEnabled = settingsState.positiveAlertSmsEnabled;
  const setPositiveSmsAlertEnabled = (val: boolean) => {
    updateSettingsField('positiveAlertSmsEnabled', val);
    updateSettingsField('positiveSmsAlertEnabled', val);
  };

  // Form input states wired to unified settingsState
  const negativeAlertEmail = settingsState.negativeAlertEmail;
  const setNegativeAlertEmail = (val: string) => updateSettingsField('negativeAlertEmail', val);

  const negativeAlertPhone = settingsState.negativeAlertPhone;
  const setNegativeAlertPhone = (val: string) => updateSettingsField('negativeAlertPhone', val);

  const positiveAlertEmail = settingsState.positiveAlertEmail;
  const setPositiveAlertEmail = (val: string) => updateSettingsField('positiveAlertEmail', val);

  const positiveAlertPhone = settingsState.positiveAlertPhone;
  const setPositiveAlertPhone = (val: string) => updateSettingsField('positiveAlertPhone', val);

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

  // AI & Automation Preferences wired to unified settingsState
  const brandVoice = (settingsState.aiTone as BrandVoiceType) || 'friendly_professional';
  const setBrandVoice = (val: BrandVoiceType) => updateSettingsField('aiTone', val);

  const aiTone = settingsState.aiTone;
  const setAiTone = (val: string) => updateSettingsField('aiTone', val);

  const aiInstructions = settingsState.aiInstructions;
  const setAiInstructions = (val: string) => updateSettingsField('aiInstructions', val);

  const [aiSignature, setAiSignature] = useState<string>(
    initialBusiness?.aiSignature || ''
  );

  const autoPublish5Star = settingsState.autoReplyEnabled;
  const setAutoPublish5Star = (val: boolean) => updateSettingsField('autoReplyEnabled', val);

  const autoReplyEnabled = settingsState.autoReplyEnabled;
  const setAutoReplyEnabled = (val: boolean) => updateSettingsField('autoReplyEnabled', val);

  const [smsTemplate, setSmsTemplate] = useState(
    initialBusiness?.smsTemplate ||
    initialSettings?.sms_template ||
    settings.sms_template ||
    'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}'
  );

  const selectedModel = settingsState.selectedModel;
  const setSelectedModel = (val: string) => updateSettingsField('selectedModel', val);
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
      if (initialBusiness.negativeAlertEmailEnabled !== undefined || initialBusiness.negativeEmailAlertEnabled !== undefined) {
        setNegativeEmailAlertEnabled(Boolean(initialBusiness.negativeAlertEmailEnabled ?? initialBusiness.negativeEmailAlertEnabled));
      }
      if (initialBusiness.negativeAlertSmsEnabled !== undefined || initialBusiness.negativeSmsAlertEnabled !== undefined) {
        setNegativeSmsAlertEnabled(Boolean(initialBusiness.negativeAlertSmsEnabled ?? initialBusiness.negativeSmsAlertEnabled));
      }
      if (initialBusiness.positiveAlertsEnabled !== undefined) {
        setPositiveAlertsEnabled(Boolean(initialBusiness.positiveAlertsEnabled));
      }
      if (initialBusiness.positiveAlertEmailEnabled !== undefined || initialBusiness.positiveEmailAlertEnabled !== undefined) {
        setPositiveEmailAlertEnabled(Boolean(initialBusiness.positiveAlertEmailEnabled ?? initialBusiness.positiveEmailAlertEnabled));
      }
      if (initialBusiness.positiveAlertSmsEnabled !== undefined || initialBusiness.positiveSmsAlertEnabled !== undefined) {
        setPositiveSmsAlertEnabled(Boolean(initialBusiness.positiveAlertSmsEnabled ?? initialBusiness.positiveSmsAlertEnabled));
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

  const handleToggleNotification = (field: string, value: boolean) => {
    if (field === 'negativeAlertsEnabled' || field === 'notifyNegativeEnabled') setNegativeAlertsEnabled(value);
    if (field === 'negativeEmailAlertEnabled' || field === 'notifyNegativeEmail') setNegativeEmailAlertEnabled(value);
    if (field === 'negativeSmsAlertEnabled' || field === 'notifyNegativeSms') setNegativeSmsAlertEnabled(value);
    if (field === 'positiveAlertsEnabled' || field === 'notifyPositiveEnabled') setPositiveAlertsEnabled(value);
    if (field === 'positiveEmailAlertEnabled' || field === 'notifyPositiveEmail') setPositiveEmailAlertEnabled(value);
    if (field === 'positiveSmsAlertEnabled' || field === 'notifyPositiveSms') setPositiveSmsAlertEnabled(value);
  };

  const handleSendTestWelcome = async () => {
    const targetEmail = settingsState.negativeAlertEmail || settingsState.positiveAlertEmail || profile.email || user?.email || 'admin@business.com';
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

  // Single Unified Atomic Save Handler - No form submit page refresh, no .reset(), no state wiping
  const handleSave = async (e?: React.MouseEvent | React.FormEvent | unknown) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }
    if (e && typeof (e as any).stopPropagation === 'function') {
      (e as any).stopPropagation();
    }

    if (isSaving) return;
    setIsSaving(true);
    setIsSavingNotifications(true);
    setIsSavingAiPersona(true);

    try {
      console.log('[SAVE_PAYLOAD] Submitting current settings:', settingsState);

      const targetBusinessId = initialBusiness?.id || activeBusiness?.id;
      const isSmsToSend = Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled ?? negativeSmsAlertEnabled);
      const res = await saveAllSettingsAction({
        businessId: targetBusinessId,
        ...settingsState,
        negativeAlertSmsEnabled: isSmsToSend,
        smsAlertsEnabled: isSmsToSend,
        negativeSmsAlertEnabled: isSmsToSend,
        googleReviewUrl: activeBusiness?.googleReviewUrl || initialBusiness?.googleReviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review',
        customKeywords: keywords.join(','),
        smsTemplate,
        negativeAlertsEnabled,
        negativeEmailAlertEnabled,
        positiveAlertsEnabled,
        positiveEmailAlertEnabled,
        positiveSmsAlertEnabled,
      });

      if (res?.success) {
        setIsSaved(true);
        setIsNotificationsSaved(true);
        setIsAiPersonaSaved(true);

        // DO NOT reset settingsState to empty values.
        // Keep the user's entered state intact or update with the returned record:
        if (res.business) {
          const returnedSms = res.business.negativeAlertSmsEnabled ?? res.business.smsAlertsEnabled ?? res.business.negativeSmsAlertEnabled;
          setSettingsState((prev) => ({
            ...prev,
            negativeAlertEmail: res.business.negativeAlertEmail ?? prev.negativeAlertEmail,
            negativeAlertPhone: res.business.negativeAlertPhone ?? prev.negativeAlertPhone,
            positiveAlertEmail: res.business.positiveAlertEmail ?? prev.positiveAlertEmail,
            positiveAlertPhone: res.business.positiveAlertPhone ?? prev.positiveAlertPhone,
            negativeAlertSmsEnabled: returnedSms ?? prev.negativeAlertSmsEnabled,
            smsAlertsEnabled: returnedSms ?? prev.smsAlertsEnabled,
            negativeAlertEmailEnabled: res.business.negativeAlertEmailEnabled ?? res.business.negativeEmailAlertEnabled ?? prev.negativeAlertEmailEnabled,
            positiveAlertSmsEnabled: res.business.positiveAlertSmsEnabled ?? res.business.positiveSmsAlertEnabled ?? prev.positiveAlertSmsEnabled,
            positiveAlertEmailEnabled: res.business.positiveAlertEmailEnabled ?? res.business.positiveEmailAlertEnabled ?? prev.positiveAlertEmailEnabled,
            negativeAlertsEnabled: res.business.negativeAlertsEnabled ?? prev.negativeAlertsEnabled,
            positiveAlertsEnabled: res.business.positiveAlertsEnabled ?? prev.positiveAlertsEnabled,
            aiTone: res.business.aiTone ?? prev.aiTone,
            aiInstructions: res.business.aiInstructions ?? prev.aiInstructions,
            autoReplyEnabled: res.business.autoReplyEnabled ?? prev.autoReplyEnabled,
            selectedModel: res.business.selectedModel ?? prev.selectedModel,
          }));

          setActiveBusiness((prev: any) => ({
            ...(prev || {}),
            ...res.business,
            isGoogleConnected: true,
            google_connected: true,
            isConnected: true,
          }));
        }

        toast.success('Settings saved successfully');

        setTimeout(() => {
          setIsSaved(false);
          setIsNotificationsSaved(false);
          setIsAiPersonaSaved(false);
        }, 2500);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
      setIsSavingNotifications(false);
      setIsSavingAiPersona(false);
    }
  };

  const handleSaveSettings = handleSave;
  const handleSaveAiPersona = handleSave;
  const handleSaveNotificationPreferences = handleSave;

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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveSettings(e); }}
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
              settingsState={settingsState}
              setSettingsState={setSettingsState}
              negativeAlertsEnabled={settingsState.negativeAlertsEnabled}
              setNegativeAlertsEnabled={(val) => updateSettingsField('negativeAlertsEnabled', val)}
              negativeAlertEmailEnabled={settingsState.negativeAlertEmailEnabled}
              setNegativeAlertEmailEnabled={(val) => updateSettingsField('negativeAlertEmailEnabled', val)}
              negativeEmailAlertEnabled={settingsState.negativeAlertEmailEnabled}
              setNegativeEmailAlertEnabled={(val) => updateSettingsField('negativeAlertEmailEnabled', val)}
              negativeAlertSmsEnabled={Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled)}
              smsAlertsEnabled={Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled)}
              setNegativeAlertSmsEnabled={(val) => {
                setSettingsState((prev) => ({
                  ...prev,
                  negativeAlertSmsEnabled: val,
                  smsAlertsEnabled: val,
                  negativeSmsAlertEnabled: val,
                }));
              }}
              setSmsAlertsEnabled={(val) => {
                setSettingsState((prev) => ({
                  ...prev,
                  negativeAlertSmsEnabled: val,
                  smsAlertsEnabled: val,
                  negativeSmsAlertEnabled: val,
                }));
              }}
              negativeSmsAlertEnabled={Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled)}
              setNegativeSmsAlertEnabled={(val) => {
                setSettingsState((prev) => ({
                  ...prev,
                  negativeAlertSmsEnabled: val,
                  smsAlertsEnabled: val,
                  negativeSmsAlertEnabled: val,
                }));
              }}
              negativeAlertEmail={settingsState.negativeAlertEmail}
              setNegativeAlertEmail={(val) => updateSettingsField('negativeAlertEmail', val)}
              negativeAlertPhone={settingsState.negativeAlertPhone}
              setNegativeAlertPhone={(val) => updateSettingsField('negativeAlertPhone', val)}
              positiveAlertsEnabled={settingsState.positiveAlertsEnabled}
              setPositiveAlertsEnabled={(val) => updateSettingsField('positiveAlertsEnabled', val)}
              positiveAlertEmailEnabled={settingsState.positiveAlertEmailEnabled}
              setPositiveAlertEmailEnabled={(val) => updateSettingsField('positiveAlertEmailEnabled', val)}
              positiveEmailAlertEnabled={settingsState.positiveAlertEmailEnabled}
              setPositiveEmailAlertEnabled={(val) => updateSettingsField('positiveAlertEmailEnabled', val)}
              positiveAlertSmsEnabled={settingsState.positiveAlertSmsEnabled}
              setPositiveAlertSmsEnabled={(val) => updateSettingsField('positiveAlertSmsEnabled', val)}
              positiveSmsAlertEnabled={settingsState.positiveAlertSmsEnabled}
              setPositiveSmsAlertEnabled={(val) => updateSettingsField('positiveAlertSmsEnabled', val)}
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveSettings(e); }}
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
