'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Smartphone,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Building,
  TrendingUp,
  ShieldCheck,
  Zap,
  Moon
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { checkQuietHours } from '@/lib/compliance/quietHours';
import QuickSenderCard from '@/components/invites/QuickSenderCard';
import BulkCsvCard from '@/components/invites/BulkCsvCard';
import InviteHistoryTable from '@/components/invites/InviteHistoryTable';

export default function InvitesPage() {
  const { profile, invites } = useRatingPulseStore();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [quietHoursState, setQuietHoursState] = useState<{ isWithinAllowedWindow: boolean; currentHour: number }>({
    isWithinAllowedWindow: true,
    currentHour: 12,
  });

  useEffect(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      setQuietHoursState(checkQuietHours(userTz));
    } catch {
      setQuietHoursState(checkQuietHours('America/New_York'));
    }
  }, []);

  const totalInvitesSent = 142 + (invites?.length || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* 1. Page Header & Stats Banner */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Review Invites
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch SMS and email requests to boost verified reviews on Google.
          </p>
        </div>

        {/* Action Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Stat 1: Invites Sent */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Invites Sent (This Month)
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-2">
                <span>{totalInvitesSent}</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +28% vs last mo
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 2: Delivery Rate */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Carrier Delivery Rate
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-2">
                <span>98.4%</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 10DLC Verified
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 3: Current TCPA Delivery Window */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TCPA Compliance Status
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                {quietHoursState.isWithinAllowedWindow ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Daytime Window (8 AM – 9 PM)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-300">
                    <Moon className="w-3.5 h-3.5 text-amber-600" />
                    Off-Hours (Queueing for 8 AM)
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

        </div>
      </div>

      {/* 2. Dispatch Campaign Tabs & Mode Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1-Tap Single Send</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV Upload</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Business:</span>
            <strong className="text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold">
              {profile?.business_name || "Scoop 'n Twist"}
            </strong>
          </div>
        </div>

        {/* Tab 1: Single Send Card */}
        {activeTab === 'single' && (
          <div className="animate-in fade-in duration-150">
            <QuickSenderCard />
          </div>
        )}

        {/* Tab 2: Bulk CSV Upload Card */}
        {activeTab === 'bulk' && (
          <div className="animate-in fade-in duration-150">
            <BulkCsvCard />
          </div>
        )}
      </div>

      {/* 3. Real-time Activity History Table */}
      <InviteHistoryTable />

    </div>
  );
}
