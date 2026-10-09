import { Review, Invite, BusinessSettings, Profile } from './supabase/types';
import {
  DEFAULT_BUSINESS,
  DEMO_BUSINESS,
  DEMO_PROFILE,
  DEMO_SETTINGS,
  DEMO_REVIEWS,
  DEMO_INVITES,
} from './mockData';

export { DEFAULT_BUSINESS, DEMO_BUSINESS, DEMO_PROFILE, DEMO_SETTINGS, DEMO_REVIEWS, DEMO_INVITES };

export const initialProfile: Profile = {
  id: '',
  email: '',
  full_name: '',
  business_name: '',
  business_category: '',
  google_place_id: '',
  formatted_address: '',
  review_url: '',
  google_rating: 0,
  google_review_count: 0,
  google_connected: false,
  phone: '',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  plan_status: 'trialing',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoProfile: Profile = {
  id: 'usr_mock_001',
  email: 'team@ratingpulse.co',
  full_name: 'Alex Rivera',
  business_name: 'RatingPulse',
  business_category: 'Software & Reputation Management',
  google_place_id: 'demo_ratingpulse_place_id',
  formatted_address: 'Rochester, NY',
  review_url: 'https://search.google.com/local/writereview?placeid=demo_ratingpulse_place_id',
  google_rating: 5.0,
  google_review_count: 48,
  google_connected: true,
  phone: '(585) 360-2026',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  plan_status: 'trialing',
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const initialSettings: BusinessSettings = DEMO_SETTINGS;
export const initialReviews: Review[] = DEMO_REVIEWS;
export const initialInvites: Invite[] = DEMO_INVITES;

export const landingFaqs = [
  {
    question: "How does RatingPulse help me get more 5-star Google reviews?",
    answer: "Most happy customers simply forget to leave a review if not asked immediately. RatingPulse sends a perfectly-timed, friction-free SMS invite right after their visit with a direct 1-tap link to your Google Business Profile review form. Our clients see an average 340% surge in monthly reviews."
  },
  {
    question: "Is RatingPulse 100% compliant with Google's review policies?",
    answer: "Yes, 100%. RatingPulse strictly follows Google's anti-review-gating terms of service. We do not gate, block, or incentivize reviews. We simply make it effortless for all genuine customers to share their legitimate feedback on Google."
  },
  {
    question: "How does the AI Reply Drafting feature work?",
    answer: "When a new Google review lands on your profile, our AI immediately generates a personalized, highly professional reply that seamlessly weaves in your local SEO keywords. You can approve or edit the reply in 1 tap directly from your phone or dashboard."
  },
  {
    question: "Can I try RatingPulse before paying?",
    answer: "Absolutely! Every account starts with a 14-day free trial. No credit card is required to sign up, connect your Google Business Profile, and start collecting reviews."
  },
  {
    question: "What happens after the 14-day free trial?",
    answer: "You can continue on our simple, all-inclusive Growth Plan for just $25/month. There are no setup fees, hidden limits, or long-term contracts. You can cancel with 1 click at any time."
  }
];

export const testimonials = [
  {
    quote: "We went from 3 reviews a month to over 35 five-star reviews in our very first month. Our Google Maps ranking jumped to #1 in our zip code!",
    author: "Alex Rivera",
    role: "Founder, RatingPulse",
    location: "Rochester, NY",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=face",
    metrics: "+410% Monthly Reviews"
  },
  {
    quote: "The 1-tap AI replies save me 3 hours every week. I get a ping on my phone, review the draft, tap approve, and it's live on Google. Absolute game changer.",
    author: "Jason Miller",
    role: "Founder, Miller Elite Auto Spa",
    location: "Scottsdale, AZ",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face",
    metrics: "4.95 Google Rating (320+ Reviews)"
  },
  {
    quote: "Our competitors were dominating the local 3-pack search results. RatingPulse flipped that within 60 days. Our phone rings with new client inquiries daily.",
    author: "Elena Rostova",
    role: "Managing Partner, Rostova Legal Group",
    location: "Miami, FL",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face",
    metrics: "+$18.4k Est. Monthly Inflow"
  }
];

