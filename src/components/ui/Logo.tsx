'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  href?: string;
  onClick?: () => void;
  subtitle?: string;
  customSubtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconOnly = false,
  variant,
  href = '/',
  onClick,
}) => {
  const isIcon = iconOnly || variant === 'icon';

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none group ${className}`}
    >
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors shrink-0">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      {!isIcon && (
        <span className="text-lg font-bold tracking-tight text-slate-900">
          RATING<span className="text-blue-600">PULSE</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;
