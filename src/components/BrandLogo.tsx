'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  subtitle?: 'none' | 'default' | 'dashboard' | 'custom';
  customSubtitle?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function BrandLogo({
  variant = 'full',
  size = 'md',
  subtitle = 'default',
  customSubtitle,
  href = '/',
  onClick,
  className = '',
}: BrandLogoProps) {
  const sizeMap = {
    sm: {
      box: 'w-7 h-7',
      svg: 28,
      title: 'text-base',
      sub: 'text-[8px] tracking-[0.2em]',
      gap: 'gap-2',
    },
    md: {
      box: 'w-9 h-9 sm:w-10 sm:h-10',
      svg: 36,
      title: 'text-lg sm:text-xl',
      sub: 'text-[9px] sm:text-[10px] tracking-[0.22em]',
      gap: 'gap-2.5',
    },
    lg: {
      box: 'w-12 h-12',
      svg: 44,
      title: 'text-2xl sm:text-3xl',
      sub: 'text-xs tracking-[0.25em]',
      gap: 'gap-3',
    },
  }[size];

  const logoMark = (
    <div
      className={`relative ${sizeMap.box} rounded-xl bg-[#111820] border border-[#00d2c4]/40 p-[2px] shadow-[0_0_16px_rgba(0,210,196,0.25)] group-hover:shadow-[0_0_24px_rgba(0,210,196,0.45)] group-hover:border-[#00d2c4] transition-all duration-300 shrink-0 flex items-center justify-center overflow-hidden`}
    >
      {/* Background glow aura */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00d2c4]/15 via-[#10b981]/15 to-transparent blur-[4px]" />

      {/* Stylized SVG 'R' + Checkmark + EKG Pulse Line */}
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cyanTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2c4" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#00e676" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Stem of R with checkmark transition */}
        <path
          d="M 12 10 L 12 38"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Head loop of R */}
        <path
          d="M 12 10 L 26 10 C 33 10 33 22 26 22 L 12 22"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Integrated Emerald Green Checkmark Leg */}
        <path
          d="M 19 22 L 25 28 L 36 14"
          stroke="url(#emeraldGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neonGlow)"
        />

        {/* Continuous Cyan/Teal EKG Pulse Line flowing out */}
        <path
          d="M 23 22 L 27 38 L 32 30 L 36 38 L 44 38"
          stroke="url(#cyanTealGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neonGlow)"
        />

        {/* Pulsing Beacon Dot */}
        <circle
          cx="43"
          cy="38"
          r="2"
          fill="#00e676"
          className="animate-ping opacity-75 origin-center"
        />
        <circle cx="43" cy="38" r="1.5" fill="#00d2c4" />
      </svg>
    </div>
  );

  const content = (
    <div className={`inline-flex items-center ${sizeMap.gap} group select-none transition-all ${className}`}>
      {logoMark}

      {variant === 'full' && (
        <div className="flex flex-col text-left">
          <div className={`font-extrabold ${sizeMap.title} tracking-tight text-white flex items-center leading-none`}>
            <span className="text-slate-50 font-black">Rating</span>
            <span className="bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] bg-clip-text text-transparent font-black ml-0.5 drop-shadow-[0_0_12px_rgba(0,210,196,0.4)]">
              Pulse
            </span>
          </div>

          {subtitle === 'default' && (
            <span className={`${sizeMap.sub} uppercase font-bold text-slate-400 mt-1 leading-none`}>
              RATINGPULSE
            </span>
          )}

          {subtitle === 'dashboard' && (
            <span className={`${sizeMap.sub} uppercase font-bold text-[#00d2c4] mt-1 leading-none flex items-center gap-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d2c4] animate-pulse" />
              DASHBOARD
            </span>
          )}

          {subtitle === 'custom' && customSubtitle && (
            <span className={`${sizeMap.sub} uppercase font-semibold text-slate-400 mt-1 leading-none`}>
              {customSubtitle}
            </span>
          )}
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
