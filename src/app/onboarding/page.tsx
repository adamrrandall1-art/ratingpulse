'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Info,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Star,
  Check
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import confetti from 'canvas-confetti';
import GooglePlacesAutocomplete from '@/components/google/GooglePlacesAutocomplete';
import { generateGoogleReviewUrl, SelectedPlaceData } from '@/lib/google-places';

const TEMPLATE_PRESETS = [
  {
    name: 'Friendly & Warm (Recommended)',
    template: 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience on Google? It means the world to our local team: {{review_link}}',
  },
  {
    name: 'Short & Direct',
    template: 'Hi {{customer_name}}, thank you for your visit to {{business_name}}! How did we do? Tap here to leave a quick Google review: {{review_link}}',
  },
  {
    name: 'Service / Contractor Follow-Up',
    template: 'Hi {{customer_name}}, thanks for trusting {{business_name}} for your service today! Please share your feedback on Google to help our small team: {{review_link}}',
  },
  {
    name: 'VIP / Healthcare / Dental',
    template: 'Dear {{customer_name}}, thank you for visiting {{business_name}} today. We hope you had a comfortable visit! Please leave us a quick review: {{review_link}}',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, settings, updateProfile, updateSettings, syncGoogleReviews } = useRatingPulseStore();

  // Form State
  const [businessName, setBusinessName] = useState(profile.business_name || 'Apex Dental & Aesthetics');
  const [businessCategory, setBusinessCategory] = useState(profile.business_category || 'Healthcare / Dental Care');
  const [googlePlaceId, setGooglePlaceId] = useState(profile.google_place_id || 'ChIJN1t_tDeuEmsRUsoyG83frY4');
  const [formattedAddress, setFormattedAddress] = useState(profile.formatted_address || '1400 Broadway, New York, NY 10018');
  const [reviewUrl, setReviewUrl] = useState(
    profile.review_url || generateGoogleReviewUrl(profile.google_place_id || 'ChIJN1t_tDeuEmsRUsoyG83frY4')
  );
  const [rating, setRating] = useState(profile.google_rating || 4.9);
  const [reviewCount, setReviewCount] = useState(profile.google_review_count || 284);

  const [smsTemplate, setSmsTemplate] = useState(
    settings.sms_template ||
      'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience on Google? It means the world to our team: {{review_link}}'
  );
  const [sampleCustomerName, setSampleCustomerName] = useState('Sarah');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePlaceSelect = (data: SelectedPlaceData) => {
    if (data.businessName) setBusinessName(data.businessName);
    if (data.placeId) setGooglePlaceId(data.placeId);
    if (data.formattedAddress) setFormattedAddress(data.formattedAddress);
    if (data.reviewUrl) setReviewUrl(data.reviewUrl);
    if (data.rating) setRating(data.rating);
    if (data.reviewCount !== undefined) setReviewCount(data.reviewCount);
  };

  // Compute live rendered preview text
  const renderedMessage = smsTemplate
    .replace(/\{\{customer_name\}\}/g, sampleCustomerName || 'Customer')
    .replace(/\{\{business_name\}\}/g, businessName.trim() || 'My Business')
    .replace(
      /\{\{review_link\}\}/g,
      reviewUrl || generateGoogleReviewUrl(googlePlaceId) || 'https://search.google.com/local/writereview?placeid=...'
    );

  const charCount = renderedMessage.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  const insertVariable = (tag: string) => {
    setSmsTemplate((prev) => `${prev} ${tag}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const directReviewUrl = reviewUrl || generateGoogleReviewUrl(googlePlaceId);

    await updateProfile({
      business_name: businessName.trim() || 'My Business',
      business_category: businessCategory,
      google_place_id: googlePlaceId.trim(),
      formatted_address: formattedAddress,
      review_url: directReviewUrl,
      google_rating: rating,
      google_review_count: reviewCount,
      google_connected: true,
    });

    await updateSettings({
      sms_template: smsTemplate,
    });

    if (googlePlaceId.trim()) {
      void syncGoogleReviews(googlePlaceId.trim());
    }

    setIsSaving(false);
    setSavedSuccess(true);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#fbbf24', '#38bdf8'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      
      {/* Top Simple Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">RatingPulse</span>
              <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Business Onboarding Setup
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Skip to Dashboard →
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Onboarding Heading */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Quick 2-Minute Setup
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Configure Your Business & Review Automation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Connect your Google Place ID and customize the automated SMS invite sent to your happy customers.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (7 cols): Onboarding Setup Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Card 1: Business Profile Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">1. Business Profile</h2>
                    <p className="text-xs text-slate-500">Your brand name as it will appear in customer SMS</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business / Practice Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Dental & Aesthetics"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Industry / Category
                    </label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="Healthcare / Dental Care">Healthcare / Dental Care</option>
                      <option value="Home Services & Contractors">Home Services & Contractors</option>
                      <option value="Auto Detailing & Repair">Auto Detailing & Repair</option>
                      <option value="Legal & Financial Services">Legal & Financial Services</option>
                      <option value="Salons, Spas & Wellness">Salons, Spas & Wellness</option>
                      <option value="Restaurants & Hospitality">Restaurants & Hospitality</option>
                      <option value="Other Local Business">Other Local Business</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Google Place ID & Autocomplete */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">2. Google Places &amp; Direct Review Link</h2>
                      <p className="text-xs text-slate-500">Auto-detect Place ID &amp; generate your 5-star Google review link</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Place ID
                  </span>
                </div>

                <GooglePlacesAutocomplete
                  initialPlaceId={googlePlaceId}
                  initialBusinessName={businessName}
                  initialAddress={formattedAddress}
                  initialRating={rating}
                  initialReviewCount={reviewCount}
                  initialReviewUrl={reviewUrl}
                  onPlaceSelect={handlePlaceSelect}
                  showPreviewCard={true}
                />
              </div>

              {/* Card 3: Custom SMS Template Configuration */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">3. Custom SMS Review Invite Template</h2>
                      <p className="text-xs text-slate-500">The message your customers receive with their 1-tap review link</p>
                    </div>
                  </div>
                </div>

                {/* Preset Dropdown / Quick Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Choose a Proven Template Preset:
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {TEMPLATE_PRESETS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSmsTemplate(preset.template)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          smsTemplate === preset.template
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{preset.name}</span>
                          {smsTemplate === preset.template && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Message Template *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {charCount} chars • {smsSegments} SMS {smsSegments > 1 ? 'segments' : 'segment'}
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    required
                    value={smsTemplate}
                    onChange={(e) => setSmsTemplate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                  />

                  {/* Dynamic Variable Insertion Pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Insert Variable:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable('{{customer_name}}')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 font-mono text-[11px] font-semibold transition-colors"
                    >
                      + {'{{customer_name}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable('{{business_name}}')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 font-mono text-[11px] font-semibold transition-colors"
                    >
                      + {'{{business_name}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable('{{review_link}}')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 font-mono text-[11px] font-semibold transition-colors"
                    >
                      + {'{{review_link}}'}
                    </button>
                  </div>
                </div>

                {/* Sample Recipient Tester */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Preview as Customer:</span>
                  <div className="flex items-center gap-2">
                    {['Sarah', 'Michael', 'David', 'Jessica'].map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => setSampleCustomerName(name)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          sampleCustomerName === name
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Submit / Launch Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Configuration...</span>
                    </>
                  ) : savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Setup Completed! Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Save & Complete Onboarding</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Column (5 cols): Live Mobile Phone SMS Simulator */}
          <div className="lg:col-span-5 sticky top-8">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Mobile SMS Preview
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time Render
                </span>
              </div>

              {/* Realistic Phone Screen Shell */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-inner">
                
                {/* Phone Top Notch */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-slate-800/60 font-mono">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 rounded-xs border border-slate-400 flex items-center p-0.5">
                      <div className="w-full h-full bg-slate-400 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Sender Header */}
                <div className="text-center pb-2 border-b border-slate-800/40">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mx-auto shadow-md shadow-blue-500/20">
                    {businessName.slice(0, 2).toUpperCase() || 'RP'}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    {businessName || 'Your Business'}
                  </div>
                  <div className="text-[10px] text-slate-400">Verified Business SMS</div>
                </div>

                {/* Delivered SMS Bubble */}
                <div className="space-y-2">
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-md space-y-2">
                    <p className="font-sans">
                      {renderedMessage}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right pr-1">
                    Delivered • Just now
                  </div>
                </div>

                {/* 1-Tap Google Link Simulation Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-xs">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Google 5-Star Review Form</div>
                      <div className="text-[10px] text-slate-400">1-Tap Direct Rating Box</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                </div>

              </div>

              {/* Statistics & Insights */}
              <div className="pt-2 grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-base font-extrabold text-blue-400">68.2%</div>
                  <div className="text-[10px] text-slate-400">Click-to-Review Rate</div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-base font-extrabold text-emerald-400">&lt; 3.0s</div>
                  <div className="text-[10px] text-slate-400">Average Delivery Time</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RatingPulse.co • 100% Google Review Policy Compliant
      </footer>

    </div>
  );
}
