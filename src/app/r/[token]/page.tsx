'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Star,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Send,
  ExternalLink,
  MapPin,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

function FunnelContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const tokenParam = (params?.token as string) || (params?.id as string) || '';
  const businessParam = searchParams.get('business');
  const placeIdParam = searchParams.get('placeId');
  const reviewUrlParam = searchParams.get('reviewUrl');
  const ownerEmailParam = searchParams.get('ownerEmail');

  const [businessName, setBusinessName] = useState<string>(
    businessParam || "RatingPulse"
  );
  const [placeId, setPlaceId] = useState<string>(
    placeIdParam || (tokenParam === 'demo' ? 'ChIJawEUC_oN04kRB70LP1wHuPg' : '')
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>(
    reviewUrlParam || (placeIdParam ? `https://search.google.com/local/writereview?placeid=${placeIdParam}` : (tokenParam === 'demo' ? 'https://search.google.com/local/writereview?placeid=ChIJawEUC_oN04kRB70LP1wHuPg' : ''))
  );
  const [ownerEmail, setOwnerEmail] = useState<string>(
    ownerEmailParam || 'notifications@ratingpulse.co'
  );
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Rating and Funnel State
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Private feedback form state (for 1-3 stars)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. Resolve business & invite record on load
  useEffect(() => {
    async function resolveFunnelData() {
      if (!tokenParam || tokenParam === 'demo') {
        return;
      }

      setIsLoading(true);
      try {
        // A. First try the server-side API endpoint for reliable data resolution
        const res = await fetch(`/api/r/${tokenParam}?format=json`, {
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (res && res.ok) {
          const json = await res.json().catch(() => null);
          if (json && json.success && json.business) {
            const b = json.business;
            const inv = json.invite;

            if (b.name) setBusinessName(b.name);
            if (b.placeId) setPlaceId(b.placeId);
            if (b.googleReviewUrl) setGoogleReviewUrl(b.googleReviewUrl);
            if (b.address) setAddress(b.address);
            if (b.ownerEmail) setOwnerEmail(b.ownerEmail);
            if (b.ownerPhone) setOwnerPhone(b.ownerPhone);
            if (b.id) setTargetUserId(b.id);

            if (inv) {
              if (inv.customer_name) setCustomerName(inv.customer_name);
              if (inv.customer_phone) {
                if (inv.customer_phone.includes('@')) {
                  setCustomerEmail(inv.customer_phone);
                } else {
                  setCustomerPhone(inv.customer_phone);
                }
              }
              if (inv.customer_email) setCustomerEmail(inv.customer_email);
            }
            setIsLoading(false);
            return;
          }
        }

        // B. Fallback: Query Supabase client directly if configured
        if (isSupabaseConfigured && supabase) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenParam);
          let query = supabase
            .from('review_invites')
            .select('id, user_id, customer_name, customer_phone, customer_email, business_name, business_id, place_id, review_link');

          if (isUuid) {
            query = query.eq('id', tokenParam);
          } else {
            query = query.or(`id.eq.${tokenParam},token.eq.${tokenParam}`);
          }

          const { data: inviteData } = await query.maybeSingle();

          const resolvedUserId = inviteData?.user_id || inviteData?.business_id;
          if (inviteData?.customer_name) setCustomerName(inviteData.customer_name);
          if (inviteData?.customer_phone) {
            if (inviteData.customer_phone.includes('@')) {
              setCustomerEmail(inviteData.customer_phone);
            } else {
              setCustomerPhone(inviteData.customer_phone);
            }
          }
          if (inviteData?.customer_email) setCustomerEmail(inviteData.customer_email);
          if (inviteData?.business_name && !businessParam) setBusinessName(inviteData.business_name);
          if (inviteData?.place_id && !placeIdParam) setPlaceId(inviteData.place_id);
          if (inviteData?.review_link && !reviewUrlParam) setGoogleReviewUrl(inviteData.review_link);

          if (resolvedUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedUserId)) {
            setTargetUserId(resolvedUserId);
            const { data: profileData } = await supabase
              .from('profiles')
              .select('business_name, google_place_id, review_url, email, notification_email, notification_phone, phone, formatted_address')
              .eq('id', resolvedUserId)
              .maybeSingle();

            if (profileData) {
              if (profileData.business_name && !businessParam && !inviteData?.business_name) {
                setBusinessName(profileData.business_name);
              }
              if (profileData.google_place_id && !placeIdParam && !inviteData?.place_id) {
                setPlaceId(profileData.google_place_id);
              }
              if (profileData.review_url && !reviewUrlParam && !inviteData?.review_link) {
                setGoogleReviewUrl(profileData.review_url);
              } else if (profileData.google_place_id && !reviewUrlParam && !inviteData?.review_link) {
                setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${profileData.google_place_id}`);
              }
              if ((profileData.notification_email || profileData.email) && !ownerEmailParam) {
                setOwnerEmail(profileData.notification_email || profileData.email);
              }
              if (profileData.notification_phone || profileData.phone) {
                setOwnerPhone(profileData.notification_phone || profileData.phone);
              }
              if (profileData.formatted_address) {
                setAddress(profileData.formatted_address);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error resolving business for funnel page:', err);
      } finally {
        setIsLoading(false);
      }
    }

    resolveFunnelData();
  }, [tokenParam, businessParam, placeIdParam, reviewUrlParam, ownerEmailParam]);

  // Derive final active Google review destination URL
  const resolvedGoogleUrl =
    googleReviewUrl ||
    (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '/');

  // Handle rating click
  const handleRatingClick = async (rating: number) => {
    setSelectedRating(rating);

    if (rating >= 4) {
      // 4 or 5 stars -> celebrate & redirect immediately to active Google review URL
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }

      setIsRedirecting(true);

      // Async log invite status in Supabase
      if (isSupabaseConfigured && supabase && tokenParam) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenParam);
          let updateQuery = supabase
            .from('review_invites')
            .update({
              status: 'reviewed',
              rating_received: rating,
              review_received_at: new Date().toISOString(),
            });

          if (isUuid) {
            void updateQuery.eq('id', tokenParam);
          } else {
            void updateQuery.eq('token', tokenParam);
          }
        } catch (dbErr) {
          console.warn('DB update on 5-star rating warning:', dbErr);
        }
      }

      // Immediate redirect to active business review link
      const destination = resolvedGoogleUrl && resolvedGoogleUrl !== '/' ? resolvedGoogleUrl : (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : 'https://google.com');
      
      // Allow brief moment for confetti and visual feedback before browser navigation
      setTimeout(() => {
        window.location.href = destination;
      }, 400);
    }
  };

  // Handle 1-3 star private feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    const effectiveRating = selectedRating || 3;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName || 'Anonymous',
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          rating: effectiveRating,
          feedback_text: feedbackText,
          status: 'unresolved',
          user_id: targetUserId || null,
          business_id: targetUserId || null,
          invite_id: tokenParam || null,
          token: tokenParam || null,
          business_name: businessName,
          businessName,
          ownerEmail,
          notificationPhone: ownerPhone || null,
        }),
      });
    } catch (err) {
      console.warn('Feedback submit dispatch error:', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6">
      
      {/* Top Header & Business Branding */}
      <header className="max-w-md mx-auto w-full pt-4 pb-6 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
            {businessName}
          </span>
        </div>
      </header>

      {/* Main Review Funnel Card */}
      <main className="max-w-md mx-auto w-full bg-slate-800/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {selectedRating === null ? (
          /* Step 1: 1-5 Star Rating Selector */
          <div className="text-center space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Your Feedback Matters
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                How was your experience with {businessName}?
              </h1>
              {address && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{address}</span>
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Tap a star below to rate your overall experience:
              </p>
            </div>

            {/* Interactive 1-5 Stars */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isHovered = hoverRating !== null && hoverRating >= star;
                const isSelected = selectedRating !== null && selectedRating >= star;
                const isFilled = isHovered || isSelected;

                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => handleRatingClick(star)}
                    className="p-1 sm:p-2 rounded-2xl transition-all transform hover:scale-120 active:scale-95 cursor-pointer"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-11 sm:h-11 transition-all ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Takes less than 30 seconds</span>
            </div>
          </div>
        ) : selectedRating >= 4 ? (
          /* Step 2A: 4 or 5 Stars -> Immediate Redirect to Google */
          <div className="text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              🌟
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Thank you so much!
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                We are thrilled you had a 5-star experience with {businessName}. Redirecting you to leave your review on Google...
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening Google Reviews...</span>
              </div>

              <a
                href={resolvedGoogleUrl}
                target="_self"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer"
              >
                <span>Continue to Google Reviews</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[11px] text-slate-500">
              If you are not redirected automatically, tap the button above.
            </p>
          </div>
        ) : (
          /* Step 2B: 1-3 Stars -> Internal Private Feedback Form */
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            {isSubmitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Thank You for Your Feedback
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your message has been sent directly to the management team at <strong>{businessName}</strong>. We appreciate your honesty and will review your notes promptly to make this right.
                </p>
                
                {/* Secondary Public Option after Submission */}
                <div className="pt-3 border-t border-slate-700/60 text-center">
                  <p className="text-[11px] text-slate-400">
                    Prefer to share your feedback publicly?{' '}
                    <a
                      href={resolvedGoogleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold underline inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Leave a review on Google instead</span>
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    How can we make this right?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    We take customer satisfaction seriously. Please let management know what happened so we can resolve it immediately.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      What went wrong? *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Please tell us about your experience..."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Jessica Parker"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Phone or Email
                      </label>
                      <input
                        type="text"
                        value={customerPhone || customerEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes('@')) {
                            setCustomerEmail(val);
                          } else {
                            setCustomerPhone(val);
                          }
                        }}
                        placeholder="(555) 000-0000 or email"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !feedbackText.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Sending to Management...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Directly to Management</span>
                    </>
                  )}
                </button>

                {/* Google & FTC Compliant Secondary Public Option */}
                <div className="pt-3 border-t border-slate-700/60 text-center">
                  <p className="text-[11px] text-slate-400">
                    Prefer to share your feedback publicly?{' '}
                    <a
                      href={resolvedGoogleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold underline inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Leave a review on Google instead</span>
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full py-4 text-center">
        <p className="text-[11px] text-slate-500">
          Powered by <strong className="text-slate-400">RatingPulse</strong> • Verified Review Engine
        </p>
      </footer>

    </div>
  );
}

export default function FunnelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading review funnel...</div>}>
      <FunnelContent />
    </Suspense>
  );
}
