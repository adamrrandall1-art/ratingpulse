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

export const initialSettings: BusinessSettings = {
  id: '',
  user_id: '',
  brand_voice: 'friendly_professional',
  auto_publish_5_star: false,
  custom_keywords: [],
  sms_template: 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to leave us a quick review on Google? {{review_link}}',
  notify_email: true,
  notify_sms: false,
  notify_negative_enabled: true,
  notify_negative_email: true,
  notify_negative_sms: false,
  notify_negative_phone: '',
  notify_positive_enabled: true,
  notify_positive_email: true,
  notify_positive_sms: false,
  notification_email: '',
  notification_phone: '',
  created_at: new Date().toISOString(),
};
export const initialReviews: Review[] = [];
export const initialInvites: Invite[] = [];

export const landingFaqs = [
  {
    question: "How does RatingPulse get more Google reviews?",
    answer: "Most happy customers simply forget to leave a review if not asked immediately. RatingPulse automates review collection by sending a friendly, personalized SMS invite to your customer right after service is completed. With a single tap, customers are taken directly to your Google Business Profile review form with 5 stars pre-selected—eliminating friction and turning everyday transactions into genuine 5-star ratings. Most businesses see a 300%+ increase in reviews within their first 30 days."
  },
  {
    question: "Does this comply with Google's review guidelines?",
    answer: "Yes, 100%. RatingPulse is strictly compliant with Google's Business Profile Policies and anti-review-gating guidelines, as well as TCPA carrier regulations. We do not gate, block, or incentivize reviews. All customers are given the direct option to post on Google, while an integrated private resolution pathway allows customers with constructive feedback to reach you directly before posting publicly."
  },
  {
    question: "How do the AI review replies work?",
    answer: "When a new Google review lands on your profile, our built-in Gemini AI engine analyzes the sentiment, customer name, and specific services mentioned. It drafts a thoughtful, human-sounding response in your brand voice while naturally incorporating your local SEO keywords. You receive a notification and can approve or edit the reply in 1 tap from your phone or dashboard."
  },
  {
    question: "How long does setup take?",
    answer: "Under 2 minutes. Simply sign in with Google OAuth to connect your Google Business Profile, confirm your business details, and customize your SMS template. No technical expertise, API coding, or credit card required to begin your 14-day free trial."
  },
  {
    question: "Can I customize the outbound text messages?",
    answer: "Yes. You have full control over the SMS copy, sender name, timing, and dynamic variables (e.g., customer name, business name, service type). You can also define quiet hours so messages are only dispatched during appropriate local business hours."
  },
  {
    question: "Are there long-term contracts or cancellation fees?",
    answer: "Never. RatingPulse operates on a straightforward month-to-month subscription ($25/month) with zero setup fees, zero contracts, and zero hidden charges. You can cancel anytime with a single click from your account dashboard."
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

