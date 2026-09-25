'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Building2, ExternalLink } from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';

export default function DashboardOverviewPage() {
  const { profile, reviews: storeReviews } = useRatingPulseStore();

  const isGoogleConnected = Boolean(
    profile.google_place_id && profile.business_name && profile.google_connected !== false
  );

  const businessName = profile.business_name || null;
  const businessAddress = (profile as any)?.business_address || (profile as any)?.city || (businessName ? 'Verified Location' : null);

  const ratingScore = profile.google_rating ? profile.google_rating.toFixed(1) : '—';
  const reviewCount = profile.google_review_count || storeReviews.length || 0;

  // Strict guard: if not connected, reviews are strictly empty
  const reviews = isGoogleConnected ? storeReviews.slice(0, 10) : [];

  return (
    <div className="space-y-8">
      
      {/* 1. THREE SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Active Business */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Business
            </span>
            <div className="mt-2">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {businessName || 'No Business Connected'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {businessAddress || (
                  <Link href="/dashboard/setup" className="text-blue-600 hover:underline font-medium">
                    Connect a business profile &rarr;
                  </Link>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Review Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Review Summary
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 flex items-center gap-1.5">
                {isGoogleConnected ? (
                  <>
                    <span>{ratingScore}</span>
                    <span className="text-amber-400 text-lg">★★★★★</span>
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isGoogleConnected ? `${reviewCount.toLocaleString()} reviews` : '0 reviews'}
            </p>
          </div>
        </div>

        {/* Card 3: Google Sync Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Google Sync Status
            </span>
            <div className="mt-2 flex items-center gap-2">
              {isGoogleConnected ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected (🟢)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Disconnected (⚪)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isGoogleConnected ? 'Live synchronization active' : 'Link Google Profile to start syncing'}
            </p>
          </div>
        </div>

      </div>

      {/* 2. REVIEWS TABLE CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Card Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Reviews</h3>
          <Link
            href="/dashboard/reviews"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            See all reviews &rarr;
          </Link>
        </div>

        {/* Table Content or Guarded Clean Empty State */}
        {!isGoogleConnected || reviews.length === 0 ? (
          <div className="px-6 py-16 text-center max-w-md mx-auto">
            <p className="text-sm font-medium text-slate-600">
              No reviews to display. Connect your Google Business profile.
            </p>
            {!isGoogleConnected && (
              <div className="mt-4">
                <Link
                  href="/dashboard/setup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  <span>Connect Google Profile</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase px-6 py-3 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Rating</th>
                  <th scope="col" className="px-6 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => {
                  const dateString = rev.review_date
                    ? new Date(rev.review_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer */}
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face'}
                            alt={rev.author_name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <span>{rev.author_name}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {dateString}
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1">
                            {rev.rating}.0
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                          {/* Colored Google G Icon */}
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Google</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}