import React from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Phone,
  Database,
  Mail,
  ShieldCheck,
  Server,
  UserCheck
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Privacy Policy | RatingPulse.co',
  description: 'RatingPulse Privacy Policy — how we collect, use, and protect your data, including strict SMS consent and mobile number handling.',
};

const EFFECTIVE_DATE = 'October 2026';
const COMPANY = 'RatingPulse.co';
const OPERATOR = 'Adam Randall';
const CONTACT_EMAIL = 'privacy@ratingpulse.co';
const SUPPORT_EMAIL = 'support@ratingpulse.co';

export default function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Legal &amp; Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            Your privacy is of paramount importance to us. This policy explains how RatingPulse collects, uses, protects, and handles your business and customer information.
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

          {/* Operator Identity Callout */}
          <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-xs sm:text-sm text-slate-700 leading-relaxed">
            RatingPulse is owned and operated by <strong className="text-slate-900">{OPERATOR}</strong> (&apos;Company&apos;, &apos;we&apos;, &apos;our&apos;, or &apos;us&apos;). We are committed to transparency and the highest standards of data security and communication privacy.
          </div>

          {/* MANDATORY 10DLC & MOBILE INFORMATION DISCLOSURE */}
          <section className="p-6 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0 text-blue-700">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Mobile Information &amp; SMS Opt-In Privacy Safeguard
                </h2>
                <div className="p-4 rounded-lg bg-white border border-blue-200 text-xs sm:text-sm font-semibold text-blue-950 leading-relaxed shadow-2xs">
                  No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
                </div>
                <ul className="space-y-2 pt-1 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Customer phone numbers submitted to RatingPulse are utilized solely to transmit transactional review invitations requested by the subscribing business.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>SMS opt-in consent is non-transferable and is never sold, leased, or distributed to any marketing brokers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Recipients can revoke consent at any time by replying <strong className="text-slate-900 font-bold">STOP</strong> to any SMS message.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 1: Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>1. Information We Collect</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Business Account Data</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  When you create an account, we collect your name, business name, work email address, payment identifiers (via Stripe), and Google Business Profile authentication tokens.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Customer Contact Records</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  To send SMS review requests, you may input your customer&apos;s name and mobile number. This information is stored securely and processed exclusively for message delivery.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Google Review &amp; Reply Data</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  With your OAuth authorization, we sync public review ratings, reviewer names, review copy, and published owner responses via official Google APIs.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Usage &amp; Telemetry</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  We gather anonymized technical data (browser type, session duration, feature utilization) to maintain software uptime, reliability, and security.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Data */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>2. How We Use Your Information</span>
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {[
                'Facilitating SMS review invitations and customer feedback collection on your behalf',
                'Generating AI-drafted review replies using Google Gemini API based on public review content',
                'Publishing approved review responses directly to Google Business Profile via OAuth',
                'Processing billing, subscription lifecycle management, and sending operational notifications',
                'Enforcing compliance with carrier 10DLC regulations and maintaining opt-out suppression lists',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Data Retention */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100">
              3. Data Retention Schedules
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {[
                ['Customer Mobile Numbers', 'Retained for active subscription duration. Deleted within 30 days upon cancellation request.'],
                ['SMS Dispatch Logs', 'Retained for 12 months for carrier delivery proof and TCPA compliance auditing, then purged.'],
                ['Opt-Out Suppression Lists', 'STOP records retained indefinitely to prevent any future messaging to opted-out recipients.'],
                ['Google Review Cache', 'Synced in real time and cached for dashboard performance. Removed upon account termination.'],
              ].map(([category, retention], i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] mb-1">{category}</div>
                  <div className="text-slate-600 text-xs sm:text-sm">{retention}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Third-Party Service Providers */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>4. Third-Party Service Providers &amp; Infrastructure</span>
            </h2>
            <p className="text-sm text-slate-600">
              We partner with trusted industry infrastructure providers strictly necessary to operate our service. We never sell customer or business data.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-2.5 px-3 font-bold text-slate-800 uppercase tracking-wider text-[11px]">Provider</th>
                    <th className="text-left py-2.5 px-3 font-bold text-slate-800 uppercase tracking-wider text-[11px]">Purpose</th>
                    <th className="text-left py-2.5 px-3 font-bold text-slate-800 uppercase tracking-wider text-[11px]">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Twilio', 'A2P 10DLC SMS transmission', 'Recipient phone number, message text'],
                    ['Supabase', 'Encrypted cloud database & auth', 'Encrypted account credentials, invite history'],
                    ['Stripe', 'PCI-DSS Level 1 payment processing', 'Billing details (credit card tokens)'],
                    ['Google Cloud / APIs', 'Google Business Profile review sync & AI reply', 'Public review text, star rating, business name'],
                    ['Vercel', 'Edge application hosting & CDN', 'Standard web request headers & logs'],
                  ].map(([provider, purpose, data], i) => (
                    <tr key={i} className="text-slate-700 hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{provider}</td>
                      <td className="py-2.5 px-3">{purpose}</td>
                      <td className="py-2.5 px-3 text-slate-500">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Security Measures */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>5. Data Security Standards</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              RatingPulse employs bank-grade security protocols, including TLS 1.3 encryption for all data in transit and AES-256 encryption for data at rest. Access to sensitive production keys and databases is strictly limited by multi-factor authentication and role-based access control (RBAC). In the unlikely event of a verified data breach, affected users will be notified within 72 hours.
            </p>
          </section>

          {/* Section 6: User Privacy Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>6. Your Privacy Rights (GDPR &amp; CCPA)</span>
            </h2>
            <p className="text-sm text-slate-600">
              Depending on your jurisdiction, you have the right to request access to, correction of, or deletion of your personal data stored by RatingPulse. To submit a data subject access or deletion request, please email our privacy team.
            </p>
          </section>

          {/* Section 7: Contact Information */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>7. Privacy Inquiries &amp; Contact</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you have questions, comments, or concerns regarding this Privacy Policy or our compliance practices, please reach out to:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1">
              <div><strong className="text-slate-900">Privacy Officer:</strong> {OPERATOR}</div>
              <div><strong className="text-slate-900">Privacy Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a></div>
              <div><strong className="text-slate-900">General Inquiries:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 hover:underline">{SUPPORT_EMAIL}</a></div>
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
            <Link href="/privacy" className="hover:text-indigo-600 font-semibold text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
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
