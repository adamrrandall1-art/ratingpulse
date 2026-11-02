'use client';

import AiPersonaCard, {
  BrandVoiceType,
  AiPersonaCardProps,
  PERSONA_OPTIONS,
  isPersonaSelected,
  PersonaOption,
} from '@/components/settings/AiPersonaCard';

export const AiReplyPersonaTab = AiPersonaCard;
export type { BrandVoiceType, AiPersonaCardProps, PersonaOption };
export { PERSONA_OPTIONS, isPersonaSelected };
export default AiPersonaCard;
export { AiPersonaCard };
