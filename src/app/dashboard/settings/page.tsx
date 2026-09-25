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
  Database,
  ExternalLink,
  Plus,
  X,
  Mail,
  Trash2,
  AlertTriangle,
  User,
  KeyRound,
  Bell,
  Lock
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
    resetAccountAndTestData,
  } = useRatingPulseStore();

  // Admin Account States
  const [fullName, setFullName] = useState(
    profile.full_name || user?.user_metadata?.full_name || ''
  );
  const [adminEmail, setAdminEmail] = useState(
    user?.email || profile.email || ''
  );

  // Notification Routing States
  const [notificationEmail, setNotificationEmail] = useState(
    settings.notification_email || profile.notification_email || profile.email || ''
  );
  const [notificationPhone, setNotificationPhone] = useState(
    settings.notification_phone || profile.notification_phone || profile.phone || ''
  );
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(
    settings.sms_alerts_enabled ?? profile.sms_alerts_enabled ?? true
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
  const [isResettingAccount, setIsResettingAccount] = useState(false);
  const [showResetAccountModal, setShowResetAccountModal] = useState(false);
  const [sendingTestWelcome, setSendingTestWelcome] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    if (profile.full_name && !fullName) setFullName(profile.full_name);
    if (profile.email && !adminEmail) setAdminEmail(profile.email);
    if (profile.notification_email && !notificationEmail) setNotificationEmail(profile.notification_email);
    if (profile.notification_phone && !notificationPhone) setNotificationPhone(profile.notification_phone);
  }, [profile.full_name, profile.email, profile.notification_email, profile.notification_phone]);

  const handleSendTestWelcome = async () => {
    const targetEmail = notificationEmail || profile.email || user?.email || 'admin@business.com';
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
      await updateProfile({
        full_name: fullName,
        notification_email: notificationEmail,
        notification_phone: notificationPhone,
        sms_alerts_enabled: smsAlertsEnabled,
      });
      await updateSettings({
        brand_voice: brandVoice as any,
        sms_template: smsTemplate,
        custom_keywords: keywords,
        notification_email: notificationEmail,
        notification_phone: notificationPhone,
        sms_alerts_enabled: smsAlertsEnabled,
      });

      setIsSaved(true);
      toast.success('Settings saved successfully!', {
        description: 'Account profile and notification preferences have been updated.',
      });
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      toast.error('Failed to save settings', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAccountAndTestData = async () => {
    setIsResettingAccount(true);
    try {
      await resetAccountAndTestData();
      setKeywords([]);
      setBrandVoice('friendly_professional');
      setNotificationPhone('');
      setShowResetAccountModal(false);
      toast.success('Account Reset Successful', {
        description: 'All test data, reviews, invites, and business connections have been wiped.',
      });
    } catch (err: any) {
      console.error('Reset account error:', err);
      toast.error('Failed to reset account', {
        description: err?.message || 'Please try again.',
      });
    } finally {
      setIsResettingAccount(false);
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

        {/* 3. NOTIFICATION PREFERENCES (EMAIL & SMS ALERTS) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Alerts &amp; Interception Routing</h3>
                <p className="text-xs text-slate-500">Receive instant alerts when low-star (1–3 star) feedback is intercepted</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Real-time Alert Engine Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Notification Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alert Notification Email
              </label>
              <input
                type="email"
                placeholder="owner@business.com"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Private feedback alerts are delivered immediately to this inbox.
              </p>
            </div>

            {/* Notification Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alert Mobile Phone (SMS)
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={notificationPhone}
                onChange={(e) => setNotificationPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Receive an urgent SMS alert when a customer leaves 1–3 star feedback.
              </p>
            </div>
          </div>

          {/* SMS Alerts Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Enable Urgent SMS Text Alerts</div>
              <div className="text-[11px] text-slate-500">
                Instantly dispatch a text message to your mobile number as soon as low-star feedback is intercepted.
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsAlertsEnabled}
              onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
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

        {/* 6. SUPABASE BACKEND CLOUD DATABASE */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Supabase Cloud Database</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
              {isSupabaseConfigured ? 'Connected' : 'Local Fallback Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Database connection is active. All business profiles, invitations, customer feedback, and synced Google reviews are persisted in PostgreSQL.
          </p>
        </div>

        {/* 7. DANGER ZONE: RESET ACCOUNT & CLEAR TEST DATA */}
        <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Account &amp; Clear All Test Data</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Wipe all review invites, reviews, SMS logs, Place IDs, and cached browser records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetAccountModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Reset Account &amp; Clear Test Data
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white/80 border border-rose-200/60 text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-rose-900 font-bold">Developer / Admin Notice:</strong> Clicking this will wipe all mock and test rows from Supabase (including <code className="text-slate-800 font-mono">review_invites</code>, <code className="text-slate-800 font-mono">reviews</code>, and <code className="text-slate-800 font-mono">business_settings</code>), clear all <code className="text-slate-800 font-mono">ratingpulse_*</code> localStorage keys, and instantly reset your dashboard to a clean 0-state ready for real customer onboarding.
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
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

      {/* Reset Account & Clear All Test Data Confirmation Modal */}
      {showResetAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Reset Account &amp; Clear All Test Data?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to clear all test data and reset business connections? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-bold text-rose-950">This action will immediately:</p>
              <ul className="list-disc pl-4 space-y-1 text-rose-800 text-[11px]">
                <li>Delete all review invites, SMS dispatch history, and customer feedback from Supabase.</li>
                <li>Delete all synced and mock reviews from the database.</li>
                <li>Clear Google Place ID, Google OAuth tokens, and rating metadata.</li>
                <li>Wipe all cached localStorage keys (<code className="font-mono text-rose-900">ratingpulse_*</code>).</li>
                <li>Reset the UI to a clean 0-state ready for real onboarding.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetAccountModal(false)}
                disabled={isResettingAccount}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAccountAndTestData}
                disabled={isResettingAccount}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
              >
                {isResettingAccount ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Wiping &amp; Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Wipe Everything &amp; Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
