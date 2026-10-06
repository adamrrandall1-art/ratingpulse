'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  FileText,
  Building2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import Logo from '@/components/ui/Logo';

const EFFECTIVE_DATE = 'October 2026';
const COMPANY = 'RatingPulse.co';
const OPERATOR = 'Adam Randall';

export default function SmsConsentPage() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionType, setSubmissionType] = useState<'opted_in' | 'skipped'>('opted_in');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const didOptIn = hasConsented && phoneNumber.trim().length > 0;
      setSubmissionType(didOptIn ? 'opted_in' : 'skipped');
      setIsSubmitted(true);

      if (didOptIn) {
        toast.success('Optional SMS Consent Recorded!', {
          description: 'Customer opted-in for optional review request SMS.',
        });
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#06b6d4', '#10b981'],
          });
        } catch {
          // ignore
        }
      } else {
        toast.info('Intake Completed without SMS Opt-in', {
          description: 'No text messages will be sent to this customer.',
        });
      }
    }, 500);
  };

  const handleSkip = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmissionType('skipped');
      setIsSubmitted(true);
      toast.info('SMS Opt-In Skipped', {
        description: 'You may continue without SMS notifications.',
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col justify-between selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Header / Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link href="/#pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/support" className="hover:text-indigo-600 transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Carrier Compliance &amp; 10DLC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            SMS Consent &amp; Opt-In Verification
          </h1>
          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            RatingPulse maintains strict compliance with carrier 10DLC requirements, TCPA regulations, and CTIA Messaging Principles. Below is our verified customer opt-in standard and live non-forced intake demonstration.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
            <span>Last updated: {EFFECTIVE_DATE}</span>
            <span>•</span>
            <span>Effective Date: {EFFECTIVE_DATE}</span>
            <span>•</span>
            <span>Operated by {OPERATOR}</span>
          </div>
        </div>

        {/* Centered White Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-10">

          {/* Two-Column Demo Opt-In and Policies */}
          <div className="grid md:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Interactive Intake Form Demonstration */}
            <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Digital Intake &amp; Opt-In Form</h2>
                    <p className="text-[11px] text-slate-500">Standard point-of-sale customer workflow</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Interactive Demo
                </span>
              </div>

              {isSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {submissionType === 'opted_in'
                        ? 'Consent Verified & Logged'
                        : 'Intake Completed (No SMS)'}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      {submissionType === 'opted_in'
                        ? `Customer "${fullName || 'Client'}" (${phoneNumber}) provided explicit optional consent for transactional review requests.`
                        : 'Customer intake completed without SMS opt-in. No text messages will be sent.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFullName('');
                      setPhoneNumber('');
                      setHasConsented(false);
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Reset &amp; Test Again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="customerName" className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Full Name
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="customerPhone" className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (Optional)
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 234-5678"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                    {/* Non-Mandatory Disclosure Callout */}
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      Providing your mobile number and opting into SMS is completely optional. Consent is not a condition of purchase or service.
                    </p>
                  </div>

                  {/* Explicit Opt-In Checkbox with Carrier Disclosures */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => setHasConsented(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-[11px] sm:text-xs text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                        By checking this box, you agree to receive automated review request text messages from RatingPulse at the number provided. Message frequency varies. Message &amp; data rates may apply. Reply <strong className="text-slate-900 font-bold">STOP</strong> to cancel, <strong className="text-slate-900 font-bold">HELP</strong> for help. View our{' '}
                        <Link href="/privacy" className="text-indigo-600 underline font-semibold">
                          Privacy Policy
                        </Link>{' '}
                        and{' '}
                        <Link href="/terms" className="text-indigo-600 underline font-semibold">
                          Terms of Service
                        </Link>.
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <span>Submit Intake Record</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={loading}
                      className="w-full py-2 bg-transparent hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl transition-colors text-center cursor-pointer"
                    >
                      Skip SMS Opt-in / Continue →
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Detailed Compliance Disclosures & Policies */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>How Opt-in is Collected</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Subscribers collect explicit verbal or written consent at point-of-sale, invoice completion, or through our digital intake form with clear disclosure of program details.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Instant Opt-Out / STOP Handling</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  End users can reply <strong className="text-slate-900">STOP</strong> at any time to immediately cancel and revoke consent. The number is automatically suppressed from all future dispatches.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Program Terms &amp; Assistance</span>
                </h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong className="text-slate-800">Frequency:</strong> 1 invitation per transaction.</li>
                  <li><strong className="text-slate-800">Rates:</strong> Message &amp; data rates may apply.</li>
                  <li><strong className="text-slate-800">Support:</strong> Reply <strong className="text-slate-800">HELP</strong> or contact <a href="mailto:support@ratingpulse.co" className="text-indigo-600 underline">support@ratingpulse.co</a>.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Sample Transactional SMS Message Preview */}
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Sample Transactional SMS Content</span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-700 leading-relaxed shadow-2xs">
              &quot;Hi Jane, thank you for choosing Scoop &apos;n Twist! Could you take 30 seconds to share your feedback on Google? It means the world to our team: https://ratingpulse.co/rate/demo. Reply STOP to cancel.&quot;
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {COMPANY}. All rights reserved. Operated by {OPERATOR}.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/sms-consent" className="hover:text-indigo-600 font-semibold text-slate-900 transition-colors">
              SMS Consent &amp; 10DLC
            </Link>
            <Link href="/support" className="hover:text-indigo-600 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
