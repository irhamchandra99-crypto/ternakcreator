-- ═══════════════════════════════════════════════════════════════════
-- Ternak Creator — campaign & payout schema
--
-- Run once in: Supabase Dashboard > SQL Editor > New query > Run.
-- Safe to re-run (everything is IF NOT EXISTS / idempotent).
--
-- Roles:
--   • Regular users  → Supabase Auth (anon key + RLS below)
--   • Admin          → the app's own cookie session; admin API routes use
--                      the Supabase secret key, which bypasses RLS.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Campaigns (brief uploaded by admin) ─────────────────────────────
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  brand_name  text not null,
  brand_logo  text,                       -- storage path in bucket `brand-logos`
  platform    text not null check (platform in ('instagram', 'tiktok')),
  brief       text not null,
  reward_note text,                       -- e.g. "Rp50.000 per 10rb views"
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now()
);

-- ── Claims ("Klaim Campaign") ───────────────────────────────────────
create table if not exists public.campaign_claims (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_email  text,
  user_name   text,
  created_at  timestamptz not null default now(),
  unique (campaign_id, user_id)           -- one claim per user per campaign
);

-- ── Submissions ("Setor View" + payout request) ─────────────────────
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  claim_id       uuid not null references public.campaign_claims(id) on delete cascade,
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  user_email     text,
  user_name      text,
  video_url      text not null,
  analytics_path text not null,           -- storage path in bucket `analytics`
  bank_name      text not null,
  account_number text not null,
  account_holder text not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'verified', 'rejected')),
  reject_reason  text,                    -- filled when status = 'rejected'
  payout_amount  bigint,                  -- filled when status = 'verified'
  payout_proof   text,                    -- storage path in bucket `payout-proofs`
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists submissions_status_idx on public.submissions (status, created_at desc);
create index if not exists claims_user_idx on public.campaign_claims (user_id);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security
-- Users only ever touch their own rows. Status changes, payout amounts
-- and proofs are admin-only: no user-facing UPDATE policy exists, and
-- the admin routes go through the secret key which bypasses RLS.
-- ═══════════════════════════════════════════════════════════════════

alter table public.campaigns       enable row level security;
alter table public.campaign_claims enable row level security;
alter table public.submissions     enable row level security;

drop policy if exists "campaigns readable by signed-in users" on public.campaigns;
create policy "campaigns readable by signed-in users"
  on public.campaigns for select to authenticated using (true);

drop policy if exists "read own claims" on public.campaign_claims;
create policy "read own claims"
  on public.campaign_claims for select to authenticated using (auth.uid() = user_id);

drop policy if exists "create own claims" on public.campaign_claims;
create policy "create own claims"
  on public.campaign_claims for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "read own submissions" on public.submissions;
create policy "read own submissions"
  on public.submissions for select to authenticated using (auth.uid() = user_id);

drop policy if exists "create own submissions" on public.submissions;
create policy "create own submissions"
  on public.submissions for insert to authenticated with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- Storage buckets
--   brand-logos   public  — brand marks shown on campaign cards
--   analytics     private — creator audience-insight screenshots
--   payout-proofs private — transfer receipts (served via signed URL)
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('analytics', 'analytics', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payout-proofs', 'payout-proofs', false)
on conflict (id) do nothing;

-- Creators upload analytics screenshots into analytics/<their-uid>/<file>.
drop policy if exists "upload own analytics" on storage.objects;
create policy "upload own analytics"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'analytics'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "read own analytics" on storage.objects;
create policy "read own analytics"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'analytics'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read the public brand-logos bucket.
drop policy if exists "brand logos are public" on storage.objects;
create policy "brand logos are public"
  on storage.objects for select to public
  using (bucket_id = 'brand-logos');
