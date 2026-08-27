'use client';

import React from 'react';
import Link from 'next/link';

export interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  onClick?: () => void;
  className?: string;
  subtitle?: string;
}

export function LogoIcon({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl bg-[#0B0F19] border border-[#00e676]/30 p-1 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(0,230,118,0.25)] group-hover:shadow-[0_0_24px_rgba(0,230,118,0.45)] group-hover:border-[#00e676]/60 transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00e676]/20 via-[#10b981]/15 to-transparent blur-[3px]" />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rpGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e676" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#00d2c4" />
          </linearGradient>
          <filter id="rpGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Left Vertical Stem of R */}
        <rect
          x="16"
          y="16"
          width="13"
          height="68"
          rx="6.5"
          fill="url(#rpGreenGrad)"
          filter="url(#rpGlow)"
        />

        {/* 2. Upper Curved Loop of R */}
        <path
          d="M 22 16 L 52 16 C 68 16 68 46 52 46 L 22 46"
          stroke="url(#rpGreenGrad)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#rpGlow)"
        />

        {/* 3. Dynamic EKG Pulse Waveform Leg */}
        <path
          d="M 38 46 L 46 80 L 60 22 L 72 80 L 86 48 L 92 48"
          stroke="url(#rpGreenGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#rpGlow)"
        />

        {/* 4. Pulsing Beacon Dot */}
        <circle
          cx="92"
          cy="48"
          r="4.5"
          fill="#00e676"
          className="animate-ping opacity-75 origin-center"
        />
        <circle cx="92" cy="48" r="3.5" fill="#00e676" />
      </svg>
    </div>
  );
}

export default function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  onClick,
  className = '',
}: LogoProps) {
  const sizeConfig = {
    sm: {
      iconSize: 30,
      gap: 'gap-2',
      ratingText: 'text-sm font-black tracking-tight leading-none',
      pulseText: 'text-[9px] font-extrabold tracking-[0.24em] leading-none mt-0.5',
    },
    md: {
      iconSize: 38,
      gap: 'gap-2.5',
      ratingText: 'text-base sm:text-lg font-black tracking-tight leading-none',
      pulseText: 'text-[10px] sm:text-[11px] font-extrabold tracking-[0.26em] leading-none mt-1',
    },
    lg: {
      iconSize: 48,
      gap: 'gap-3',
      ratingText: 'text-xl sm:text-2xl font-black tracking-tight leading-none',
      pulseText: 'text-xs sm:text-sm font-extrabold tracking-[0.28em] leading-none mt-1',
    },
    xl: {
      iconSize: 60,
      gap: 'gap-3.5',
      ratingText: 'text-2xl sm:text-3xl font-black tracking-tight leading-none',
      pulseText: 'text-sm sm:text-base font-extrabold tracking-[0.3em] leading-none mt-1.5',
    },
  }[size];

  const content = (
    <div className={`inline-flex items-center ${sizeConfig.gap} group select-none transition-all ${className}`}>
      <LogoIcon size={sizeConfig.iconSize} />

      {variant === 'full' && (
        <div className="flex flex-col text-left justify-center">
          {/* Top Line: RATING (White) */}
          <span className={`${sizeConfig.ratingText} text-white uppercase`}>
            RATING
          </span>

          {/* Bottom Line: PULSE (Green matching icon) */}
          <span
            className={`${sizeConfig.pulseText} text-[#00e676] uppercase font-black drop-shadow-[0_0_10px_rgba(0,230,118,0.4)]`}
          >
            PULSE
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
