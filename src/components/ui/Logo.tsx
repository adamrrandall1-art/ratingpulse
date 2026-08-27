'use client';

import React from 'react';
import BrandLogo from '@/components/BrandLogo';

export default function Logo(props: any) {
  const subtitleMap: Record<string, 'none' | 'default' | 'dashboard' | 'custom'> = {
    domain: 'default',
    dashboard: 'dashboard',
    none: 'none',
    custom: 'custom',
  };

  return (
    <BrandLogo
      {...props}
      subtitle={subtitleMap[props.subtitle] || props.subtitle || 'default'}
    />
  );
}
