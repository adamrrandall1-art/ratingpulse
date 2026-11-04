'use client';

import AiPersonaCard, {
  BrandVoiceType,
  AiPersonaCardProps,
  PERSONA_OPTIONS,
  isPersonaSelected,
  PersonaOption,
  generateSimulationPreview,
} from '@/components/settings/AiPersonaCard';

export const AiReplyPersonaTab = AiPersonaCard;
export type { BrandVoiceType, AiPersonaCardProps, PersonaOption };
export { PERSONA_OPTIONS, isPersonaSelected, generateSimulationPreview };
export default AiPersonaCard;
export { AiPersonaCard };
