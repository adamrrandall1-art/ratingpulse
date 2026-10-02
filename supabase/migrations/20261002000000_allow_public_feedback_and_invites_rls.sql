-- ==============================================================================
-- RatingPulse - Allow Public Feedback & Review Gate Interactions (RLS Policies)
-- ==============================================================================

-- 1. Feedback Table Policies (Allow public submissions to insert feedback)
alter table if exists public.feedback enable row level security;

drop policy if exists "Allow public feedback inserts" on public.feedback;
create policy "Allow public feedback inserts" on public.feedback
  for insert to anon, authenticated
  with check (true);

drop policy if exists "Allow public feedback select" on public.feedback;
create policy "Allow public feedback select" on public.feedback
  for select to anon, authenticated
  using (true);

-- 2. Review Invites Table Policies (Allow public customers to view & complete review invites)
alter table if exists public.review_invites enable row level security;

drop policy if exists "Allow public review_invites insert" on public.review_invites;
create policy "Allow public review_invites insert" on public.review_invites
  for insert to anon, authenticated
  with check (true);

drop policy if exists "Allow public review_invites update" on public.review_invites;
create policy "Allow public review_invites update" on public.review_invites
  for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow public review_invites select" on public.review_invites;
create policy "Allow public review_invites select" on public.review_invites
  for select to anon, authenticated
  using (true);

-- 3. Public Read for Profiles & Business Settings (For public review gate branding & routing)
drop policy if exists "Allow public profiles read for review gate" on public.profiles;
create policy "Allow public profiles read for review gate" on public.profiles
  for select to anon, authenticated
  using (true);

drop policy if exists "Allow public business_settings read for review gate" on public.business_settings;
create policy "Allow public business_settings read for review gate" on public.business_settings
  for select to anon, authenticated
  using (true);
