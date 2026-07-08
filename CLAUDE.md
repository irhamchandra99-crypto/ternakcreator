# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack via Next 16)
- `npm run build` — static export build; output written to `out/` (see static-export note below)
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

No test suite exists.

## What this is

`ternakcreator` — single-page marketing landing site for "Ternak Creator", a platform pitching UMKM–creator collaboration (Indonesian-language copy). Built for a competition (P2MW). Next.js 16 App Router + React 19 + Tailwind CSS v4.

## Architecture

The entire site is **one client component**: `app/page.tsx` (~630 lines). Sections are stacked `<section>` blocks in a single `Home()` render — Hero, About (`#about`), Pricing (`#pricing`), Careers (`#careers`), Testimonials (`#testimonials`), Footer. Navbar anchors scroll to these IDs (smooth-scroll set in `globals.css`). To edit a section, find its `{/* ── SECTION ── */}` comment marker.

- `RollingNumber` (top of `page.tsx`) — the only reusable component; counts up to `target` via `requestAnimationFrame`, triggered when scrolled into view by an `IntersectionObserver`. Used for the About-section metric counters.
- Section content (feature cards, pricing tiers, testimonials, footer links) is defined as inline arrays mapped in JSX — edit the array literals, not repeated markup.
- `app/layout.tsx` — root layout, sets metadata + loads `Plus_Jakarta_Sans` (exposed as Tailwind `font-sans` via `--font-plus-jakarta-sans`).
- `app/globals.css` — Tailwind import + custom classes referenced by class name in `page.tsx`: `.nav-link` (underline hover), `.glass-button`, `.glass-card`, `.pricing-card` (fadeInUp). Note: `.hamburger-btn` / `.mobile-nav` CSS exists but is unused — the live mobile menu is the Tailwind-styled hamburger + `menuOpen` state in `page.tsx`.

### Brand system (hardcoded, no theme tokens)

Colors are inline Tailwind arbitrary values throughout, not CSS variables:
- `#1B198F` — deep indigo (primary bg / text)
- `#A9DB1B` — lime green (accent); `#8CBF00` darker lime variant
- `#FAFAFA` — off-white section bg

When adding UI, reuse these exact hex values for consistency.

## Static export — important constraints

`next.config.ts` sets `output: 'export'`, so the build is a fully static site (deployed on Vercel as static). This means:
- **No** server components' server features, API routes, server actions, middleware, ISR, or `next/image` optimization at runtime.
- External `<img>` (pravatar avatars in testimonials) and `next/image` are used with unoptimized static output — keep images static/CDN-hosted.
- Anything requiring a Node server will not work; keep everything client-side or build-time.

`next.config.ts` also whitelists a LAN IP in `experimental.allowedDevOrigins` for dev access from other devices — update that IP if testing on a different network.

## Conventions

- All interactivity is client-side (`"use client"` at top of `page.tsx`); state via `useState`/`useRef`.
- CTAs link out to external URLs (WhatsApp `wa.me`, Google Forms, Instagram) — these are the real conversion targets; preserve them when editing.
- Copy is Indonesian; keep new user-facing text in Indonesian to match.
- Path alias `@/*` maps to repo root (`tsconfig.json`).
