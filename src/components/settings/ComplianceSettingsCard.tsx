'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  ExternalLink,
  Lock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { checkQuietHours } from '@/lib/compliance/quietHours';

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET) – New York' },
  { value: 'America/Chicago', label: 'Central Time (CT) – Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (MT) – Denver' },
  { value: 'America/Phoenix', label: 'Mountain Time (no DST) – Phoenix' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) – Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT) – Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST) – Honolulu' },
];

export default function ComplianceSettingsCard() {
  const [selectedTimeZone, setSelectedTimeZone] = useState('America/New_York');
  const [quietStatus, setQuietStatus] = useState<{ isWithinAllowedWindow: boolean; currentHour: number }>({
    isWithinAllowedWindow: true,
    currentHour: 12,
  });

  useEffect(() => {
    const res = checkQuietHours(selectedTimeZone);
    setQuietStatus(res);
  }, [selectedTimeZone]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Legal, Compliance &amp; Quiet Hours</h3>
            <p className="text-xs text-slate-500">
              Manage TCPA outbound calling safeguards, delivery time windows, and review HIPAA policies.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Automated Compliance Guard
        </span>
      </div>

      {/* 1. TCPA Quiet Hours Guard & Timezone Selector */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">TCPA Daytime Delivery Window</h4>
            </div>
            <p className="text-xs text-slate-500">
              Outbound review invites (SMS and automated communications) are strictly delivered between <strong>8:00 AM and 9:00 PM</strong> in recipient local time to comply with federal TCPA guidelines.
            </p>
          </div>

          <div>
            {quietStatus.isWithinAllowedWindow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Delivery Window Open 🟢
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Quiet Hours Active (Held in Queue) 🌙
              </span>
            )}
          </div>
        </div>

        {/* Timezone Selector */}
        <div className="pt-2 border-t border-slate-200/60 max-w-md">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Business Operating Time Zone
          </label>
          <select
            value={selectedTimeZone}
            onChange={(e) => setSelectedTimeZone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. HIPAA & Protected Health Information (PHI) Notice */}
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Lock className="w-4 h-4 text-blue-600" />
          HIPAA &amp; Protected Health Information (PHI) Notice
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          RatingPulse is not a Business Associate under the Health Insurance Portability and Accountability Act (HIPAA). RatingPulse does not enter into Business Associate Agreements (BAAs), nor is the platform designed or certified to store or process Protected Health Information (PHI). Users in healthcare, medical, dental, or allied practices agree not to upload or request reviews containing PHI or clinical records.
        </p>
      </div>

      {/* 3. TCPA Representation Notice */}
      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          SMS Express Consent Representation
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          You represent, warrant, and certify that you have obtained prior express written consent or transactional business consent from each customer prior to uploading their phone number or dispatching review invitations through RatingPulse.
        </p>
      </div>

      {/* 4. Quick Legal & Help Links Grid */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Compliance &amp; Legal Documentation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Link
            href="/terms"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Terms of Service</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/privacy"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Privacy Policy</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/sms-consent"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>SMS Consent &amp; TCPA</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/support"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Support Desk</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
