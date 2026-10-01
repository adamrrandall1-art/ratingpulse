'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

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
  size = 'md',
  href,
  onClick,
}) => {
  const { user } = useAuth();
  const targetHref = href !== undefined ? href : (user ? '/dashboard' : '/');

  const heightClass =
    size === 'sm'
      ? 'h-8'
      : size === 'lg'
      ? 'h-11'
      : size === 'xl'
      ? 'h-12'
      : 'h-9 sm:h-10';

  return (
    <Link
      href={targetHref}
      onClick={onClick}
      className={`inline-flex items-center select-none hover:opacity-90 transition-opacity shrink-0 ${className}`}
    >
      <img
        src="/ratingpulse_logo.png"
        alt="RatingPulse"
        className={`${heightClass} w-auto object-contain block`}
      />
    </Link>
  );
};

export default Logo;
