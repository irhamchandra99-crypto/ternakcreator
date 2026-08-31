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
  platforms   text[] not null default array['instagram']::text[], -- one or more of instagram/tiktok
  sector      text not null default 'services-lifestyle',
  brief       text not null,
  brief_pdf   text,                       -- storage path in bucket `campaign-briefs`
  reward_note text,                       -- e.g. "Rp50.000 per 10rb views"
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now()
);

-- Adds `brief_pdf` to a campaigns table created before this column existed.
alter table public.campaigns add column if not exists brief_pdf text;

-- Migrates a campaigns table created before `platforms` replaced the
-- single-value `platform` column.
alter table public.campaigns add column if not exists platforms text[];

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'campaigns' and column_name = 'platform'
  ) then
    update public.campaigns
      set platforms = array[platform]
      where platforms is null and platform is not null;

    if exists (select 1 from pg_constraint where conname = 'campaigns_platform_check') then
      alter table public.campaigns drop constraint campaigns_platform_check;
    end if;

    alter table public.campaigns drop column platform;
  end if;
end $$;

update public.campaigns
  set platforms = array['instagram']::text[]
  where platforms is null or array_length(platforms, 1) is null;

alter table public.campaigns alter column platforms set default array['instagram']::text[];
alter table public.campaigns alter column platforms set not null;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'campaigns_platforms_check') then
    alter table public.campaigns drop constraint campaigns_platforms_check;
  end if;
  alter table public.campaigns
    add constraint campaigns_platforms_check
    check (platforms <@ array['instagram', 'tiktok']::text[] and array_length(platforms, 1) > 0);
end $$;

-- Adds `sector` to a campaigns table created before this column existed.
alter table public.campaigns add column if not exists sector text not null default 'services-lifestyle';
alter table public.campaigns alter column sector set default 'services-lifestyle';

-- Reassign any row from a retired sector value before the constraint below rejects it.
update public.campaigns
  set sector = 'services-lifestyle'
  where sector not in ('fnb', 'event-entertainment', 'tourism', 'retail', 'services-lifestyle');

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'campaigns_sector_check') then
    alter table public.campaigns drop constraint campaigns_sector_check;
  end if;
  alter table public.campaigns
    add constraint campaigns_sector_check
    check (sector in ('fnb', 'event-entertainment', 'tourism', 'retail', 'services-lifestyle'));
end $$;

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
--   brand-logos     public  — brand marks shown on campaign cards
--   campaign-briefs public  — brief PDFs uploaded by admin per campaign
--   analytics       private — creator audience-insight screenshots
--   payout-proofs   private — transfer receipts (served via signed URL)
--   avatars         public  — creator profile photos (WebP)
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('campaign-briefs', 'campaign-briefs', true)
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

-- Anyone can read the public campaign-briefs bucket.
drop policy if exists "campaign briefs are public" on storage.objects;
create policy "campaign briefs are public"
  on storage.objects for select to public
  using (bucket_id = 'campaign-briefs');

-- ═══════════════════════════════════════════════════════════════════
-- Creator profiles ("Lengkapi Profil")
-- Filled by the creator right after logging in. One row per auth user;
-- the user id is the primary key so an upsert always hits the same row.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.creator_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  user_email text,
  full_name  text not null,
  instagram  text,                        -- username, stored without the leading @
  tiktok     text,                        -- username, stored without the leading @
  whatsapp   text not null,               -- digits only, 62… or 08…
  age        int  not null check (age between 13 and 99),
  gender     text not null check (gender in ('laki-laki', 'perempuan')),
  niches     text[] not null default array[]::text[],
  domicile   text not null,
  avg_views  bigint not null default 0 check (avg_views >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

drop policy if exists "read own profile" on public.creator_profiles;
create policy "read own profile"
  on public.creator_profiles for select to authenticated using (auth.uid() = user_id);

drop policy if exists "create own profile" on public.creator_profiles;
create policy "create own profile"
  on public.creator_profiles for insert to authenticated with check (auth.uid() = user_id);

-- Unlike submissions, the creator owns every column here, so updating is allowed.
drop policy if exists "update own profile" on public.creator_profiles;
create policy "update own profile"
  on public.creator_profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profile photo. Stores the storage path inside the public `avatars` bucket;
-- the API resolves it to a URL and falls back to a DiceBear "Voxel Bot" avatar
-- when it is null.
alter table public.creator_profiles
  add column if not exists avatar_path text;

-- Chosen Voxel Bot variant. Null means the bot is seeded with the user id.
-- Picking a bot clears avatar_path, so only one of the two is ever in effect.
alter table public.creator_profiles
  add column if not exists avatar_seed text;

alter table public.creator_profiles
  drop constraint if exists creator_profiles_avatar_seed_check;
alter table public.creator_profiles
  add constraint creator_profiles_avatar_seed_check
  check (avatar_seed is null or avatar_seed ~ '^[A-Za-z0-9_-]{1,64}$');

-- ═══════════════════════════════════════════════════════════════════
-- avatars  public — creator profile photos, converted to WebP in the browser
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read the public avatars bucket.
drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Creators write their own photo into avatars/<their-uid>/<file>.
drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "replace own avatar" on storage.objects;
create policy "replace own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own avatar" on storage.objects;
create policy "delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
