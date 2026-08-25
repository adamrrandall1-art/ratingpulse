-- ==============================================================================
-- RatingPulse.co - 100% Idempotent Migration Script
-- Safe on fresh OR pre-existing databases (handles partial tables, missing columns, views)
-- ==============================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. Create Base Tables
-- ==============================================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key
);

create table if not exists public.business_settings (
  id uuid default uuid_generate_v4() primary key
);

create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key
);

create table if not exists public.review_invites (
  id uuid default uuid_generate_v4() primary key
);

create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key
);

-- ==============================================================================
-- 3. Explicitly Ensure ALL Columns Exist on Every Table
-- (Guarantees no "column does not exist" error on partial schemas)
-- ==============================================================================

-- Profiles columns
alter table public.profiles add column if not exists id uuid references auth.users on delete cascade;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists business_name text default 'Apex Dental & Aesthetics';
alter table public.profiles add column if not exists business_category text default 'Healthcare / Dental';
alter table public.profiles add column if not exists google_place_id text default 'ChIJN1t_tDeuEmsRUsoyG83frY4';
alter table public.profiles add column if not exists formatted_address text default '1400 Broadway, New York, NY 10018';
alter table public.profiles add column if not exists review_url text default 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';
alter table public.profiles add column if not exists google_rating numeric(2,1) default 4.9;
alter table public.profiles add column if not exists google_review_count integer default 284;
alter table public.profiles add column if not exists google_connected boolean default true;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists notification_email text;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists plan_status text default 'trialing';
alter table public.profiles add column if not exists trial_ends_at timestamp with time zone default timezone('utc'::text, now() + interval '14 days');
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Business Settings columns
alter table public.business_settings add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.business_settings add column if not exists brand_voice text default 'friendly_professional';
alter table public.business_settings add column if not exists auto_publish_5_star boolean default false;
alter table public.business_settings add column if not exists custom_keywords text[] default array['gentle care', 'emergency dentist', 'friendly staff', 'painless dentistry'];
alter table public.business_settings add column if not exists sms_template text default 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience on Google? It means the world to our team: {{review_link}}';
alter table public.business_settings add column if not exists notification_email text;
alter table public.business_settings add column if not exists notify_email boolean default true;
alter table public.business_settings add column if not exists notify_sms boolean default true;
alter table public.business_settings add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.business_settings add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Reviews columns
alter table public.reviews add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.reviews add column if not exists author_name text default 'Google Reviewer';
alter table public.reviews add column if not exists author_avatar text;
alter table public.reviews add column if not exists rating integer default 5;
alter table public.reviews add column if not exists review_text text default '';
alter table public.reviews add column if not exists review_date timestamp with time zone default timezone('utc'::text, now());
alter table public.reviews add column if not exists ai_draft_reply text default '';
alter table public.reviews add column if not exists published_reply text;
alter table public.reviews add column if not exists status text default 'pending_approval';
alter table public.reviews add column if not exists sentiment text default 'positive';
alter table public.reviews add column if not exists keywords_used text[] default array[]::text[];
alter table public.reviews add column if not exists ai_model text default 'gemini-1.5-flash';
alter table public.reviews add column if not exists published_at timestamp with time zone;
alter table public.reviews add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.reviews add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Review Invites columns
alter table public.review_invites add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.review_invites add column if not exists customer_name text default 'Customer';
alter table public.review_invites add column if not exists customer_phone text default '';
alter table public.review_invites add column if not exists service_type text default 'General Service';
alter table public.review_invites add column if not exists status text default 'sent';
alter table public.review_invites add column if not exists sent_at timestamp with time zone default timezone('utc'::text, now());
alter table public.review_invites add column if not exists review_received_at timestamp with time zone;
alter table public.review_invites add column if not exists rating_received integer;
alter table public.review_invites add column if not exists review_id uuid references public.reviews(id) on delete set null;
alter table public.review_invites add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.review_invites add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Subscriptions columns
alter table public.subscriptions add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_price_id text;
alter table public.subscriptions add column if not exists status text default 'trialing';
alter table public.subscriptions add column if not exists current_period_start timestamp with time zone;
alter table public.subscriptions add column if not exists current_period_end timestamp with time zone;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean default false;
alter table public.subscriptions add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.subscriptions add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- ==============================================================================
-- 4. Views & Redirect Triggers for Backward Compatibility
-- ==============================================================================

-- View: invites -> review_invites
create or replace view public.invites as
  select * from public.review_invites;

