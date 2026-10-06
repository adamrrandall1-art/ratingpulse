import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Terms of Service | RatingPulse.co',
  description: 'RatingPulse Terms of Service — subscription terms, acceptable use, A2P SMS disclosures, HIPAA disclaimers, and user obligations.',
};

const EFFECTIVE_DATE = 'October 2026';
const COMPANY = 'RatingPulse.co';
const OPERATOR = 'Adam Randall';
const CONTACT_EMAIL = 'legal@ratingpulse.co';
const BILLING_EMAIL = 'billing@ratingpulse.co';
const SUPPORT_EMAIL = 'support@ratingpulse.co';

export default function TermsPage() {
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
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy
            </Link>
            <Link href="/sms-consent" className="hover:text-indigo-600 transition-colors">
              SMS Consent
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

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
        {/* Hero Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Legal &amp; Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Terms of Service
          </h1>
          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            Please read these Terms of Service carefully before using RatingPulse.co. By creating an account or using the service, you agree to be bound by these terms.
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

          {/* Operator Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-xs sm:text-sm text-slate-700 leading-relaxed">
            RatingPulse is owned and operated by <strong className="text-slate-900">{OPERATOR}</strong> (&apos;Company&apos;, &apos;we&apos;, &apos;our&apos;, or &apos;us&apos;). All services, billing, and contractual obligations are administered in accordance with these Terms.
          </div>

          {/* A2P SMS MANDATORY DISCLOSURE CALLOUT */}
          <section className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-700">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  A2P 10DLC SMS Program Mandatory Disclosure
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  RatingPulse operates an Application-to-Person (A2P) SMS messaging program on behalf of subscribing businesses. When sending SMS review invites, the following mandatory disclosures apply:
                </p>
                <div className="p-4 rounded-lg bg-white border border-emerald-200 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed shadow-2xs">
                  RatingPulse provides SMS notifications for service feedback and review collection. Message frequency varies. Message and data rates may apply. Reply <strong className="text-emerald-700 font-bold">STOP</strong> to cancel at any time. Reply <strong className="text-emerald-700 font-bold">HELP</strong> for assistance or email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 underline font-semibold">{SUPPORT_EMAIL}</a>.
                </div>
                <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>SMS messages are sent on behalf of your business, not as direct promotions from RatingPulse.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>You are solely responsible for obtaining valid prior express consent from recipients prior to uploading phone numbers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>All STOP requests are automatically suppressed by our carrier infrastructure to prevent re-messaging.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 1: Acceptance */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>1. Acceptance of Terms</span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              By accessing, browsing, or registering for an account on RatingPulse.co (&quot;Service&quot;), you agree to be bound by these Terms of Service, all applicable laws and regulations, and our Privacy Policy. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              These Terms apply to all users, including business owners, authorized managers, administrators, and staff members operating an account on behalf of an enterprise or organization.
            </p>
          </section>

          {/* Section 2: Description of Service */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              2. Description of Service
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              RatingPulse provides a cloud-based SaaS platform designed to assist local businesses in gathering customer feedback and managing their Google online reputation, including:
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700 pt-1">
              {[
                'Transactional SMS review request automation',
                'AI-assisted draft generation for customer reviews',
                '1-tap reply publishing to Google Business Profile via OAuth',
                'Reputation monitoring, rating metrics, and review feed synchronization',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Subscription & Billing */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>3. Subscription &amp; Billing</span>
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">14-Day Free Trial</h3>
                <p>New accounts receive a full-featured 14-day free trial. No credit card is required to begin. At the end of the trial period, an active subscription is required to continue sending SMS invites and syncing reviews.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Subscription Plans</h3>
                <p>The Growth Plan is billed at $25/month (monthly) or $20/month billed annually ($240/year). Pricing is subject to change with 30 days prior written notice to active subscribers.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Payment Processing &amp; Renewal</h3>
                <p>Subscriptions renew automatically at the end of each billing cycle unless cancelled prior to the renewal date. Payments are securely processed via Stripe. You authorize RatingPulse to charge your card on file for each renewal.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Cancellation &amp; 30-Day Money-Back Guarantee</h3>
                <p>You may cancel your subscription at any time from your account settings or by emailing <a href={`mailto:${BILLING_EMAIL}`} className="text-indigo-600 underline font-semibold">{BILLING_EMAIL}</a>. We offer a no-questions-asked 30-day money-back guarantee on your first paid billing period.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>4. Acceptable Use Policy</span>
            </h2>
            <p className="text-sm text-slate-600">You agree not to misuse the Service or assist others in doing so. You expressly agree not to:</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {[
                'Send unsolicited SMS messages (spam) or contact numbers without documented prior consent',
                'Incentivize, coerce, or purchase fake Google reviews in violation of Google\'s review guidelines',
                'Upload scraped or purchased phone number marketing lists',
                'Bypass quiet hours rules or attempt to deliver messages outside local legal hours (8am - 9pm)',
                'Transmit defamatory, harassing, infringing, or unlawful content',
                'Reverse-engineer, decompile, or attempt to extract source code from the Service',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✕</span>
                  <span className="text-xs sm:text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5: TCPA Representation & SMS Obligations */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              5. SMS Messaging Obligations &amp; TCPA Representation
            </h2>
            <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-blue-700" />
                <span>Telephone Consumer Protection Act (TCPA) &amp; SMS Compliance Representation</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-950 leading-relaxed font-medium">
                You represent, warrant, and certify that you have obtained prior express written or verbal consent from each recipient in accordance with the Telephone Consumer Protection Act (TCPA), CTIA Guidelines, and applicable state laws before uploading or initiating SMS review invite requests. You agree to indemnify and hold harmless RatingPulse against any claims, regulatory enforcement, fines, or liabilities arising from unauthorized text messages sent on your behalf.
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">Quiet Hours Guard:</strong> You acknowledge that SMS review invitations must only be sent during compliant local daytime hours in the recipient&apos;s timezone (8:00 AM – 9:00 PM local time).
              </p>
              <p>
                <strong className="text-slate-900">Sender Identification:</strong> All SMS messages sent via RatingPulse will clearly identify your business name and provide straightforward opt-out commands.
              </p>
            </div>
          </section>

          {/* Section 6: HIPAA & PHI Notice */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>6. HIPAA &amp; Protected Health Information (PHI) Notice</span>
            </h2>
            <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Important Healthcare Provider Notice</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                RatingPulse is not a Business Associate under the Health Insurance Portability and Accountability Act (HIPAA). RatingPulse does not enter into Business Associate Agreements (BAAs), nor is the Service designed, intended, or certified to store, transmit, or process Protected Health Information (PHI). Users in healthcare, medical, dental, or allied practices agree not to upload, transmit, or request reviews containing PHI or patient-identifiable clinical details.
              </p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Medical and dental practices must ensure that review invitations and AI-generated replies remain strictly generic and administrative, omitting patient treatment records, medical diagnoses, or confidential health histories.
            </p>
          </section>

          {/* Section 7: Intellectual Property & Google Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              7. Intellectual Property &amp; Third-Party Services
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              RatingPulse and its original content, features, and functionality remain the exclusive property of {OPERATOR} and its licensors. Google, Google Maps, and Google Business Profile are registered trademarks of Google LLC. RatingPulse operates as an independent review management software integrating via public developer APIs.
            </p>
          </section>

          {/* Section 8: Disclaimers & Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              8. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee specific review counts, conversion increases, or search ranking improvements. In no event shall RatingPulse or {OPERATOR} be liable for indirect, incidental, special, consequential, or punitive damages exceeding the amount paid by you in the 3 months preceding the claim.
            </p>
          </section>

          {/* Section 9: Governing Law & Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              9. Governing Law &amp; Contact Information
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              These Terms shall be governed by the laws of the State of New York and the United States, without regard to conflict of law principles. Any legal notices or inquiries regarding these Terms should be directed to:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1">
              <div><strong className="text-slate-900">Legal Contact:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a></div>
              <div><strong className="text-slate-900">Billing &amp; Refunds:</strong> <a href={`mailto:${BILLING_EMAIL}`} className="text-indigo-600 hover:underline">{BILLING_EMAIL}</a></div>
              <div><strong className="text-slate-900">Customer Support:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 hover:underline">{SUPPORT_EMAIL}</a></div>
            </div>
          </section>

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
            <Link href="/terms" className="hover:text-indigo-600 font-semibold text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/sms-consent" className="hover:text-indigo-600 transition-colors">
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
