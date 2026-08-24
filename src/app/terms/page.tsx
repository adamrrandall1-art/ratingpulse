import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2, MessageSquare, AlertTriangle, CreditCard } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | RatingPulse.co',
  description: 'RatingPulse Terms of Service — subscription terms, acceptable use, A2P SMS disclosures, and user obligations.',
};

const EFFECTIVE_DATE = 'August 21, 2025';
const COMPANY = 'RatingPulse.co';
const CONTACT_EMAIL = 'legal@ratingpulse.co';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Ambient glow */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sticky nav bar */}
      <header className="border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to RatingPulse.co
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            Effective: {EFFECTIVE_DATE}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 relative">

        {/* Page Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
            <FileText className="w-3.5 h-3.5" /> Terms of Service
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Terms of{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Please read these Terms of Service carefully before using RatingPulse.co. By creating an account or using the service, you agree to be bound by these terms.
          </p>
          {/* Legal entity / operator identity */}
          <p className="mt-3 text-sm text-slate-300 leading-relaxed border-l-2 border-emerald-500/50 pl-4">
            RatingPulse is owned and operated by <strong className="text-white">Adam Randall</strong> (&apos;Company&apos;, &apos;we&apos;, &apos;our&apos;, or &apos;us&apos;).
          </p>
          <p className="text-slate-600 text-sm mt-3">
            Effective Date: {EFFECTIVE_DATE} · Last Updated: {EFFECTIVE_DATE}
          </p>
        </div>

        {/* A2P SMS MANDATORY DISCLOSURE */}
        <section className="mb-12 p-6 rounded-2xl bg-teal-950/40 border border-teal-500/25">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">
                A2P SMS Program Disclosure
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Adam Randall / RatingPulse operates an Application-to-Person (A2P) SMS messaging program for review solicitation. By using the SMS invite feature, you acknowledge and agree to the following mandatory disclosures:
              </p>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-teal-500/30 text-sm text-slate-200 font-medium leading-relaxed mb-4">
                Adam Randall / RatingPulse provides SMS notifications for service feedback and review collection. Message frequency varies. Message and data rates may apply. Reply <strong className="text-teal-300">STOP</strong> to cancel at any time. Reply <strong className="text-teal-300">HELP</strong> for assistance.
              </div>
              <ul className="space-y-2">
                {[
                  'Adam Randall / RatingPulse provides SMS notifications for service feedback and review collection. Message frequency varies. Message and data rates may apply. Reply STOP to cancel at any time. Reply HELP for assistance.',
                  'SMS messages are sent on behalf of the subscribing business, not by RatingPulse directly.',
                  'You, the business owner, are solely responsible for obtaining valid prior express written consent from recipients before uploading their numbers.',
                  'You agree to honor all opt-out requests immediately and maintain a compliant suppression list.',
                  'You must not upload numbers for which you do not have compliant consent.',
                  'RatingPulse maintains A2P 10DLC registration and CTIA compliance on the carrier infrastructure level.',
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="space-y-8">

          {/* 1. Acceptance */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              By accessing or using RatingPulse.co ("Service"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              These Terms apply to all users, including business owners, administrators, and staff members accessing the Service on behalf of a business.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              RatingPulse provides a SaaS platform for local service businesses to:
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                'Send automated and manual SMS review request messages to customers',
                'Generate AI-drafted responses to Google reviews using the Gemini API',
                'Publish approved responses directly to Google Business Profile via OAuth',
                'Monitor review volume, rating trends, and campaign performance',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Subscription & Billing */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-5">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">3. Subscription &amp; Billing</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Free Trial</h3>
                <p>New accounts receive a 14-day free trial with full access to all features. No credit card is required to start. At the end of the trial period, you must subscribe to continue using the Service.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Subscription Plans</h3>
                <p>The Growth Plan is billed at $25/month (monthly) or $20/month (annual, billed as $240/year). Prices are subject to change with 30 days notice to existing subscribers.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Payment & Renewal</h3>
                <p>Subscriptions renew automatically at the end of each billing period. Payments are processed via Stripe. You authorize RatingPulse to charge your payment method on file for each renewal period.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Cancellation</h3>
                <p>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time within a billing period.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">30-Day Money-Back Guarantee</h3>
                <p>If you are not satisfied with the Service within the first 30 days of your first paid subscription period, contact us for a full refund. This guarantee applies once per customer.</p>
              </div>
            </div>
          </section>

          {/* 4. Acceptable Use */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">4. Acceptable Use Policy</h2>
            </div>
            <p className="text-sm text-slate-300 mb-4">You agree not to use the Service to:</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                'Send unsolicited SMS messages or spam to individuals who have not provided consent',
                'Solicit, incentivize, or purchase fake reviews in violation of Google\'s review policies',
                'Upload customer phone numbers obtained without appropriate consent',
                'Circumvent or disable any technical measures of the Service',
                'Violate any applicable law, regulation, or third-party right',
                'Use the Service for any purpose other than legitimate business review management',
                'Reverse engineer, decompile, or attempt to extract source code from the Service',
                'Resell or sublicense access to the Service without written permission',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">✕</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-400 mt-4">
              Violation of this policy may result in immediate suspension or termination of your account without refund.
            </p>
          </section>

          {/* 5. SMS Obligations */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">5. SMS Messaging Obligations &amp; Disclosures</h2>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-teal-500/30 text-sm text-teal-300 font-medium leading-relaxed mb-4">
              Adam Randall / RatingPulse provides SMS notifications for service feedback and review collection. Message frequency varies. Message and data rates may apply. Reply STOP to cancel at any time. Reply HELP for assistance.
            </div>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>You are solely responsible for compliance with all applicable laws governing SMS communications, including but not limited to the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, and applicable state laws.</p>
              <p><strong className="text-slate-200">Consent requirement:</strong> You represent and warrant that all phone numbers uploaded to the platform have provided valid prior express written consent to receive SMS marketing communications from your business.</p>
              <p><strong className="text-slate-200">Opt-out compliance:</strong> You agree to honor all STOP requests within the platform and must not attempt to re-contact opted-out numbers.</p>
              <p><strong className="text-slate-200">Content standards:</strong> All SMS messages sent via RatingPulse must identify your business by name, include a clear opt-out mechanism, and comply with CTIA Messaging Principles and Best Practices.</p>
              <p><strong className="text-slate-200">Indemnification:</strong> You agree to indemnify and hold harmless RatingPulse and Adam Randall from any claims, fines, or damages arising from your violation of SMS messaging laws or regulations.</p>
            </div>
          </section>

          {/* 6. Intellectual Property */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              The Service, including its software, design, branding, and all content created by RatingPulse, is owned by RatingPulse and protected by intellectual property laws.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              You retain ownership of your business data, customer data, and any content you upload. By using the Service, you grant RatingPulse a limited license to process this data solely to provide the Service to you.
            </p>
          </section>

          {/* 7. Disclaimers */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">7. Disclaimers &amp; Limitation of Liability</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>The Service is provided "as is" without warranty of any kind. RatingPulse does not guarantee specific outcomes, including review volume, rating improvements, or Google Maps ranking changes.</p>
              <p><strong className="text-slate-200">Google compliance:</strong> RatingPulse does not guarantee compliance with Google's review policies on your behalf. You are responsible for ensuring your use of the Service complies with Google's Terms of Service and Review Policy.</p>
              <p>To the maximum extent permitted by law, RatingPulse's aggregate liability for any claims arising from these Terms or use of the Service shall not exceed the amounts paid by you in the 3 months preceding the claim.</p>
            </div>
          </section>

          {/* 8. Termination */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">8. Termination</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Either party may terminate this agreement at any time. RatingPulse reserves the right to suspend or terminate your account immediately, without notice, for violation of these Terms, non-payment, or any activity that poses a risk to the Service or other users.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Upon termination, your right to access the Service immediately ceases. Data will be retained and deleted per our Privacy Policy.
            </p>
          </section>

          {/* 9. Governing Law */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">9. Governing Law</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              These Terms are governed by the laws of the United States and the State of New York, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in New York, NY, except where prohibited by law. You waive the right to participate in class action lawsuits.
            </p>
          </section>

          {/* 10. Changes & Contact */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">10. Changes to Terms &amp; Contact</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or in-app notification at least 14 days before they take effect. Continued use of the Service after the effective date constitutes acceptance.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Questions about these Terms? Contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 hover:text-emerald-300 underline">{CONTACT_EMAIL}</a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
