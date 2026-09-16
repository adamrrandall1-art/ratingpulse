export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string;
  business_category: string;
  google_place_id: string;
  formatted_address?: string | null;
  review_url?: string | null;
  google_rating: number;
  google_review_count: number;
  google_connected: boolean;
  google_access_token?: string | null;
  google_refresh_token?: string | null;
  google_token_expiry?: string | number | null;
  google_account_id?: string | null;
  google_location_id?: string | null;
  google_account_name?: string | null;
  phone: string | null;
  notification_email?: string | null;
  notification_phone?: string | null;
  sms_alerts_enabled?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | string;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  user_id: string;
  brand_voice: 'friendly_professional' | 'casual_enthusiastic' | 'concise_polite' | 'empathetic';
  auto_publish_5_star: boolean;
  custom_keywords: string[];
  sms_template: string;
  notification_email?: string | null;
  notification_phone?: string | null;
  sms_alerts_enabled?: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  review_id?: string | null;
  author_name: string;
  author_avatar?: string | null;
  rating: number;
  review_text: string;
  review_date: string;
  ai_draft_reply: string;
  review_reply?: string | null;
  published_reply?: string | null;
  replied_at?: string | null;
  published_at?: string | null;
  status: 'pending_approval' | 'published' | 'ignored';
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords_used: string[];
  created_at: string;
}

export interface Invite {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  service_type: string;
  status: 'sent' | 'delivered' | 'opened' | 'reviewed' | 'feedback_submitted' | string;
  sent_at: string;
  review_received_at?: string | null;
  rating_received?: number | null;
  feedback_text?: string | null;
  resolution_status?: 'unresolved' | 'resolved' | 'needs_follow_up' | string;
  review_id?: string | null;
}

