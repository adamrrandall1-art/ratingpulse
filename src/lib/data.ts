import { Review, Invite, BusinessSettings, Profile } from './supabase/types';

export const initialProfile: Profile = {
  id: 'usr_mock_001',
  email: 'dr.marcus@apexdental.com',
  full_name: 'Dr. Marcus Vance',
  business_name: 'Apex Dental & Aesthetics',
  business_category: 'Healthcare / Dental Care',
  google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  formatted_address: '1400 Broadway, New York, NY 10018',
  review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  google_rating: 4.9,
  google_review_count: 284,
  google_connected: true,
  phone: '+1 (555) 234-8900',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  plan_status: 'trialing',
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const initialSettings: BusinessSettings = {
  id: 'set_mock_001',
  user_id: 'usr_mock_001',
  brand_voice: 'friendly_professional',
  auto_publish_5_star: false,
  custom_keywords: ['gentle dental care', 'teeth whitening', 'emergency dentist', 'friendly staff'],
  sms_template: 'Hi {{customer_name}}, thank you for trusting {{business_name}} today! Could you take 30 seconds to share your feedback on Google? It really helps our local team: {{review_link}}',
  notify_email: true,
  notify_sms: true,
  created_at: new Date().toISOString(),
};

export const initialReviews: Review[] = [
  {
    id: 'rev-101',
    user_id: 'usr_mock_001',
    author_name: 'Sarah Jenkins',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    rating: 5,
    review_text: 'Had an emergency toothache and Dr. Marcus took me in right away. The team made me feel completely comfortable and the laser treatment was 100% painless. Truly the best dental clinic in town!',
    review_date: new Date(Date.now() - 2 * 3600000).toISOString(),
    ai_draft_reply: 'Thank you so much for the glowing 5-star review, Sarah! We are thrilled to hear that Dr. Marcus and our team provided painless, immediate care for your emergency dental needs. Your comfort is our top priority. We look forward to seeing you again for your regular checkups!',
    published_reply: null,
    status: 'pending_approval',
    sentiment: 'positive',
    keywords_used: ['emergency dental', 'painless care', 'Dr. Marcus'],
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'rev-102',
    user_id: 'usr_mock_001',
    author_name: 'David Montgomery',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
    rating: 5,
    review_text: 'Super efficient reception, clean modern clinic, and the teeth whitening results exceeded my expectations. Highly recommend Apex Dental!',
    review_date: new Date(Date.now() - 5 * 3600000).toISOString(),
    ai_draft_reply: 'Hi David! Thank you for trusting Apex Dental with your teeth whitening procedure. We are delighted to hear you loved the modern atmosphere and outstanding results. See you next time!',
    published_reply: null,
    status: 'pending_approval',
    sentiment: 'positive',
    keywords_used: ['teeth whitening', 'Apex Dental', 'modern clinic'],
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'rev-103',
    user_id: 'usr_mock_001',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
    rating: 5,
    review_text: 'The whole staff is incredible with kids. My daughter was nervous about her cavity filling, but the hygienist was patient and sweet.',
    review_date: new Date(Date.now() - 24 * 3600000).toISOString(),
    ai_draft_reply: 'Thank you for your heartwarming feedback, Elena! Helping young patients feel safe and relaxed during dental visits is a joy for our entire pediatric care team. Send our warmest regards to your daughter!',
    published_reply: 'Thank you for your heartwarming feedback, Elena! Helping young patients feel safe and relaxed during dental visits is a joy for our entire pediatric care team. Send our warmest regards to your daughter!',
    status: 'published',
    sentiment: 'positive',
    keywords_used: ['pediatric dental care', 'gentle hygienist'],
    published_at: new Date(Date.now() - 22 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'rev-104',
    user_id: 'usr_mock_001',
    author_name: 'Robert Chen',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
    rating: 4,
    review_text: 'Great service and very professional staff. Only reason for 4 stars is parking was a bit tight around 2 PM, but the dental treatment was top notch.',
    review_date: new Date(Date.now() - 48 * 3600000).toISOString(),
    ai_draft_reply: 'Hi Robert, thank you for your honest 4-star review and kind words about our dental team! We appreciate your note regarding the afternoon parking rush—we have reserved dedicated patient spots right behind building B for your future convenience.',
    published_reply: 'Hi Robert, thank you for your honest 4-star review and kind words about our dental team! We appreciate your note regarding the afternoon parking rush—we have reserved dedicated patient spots right behind building B for your future convenience.',
    status: 'published',
    sentiment: 'neutral',
    keywords_used: ['professional dental treatment', 'patient care'],
    published_at: new Date(Date.now() - 45 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  }
];

export const initialInvites: Invite[] = [
  {
    id: 'inv-301',
    user_id: 'usr_mock_001',
    customer_name: 'Jessica Reynolds',
    customer_phone: '+1 (555) 849-2910',
    customer_email: 'jessica.reynolds@example.com',
    service_type: 'Teeth Cleaning & Polish',
    status: 'reviewed',
    sent_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    review_received_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    rating_received: 5,
  },
  {
    id: 'inv-302',
    user_id: 'usr_mock_001',
    customer_name: 'Michael Chang',
    customer_phone: '+1 (555) 492-1082',
    service_type: 'Cosmetic Consultation',
    status: 'opened',
    sent_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'inv-303',
    user_id: 'usr_mock_001',
    customer_name: 'Amanda Taylor',
    customer_phone: '+1 (555) 782-9013',
    service_type: 'Invisalign Checkup',
    status: 'delivered',
    sent_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'inv-304',
    user_id: 'usr_mock_001',
    customer_name: 'Brian Kowalski',
    customer_phone: '+1 (555) 301-4491',
    service_type: 'Crown Replacement',
    status: 'sent',
    sent_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'inv-305',
    user_id: 'usr_mock_001',
    customer_name: 'Lisa Morales',
    customer_phone: '+1 (555) 619-8820',
    service_type: 'Deep Scaling',
    status: 'reviewed',
    sent_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    review_received_at: new Date(Date.now() - 27 * 3600000).toISOString(),
    rating_received: 5,
  }
];

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
    author: "Dr. Marcus Vance",
    role: "Owner, Apex Dental Care",
    location: "Austin, TX",
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
