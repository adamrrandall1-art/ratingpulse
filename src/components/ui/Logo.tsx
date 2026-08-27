'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

export default function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  onClick,
  className = '',
  priority = true,
}: LogoProps) {
  const dimensions = {
    sm: variant === 'icon' ? { width: 32, height: 32 } : { width: 140, height: 34 },
    md: variant === 'icon' ? { width: 40, height: 40 } : { width: 175, height: 42 },
    lg: variant === 'icon' ? { width: 48, height: 48 } : { width: 210, height: 50 },
    xl: variant === 'icon' ? { width: 64, height: 64 } : { width: 260, height: 62 },
  }[size];

  const logoSrc = variant === 'icon' ? '/apple-touch-icon.png' : '/images/logo.png';

  const content = (
    <div className={`inline-flex items-center select-none group transition-transform hover:scale-[1.02] ${className}`}>
      <Image
        src={logoSrc}
        alt="RatingPulse"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="h-auto w-auto object-contain drop-shadow-[0_0_16px_rgba(0,230,118,0.2)] group-hover:drop-shadow-[0_0_24px_rgba(0,230,118,0.4)] transition-all duration-300"
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
