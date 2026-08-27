'use client';

import React from 'react';
import Logo, { LogoProps } from '@/components/ui/Logo';

export default function BrandLogo(props: LogoProps & { subtitle?: string; customSubtitle?: string }) {
  return <Logo {...props} />;
}
