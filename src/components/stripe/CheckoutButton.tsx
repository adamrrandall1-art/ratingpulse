'use client';

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Shield, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CheckoutButtonProps {
  label?: string;
  className?: string;
  userEmail?: string;
  userId?: string;
  businessName?: string;
  showTrialBadge?: boolean;
  children?: React.ReactNode;
}

export default function CheckoutButton({
  label = 'Start 14-Day Free Trial',
  className = '',
  userEmail,
  userId,
  businessName,
  showTrialBadge = false,
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userId,
          businessName,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initiate Stripe Checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push('/checkout/success?demo=true');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const defaultClasses =
    'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all transform active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="w-full flex flex-col items-center">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={className || defaultClasses}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Connecting to Stripe...</span>
          </>
        ) : children ? (
          children
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{label}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {showTrialBadge && !loading && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>14-day free trial • $25/mo thereafter • Cancel anytime</span>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-rose-500 font-semibold">{error}</p>
      )}
    </div>
  );
}
