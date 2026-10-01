import React from 'react';
import Link from 'next/link';

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
    <Link href={href} onClick={onClick} className={`inline-flex items-center gap-2 select-none group ${className}`}>
      {isIcon ? (
        /* Favicon / Collapsed Mobile Icon View (R + Checkmark) */
        <svg viewBox="0 0 100 100" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* White 'R' Shape */}
          <path
            d="M22 82V20H54C64 20 72 26 72 37C72 46 66 52 57 54L76 82H58L42 56H38V82H22ZM38 44H52C56 44 60 41 60 37C60 33 56 30 52 30H38V44Z"
            fill="#FFFFFF"
          />
          {/* Green Checkmark Accent */}
          <path
            d="M26 48L44 66L84 22L75 14L44 48L34 38L26 48Z"
            fill="#22C55E"
          />
        </svg>
      ) : (
        /* Full Logo Lockup: R + Checkmark + Pulse Waveform + Typography */
        <div className="flex flex-col">
          <div className="flex items-center">
            <svg viewBox="0 0 320 80" className="h-9 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* White 'R' */}
              <path
                d="M18 70V14H46C56 14 64 20 64 30C64 38 58 44 50 46L68 70H52L36 47H32V70H18ZM32 37H44C48 37 51 34 51 30C51 26 48 23 44 23H32V37Z"
                fill="#FFFFFF"
              />
              {/* Green EKG Pulse Waveform intersecting R */}
              <path
                d="M2 44H26L38 60L74 16L92 74L108 36L118 44H132"
                stroke="#22C55E"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Teal / Cyan "ulse" Text */}
              <text
                x="134"
                y="52"
                fill="#14B8A6"
                fontSize="42"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="700"
                letterSpacing="-0.5"
              >
                ulse
              </text>
              {/* Trailing Pulse Line */}
              <path
                d="M228 44H310"
                stroke="#14B8A6"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {/* Small Subtitle Text "RATINGPULSE" */}
          <span className="text-[11px] font-bold tracking-[0.22em] text-white/90 pl-[70px] -mt-1 uppercase">
            RatingPulse
          </span>
        </div>
      )}
    </Link>
  );
};

export default Logo;