-- View: businesses -> profiles
create or replace view public.businesses as
  select * from public.profiles;

-- View: feedbacks -> review_invites
create or replace view public.feedbacks as
  select * from public.review_invites;

-- View: customer_feedback -> review_invites
create or replace view public.customer_feedback as
  select * from public.review_invites;

-- View: inquiries -> review_invites
create or replace view public.inquiries as
  select * from public.review_invites;

create or replace function public.invites_insert_redirect()
returns trigger language plpgsql as $$
begin
  insert into public.review_invites values (new.*);
  return new;
end;
$$;

drop trigger if exists invites_insert on public.invites;
create trigger invites_insert
  instead of insert on public.invites
  for each row execute function public.invites_insert_redirect();

-- View: settings -> business_settings
create or replace view public.settings as
  select * from public.business_settings;

create or replace function public.settings_insert_redirect()
returns trigger language plpgsql as $$
begin
  insert into public.business_settings values (new.*);
  return new;
end;
$$;

drop trigger if exists settings_insert on public.settings;
create trigger settings_insert
  instead of insert on public.settings
  for each row execute function public.settings_insert_redirect();

create or replace function public.settings_update_redirect()
returns trigger language plpgsql as $$
begin
  update public.business_settings
  set
    brand_voice = coalesce(new.brand_voice, public.business_settings.brand_voice),
    auto_publish_5_star = coalesce(new.auto_publish_5_star, public.business_settings.auto_publish_5_star),
    custom_keywords = coalesce(new.custom_keywords, public.business_settings.custom_keywords),
    sms_template = coalesce(new.sms_template, public.business_settings.sms_template),
    notify_email = coalesce(new.notify_email, public.business_settings.notify_email),
    notify_sms = coalesce(new.notify_sms, public.business_settings.notify_sms),
    updated_at = timezone('utc'::text, now())
  where user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists settings_update on public.settings;
create trigger settings_update
  instead of update on public.settings
  for each row execute function public.settings_update_redirect();

-- ==============================================================================
-- 5. Indexes (Safe creation after all columns are confirmed)
-- ==============================================================================
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_place_id on public.profiles(google_place_id);
create index if not exists idx_reviews_user_status on public.reviews(user_id, status);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);
create index if not exists idx_review_invites_user_status on public.review_invites(user_id, status);
create index if not exists idx_review_invites_phone on public.review_invites(customer_phone);
create index if not exists idx_review_invites_sent_at on public.review_invites(sent_at desc);

-- ==============================================================================
-- 6. Updated_at Trigger
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_business_settings_updated_at on public.business_settings;
create trigger set_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.handle_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function public.handle_updated_at();

drop trigger if exists set_review_invites_updated_at on public.review_invites;
create trigger set_review_invites_updated_at
  before update on public.review_invites
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 7. Row Level Security (RLS) Policies
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_invites enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Business Settings Policies
drop policy if exists "Users can view own settings" on public.business_settings;
create policy "Users can view own settings" on public.business_settings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.business_settings;
create policy "Users can update own settings" on public.business_settings
  for update using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.business_settings;
create policy "Users can insert own settings" on public.business_settings
  for insert with check (auth.uid() = user_id);

-- Reviews Policies
drop policy if exists "Users can view own reviews" on public.reviews;
create policy "Users can view own reviews" on public.reviews
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reviews" on public.reviews;
create policy "Users can insert own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews" on public.reviews
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews" on public.reviews
  for delete using (auth.uid() = user_id);

-- Review Invites Policies
drop policy if exists "Users can view own invites" on public.review_invites;
create policy "Users can view own invites" on public.review_invites
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own invites" on public.review_invites;
create policy "Users can insert own invites" on public.review_invites
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own invites" on public.review_invites;
create policy "Users can update own invites" on public.review_invites
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own invites" on public.review_invites;
create policy "Users can delete own invites" on public.review_invites
  for delete using (auth.uid() = user_id);

-- Subscriptions Policies
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ==============================================================================
-- 8. Automatic Profile Creation on User Signup (Auth Trigger)
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    business_name
  )
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', ''),
    coalesce(new.raw_user_meta_data->>'full_name', 'Business Owner'),
    coalesce(new.raw_user_meta_data->>'business_name', 'My Business')
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    business_name = coalesce(excluded.business_name, public.profiles.business_name),
    updated_at = timezone('utc'::text, now());

  insert into public.business_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
