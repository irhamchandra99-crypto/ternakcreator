# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build (`.next/`; needs a server runtime)
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

No test suite exists.

## What this is

`ternakcreator` — the platform for "Ternak Creator", pitching UMKM–creator collaboration (Indonesian-language copy). Built for a competition (P2MW). Next.js 16 App Router + React 19 + Tailwind CSS v4 + Supabase.

It started as a static marketing page and grew a backend. It is now three apps inside one Next project:

| Area | Routes | Who |
|---|---|---|
| Marketing landing | `/` | public |
| Creator app | `/login`, `/auth/callback`, `/dashboard` | Supabase-authenticated creators |
| Admin panel | `/admin` | admin, via a separate cookie session |

**This is not a static export.** `next.config.ts` no longer sets `output: 'export'` — API routes, `proxy.ts`, and the server-side Supabase clients all require a running Node server.

## The business flow

Everything in the creator/admin half serves one loop:

```
admin creates campaign  →  creator claims it ("Klaim Campaign")
  →  creator submits ("Setor View"): video link + analytics screenshot + bank details
  →  admin verifies (payout amount + transfer receipt) or rejects (with a reason)
  →  creator sees status + receipt on their dashboard
```

The tables mirror that chain: `campaigns` → `campaign_claims` → `submissions`. Schema lives in `supabase/schema.sql` (idempotent — run it in the Supabase SQL editor).

## Two independent auth systems

Do not mix these up; they share no code.

**Creators — Supabase Auth.** Anon key + Row Level Security. Google OAuth via `/login` → `/auth/callback` (exchanges the code for a session). `proxy.ts` runs `lib/supabase/middleware.ts` on every non-asset request to refresh the session cookie. Client helper: `lib/supabase/client.ts`; server helper: `lib/supabase/server.ts`.

**Admin — the app's own cookie.** `tc_admin`, a stateless HMAC-signed token (`lib/auth.ts`, `SESSION_SECRET`), 1-day TTL, credentials compared constant-time against `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Every `/api/admin/*` handler must start with `requireAdmin(req)` from `lib/adminGuard.ts`. Login is rate-limited: 3 failures per IP hash → 15-minute ban.

### RLS is the authorization boundary

Users can only `select`/`insert` their own `campaign_claims` and `submissions`. **There is deliberately no user-facing `UPDATE` policy** — status, `payout_amount`, and `payout_proof` are admin-only. Admin routes reach them through `createAdminClient()` (`lib/supabase/admin.ts`), which uses `SUPABASE_SECRET_KEY` and **bypasses RLS entirely**.

Rules that follow from this:

- Never import `lib/supabase/admin.ts` from a `"use client"` file.
- Only call it behind `requireAdmin`, or — as in `app/api/my/campaigns/route.ts` — on rows already fetched RLS-filtered for the current user.
- Never trust identity from a request body. Take `user.id` / `user.email` from `supabase.auth.getUser()`.

### Storage buckets

| Bucket | Access | Holds |
|---|---|---|
| `brand-logos` | public | campaign brand marks |
| `analytics` | private, RLS-scoped to `<uid>/` | creator audience screenshots |
| `payout-proofs` | private | transfer receipts, served via 1-hour signed URLs (`SIGNED_URL_TTL`) |
| `app-data` | private | JSON records for `lib/store.ts` |

Creators upload analytics screenshots **straight from the browser** into `analytics/<their-uid>/`. `app/api/submissions/route.ts` only records the path, and re-checks the `<uid>/` prefix so a mismatched path cannot be filed against someone else's folder.

## Architecture notes

