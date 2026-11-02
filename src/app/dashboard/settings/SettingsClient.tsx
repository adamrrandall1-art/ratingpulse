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

type TabKey = 'gbp' | 'ai' | 'ai-persona' | 'channels' | 'compliance' | 'billing';

const STORAGE_KEY = 'rp_persisted_settings_v1';
const TAB_STORAGE_KEY = 'rp_settings_tab';

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

  const [activeTab, setActiveTabState] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryTab = params.get('tab') || params.get('activeTab');
        if (queryTab && ['gbp', 'ai', 'ai-persona', 'channels', 'compliance', 'billing'].includes(queryTab)) {
          return (queryTab === 'ai-persona' ? 'ai' : queryTab) as TabKey;
        }
        const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY) || localStorage.getItem(TAB_STORAGE_KEY);
        if (savedTab && ['gbp', 'ai', 'ai-persona', 'channels', 'compliance', 'billing'].includes(savedTab)) {
          return (savedTab === 'ai-persona' ? 'ai' : savedTab) as TabKey;
        }
      } catch {}
    }
    return 'gbp';
  });

  const setActiveTab = (tab: TabKey) => {
    const canonicalTab = (tab === 'ai-persona' ? 'ai' : tab) as TabKey;
    setActiveTabState(canonicalTab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(TAB_STORAGE_KEY, canonicalTab);
        localStorage.setItem(TAB_STORAGE_KEY, canonicalTab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', canonicalTab);
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  // Admin Account States
  const [fullName, setFullName] = useState(
    initialProfile?.full_name || profile.full_name || user?.user_metadata?.full_name || ''
  );
  const [adminEmail, setAdminEmail] = useState(
    initialProfile?.email || user?.email || profile.email || ''
  );

  // Helper to persist to localStorage safely
  const persistToLocalStorage = (data: Partial<any>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write settings to localStorage:', e);
    }
  };

  // Build default settings from initialBusiness
  const buildInitialSettings = (biz: any) => {
    const isSms = biz?.negativeAlertSmsEnabled ?? biz?.smsAlertsEnabled ?? biz?.negativeSmsAlertEnabled ?? true;
    const tone = biz?.brandVoice || biz?.brand_voice || biz?.aiPersonality || biz?.aiTone || 'friendly_professional';
    const bizKw = biz?.seoKeywords || biz?.customKeywords;
    return {
      negativeAlertEmail: biz?.negativeAlertEmail || '',
      negativeAlertPhone: biz?.negativeAlertPhone || '',
      positiveAlertEmail: biz?.positiveAlertEmail || '',
      positiveAlertPhone: biz?.positiveAlertPhone || '',
      negativeAlertSmsEnabled: Boolean(isSms),
      smsAlertsEnabled: Boolean(isSms),
      negativeAlertEmailEnabled: biz?.negativeAlertEmailEnabled ?? biz?.negativeEmailAlertEnabled ?? true,
      positiveAlertSmsEnabled: biz?.positiveAlertSmsEnabled ?? biz?.positiveSmsAlertEnabled ?? false,
      positiveAlertEmailEnabled: biz?.positiveAlertEmailEnabled ?? biz?.positiveEmailAlertEnabled ?? true,
      negativeAlertsEnabled: biz?.negativeAlertsEnabled ?? true,
      positiveAlertsEnabled: biz?.positiveAlertsEnabled ?? true,
      aiTone: tone,
      aiPersonality: tone,
      brandVoice: tone,
      aiInstructions: biz?.aiInstructions || '',
      aiSignature: biz?.aiSignature || '',
      autoReplyEnabled: Boolean(biz?.autoReplyEnabled ?? biz?.autoPublish5Star ?? false),
      selectedModel: biz?.selectedModel || 'gemini-1.5-flash',
      smsTemplate: biz?.smsTemplate || initialSettings?.sms_template || settings.sms_template || 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}',
      keywords: bizKw
        ? bizKw.split(',').map((k: string) => k.trim()).filter(Boolean)
        : (initialSettings?.custom_keywords || settings.custom_keywords || []),
      seoKeywords: bizKw || '',
      customKeywords: bizKw || '',
    };
  };

  // Unified Atomic Settings State initialized from localStorage first, falling back to initialBusiness
  const [settingsState, setSettingsState] = useState(() => {
    const fallback = buildInitialSettings(initialBusiness);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...fallback,
            ...parsed,
            negativeAlertSmsEnabled: parsed.negativeAlertSmsEnabled !== undefined ? Boolean(parsed.negativeAlertSmsEnabled) : fallback.negativeAlertSmsEnabled,
            smsAlertsEnabled: parsed.smsAlertsEnabled !== undefined ? Boolean(parsed.smsAlertsEnabled) : (parsed.negativeAlertSmsEnabled !== undefined ? Boolean(parsed.negativeAlertSmsEnabled) : fallback.smsAlertsEnabled),
            autoReplyEnabled: parsed.autoReplyEnabled !== undefined ? Boolean(parsed.autoReplyEnabled) : fallback.autoReplyEnabled,
          };
        }
      } catch (e) {
        console.warn('Failed to parse settings from localStorage:', e);
      }
    }
    return fallback;
  });

  const updateSettingsField = (field: string, value: any) => {
    setSettingsState((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field === 'negativeAlertSmsEnabled' || field === 'smsAlertsEnabled' || field === 'negativeSmsAlertEnabled') {
        const boolVal = Boolean(value);
        next.negativeAlertSmsEnabled = boolVal;
        next.smsAlertsEnabled = boolVal;
        next.negativeSmsAlertEnabled = boolVal;
      }
      if (field === 'negativeAlertEmailEnabled' || field === 'negativeEmailAlertEnabled') {
        next.negativeAlertEmailEnabled = Boolean(value);
      }
      if (field === 'positiveAlertSmsEnabled' || field === 'positiveSmsAlertEnabled') {
        next.positiveAlertSmsEnabled = Boolean(value);
      }
      if (field === 'positiveAlertEmailEnabled' || field === 'positiveEmailAlertEnabled') {
        next.positiveAlertEmailEnabled = Boolean(value);
      }
      if (field === 'aiTone' || field === 'brandVoice' || field === 'aiPersonality') {
        next.aiTone = value;
        next.brandVoice = value;
        next.aiPersonality = value;
      }
      if (field === 'autoReplyEnabled' || field === 'autoPublish5Star') {
        next.autoReplyEnabled = Boolean(value);
        next.autoPublish5Star = Boolean(value);
      }
      if (field === 'keywords' || field === 'seoKeywords' || field === 'customKeywords') {
        const kwArr = Array.isArray(value)
          ? value
          : (typeof value === 'string' ? value.split(',').map((k: string) => k.trim()).filter(Boolean) : []);
        next.keywords = kwArr;
        next.seoKeywords = kwArr.join(',');
        next.customKeywords = kwArr.join(',');
      }
      persistToLocalStorage(next);
      return next;
    });
  };

  const setUnifiedSettingsState: React.Dispatch<React.SetStateAction<any>> = (action: any) => {
    setSettingsState((prev: any) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isSms = next.negativeAlertSmsEnabled ?? next.smsAlertsEnabled ?? prev.negativeAlertSmsEnabled;
      const tone = next.aiPersonality ?? next.aiTone ?? next.brandVoice ?? prev.aiTone;
      const merged = {
        ...prev,
        ...next,
        negativeAlertSmsEnabled: Boolean(isSms),
        smsAlertsEnabled: Boolean(isSms),
        aiTone: tone,
        aiPersonality: tone,
        brandVoice: tone,
      };
      persistToLocalStorage(merged);
      return merged;
    });
  };

  // Synchronize on mount and initialBusiness changes with dual-layer localStorage fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cachedSettings: Record<string, any> | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cachedSettings = JSON.parse(stored);
      }
    } catch {}

    setSettingsState((prev: any) => {
      const next = {
        ...prev,
        ...(cachedSettings || {}),
      };

      if (initialBusiness) {
        if (initialBusiness.negativeAlertEmail) next.negativeAlertEmail = initialBusiness.negativeAlertEmail;
        if (initialBusiness.negativeAlertPhone) next.negativeAlertPhone = initialBusiness.negativeAlertPhone;
        if (initialBusiness.positiveAlertEmail) next.positiveAlertEmail = initialBusiness.positiveAlertEmail;
        if (initialBusiness.positiveAlertPhone) next.positiveAlertPhone = initialBusiness.positiveAlertPhone;

        const isSms = initialBusiness.negativeAlertSmsEnabled ?? initialBusiness.smsAlertsEnabled ?? initialBusiness.negativeSmsAlertEnabled;
        if (isSms !== undefined) {
          if (cachedSettings?.negativeAlertSmsEnabled !== undefined) {
            next.negativeAlertSmsEnabled = Boolean(cachedSettings.negativeAlertSmsEnabled);
            next.smsAlertsEnabled = Boolean(cachedSettings.negativeAlertSmsEnabled);
          } else {
            next.negativeAlertSmsEnabled = Boolean(isSms);
            next.smsAlertsEnabled = Boolean(isSms);
          }
        }

        if (initialBusiness.negativeAlertEmailEnabled !== undefined || initialBusiness.negativeEmailAlertEnabled !== undefined) {
          next.negativeAlertEmailEnabled = Boolean(initialBusiness.negativeAlertEmailEnabled ?? initialBusiness.negativeEmailAlertEnabled);
        }
        if (initialBusiness.positiveAlertSmsEnabled !== undefined || initialBusiness.positiveSmsAlertEnabled !== undefined) {
          next.positiveAlertSmsEnabled = Boolean(initialBusiness.positiveAlertSmsEnabled ?? initialBusiness.positiveSmsAlertEnabled);
        }
        if (initialBusiness.positiveAlertEmailEnabled !== undefined || initialBusiness.positiveEmailAlertEnabled !== undefined) {
          next.positiveAlertEmailEnabled = Boolean(initialBusiness.positiveAlertEmailEnabled ?? initialBusiness.positiveEmailAlertEnabled);
        }
        if (initialBusiness.negativeAlertsEnabled !== undefined) {
          next.negativeAlertsEnabled = Boolean(initialBusiness.negativeAlertsEnabled);
        }
        if (initialBusiness.positiveAlertsEnabled !== undefined) {
          next.positiveAlertsEnabled = Boolean(initialBusiness.positiveAlertsEnabled);
        }

        if (initialBusiness.aiPersonality || initialBusiness.aiTone || initialBusiness.brandVoice || initialBusiness.brand_voice) {
          const t = initialBusiness.brandVoice || initialBusiness.brand_voice || initialBusiness.aiPersonality || initialBusiness.aiTone;
          next.aiTone = t;
          next.aiPersonality = t;
          next.brandVoice = t;
          setBrandVoiceState(t);
        }
        if (initialBusiness.aiInstructions !== undefined && initialBusiness.aiInstructions !== null) {
          next.aiInstructions = initialBusiness.aiInstructions;
        }
        if (initialBusiness.aiSignature !== undefined && initialBusiness.aiSignature !== null) {
          next.aiSignature = initialBusiness.aiSignature;
        }
        if (initialBusiness.autoReplyEnabled !== undefined || initialBusiness.autoPublish5Star !== undefined) {
          next.autoReplyEnabled = Boolean(initialBusiness.autoReplyEnabled ?? initialBusiness.autoPublish5Star);
        }
        if (initialBusiness.selectedModel) {
          next.selectedModel = initialBusiness.selectedModel;
        }
        if (initialBusiness.smsTemplate) {
          next.smsTemplate = initialBusiness.smsTemplate;
        }
        const bKw = initialBusiness.seoKeywords || initialBusiness.customKeywords;
        if (bKw) {
          const kwArr = bKw.split(',').map((k: string) => k.trim()).filter(Boolean);
          next.keywords = kwArr;
          next.seoKeywords = bKw;
          next.customKeywords = bKw;
        }
      }

      persistToLocalStorage(next);
      return next;
    });

    if (initialBusiness) {
      setActiveBusiness((prev: any) => ({
        ...(prev || {}),
        ...initialBusiness,
        isGoogleConnected: true,
        google_connected: true,
        isConnected: true,
      }));
    }
  }, [initialBusiness, setActiveBusiness]);

  // Booleans for checkboxes/toggles bound directly to unified settingsState
  const negativeAlertsEnabled = settingsState.negativeAlertsEnabled;
  const setNegativeAlertsEnabled = (val: boolean) => updateSettingsField('negativeAlertsEnabled', val);

  const negativeEmailAlertEnabled = settingsState.negativeAlertEmailEnabled;
  const setNegativeEmailAlertEnabled = (val: boolean) => {
    updateSettingsField('negativeAlertEmailEnabled', val);
    updateSettingsField('negativeEmailAlertEnabled', val);
  };

  const negativeSmsAlertEnabled = Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled);
  const setNegativeSmsAlertEnabled = (val: boolean) => updateSettingsField('negativeAlertSmsEnabled', val);

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
  const [brandVoice, setBrandVoiceState] = useState<string>(
    initialSettings?.brandVoice || initialBusiness?.brandVoice || initialBusiness?.brand_voice || 'friendly_professional'
  );

  const setBrandVoice = (val: string) => {
    setBrandVoiceState(val);
    updateSettingsField('brandVoice', val);
    updateSettingsField('aiTone', val);
    updateSettingsField('aiPersonality', val);
  };

  const aiTone = brandVoice || settingsState.aiTone;
  const setAiTone = setBrandVoice;

  const aiInstructions = settingsState.aiInstructions;
  const setAiInstructions = (val: string) => updateSettingsField('aiInstructions', val);

  const aiSignature = settingsState.aiSignature;
  const setAiSignature = (val: string) => updateSettingsField('aiSignature', val);

  const autoPublish5Star = settingsState.autoReplyEnabled;
  const setAutoPublish5Star = (val: boolean) => updateSettingsField('autoReplyEnabled', val);

  const autoReplyEnabled = settingsState.autoReplyEnabled;
  const setAutoReplyEnabled = (val: boolean) => updateSettingsField('autoReplyEnabled', val);

  const smsTemplate = settingsState.smsTemplate;
  const setSmsTemplate = (val: string) => updateSettingsField('smsTemplate', val);

  const selectedModel = settingsState.selectedModel;
  const setSelectedModel = (val: string) => updateSettingsField('selectedModel', val);

  const keywords = settingsState.keywords;
  const setKeywords = (val: string[]) => updateSettingsField('keywords', val);

  // Status & Modal States
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isNotificationsSaved, setIsNotificationsSaved] = useState(false);
  const [isSavingAiPersona, setIsSavingAiPersona] = useState(false);
  const [isAiPersonaSaved, setIsAiPersonaSaved] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [sendingTestWelcome, setSendingTestWelcome] = useState(false);

  const handleToggleNotification = (field: string, value: boolean) => {
    if (field === 'negativeAlertsEnabled' || field === 'notifyNegativeEnabled') setNegativeAlertsEnabled(value);
    if (field === 'negativeEmailAlertEnabled' || field === 'notifyNegativeEmail') setNegativeEmailAlertEnabled(value);
    if (field === 'negativeSmsAlertEnabled' || field === 'notifyNegativeSms' || field === 'negativeAlertSmsEnabled' || field === 'smsAlertsEnabled') {
      updateSettingsField('negativeAlertSmsEnabled', value);
    }
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
      // 1. Immediately persist current state to localStorage before network dispatch
      persistToLocalStorage(settingsState);

      console.log('[SAVE_PAYLOAD] Submitting current settings:', settingsState);

      const targetBusinessId = initialBusiness?.id || activeBusiness?.id;
      const isSmsToSend = Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled);
      const toneToSave = brandVoice || settingsState.brandVoice || settingsState.aiTone || 'friendly_professional';
      const kwList = settingsState.keywords || [];
      const kwString = kwList.join(',');

      const res = await saveAllSettingsAction({
        businessId: targetBusinessId,
        ...settingsState,
        negativeAlertSmsEnabled: isSmsToSend,
        smsAlertsEnabled: isSmsToSend,
        negativeSmsAlertEnabled: isSmsToSend,
        notifySms: isSmsToSend,
        enableSmsAlerts: isSmsToSend,
        googleReviewUrl: activeBusiness?.googleReviewUrl || initialBusiness?.googleReviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review',
        customKeywords: kwString,
        keywords: kwList,
        seoKeywords: kwString,
        smsTemplate: settingsState.smsTemplate,
        aiSignature: settingsState.aiSignature,
        aiInstructions: settingsState.aiInstructions,
        brandVoice: toneToSave,
        aiTone: toneToSave,
        aiPersonality: toneToSave,
        selectedModel: settingsState.selectedModel,
        autoReplyEnabled: settingsState.autoReplyEnabled,
        autoPublish5Star: settingsState.autoReplyEnabled,
      });

      if (res?.success) {
        setIsSaved(true);
        setIsNotificationsSaved(true);
        setIsAiPersonaSaved(true);

        // DO NOT reset settingsState to empty values.
        // Update both React state and localStorage with the returned record:
        if (res.business) {
          const returnedSms = res.business.negativeAlertSmsEnabled ?? res.business.smsAlertsEnabled ?? res.business.negativeSmsAlertEnabled;
          const returnedTone = res.business.brandVoice ?? res.business.brand_voice ?? res.business.aiPersonality ?? res.business.aiTone ?? toneToSave;
          setBrandVoiceState(returnedTone);
          const returnedKw = res.business.seoKeywords || res.business.customKeywords;
          const returnedKwList = returnedKw
            ? returnedKw.split(',').map((k: string) => k.trim()).filter(Boolean)
            : (settingsState.keywords || []);

          setSettingsState((prev: any) => {
            const updated = {
              ...prev,
              negativeAlertEmail: res.business.negativeAlertEmail ?? prev.negativeAlertEmail,
              negativeAlertPhone: res.business.negativeAlertPhone ?? prev.negativeAlertPhone,
              positiveAlertEmail: res.business.positiveAlertEmail ?? prev.positiveAlertEmail,
              positiveAlertPhone: res.business.positiveAlertPhone ?? prev.positiveAlertPhone,
              negativeAlertSmsEnabled: returnedSms !== undefined ? Boolean(returnedSms) : prev.negativeAlertSmsEnabled,
              smsAlertsEnabled: returnedSms !== undefined ? Boolean(returnedSms) : prev.smsAlertsEnabled,
              negativeAlertEmailEnabled: res.business.negativeAlertEmailEnabled ?? prev.negativeAlertEmailEnabled,
              positiveAlertSmsEnabled: res.business.positiveAlertSmsEnabled ?? prev.positiveAlertSmsEnabled,
              positiveAlertEmailEnabled: res.business.positiveAlertEmailEnabled ?? prev.positiveAlertEmailEnabled,
              negativeAlertsEnabled: res.business.negativeAlertsEnabled ?? prev.negativeAlertsEnabled,
              positiveAlertsEnabled: res.business.positiveAlertsEnabled ?? prev.positiveAlertsEnabled,
              aiTone: returnedTone,
              aiPersonality: returnedTone,
              brandVoice: returnedTone,
              aiInstructions: res.business.aiInstructions ?? prev.aiInstructions,
              aiSignature: res.business.aiSignature ?? prev.aiSignature,
              autoReplyEnabled: res.business.autoReplyEnabled ?? prev.autoReplyEnabled,
              selectedModel: res.business.selectedModel ?? prev.selectedModel,
              smsTemplate: res.business.smsTemplate ?? prev.smsTemplate,
              keywords: returnedKwList,
              seoKeywords: returnedKw || prev.seoKeywords || kwString,
              customKeywords: returnedKw || prev.customKeywords || kwString,
            };
            persistToLocalStorage(updated);
            return updated;
          });

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
          const isActive = activeTab === tab.key || (tab.key === 'ai' && activeTab === 'ai-persona');

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
        {(activeTab === 'ai' || activeTab === 'ai-persona') && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <AiPersonaCard
              business={initialBusiness}
              initialBusiness={initialBusiness}
              settingsState={settingsState}
              setSettingsState={setUnifiedSettingsState}
              brandVoice={brandVoice}
              setBrandVoice={setBrandVoice}
              aiTone={brandVoice}
              setAiTone={setBrandVoice}
              aiPersonality={brandVoice}
              setAiPersonality={setBrandVoice}
              aiInstructions={aiInstructions}
              setAiInstructions={setAiInstructions}
              aiSignature={aiSignature}
              setAiSignature={setAiSignature}
              keywords={keywords}
              setKeywords={setKeywords}
              seoKeywords={(settingsState.keywords || []).join(',')}
              setSeoKeywords={(val) => updateSettingsField('seoKeywords', val)}
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
              setSettingsState={setUnifiedSettingsState}
              negativeAlertsEnabled={settingsState.negativeAlertsEnabled}
              setNegativeAlertsEnabled={(val) => updateSettingsField('negativeAlertsEnabled', val)}
              negativeAlertEmailEnabled={settingsState.negativeAlertEmailEnabled}
              setNegativeAlertEmailEnabled={(val) => updateSettingsField('negativeAlertEmailEnabled', val)}
              negativeEmailAlertEnabled={settingsState.negativeAlertEmailEnabled}
              setNegativeEmailAlertEnabled={(val) => updateSettingsField('negativeAlertEmailEnabled', val)}
              negativeAlertSmsEnabled={Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled)}
              smsAlertsEnabled={Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled)}
              setNegativeAlertSmsEnabled={(val) => updateSettingsField('negativeAlertSmsEnabled', val)}
              setSmsAlertsEnabled={(val) => updateSettingsField('negativeAlertSmsEnabled', val)}
              negativeSmsAlertEnabled={Boolean(settingsState.negativeAlertSmsEnabled ?? settingsState.smsAlertsEnabled)}
              setNegativeSmsAlertEnabled={(val) => updateSettingsField('negativeAlertSmsEnabled', val)}
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
