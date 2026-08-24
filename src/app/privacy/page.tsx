import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, CheckCircle2, Lock, Phone, Database, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | RatingPulse.co',
  description: 'RatingPulse Privacy Policy — how we collect, use, and protect your data, including SMS consent and mobile number handling.',
};

const EFFECTIVE_DATE = 'August 21, 2025';
const COMPANY = 'RatingPulse.co';
const CONTACT_EMAIL = 'privacy@ratingpulse.co';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sticky nav bar */}
      <header className="border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to RatingPulse.co
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Effective: {EFFECTIVE_DATE}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 relative">

        {/* Page Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Shield className="w-3.5 h-3.5" /> Privacy Policy
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Your Privacy,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Protected.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            RatingPulse is owned and operated by <strong className="text-white">Adam Randall</strong> (&apos;Company&apos;, &apos;we&apos;, &apos;our&apos;, or &apos;us&apos;).
            This policy explains what we collect, why we collect it, and how we keep it safe.
          </p>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed border-l-2 border-emerald-500/50 pl-4">
            RatingPulse is owned and operated by Adam Randall (&apos;Company&apos;, &apos;we&apos;, &apos;our&apos;, or &apos;us&apos;).
          </p>
          <p className="text-slate-600 text-sm mt-3">
            Effective Date: {EFFECTIVE_DATE} · Last Updated: {EFFECTIVE_DATE}
          </p>
        </div>

        {/* CRITICAL SMS NOTICE */}
        <section className="mb-12 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/25">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">
                Mobile Numbers &amp; SMS Consent — Critical Disclosure
              </h2>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-sm text-slate-200 font-medium leading-relaxed mb-4">
                No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
              </div>
              <ul className="space-y-2">
                {[
                  'Mobile numbers collected via RatingPulse are used exclusively to send review request SMS messages on behalf of the subscribing business.',
                  'SMS opt-in consent is not transferable. Consent given to one business cannot be used by any other business or entity.',
                  'No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.',
                  'Customers may opt out at any time by replying STOP to any SMS message.',
                  'Opt-out requests are processed immediately and the number is suppressed from all future messages.',
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="space-y-8">

          {/* 1. Information We Collect */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-5">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              {[
                ['Business Account Data', "When you create an account we collect your name, business name, email address, billing information, and Google Business Profile data (via OAuth)."],
                ['Customer Contact Data', "To send SMS review invites, you may enter your customers' names and mobile phone numbers. This data is stored securely and used solely to send the review request messages you initiate."],
                ['Usage & Analytics Data', 'We collect anonymised usage data (pages visited, features used, session duration) to improve the product. This data is never linked to individual customer phone numbers.'],
                ['Google Reviews Data', 'With your explicit OAuth authorization, we read and write review response data from your Google Business Profile via the Google My Business API.'],
              ].map(([title, body], i) => (
                <div key={i}>
                  <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. How We Use Your Data */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-5">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">2. How We Use Your Data</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                ['Delivering the Service', 'Sending SMS review invites, generating AI reply drafts, syncing with your Google Business Profile.'],
                ['Account Management', 'Billing, authentication, customer support, and onboarding communications.'],
                ['Product Improvement', 'Aggregate, anonymised analytics to improve features, reliability, and performance.'],
                ['Legal & Compliance', 'Maintaining records as required by applicable law, including TCPA and CTIA guidelines.'],
                ['Security', 'Detecting and preventing fraud, abuse, and unauthorized access.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-200">{title}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Data Retention */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-5">3. Data Retention</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Customer Mobile Numbers', 'Retained for the duration of your active subscription. Deleted within 30 days of account cancellation upon request.'],
                ['SMS Invite Logs', 'Retained for 12 months to support dispute resolution and TCPA compliance, then purged.'],
                ['Google Review Data', 'Synced in real time. Cached locally for up to 24 hours. Deleted within 30 days of account cancellation.'],
                ['Billing Records', 'Retained for 7 years as required by financial regulations.'],
                ['Opt-Out Records', 'STOP/opt-out records are retained indefinitely to ensure suppressed numbers are never re-messaged.'],
                ['Account Data', 'Retained for the life of your account plus 90 days after cancellation, then permanently deleted.'],
              ].map(([type, policy], i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">{type}</div>
                  <div className="text-slate-300 text-sm">{policy}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. SMS Transmission */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-5">4. SMS &amp; Review Transmission Practices</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>All SMS messages are sent via Twilio, a SOC 2 Type II certified carrier. Messages originate from a dedicated business number registered under the A2P 10DLC framework.</p>
              <p><strong className="text-slate-200">Message content:</strong> Each SMS contains the business name, a personalised review invitation, and a direct Google review link. No third-party advertising content is ever included.</p>
              <p><strong className="text-slate-200">Consent model:</strong> SMS messages are sent only to customers who have an established business relationship with the subscribing business. Businesses are contractually required to obtain and maintain appropriate consent before uploading customer numbers.</p>
              <p><strong className="text-slate-200">Opt-out:</strong> Every message is STOP-compliant. Replying STOP immediately suppresses the number from all future messages. Reply HELP for support contact information.</p>
              <div className="mt-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400 font-medium italic">
                Message frequency varies. Message and data rates may apply. Reply STOP to cancel at any time. Reply HELP for assistance. Contact: {CONTACT_EMAIL}
              </div>
            </div>
          </section>

          {/* 5. Third-Party Sharing Table */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-2">5. Data Sharing &amp; Third Parties</h2>
            <p className="text-sm text-slate-400 mb-3">We share data only with service providers strictly necessary to operate the platform. We do not sell data.</p>
            <p className="text-sm text-emerald-400 font-medium mb-5 bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/20">
              No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Provider</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Purpose</th>
                    <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {[
                    ['Twilio', 'SMS delivery', 'Recipient phone number, message body'],
                    ['Supabase', 'Database & authentication', 'Account data, invite logs'],
                    ['Stripe', 'Payment processing', 'Billing info only — no phone numbers'],
                    ['Google APIs', 'Review sync', 'Business profile data, review content'],
                    ['Vercel', 'Hosting & edge delivery', 'No personal data stored'],
                  ].map(([provider, purpose, data], i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="py-2.5 pr-4 font-semibold text-slate-200">{provider}</td>
                      <td className="py-2.5 pr-4">{purpose}</td>
                      <td className="py-2.5 text-slate-400">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Security */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">6. Security</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">We implement industry-standard security measures including TLS 1.3 encryption in transit, AES-256 encryption at rest, role-based access controls, and regular security audits. Access to customer data is restricted to personnel who need it to perform their job functions.</p>
            <p className="text-sm text-slate-300 leading-relaxed">In the event of a data breach affecting your information, we will notify you within 72 hours as required by applicable law.</p>
          </section>

          {/* 7. Your Rights */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-white mb-4">7. Your Rights (GDPR / CCPA)</h2>
            <p className="text-sm text-slate-300 mb-4">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                'Access the personal data we hold about you',
                'Request correction of inaccurate data',
                'Request deletion of your data (right to erasure)',
                'Object to or restrict certain processing',
                'Data portability — receive your data in a machine-readable format',
                'Withdraw consent at any time for consent-based processing',
              ].map((right, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{right}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-400 mt-4">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 hover:text-emerald-300 underline">{CONTACT_EMAIL}</a>.
              We respond to all requests within 30 days.
            </p>
          </section>

          {/* 8. Contact */}
          <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">8. Contact &amp; Updates</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Questions about this policy? Contact our privacy team at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 hover:text-emerald-300 underline">{CONTACT_EMAIL}</a>.
              {' '}We may update this Privacy Policy from time to time. Material changes will be communicated by email
              or in-app notification. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
