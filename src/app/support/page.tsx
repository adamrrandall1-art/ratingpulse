'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Mail,
  HelpCircle,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/ui/Logo';

const COMPANY = 'RatingPulse.co';
const OPERATOR = 'Adam Randall';
const SUPPORT_EMAIL = 'support@ratingpulse.co';

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Google Business Profile Sync');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      toast.success('Support ticket submitted successfully!', {
        description: 'Our team will respond to your email within 24 hours.',
      });
    }, 600);
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
            <Link href="/sms-consent" className="hover:text-indigo-600 transition-colors">
              SMS Consent
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full space-y-10">
        {/* Hero Section */}
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <LifeBuoy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Support &amp; Help Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            How can we help you?
          </h1>
          <p className="text-slate-600 text-base max-w-2xl leading-relaxed">
            Have a question about Google Reviews syncing, automated SMS campaigns, or your subscription? Our technical support team is here to assist.
          </p>
        </div>

        {/* 3 Quick Action Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group block"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Email Support</h2>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              Direct assistance from our core technical support team.
            </p>
            <span className="text-xs font-bold text-indigo-600 group-hover:underline">
              {SUPPORT_EMAIL} →
            </span>
          </a>

          <Link
            href="/#faq"
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Documentation &amp; FAQ</h2>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              Browse guides on OAuth setup, SMS quiet hours, and AI replying.
            </p>
            <span className="text-xs font-bold text-emerald-600 group-hover:underline">
              Read Common Questions →
            </span>
          </Link>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Response Time</h2>
            <p className="text-xs text-slate-500 mb-1 leading-relaxed">
              Standard tickets: <strong className="text-slate-800">Within 24 hours</strong>.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Systems Operational
            </span>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill out the form below and an engineer will reply directly to your inbox.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              SSL Encrypted
            </span>
          </div>

          {isSent ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for contacting RatingPulse support. We have received your inquiry and sent a confirmation to <strong className="text-slate-900">{email}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSent(false);
                  setName('');
                  setEmail('');
                  setSubject('');
                  setMessage('');
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supportName" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="supportName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="supportEmail" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="supportEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@business.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supportCategory" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Topic / Category
                  </label>
                  <select
                    id="supportCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="Google Business Profile Sync">Google Business Profile Sync</option>
                    <option value="SMS Campaign & 10DLC">SMS Campaign &amp; 10DLC</option>
                    <option value="AI Reply Generation">AI Reply Generation</option>
                    <option value="Billing & Subscription">Billing &amp; Subscription</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other Question</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="supportSubject" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    id="supportSubject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question about Google OAuth reconnecting"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="supportMessage" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="supportMessage"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting message...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Support Request</span>
                  </>
                )}
              </button>
            </form>
          )}
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
            <Link href="/sms-consent" className="hover:text-indigo-600 transition-colors">
              SMS Consent &amp; 10DLC
            </Link>
            <Link href="/support" className="hover:text-indigo-600 font-semibold text-slate-900 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
