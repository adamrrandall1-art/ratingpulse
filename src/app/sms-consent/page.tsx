'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
  Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

import Logo from '@/components/ui/Logo';

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
            colors: ['#22c55e', '#14b8a6', '#3b82f6'],
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
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-between selection:bg-[#22c55e]/30 selection:text-white">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Carrier Compliance & 10DLC Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            RatingPulse SMS Consent & Opt-In Verification
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Demonstration of our non-forced, fully optional customer intake, TCR disclosure language, and review intake flow.
          </p>
        </div>

        {/* Two-Column Grid: Demo Opt-in Form & Compliance Policy */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Consent Form Demonstration */}
          <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Customer Intake & Opt-In</h2>
                  <p className="text-xs text-slate-400">Standard point-of-sale intake flow</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Interactive Demo
              </span>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {submissionType === 'opted_in'
                      ? 'Consent Verified & Recorded'
                      : 'Intake Completed (No SMS)'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {submissionType === 'opted_in'
                      ? `Customer "${fullName || 'Client'}" (${phoneNumber}) provided explicit optional opt-in for transactional SMS review invites.`
                      : 'Customer intake completed without opting into SMS. No text messages will be sent.'}
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Test Another Submission
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="customerName" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Customer Full Name
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 234-5678"
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {/* Clear Non-Mandatory Disclosure */}
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    Providing your phone number and opting into SMS is entirely optional. Consent is not a condition of purchase or receiving services from RatingPulse.
                  </p>
                </div>

                {/* Explicit Opt-In Checkbox with Carrier-Compliant Disclosures */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hasConsented}
                      onChange={(e) => setHasConsented(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                      By checking this box, you agree to receive automated review request and notification text messages from RatingPulse at the phone number provided. Message frequency varies. Message and data rates may apply. Reply STOP to cancel at any time, or HELP for assistance. View our{' '}
                      <Link href="/privacy" className="text-emerald-400 hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      (https://ratingpulse.co/privacy) and{' '}
                      <Link href="/terms" className="text-emerald-400 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      (https://ratingpulse.co/terms).
                    </span>
                  </label>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#14b8a6] hover:brightness-110 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <span>Submit Intake Form</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={loading}
                    className="w-full py-2.5 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-colors text-center cursor-pointer border border-transparent hover:border-slate-800"
                  >
                    Skip SMS Opt-in / Continue →
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Detailed Compliance Disclosures & Policies */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>How Opt-in is Collected</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Customers provide explicit verbal or written consent at checkout / service completion, or enter their details via our secure digital intake flow with clear disclosure of message frequency and opt-out instructions.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Opt-Out & Unsubscribe Mechanism</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                End users can reply <strong className="text-white">STOP</strong> at any time to any SMS message received to immediately cancel and revoke SMS consent. A confirmation message will be sent, and no further messages will be dispatched.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Message Frequency & Support</span>
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li><strong className="text-white">Frequency:</strong> Message frequency varies per transaction.</li>
                <li><strong className="text-white">Rates:</strong> Message and data rates may apply.</li>
                <li><strong className="text-white">Assistance:</strong> Reply <strong className="text-white">HELP</strong> or contact support at <a href="mailto:support@ratingpulse.co" className="text-[#00d2c4] hover:underline">support@ratingpulse.co</a>.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Sample SMS Message Preview */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Sample Transactional SMS Content</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 leading-relaxed">
            &quot;Hi Jane, thank you for choosing Apex Dental! Could you take 30 seconds to share your experience on Google? It means the world to our team: https://ratingpulse.co/rate/demo. Reply STOP to cancel.&quot;
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#0B0F17]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RatingPulse.co. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/sms-consent" className="hover:text-slate-300 transition-colors">
              SMS Consent
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
