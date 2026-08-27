'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: 'none' | 'domain' | 'dashboard' | 'custom';
  customSubtitle?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function Logo({
  size = 'md',
  subtitle = 'domain',
  customSubtitle,
  href = '/',
  onClick,
  className = '',
}: LogoProps) {
  const sizeClasses = {
    sm: {
      container: 'gap-2',
      iconBox: 'w-7 h-7 rounded-lg',
      star: 'w-3.5 h-3.5',
      title: 'text-base',
      subtitle: 'text-[9px]',
    },
    md: {
      container: 'gap-2.5',
      iconBox: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
      star: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
      title: 'text-lg sm:text-xl',
      subtitle: 'text-[10px]',
    },
    lg: {
      container: 'gap-3',
      iconBox: 'w-12 h-12 rounded-2xl',
      star: 'w-6 h-6',
      title: 'text-2xl sm:text-3xl',
      subtitle: 'text-xs',
    },
  }[size];

  const content = (
    <div className={`flex items-center ${sizeClasses.container} group transition-all select-none ${className}`}>
      {/* Radiant Electric Neon Emblem */}
      <div
        className={`relative ${sizeClasses.iconBox} p-[1.5px] rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/50 group-hover:scale-105 transition-all duration-300 shrink-0`}
      >
        {/* Glow backdrop aura */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-cyan-500 to-blue-600 blur-[6px] opacity-60 group-hover:opacity-100 transition-opacity" />

        {/* Inner Midnight Glass Core */}
        <div className="relative w-full h-full rounded-[10px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center overflow-hidden border border-cyan-400/20">
          
          {/* Animated Neon Wave Pulse Rings */}
          <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping opacity-40 duration-1000" />
          <svg
            viewBox="0 0 40 40"
            className="absolute inset-0 w-full h-full text-cyan-400/30 stroke-current"
            fill="none"
          >
            <circle cx="20" cy="20" r="14" strokeWidth="1" strokeDasharray="3 3" className="animate-spin duration-7000" />
          </svg>

          {/* Glowing Geometric 5-Star Core */}
          <div className="relative z-10 flex items-center justify-center">
            <Star
              className={`${sizeClasses.star} fill-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)] group-hover:rotate-12 transition-transform duration-300`}
            />
          </div>

          {/* Electric Pulse Signal Line */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 animate-pulse" />
        </div>
      </div>

      {/* Typography: Rating (White) + Pulse (Cyan/Blue Gradient) */}
      <div className="flex flex-col text-left">
        <div className={`font-extrabold ${sizeClasses.title} tracking-tight text-white flex items-center leading-none`}>
          <span>Rating</span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent ml-0.5 drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]">
            Pulse
          </span>
          {subtitle === 'domain' && (
            <span className="text-cyan-400 font-bold ml-0.5 text-[0.85em] leading-none drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              .co
            </span>
          )}
        </div>

        {subtitle === 'domain' && (
          <span className={`${sizeClasses.subtitle} uppercase font-bold tracking-widest text-slate-400 mt-1 leading-none`}>
            Google Review Automation
          </span>
        )}

        {subtitle === 'dashboard' && (
          <span className={`${sizeClasses.subtitle} font-bold text-cyan-400 tracking-wider uppercase mt-1 leading-none flex items-center gap-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Dashboard
          </span>
        )}

        {subtitle === 'custom' && customSubtitle && (
          <span className={`${sizeClasses.subtitle} text-slate-400 font-medium mt-1 leading-none`}>
            {customSubtitle}
          </span>
        )}
      </div>
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
