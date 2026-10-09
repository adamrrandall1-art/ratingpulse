import { Review, Invite, BusinessSettings, Profile } from './supabase/types';

export { DEMO_BUSINESS, DEMO_PROFILE, DEMO_SETTINGS, DEMO_REVIEWS, DEMO_INVITES } from './mockData';

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
  email: 'scoopntwist@example.com',
  full_name: 'Alex Rivera',
  business_name: "Scoop 'n Twist",
  business_category: 'Ice Cream & Frozen Dessert',
  google_place_id: 'ChIJawEUC_oN04kRB70LP1wHuPg',
  formatted_address: '932 S Winton Rd, Rochester, NY 14618',
  review_url: 'https://search.google.com/local/writereview?placeid=ChIJawEUC_oN04kRB70LP1wHuPg',
  google_rating: 4.9,
  google_review_count: 128,
  google_connected: true,
  phone: '(585) 360-2026',
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
  custom_keywords: [],
  sms_template: 'Hi {{customer_name}}, thank you for visiting {{business_name}} today! Could you take 30 seconds to leave us a quick review on Google? {{review_link}}',
  notify_email: true,
  notify_sms: true,
  notify_negative_enabled: true,
  notify_negative_email: true,
  notify_negative_sms: true,
  notify_negative_phone: '',
  notify_positive_enabled: true,
  notify_positive_email: true,
  notify_positive_sms: false,
  notification_email: '',
  notification_phone: '',
  created_at: new Date().toISOString(),
};

export const initialReviews: Review[] = [
  {
    id: 'rev-101',
    user_id: 'usr_mock_001',
    business_id: 'usr_mock_001',
    place_id: 'ChIJawEUC_oN04kRB70LP1wHuPg',
    author_name: 'Sarah Jenkins',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    rating: 5,
    review_text: 'Best artisanal ice cream in town! The salted caramel twist in a fresh homemade waffle cone is out of this world. Super clean shop and friendly crew.',
    review_date: new Date(Date.now() - 2 * 3600000).toISOString(),
    ai_draft_reply: 'Hi Sarah, thank you for visiting Scoop \'n Twist! We are so glad you loved our salted caramel twist and fresh waffle cones. Looking forward to scooping your favorite flavor again soon!',
    published_reply: null,
    status: 'pending_approval',
    sentiment: 'positive',
    keywords_used: ['salted caramel', 'waffle cone', "Scoop 'n Twist"],
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'rev-102',
    user_id: 'usr_mock_001',
    business_id: 'usr_mock_001',
    place_id: 'ChIJawEUC_oN04kRB70LP1wHuPg',
    author_name: 'David Montgomery',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
    rating: 5,
    review_text: 'Super efficient service, clean modern vibe, and the dairy-free passionfruit gelato exceeded all my expectations. Highly recommend Scoop \'n Twist!',
    review_date: new Date(Date.now() - 5 * 3600000).toISOString(),
    ai_draft_reply: 'Hi David! Thank you for visiting Scoop \'n Twist. We are delighted to hear you loved the passionfruit gelato and friendly atmosphere. See you next time!',
    published_reply: null,
    status: 'pending_approval',
    sentiment: 'positive',
    keywords_used: ['passionfruit gelato', "Scoop 'n Twist", 'dairy-free'],
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'rev-103',
    user_id: 'usr_mock_001',
    business_id: 'usr_mock_001',
    place_id: 'ChIJawEUC_oN04kRB70LP1wHuPg',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
    rating: 5,
    review_text: 'The whole staff is incredible with kids. My daughter was so excited building her custom sundae bowl, and the team was patient and sweet.',
    review_date: new Date(Date.now() - 24 * 3600000).toISOString(),
    ai_draft_reply: 'Thank you for your heartwarming feedback, Elena! Helping young dessert lovers create their dream custom sundaes is a joy for our entire team. Send our warmest regards to your daughter!',
    published_reply: 'Thank you for your heartwarming feedback, Elena! Helping young dessert lovers create their dream custom sundaes is a joy for our entire team. Send our warmest regards to your daughter!',
    status: 'published',
    sentiment: 'positive',
    keywords_used: ['custom sundae', 'friendly team', 'Scoop \'n Twist'],
    published_at: new Date(Date.now() - 22 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'rev-104',
    user_id: 'usr_mock_001',
    business_id: 'usr_mock_001',
    place_id: 'ChIJawEUC_oN04kRB70LP1wHuPg',
    author_name: 'Robert Chen',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
    rating: 4,
    review_text: 'Great dessert spot and very friendly staff. Only reason for 4 stars is parking was a bit tight around 8 PM on Friday, but the ice cream flight was top notch.',
    review_date: new Date(Date.now() - 48 * 3600000).toISOString(),
    ai_draft_reply: 'Hi Robert, thank you for your honest 4-star review and kind words about our ice cream flights! We appreciate your note regarding the Friday evening parking rush—we have additional parking spaces behind the building for your future convenience.',
    published_reply: 'Hi Robert, thank you for your honest 4-star review and kind words about our ice cream flights! We appreciate your note regarding the Friday evening parking rush—we have additional parking spaces behind the building for your future convenience.',
    status: 'published',
    sentiment: 'neutral',
    keywords_used: ['ice cream flight', 'Scoop \'n Twist', 'dessert'],
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
    service_type: 'Waffle Cone Duo',
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
    service_type: 'Artisan Ice Cream Flight',
    status: 'opened',
    sent_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'inv-303',
    user_id: 'usr_mock_001',
    customer_name: 'Amanda Taylor',
    customer_phone: '+1 (555) 782-9013',
    service_type: 'Custom Sundae Party',
    status: 'delivered',
    sent_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'inv-304',
    user_id: 'usr_mock_001',
    customer_name: 'Brian Kowalski',
    customer_phone: '+1 (555) 301-4491',
    service_type: 'Family Dessert Box',
    status: 'sent',
    sent_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'inv-305',
    user_id: 'usr_mock_001',
    customer_name: 'Lisa Morales',
    customer_phone: '+1 (555) 619-8820',
    service_type: 'Ice Cream Catering',
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
    author: "Alex Rivera",
    role: "Owner, Scoop 'n Twist Ice Cream",
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