- `app/page.tsx` (~880 lines) — the whole landing page as one client component. Sections are stacked `<section>` blocks marked with `{/* ── SECTION ── */}` comments (Hero, `#about`, `#pricing`, `#careers`, `#testimonials`, Footer); navbar anchors scroll to those IDs. Card / tier / testimonial content lives in inline array literals mapped in JSX — edit the arrays, not repeated markup. `RollingNumber` at the top counts up via `requestAnimationFrame` when an `IntersectionObserver` brings it into view.
- `app/component/` — dashboard and admin UI. `Dashboard*` for creators, `Admin*` for the panel. `app/dashboard/page.tsx` and `app/admin/page.tsx` are thin tab shells around them.
- `lib/types.ts` — shared row shapes (`Campaign`, `Claim`, `Submission`) plus `formatRupiah` / `formatDate`. Used by both halves; keep it the single source for these.
- `lib/store.ts` — small JSON key/value store with four backends picked per call by `pickBackend()`: Supabase Storage → Netlify Blobs → Vercel Blob → local `.data/` filesystem. Supabase wins whenever it is configured, because the filesystem fallback is read-only in a serverless runtime and used to fail in production while dev looked fine. Backs feedback records and rate-limit counters.
- `lib/ratelimit.ts` — sliding window over one counter record per key. Writes are best-effort and swallowed: a failed counter must never turn a "wrong password" into a 500.
- `app/component/AdminUsers.tsx` — the registered-creator list, backed by `supabase.auth.admin.listUsers()`. This replaced an earlier Google Sheets export; keep the CSV download in step with the table's columns so that workflow still has a home.

### API surface

`/api/campaigns` (open offers + claimed flag) · `/api/campaigns/[id]/claim` · `/api/submissions` · `/api/my/campaigns` (dashboard payload) · `/api/feedback` · `/api/admin/{login,logout,session,campaigns,submissions,feedback,users}`.

Route handlers set `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"` — keep both when adding routes: `lib/auth.ts` needs Node `crypto`, and these responses must never be cached.

## Environment

Server-only: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `IP_SALT`, `SUPABASE_SECRET_KEY`, optionally `BLOB_READ_WRITE_TOKEN`.

Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Never prefix a secret with `NEXT_PUBLIC_`, and never hardcode credentials — they get baked into the build output.

Without `SUPABASE_SECRET_KEY` every admin tab that touches Supabase (Campaign, Pencairan Dana, Users) returns 500 and `lib/store.ts` silently falls back to `.data/`. The creator-facing routes keep working — they run on the anon key plus RLS.

`next.config.ts` whitelists LAN IPs in `allowedDevOrigins` for testing from other devices — update them for a different network.

## Brand system (hardcoded, no theme tokens)

Colors are inline Tailwind arbitrary values throughout, not CSS variables:

- `#1B198F` — deep indigo (primary bg / text)
- `#A9DB1B` — lime green (accent); `#8CBF00` darker lime variant
- `#FAFAFA` — off-white section bg

Reuse these exact hex values when adding UI. `app/layout.tsx` loads `Plus_Jakarta_Sans` as Tailwind `font-sans` (via `--font-plus-jakarta-sans`) and mounts Vercel Analytics. `app/globals.css` holds the Tailwind import, smooth-scroll, and classes referenced by name in `page.tsx`: `.nav-link` (underline hover), `.glass-button`, `.glass-card`, `.pricing-card` (fadeInUp). Note: `.hamburger-btn` / `.mobile-nav` are dead CSS — the live mobile menu is the Tailwind-styled hamburger driven by `menuOpen` state.

## Conventions

- Copy is Indonesian; keep new user-facing text and error messages in Indonesian to match.
- Error responses: `NextResponse.json({ error: "pesan Indonesia" }, { status })`. Log the real cause with `console.error` and return a generic message to the caller.
- Landing-page CTAs link out to WhatsApp `wa.me`, Google Forms, and Instagram — these are the real conversion targets; preserve them when editing.
- Path alias `@/*` maps to repo root (`tsconfig.json`).
- Deployment targets both Vercel (`@vercel/analytics`, Vercel Blob) and Netlify (`netlify.toml`, publish `.next`, `@netlify/plugin-nextjs`). Keep both paths working when touching storage or build config.
