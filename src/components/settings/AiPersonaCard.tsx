'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveAllSettingsAction } from '@/app/dashboard/settings/actions';
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
  Save,
  PenTool,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export type BrandVoiceType =
  | 'friendly_professional'
  | 'casual_enthusiastic'
  | 'concise_polite'
  | 'empathetic'
  | 'Professional & Warm'
  | string;

export function isPersonaSelected(currentTone: string | undefined, personaKey: string): boolean {
  if (!currentTone) return personaKey === 'friendly_professional';
  if (currentTone === personaKey) return true;

  const normCurrent = currentTone.toLowerCase().replace(/[^a-z]/g, '');
  const normKey = personaKey.toLowerCase().replace(/[^a-z]/g, '');

  if (normCurrent === normKey) return true;

  if (
    (normCurrent === 'professionalwarm' || normCurrent === 'friendlyprofessional' || normCurrent === 'friendlyandprofessional') &&
    (normKey === 'friendlyprofessional' || normKey === 'friendlyandprofessional')
  ) {
    return true;
  }

  if (
    (normCurrent === 'casualenthusiastic' || normCurrent === 'casualandenthusiastic') &&
    (normKey === 'casualenthusiastic' || normKey === 'casualandenthusiastic')
  ) {
    return true;
  }

  if (
    (normCurrent === 'concisepolite' || normCurrent === 'conciseandpolite') &&
    (normKey === 'concisepolite' || normKey === 'conciseandpolite')
  ) {
    return true;
  }

  if (
    (normCurrent === 'empathetic' || normCurrent === 'empatheticcaring' || normCurrent === 'empatheticandcaring') &&
    (normKey === 'empathetic' || normKey === 'empatheticcaring' || normKey === 'empatheticandcaring')
  ) {
    return true;
  }

  return normCurrent.startsWith(normKey) || normKey.startsWith(normCurrent);
}

export interface AiPersonaCardProps {
  business?: any;
  initialBusiness?: any;
  brandVoice?: BrandVoiceType | string;
  setBrandVoice?: (voice: BrandVoiceType | string) => void;
  aiTone?: string;
  setAiTone?: (tone: string) => void;
  aiPersonality?: string;
  setAiPersonality?: (personality: string) => void;
  settingsState?: any;
  setSettingsState?: React.Dispatch<React.SetStateAction<any>>;
  aiInstructions?: string;
  setAiInstructions?: (instructions: string) => void;
  customInstructions?: string;
  setCustomInstructions?: (instructions: string) => void;
  aiSignature?: string;
  setAiSignature?: (signature: string) => void;
  replySignature?: string;
  setReplySignature?: (signature: string) => void;
  keywords?: string[];
  setKeywords?: (keywords: string[]) => void;
  seoKeywords?: string | string[];
  setSeoKeywords?: (keywords: string | string[]) => void;
  autoPublish5Star?: boolean;
  setAutoPublish5Star?: (val: boolean) => void;
  autoReplyEnabled?: boolean;
  setAutoReplyEnabled?: (val: boolean) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  businessName?: string;
  onSaveAiPersona?: (e?: React.MouseEvent | React.FormEvent) => Promise<void>;
  isSavingAiPersona?: boolean;
  isAiPersonaSaved?: boolean;
}

export interface PersonaOption {
  key: string;
  value: string;
  title: string;
  tagline: string;
  badge: string;
  icon: React.ElementType;
  samplePrefix: string;
}

