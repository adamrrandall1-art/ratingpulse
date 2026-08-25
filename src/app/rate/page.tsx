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
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

function ReviewGateContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const idParam = (params?.id as string) || '';
  const businessParam = searchParams.get('business');
  const placeIdParam = searchParams.get('placeId');
  const reviewUrlParam = searchParams.get('reviewUrl');
  const ownerEmailParam = searchParams.get('ownerEmail');

  const [businessName, setBusinessName] = useState<string>(
    businessParam || 'Apex Dental & Aesthetics'
  );
  const [placeId, setPlaceId] = useState<string>(
    placeIdParam || ''
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>(
    reviewUrlParam || (placeIdParam ? `https://search.google.com/local/writereview?placeid=${placeIdParam}` : '')
  );
  const [ownerEmail, setOwnerEmail] = useState<string>(
    ownerEmailParam || 'notifications@ratingpulse.co'
  );
  const [address, setAddress] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch business record from Supabase if invite ID or business ID is provided
  useEffect(() => {
    async function resolveBusiness() {
      if (!isSupabaseConfigured || !supabase || !idParam || idParam === 'demo') {
        return;
      }

      setIsLoading(true);
      try {
        // Try looking up review_invites table
        const { data: inviteData } = await supabase
          .from('review_invites')
          .select('id, user_id, customer_name, customer_phone')
          .eq('id', idParam)
          .maybeSingle();

        const resolvedUserId = inviteData?.user_id || idParam;
        if (inviteData?.customer_name) {
          setCustomerName(inviteData.customer_name);
        }
        if (inviteData?.customer_phone) {
          if (inviteData.customer_phone.includes('@')) {
            setCustomerEmail(inviteData.customer_phone);
          } else {
            setCustomerPhone(inviteData.customer_phone);
          }
        }

        if (resolvedUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedUserId)) {
          setTargetUserId(resolvedUserId);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('business_name, google_place_id, review_url, email, notification_email, formatted_address')
            .eq('id', resolvedUserId)
            .maybeSingle();

          if (profileData) {
            if (profileData.business_name && !businessParam) {
              setBusinessName(profileData.business_name);
            }
            if (profileData.google_place_id && !placeIdParam) {
              setPlaceId(profileData.google_place_id);
            }
            if (profileData.review_url && !reviewUrlParam) {
              setGoogleReviewUrl(profileData.review_url);
            } else if (profileData.google_place_id && !reviewUrlParam) {
              setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${profileData.google_place_id}`);
            }
            if ((profileData.notification_email || profileData.email) && !ownerEmailParam) {
              setOwnerEmail(profileData.notification_email || profileData.email);
            }
            if (profileData.formatted_address) {
              setAddress(profileData.formatted_address);
            }
          }
        }
      } catch (err) {
        console.warn('Error resolving business on review gate:', err);
      } finally {
        setIsLoading(false);
      }
    }

    resolveBusiness();
  }, [idParam, businessParam, placeIdParam, reviewUrlParam, ownerEmailParam]);

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Private feedback form state (for 1-3 stars)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Derive final 5-star Google review URL without hardcoded Sydney fallback
  const resolvedGoogleUrl =
    googleReviewUrl ||
    (placeId
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : `https://www.google.com/search?q=${encodeURIComponent(businessName + ' write a review')}`);

  const handleRatingClick = async (rating: number) => {
    setSelectedRating(rating);

    if (rating >= 4) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }

      // If user left 4-5 stars, update invite status in Supabase
      if (isSupabaseConfigured && supabase && idParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam)) {
        try {
          await supabase
            .from('review_invites')
            .update({
              status: 'reviewed',
              rating_received: rating,
              review_received_at: new Date().toISOString(),
            })
            .eq('id', idParam);
        } catch (dbErr) {
          console.warn('DB update on 5-star rating warning:', dbErr);
        }
      }
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);

    const effectiveRating = selectedRating || 3;
    const effectiveContact = customerEmail || customerPhone || 'Not provided';

    // 1. Submit feedback via server-side API (bypasses RLS & dispatches email alert)
    try {
      await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId: idParam,
          businessId: targetUserId,
          userId: targetUserId,
          customerName: customerName || 'Anonymous Customer',
          customerPhone,
          customerEmail,
          rating: effectiveRating,
          feedbackText,
          businessName,
          ownerEmail,
        }),
      });
    } catch (err) {
      console.warn('Feedback submit dispatch warning:', err);
    }

    // 2. Direct client fallback update if Supabase client is active
    if (isSupabaseConfigured && supabase) {
      try {
        if (idParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam)) {
          const updatePayload: Record<string, unknown> = {
            rating_received: effectiveRating,
            feedback_text: feedbackText,
            status: 'unresolved',
            resolution_status: 'unresolved',
            review_received_at: new Date().toISOString(),
          };
          if (customerName) updatePayload.customer_name = customerName;
          if (customerPhone) updatePayload.customer_phone = customerPhone;
          if (customerEmail) updatePayload.customer_email = customerEmail;

          await supabase
            .from('review_invites')
            .update(updatePayload)
            .eq('id', idParam);
        }

        if (targetUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
          await supabase.from('feedback').insert([{
            user_id: targetUserId,
            business_id: targetUserId,
            customer_name: customerName || 'Anonymous Customer',
            customer_email: customerEmail || (customerPhone?.includes('@') ? customerPhone : null),
            customer_phone: customerPhone || null,
            rating: effectiveRating,
            feedback_text: feedbackText,
            status: 'unresolved',
          }]);
        }
      } catch (dbErr) {
        console.warn('Direct client feedback update warning:', dbErr);
      }
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6">
      
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full pt-4 pb-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-100 tracking-tight">
            {businessName}
          </span>
        </div>
      </header>

      {/* Main Rating Card */}
      <main className="max-w-md mx-auto w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {selectedRating === null ? (
          /* Step 1: Star Rating Selector */
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
                Tap a star below to rate your overall visit:
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
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
                    className="p-1 sm:p-2 rounded-2xl transition-all transform hover:scale-115 active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-600 hover:text-slate-500'
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
          /* Step 2A: 4-5 Stars -> Redirect to Google Review */
          <div className="text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              🌟
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Thank you so much!
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                We are thrilled you had a 5-star experience with {businessName}. Could you share your review on Google to help others find us?
              </p>
            </div>

            <div className="pt-2">
              <a
                href={resolvedGoogleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer"
              >
                <span>Post Review on Google</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[11px] text-slate-500">
              Directly opens the Google review dialog for {businessName}.
            </p>
          </div>
        ) : (
          /* Step 2B: 1-3 Stars -> Private Feedback Form with Compliant Public Google Option */
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

export default function ReviewGatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading review gate...</div>}>
      <ReviewGateContent />
    </Suspense>
  );
}