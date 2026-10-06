'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  X,
  Bot,
  Zap,
  Check,
  Star,
  MessageSquare,
  Smile,
  Flame,
  CheckCircle,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export type BrandVoiceType = 'friendly_professional' | 'casual_enthusiastic' | 'concise_polite' | 'empathetic';

interface AiPersonaCardProps {
  brandVoice: BrandVoiceType;
  setBrandVoice: (voice: BrandVoiceType) => void;
  keywords: string[];
  setKeywords: (keywords: string[]) => void;
  autoPublish5Star?: boolean;
  setAutoPublish5Star?: (val: boolean) => void;
  businessName?: string;
}

const PERSONA_OPTIONS: {
  key: BrandVoiceType;
  title: string;
  tagline: string;
  badge: string;
  icon: React.ElementType;
  samplePrefix: string;
}[] = [
  {
    key: 'friendly_professional',
    title: 'Friendly & Professional',
    tagline: 'Warm, polished, and courteous. Ideal for clinics, law, real estate, and professional services.',
    badge: 'Recommended',
    icon: Smile,
    samplePrefix: 'Hi Alex, thank you so much for the kind words! We truly appreciate your trust and look forward to welcoming you back.',
  },
  {
    key: 'casual_enthusiastic',
    title: 'Casual & Enthusiastic',
    tagline: 'High energy, warm, and upbeat. Perfect for cafes, bakeries, gyms, and retail.',
    badge: 'High Energy',
    icon: Flame,
    samplePrefix: 'Hey Alex! WOW, thank you so much for the glowing review! Our team is smiling ear to ear. See you again soon!',
  },
  {
    key: 'concise_polite',
    title: 'Concise & Polite',
    tagline: 'Direct, respectful, and brief. Great for busy B2B and automotive operations.',
    badge: 'Direct',
    icon: CheckCircle,
    samplePrefix: 'Thank you for your review, Alex. We appreciate your patronage and look forward to serving you again.',
  },
  {
    key: 'empathetic',
    title: 'Empathetic & Caring',
    tagline: 'Deeply attentive, gentle, and understanding. Excellent for wellness and healthcare.',
    badge: 'Attentive',
    icon: Heart,
    samplePrefix: 'Dear Alex, thank you from the bottom of our hearts for sharing your experience. Knowing our team made you feel cared for means everything to us.',
  },
];

const SUGGESTED_KEYWORDS = [
  'friendly team',
  'fast turnaround',
  'family friendly',
  'great service',
  'clean facility',
  'transparent pricing',
];

export default function AiPersonaCard({
  brandVoice,
  setBrandVoice,
  keywords,
  setKeywords,
  autoPublish5Star = false,
  setAutoPublish5Star,
  businessName = 'our team',
}: AiPersonaCardProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleAddKeyword = (kwToAdd?: string) => {
    const text = (kwToAdd || newKeyword).trim();
    if (text && !keywords.includes(text)) {
      setKeywords([...keywords, text]);
      if (!kwToAdd) setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  // Generate dynamic live preview text
  const currentPersona = PERSONA_OPTIONS.find((p) => p.key === brandVoice) || PERSONA_OPTIONS[0];
  const keywordHighlights = keywords.length > 0 ? ` Mentioning our commitment to ${keywords.slice(0, 2).join(' and ')}.` : '';
  const previewReply = `${currentPersona.samplePrefix}${keywordHighlights}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Reply Persona &amp; Brand Voice</h3>
            <p className="text-xs text-slate-500">
              Configure how Gemini generates responses to Google reviews and injects local SEO keywords.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Bot className="w-3.5 h-3.5" />
          Gemini 3.8 Flash Engine
        </span>
      </div>

      {/* 1. Persona Selector Grid */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Select Tone &amp; Personality
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONA_OPTIONS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = brandVoice === persona.key;

            return (
              <button
                type="button"
                key={persona.key}
                onClick={() => setBrandVoice(persona.key)}
                className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{persona.title}</span>
                  </div>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {persona.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-9">
                  {persona.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Local SEO Keywords Tag Manager */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            Local SEO Keywords (Injected into replies to boost Google 3-Pack rankings)
          </label>
          <span className="text-[11px] text-slate-500">{keywords.length} active keywords</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add keyword or phrase (e.g. artisan ice cream, emergency care)..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
          <button
            type="button"
            onClick={() => handleAddKeyword()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Suggested Quick Add Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-semibold text-slate-400">Quick Add:</span>
          {SUGGESTED_KEYWORDS.filter((k) => !keywords.includes(k)).slice(0, 4).map((sug) => (
            <button
              type="button"
              key={sug}
              onClick={() => handleAddKeyword(sug)}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 transition-colors cursor-pointer border border-slate-200/80"
            >
              + {sug}
            </button>
          ))}
        </div>

        {/* Active Tags List */}
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium"
              >
                #{kw}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="hover:text-purple-950 cursor-pointer p-0.5"
                  title="Remove keyword"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-500 text-center">
            No custom keywords added yet. Keywords help mention specific services in your AI replies.
          </div>
        )}
      </div>

      {/* 3. Auto-publish 5-Star Reviews Toggle */}
      {setAutoPublish5Star && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50/40 to-blue-50/40 border border-purple-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                Auto-Publish 5-Star Reviews
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  Automation
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically generate and publish AI replies to glowing 5-star Google reviews without requiring manual 1-tap approval.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={autoPublish5Star}
              onChange={(e) => setAutoPublish5Star(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      )}

      {/* 4. Interactive Live Sample Reply Preview */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            Live AI Persona Preview
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSimulating(true);
              setTimeout(() => {
                setIsSimulating(false);
                toast.success('AI Preview Refreshed', {
                  description: `Simulated response updated using ${currentPersona.title} voice.`,
                });
              }, 400);
            }}
            className="text-[11px] text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
            Re-simulate
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          {/* Sample Review */}
          <div className="flex items-start gap-3 pb-3 border-b border-slate-200/70">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
              A
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Alex M.</span>
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">Sample Google Review</span>
              </div>
              <p className="text-xs text-slate-600 italic">
                &ldquo;Had an incredible experience here yesterday! The team was super attentive and everything was handled seamlessly.&rdquo;
              </p>
            </div>
          </div>

          {/* AI Generated Sample Output */}
          <div className="pl-9 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                <Bot className="w-3 h-3" />
                AI Reply ({currentPersona.title})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-purple-200 text-xs text-slate-800 leading-relaxed font-sans shadow-2xs">
              {isSimulating ? (
                <div className="flex items-center gap-2 text-slate-400 py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Synthesizing response with Gemini 3.8 Flash...</span>
                </div>
              ) : (
                previewReply
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