export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    key: 'friendly_professional',
    value: 'friendly_professional',
    title: 'Friendly & Professional',
    tagline: 'Warm, polished, and courteous. Ideal for clinics, law, real estate, and professional services.',
    badge: 'Recommended',
    icon: Smile,
    samplePrefix: 'Hi Alex, thank you so much for the kind words! We truly appreciate your trust and look forward to welcoming you back.',
  },
  {
    key: 'casual_enthusiastic',
    value: 'casual_enthusiastic',
    title: 'Casual & Enthusiastic',
    tagline: 'High energy, warm, and upbeat. Perfect for cafes, bakeries, gyms, and retail.',
    badge: 'High Energy',
    icon: Flame,
    samplePrefix: 'Hey Alex! WOW, thank you so much for the glowing review! Our team is smiling ear to ear. See you again soon!',
  },
  {
    key: 'concise_polite',
    value: 'concise_polite',
    title: 'Concise & Polite',
    tagline: 'Direct, respectful, and brief. Great for busy B2B and automotive operations.',
    badge: 'Direct',
    icon: CheckCircle,
    samplePrefix: 'Thank you for your review, Alex. We appreciate your patronage and look forward to serving you again.',
  },
  {
    key: 'empathetic',
    value: 'empathetic',
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

export default function AiPersonaCard(props: AiPersonaCardProps) {
  const {
    initialBusiness,
    business,
    brandVoice = 'friendly_professional',
    setBrandVoice,
    aiTone,
    setAiTone,
    aiInstructions = '',
    setAiInstructions,
    aiSignature = '',
    setAiSignature,
    keywords = [],
    setKeywords,
    autoPublish5Star = false,
    setAutoPublish5Star,
    autoReplyEnabled = false,
    setAutoReplyEnabled,
    selectedModel: propSelectedModel = 'gemini-1.5-flash',
    setSelectedModel: propSetSelectedModel,
    businessName = 'our team',
    onSaveAiPersona,
    isSavingAiPersona = false,
    isAiPersonaSaved = false,
  } = props;

  const router = useRouter();
  const initialBiz = initialBusiness || business;

  const [internalSaving, setInternalSaving] = useState(false);
  const [internalSaved, setInternalSaved] = useState(false);

  const [selectedModel, setSelectedModel] = useState<string>(
    initialBiz?.selectedModel || propSelectedModel || 'gemini-1.5-flash'
  );

  // Initialize state directly from props first, avoiding empty overrides
  const [localTone, setLocalTone] = useState<BrandVoiceType>(
    (props.brandVoice as BrandVoiceType) ||
    (props.settingsState?.brandVoice as BrandVoiceType) ||
    (props.settingsState?.aiTone as BrandVoiceType) ||
    (props.settingsState?.aiPersonality as BrandVoiceType) ||
    (props.aiPersonality as BrandVoiceType) ||
    (props.aiTone as BrandVoiceType) ||
    brandVoice ||
    (initialBiz?.brandVoice as BrandVoiceType) ||
    (initialBiz?.brand_voice as BrandVoiceType) ||
    'friendly_professional'
  );

  const [localInstructions, setLocalInstructions] = useState<string>(
    props.settingsState?.customInstructions !== undefined
      ? props.settingsState.customInstructions
      : (props.settingsState?.aiInstructions !== undefined
        ? props.settingsState.aiInstructions
        : (props.customInstructions !== undefined
          ? props.customInstructions
          : (props.aiInstructions !== undefined
            ? props.aiInstructions
            : (aiInstructions || initialBiz?.customInstructions || initialBiz?.aiInstructions || ''))))
  );

  const [localSignature, setLocalSignature] = useState<string>(
    props.settingsState?.replySignature !== undefined
      ? props.settingsState.replySignature
      : (props.settingsState?.aiSignature !== undefined
        ? props.settingsState.aiSignature
        : (props.replySignature !== undefined
          ? props.replySignature
          : (props.aiSignature !== undefined
            ? props.aiSignature
            : (aiSignature || initialBiz?.replySignature || initialBiz?.aiSignature || ''))))
  );

  const [localAutoReply, setLocalAutoReply] = useState<boolean>(
    props.settingsState?.autoReplyEnabled !== undefined
      ? Boolean(props.settingsState.autoReplyEnabled)
      : (props.autoReplyEnabled !== undefined
        ? Boolean(props.autoReplyEnabled)
        : (props.autoPublish5Star !== undefined
          ? Boolean(props.autoPublish5Star)
          : Boolean(initialBiz?.autoReplyEnabled ?? initialBiz?.autoPublish5Star ?? false)))
  );

  const [localKeywords, setLocalKeywords] = useState<string[]>(() => {
    if (props.settingsState?.keywords && props.settingsState.keywords.length > 0) return props.settingsState.keywords;
    if (props.keywords && props.keywords.length > 0) return props.keywords;
    if (props.seoKeywords) {
      if (Array.isArray(props.seoKeywords)) return props.seoKeywords;
      return props.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    if (props.settingsState?.seoKeywords) {
      if (Array.isArray(props.settingsState.seoKeywords)) return props.settingsState.seoKeywords;
      return props.settingsState.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    if (initialBiz?.seoKeywords) {
      return initialBiz.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    if (initialBiz?.customKeywords) {
      return initialBiz.customKeywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    return keywords || [];
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Sync state if initialBusiness changes
  useEffect(() => {
    const biz = initialBusiness || business;
    if (biz) {
      if ((biz.aiPersonality || biz.aiTone || biz.brandVoice) && !props.aiTone && !props.brandVoice && !props.aiPersonality) {
        const tone = (biz.aiPersonality || biz.aiTone || biz.brandVoice) as BrandVoiceType;
        setLocalTone(tone);
        setBrandVoice?.(tone);
        setAiTone?.(tone);
        props.setAiPersonality?.(tone);
      }
      if (biz.aiInstructions !== undefined && props.aiInstructions === undefined) {
        setLocalInstructions(biz.aiInstructions || '');
        setAiInstructions?.(biz.aiInstructions || '');
      }
      if (biz.aiSignature !== undefined && props.aiSignature === undefined) {
        setLocalSignature(biz.aiSignature || '');
        setAiSignature?.(biz.aiSignature || '');
      }
      if ((biz.autoReplyEnabled !== undefined || biz.autoPublish5Star !== undefined) && props.autoReplyEnabled === undefined) {
        const enabled = Boolean(biz.autoReplyEnabled ?? biz.autoPublish5Star);
        setLocalAutoReply(enabled);
        setAutoReplyEnabled?.(enabled);
        setAutoPublish5Star?.(enabled);
      }
      const bizKw = biz.seoKeywords || biz.customKeywords;
      if (bizKw && (!props.keywords || props.keywords.length === 0)) {
        const kwList = bizKw.split(',').map((k: string) => k.trim()).filter(Boolean);
        setLocalKeywords(kwList);
        setKeywords?.(kwList);
      }
      if (biz.selectedModel && !propSelectedModel) {
        setSelectedModel(biz.selectedModel);
        propSetSelectedModel?.(biz.selectedModel);
      }
    }
  }, [initialBusiness, business]);

  // Sync from parent props if parent updates
  useEffect(() => {
    if (props.brandVoice && props.brandVoice !== localTone) {
      setLocalTone(props.brandVoice as BrandVoiceType);
    }
  }, [props.brandVoice]);

  useEffect(() => {
    if (props.aiTone && props.aiTone !== localTone) {
      setLocalTone(props.aiTone as BrandVoiceType);
    }
  }, [props.aiTone]);

  useEffect(() => {
    if (props.aiPersonality && props.aiPersonality !== localTone) {
      setLocalTone(props.aiPersonality as BrandVoiceType);
    }
  }, [props.aiPersonality]);

  useEffect(() => {
    if (props.settingsState?.aiPersonality && props.settingsState.aiPersonality !== localTone) {
      setLocalTone(props.settingsState.aiPersonality as BrandVoiceType);
    } else if (props.settingsState?.aiTone && props.settingsState.aiTone !== localTone) {
      setLocalTone(props.settingsState.aiTone as BrandVoiceType);
    }
  }, [props.settingsState?.aiPersonality, props.settingsState?.aiTone]);

  useEffect(() => {
    const nextInst = props.customInstructions ?? props.aiInstructions ?? props.settingsState?.customInstructions ?? props.settingsState?.aiInstructions;
    if (nextInst !== undefined && nextInst !== localInstructions) {
      setLocalInstructions(nextInst);
    }
  }, [props.customInstructions, props.aiInstructions, props.settingsState?.customInstructions, props.settingsState?.aiInstructions]);

  useEffect(() => {
    const nextSig = props.replySignature ?? props.aiSignature ?? props.settingsState?.replySignature ?? props.settingsState?.aiSignature;
    if (nextSig !== undefined && nextSig !== localSignature) {
      setLocalSignature(nextSig);
    }
  }, [props.replySignature, props.aiSignature, props.settingsState?.replySignature, props.settingsState?.aiSignature]);

  useEffect(() => {
    if (props.autoReplyEnabled !== undefined && props.autoReplyEnabled !== localAutoReply) {
      setLocalAutoReply(props.autoReplyEnabled);
    }
  }, [props.autoReplyEnabled]);

  useEffect(() => {
    if (props.keywords && JSON.stringify(props.keywords) !== JSON.stringify(localKeywords)) {
      setLocalKeywords(props.keywords);
    }
  }, [props.keywords]);

  useEffect(() => {
    if (props.seoKeywords !== undefined && !props.keywords) {
      const arr = typeof props.seoKeywords === 'string'
        ? props.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : (Array.isArray(props.seoKeywords) ? props.seoKeywords : []);
      if (JSON.stringify(arr) !== JSON.stringify(localKeywords)) {
        setLocalKeywords(arr);
      }
    }
  }, [props.seoKeywords, props.keywords]);

  useEffect(() => {
    if (propSelectedModel && propSelectedModel !== selectedModel) {
      setSelectedModel(propSelectedModel);
    }
  }, [propSelectedModel]);

  const handleToneSelect = (tone: BrandVoiceType) => {
    setLocalTone(tone);
    setBrandVoice?.(tone);
    setAiTone?.(tone);
    props.setAiPersonality?.(tone);
    if (props.setSettingsState) {
      props.setSettingsState((prev: any) => ({
        ...prev,
        aiTone: tone,
        brandVoice: tone,
        aiPersonality: tone,
      }));
    }
  };

  const handleInstructionsChange = (val: string) => {
    setLocalInstructions(val);
    setAiInstructions?.(val);
    props.setCustomInstructions?.(val);
    if (props.setSettingsState) {
      props.setSettingsState((prev: any) => ({
        ...prev,
        aiInstructions: val,
        customInstructions: val,
      }));
    }
  };

  const handleSignatureChange = (val: string) => {
    setLocalSignature(val);
    setAiSignature?.(val);
    props.setReplySignature?.(val);
    if (props.setSettingsState) {
      props.setSettingsState((prev: any) => ({
        ...prev,
        aiSignature: val,
        replySignature: val,
      }));
    }
  };

  const handleAutoReplyToggle = (checked: boolean) => {
    setLocalAutoReply(checked);
    setAutoReplyEnabled?.(checked);
    setAutoPublish5Star?.(checked);
    if (props.setSettingsState) {
      props.setSettingsState((prev: any) => ({
        ...prev,
        autoReplyEnabled: checked,
        autoPublish5Star: checked,
      }));
    }
  };

  const handleAddKeyword = (kwToAdd?: string) => {
    const text = (kwToAdd || newKeyword).trim();
    if (text && !localKeywords.includes(text)) {
      const updated = [...localKeywords, text];
      setLocalKeywords(updated);
      setKeywords?.(updated);
      props.setSeoKeywords?.(updated.join(','));
      if (props.setSettingsState) {
        props.setSettingsState((prev: any) => ({
          ...prev,
          keywords: updated,
          seoKeywords: updated.join(','),
          customKeywords: updated.join(','),
        }));
      }
      if (!kwToAdd) setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    const updated = localKeywords.filter((k) => k !== kw);
    setLocalKeywords(updated);
    setKeywords?.(updated);
    props.setSeoKeywords?.(updated.join(','));
    if (props.setSettingsState) {
      props.setSettingsState((prev: any) => ({
        ...prev,
        keywords: updated,
        seoKeywords: updated.join(','),
        customKeywords: updated.join(','),
      }));
    }
  };

  const isSaving = isSavingAiPersona || internalSaving;
  const isSaved = isAiPersonaSaved || internalSaved;

  const handleSavePersona = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }
    if (e && typeof (e as any).stopPropagation === 'function') {
      (e as any).stopPropagation();
    }
    setInternalSaving(true);
    try {
      const personaPayload = {
        aiTone: localTone,
        brandVoice: localTone,
        brand_voice: localTone,
        tone: localTone,
        selectedTone: localTone,
        aiPersonality: localTone,
        ai_personality: localTone,
        aiInstructions: localInstructions,
        customInstructions: localInstructions,
        aiSignature: localSignature,
        replySignature: localSignature,
        autoReplyEnabled: localAutoReply,
        autoPublish5Star: localAutoReply,
        keywords: localKeywords,
        seoKeywords: localKeywords.join(','),
        customKeywords: localKeywords.join(','),
        selectedModel,
      };

      if (props.setSettingsState) {
        props.setSettingsState((prev: any) => ({
          ...prev,
          ...personaPayload,
        }));
      }
      if (onSaveAiPersona) {
        await (onSaveAiPersona as any)(personaPayload, e);
      } else {
        const bId = initialBiz?.id || business?.id;
        await saveAllSettingsAction({
          businessId: bId,
          ...personaPayload,
        });
        setInternalSaved(true);
        toast.success('AI Persona saved successfully');
        setTimeout(() => setInternalSaved(false), 2500);
      }
    } catch (err: any) {
      console.error('[AiPersonaCard save error]:', err);
      toast.error('Failed to save AI persona', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setInternalSaving(false);
    }
  };

  // Generate dynamic live preview text
  const currentPersona = PERSONA_OPTIONS.find((p) => isPersonaSelected(localTone, p.key)) || PERSONA_OPTIONS[0];
  const keywordHighlights = localKeywords.length > 0 ? ` Mentioning our commitment to ${localKeywords.slice(0, 2).join(' and ')}.` : '';
  const signatureSuffix = localSignature ? ` ${localSignature}` : '';
  const previewReply = `${currentPersona.samplePrefix}${keywordHighlights}${signatureSuffix}`;

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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <select
              value={props.selectedModel || selectedModel}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedModel(val);
                propSetSelectedModel?.(val);
              }}
              className="bg-transparent text-xs font-bold text-purple-700 border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
              <option value="gemini-3.8-pro">Gemini 3.8 Pro</option>
            </select>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSavePersona(e); }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Persona Selector Grid */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Select Tone &amp; Personality
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONA_OPTIONS.map((option) => {
            const Icon = option.icon;
            const currentVoice = localTone || props.brandVoice || props.settingsState?.brandVoice || 'friendly_professional';
            const isSelected = isPersonaSelected(currentVoice, option.value);

            return (
              <button
                type="button"
                key={option.value}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (setBrandVoice) {
                    setBrandVoice(option.value);
                  }
                  if (props.setBrandVoice) {
                    props.setBrandVoice(option.value);
                  }
                  setLocalTone(option.value as BrandVoiceType);
                  handleToneSelect(option.value as BrandVoiceType);
                }}
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
                    <span className="text-xs font-bold text-slate-900">{option.title}</span>
                  </div>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-9">
                  {option.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom AI Guidance & Reply Instructions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            Custom AI Reply Instructions &amp; Policies
          </label>
          <span className="text-[11px] text-slate-400">Optional</span>
        </div>
        <textarea
          rows={3}
          value={
            props.customInstructions !== undefined
              ? props.customInstructions
              : (props.settingsState?.customInstructions !== undefined
                ? props.settingsState.customInstructions
                : (props.aiInstructions !== undefined
                  ? props.aiInstructions
                  : (props.settingsState?.aiInstructions !== undefined
                    ? props.settingsState.aiInstructions
                    : (localInstructions || ''))))
          }
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="E.g. Always mention that parking is validated in the rear lot. Never offer refunds or discounts in public review replies. Encourage reviewers to ask for Chef Marco next time."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 leading-relaxed"
        />
        <p className="text-[11px] text-slate-500">
          Special rules injected into the prompt when Gemini drafts replies to your Google reviews.
        </p>
      </div>

      {/* 3. AI Sign-off / Signature */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-purple-600" />
            AI Reply Sign-off &amp; Signature
          </label>
          <span className="text-[11px] text-slate-400">Optional</span>
        </div>
        <input
          type="text"
          value={
            props.replySignature !== undefined
              ? props.replySignature
              : (props.settingsState?.replySignature !== undefined
                ? props.settingsState.replySignature
                : (props.aiSignature !== undefined
                  ? props.aiSignature
                  : (props.settingsState?.aiSignature !== undefined
                    ? props.settingsState.aiSignature
                    : (localSignature || ''))))
          }
          onChange={(e) => handleSignatureChange(e.target.value)}
          placeholder="E.g. — The Management Team, RatingPulse"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
        />
        <p className="text-[11px] text-slate-500">
          Automatically appended to the end of every generated public review response.
        </p>
      </div>

      {/* 4. Custom Local SEO Keywords Tag Manager */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            Local SEO Keywords (Injected into replies to boost Google 3-Pack rankings)
          </label>
          <span className="text-[11px] text-slate-500">{localKeywords.length} active keywords</span>
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
          {SUGGESTED_KEYWORDS.filter((k) => !localKeywords.includes(k)).slice(0, 4).map((sug) => (
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
        {localKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {localKeywords.map((kw, i) => (
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

      {/* 5. Auto-publish 5-Star Reviews Toggle */}
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
            checked={Boolean(props.autoReplyEnabled !== undefined ? props.autoReplyEnabled : (props.autoPublish5Star !== undefined ? props.autoPublish5Star : localAutoReply))}
            onChange={(e) => handleAutoReplyToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* 6. Interactive Live Sample Reply Preview */}
      <div className="space-y-3 pt-1">
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

      {/* 7. Dedicated Persona Tab Save Footer Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Saved persona settings will be applied immediately to all generated review replies.
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSavePersona(e); }}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Saving Persona...</span>
            </>
          ) : isSaved ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Persona Preferences Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Save AI Persona Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
