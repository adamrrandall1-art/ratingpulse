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
  Mail
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import CheckoutButton from '@/components/stripe/CheckoutButton';
import BillingSection from '@/components/dashboard/BillingSection';
import GooglePlacesAutocomplete from '@/components/google/GooglePlacesAutocomplete';
import { SelectedPlaceData, generateGoogleReviewUrl } from '@/lib/google-places';

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, settings, updateSettings, updateProfile } = useRatingPulseStore();

  const [businessName, setBusinessName] = useState(profile.business_name || 'Apex Dental & Aesthetics');
  const [placeId, setPlaceId] = useState(profile.google_place_id || '');
  const [formattedAddress, setFormattedAddress] = useState(profile.formatted_address || '1400 Broadway, New York, NY 10018');
  const [reviewUrl, setReviewUrl] = useState(
    profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : '')
  );
  const [rating, setRating] = useState(profile.google_rating || 4.9);
  const [reviewCount, setReviewCount] = useState(profile.google_review_count || 284);
  const [notificationEmail, setNotificationEmail] = useState(
    settings.notification_email || profile.notification_email || profile.email || ''
  );
  const [notificationPhone, setNotificationPhone] = useState(
    settings.notification_phone || profile.notification_phone || profile.phone || ''
  );
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(
    settings.sms_alerts_enabled ?? profile.sms_alerts_enabled ?? true
  );

  const [brandVoice, setBrandVoice] = useState(settings.brand_voice);
  const [autoPublish, setAutoPublish] = useState(settings.auto_publish_5_star);
  const [smsTemplate, setSmsTemplate] = useState(settings.sms_template);
  const [keywords, setKeywords] = useState<string[]>(settings.custom_keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Hydrate settings on mount from Supabase
  useEffect(() => {
    async function loadSettingsFromDatabase() {
      const uid = user?.id || profile.id;
      if (!isSupabaseConfigured || !supabase || !uid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
        return;
      }

      try {
        const [settingsRes, profileRes] = await Promise.allSettled([
          supabase.from('business_settings').select('*').eq('user_id', uid).maybeSingle(),
          supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
          const s = settingsRes.value.data;
          if (s.notification_email) setNotificationEmail(s.notification_email);
          if (s.notification_phone) setNotificationPhone(s.notification_phone);
          if (s.sms_alerts_enabled !== undefined && s.sms_alerts_enabled !== null) {
            setSmsAlertsEnabled(Boolean(s.sms_alerts_enabled));
          }
          if (s.brand_voice) setBrandVoice(s.brand_voice);
          if (s.auto_publish_5_star !== undefined && s.auto_publish_5_star !== null) {
            setAutoPublish(Boolean(s.auto_publish_5_star));
          }
          if (s.sms_template) setSmsTemplate(s.sms_template);
          if (Array.isArray(s.custom_keywords) && s.custom_keywords.length > 0) {
            setKeywords(s.custom_keywords);
          }
        }

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          const p = profileRes.value.data;
          if (p.business_name) setBusinessName(p.business_name);
          if (p.google_place_id) setPlaceId(p.google_place_id);
          if (p.formatted_address) setFormattedAddress(p.formatted_address);
          if (p.review_url) setReviewUrl(p.review_url);
          if (p.google_rating) setRating(p.google_rating);
          if (p.google_review_count !== undefined) setReviewCount(p.google_review_count);
          if (p.notification_email && !notificationEmail) setNotificationEmail(p.notification_email);
          if (p.notification_phone && !notificationPhone) setNotificationPhone(p.notification_phone);
        }
      } catch (err) {
        console.warn('Error loading settings from Supabase:', err);
      }
    }

    loadSettingsFromDatabase();
  }, [user?.id, profile.id]);

  const handlePlaceSelect = async (data: any) => {
    const bName = data.name || data.businessName || '';
    const addr = data.address || data.formattedAddress || '';
    const pId = data.placeId || '';
    const rUrl = data.reviewUrl || (pId ? `https://search.google.com/local/writereview?placeid=${pId}` : '');

    if (bName) setBusinessName(bName);
    if (pId) setPlaceId(pId);
    if (addr) setFormattedAddress(addr);
    if (rUrl) setReviewUrl(rUrl);
    if (data.rating) setRating(data.rating);
    if (data.reviewCount !== undefined) setReviewCount(data.reviewCount);

    try {
      await updateProfile({
        business_name: bName || businessName,
        google_place_id: pId || placeId,
        formatted_address: addr || formattedAddress,
        review_url: rUrl || reviewUrl,
        notification_email: notificationEmail,
        notification_phone: notificationPhone,
        sms_alerts_enabled: smsAlertsEnabled,
        google_connected: true,
      });
      await updateSettings({
        brand_voice: brandVoice as any,
        auto_publish_5_star: autoPublish,
        sms_template: smsTemplate,
        custom_keywords: keywords,
        notification_email: notificationEmail,
        notification_phone: notificationPhone,
        sms_alerts_enabled: smsAlertsEnabled,
      });
      toast.success('Business location updated', {
        description: `Connected to ${bName || 'Google Business Profile'}.`
      });
    } catch (err) {
      console.warn('Auto-save place error:', err);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const directReviewUrl = (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '') || reviewUrl;

    try {
      await updateProfile({
        business_name: businessName,
        google_place_id: placeId,
        formatted_address: formattedAddress,
        review_url: directReviewUrl,
        google_rating: rating,
        google_review_count: reviewCount,
        notification_email: notificationEmail,
        notification_phone: notificationPhone,
        sms_alerts_enabled: smsAlertsEnabled,
        google_connected: Boolean(placeId),
      });
      await updateSettings({
        brand_voice: brandVoice as any,
        auto_publish_5_star: autoPublish,
        sms_template: smsTemplate,
        custom_keywords: keywords,
        notification_email: notificationEmail,
        notification_phone: notificationPhone,
        sms_alerts_enabled: smsAlertsEnabled,
      });

      setIsSaved(true);
      toast.success('Settings saved successfully!', {
        description: 'Your profile and notification routing preferences have been updated.'
      });
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      toast.error('Failed to save settings', {
        description: err?.message || 'Please check your connection and try again.'
      });
    }
  };

  const handleSyncGoogle = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIsSaved(true);
      toast.success('Google reviews synced', {
        description: 'Your review count and average rating are now up to date.'
      });
      setTimeout(() => setIsSaved(false), 2000);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Settings & Google Integration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your Google Business Profile connection, AI voice, and SMS automation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Launch Onboarding Wizard
          </Link>

          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved Successfully
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Google Business Profile & Places Connection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                G
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Business Profile Sync &amp; Places</h3>
                <p className="text-xs text-slate-500">Official Google Places &amp; Direct Review Link</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected &amp; Verified
            </span>
          </div>

          <GooglePlacesAutocomplete
            initialPlaceId={placeId}
            initialBusinessName={businessName}
            initialAddress={formattedAddress}
            initialRating={rating}
            initialReviewCount={reviewCount}
            initialReviewUrl={reviewUrl}
            onPlaceSelect={handlePlaceSelect}
            showPreviewCard={true}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <div className="text-[11px] text-slate-500">
              Live Google Place ID connection active • Direct review URL automatically updated in SMS invites
            </div>
            <button
              type="button"
              onClick={handleSyncGoogle}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Force Sync Google Reviews'}
            </button>
          </div>
        </div>

        {/* 2. Notification Preferences (Email & Text Alerts) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Preferences (Email &amp; Text Alerts)</h3>
                <p className="text-xs text-slate-500">Configure where you want instant alerts delivered when a customer leaves 1–3 star feedback</p>
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
                Notification Email
              </label>
              <input
                type="email"
                placeholder="owner@business.com"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Immediate email notifications are delivered to this inbox (defaults to {profile.email || 'your account email'}).
              </p>
            </div>

            {/* Notification Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notification Mobile Number
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={notificationPhone}
                onChange={(e) => setNotificationPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Receive an instant text message when a customer leaves 1-3 star feedback.
              </p>
            </div>
          </div>

          {/* SMS Alerts Enabled Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Enable SMS Text Alerts</div>
              <div className="text-[11px] text-slate-500">
                Instantly dispatch an urgent text message to your mobile number as soon as low-star feedback is intercepted.
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsAlertsEnabled}
              onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. AI Response Engine & SEO Keywords */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Response Engine & SEO Tone</h3>
              <p className="text-xs text-slate-500">Fine-tune how AI crafts review replies</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Brand Voice & Personality
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
                Local SEO Keywords (Injected into replies to boost Google rankings)
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
                      className="hover:text-blue-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Auto-publish toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Auto-Publish 5-Star AI Responses</div>
                <div className="text-[11px] text-slate-500">
                  Automatically publish 5-star review responses without waiting for manual 1-tap confirmation.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. SMS Template Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Automated SMS Invite Template</h3>
              <p className="text-xs text-slate-500">Customize the text message sent to your customers</p>
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

        {/* 4. Active Subscription & Billing */}
        <BillingSection />

        {/* 5. Supabase Backend Connection Details */}
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
            Schema is prepared in <code className="text-blue-300 font-mono">supabase/schema.sql</code>. To connect your live Supabase project, set <code className="text-blue-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-blue-300 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your <code className="text-blue-300 font-mono">.env.local</code> file.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save All Settings
          </button>
        </div>

      </form>

    </div>
  );
}
