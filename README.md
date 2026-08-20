# Scrapbook

A digital scrapbook / journaling app. Capture moments into a "loose pile," then file
them onto day pages — photos (polaroid frames), notes, places, meals, movies, people,
and gratitude logs. Includes a calendar, quests with stickers, and movie/place/meal
shelves.

Built with React + TypeScript + Vite, [Supabase](https://supabase.com) (Postgres +
Auth), and deployed to Cloudflare Pages.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon/publishable key
npm run dev
```

The dev server needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — get these from
your Supabase project's API settings.

## Database

The schema lives in Supabase (Postgres). Tables: `people`, `places`, `movies`,
`stickers`, `quests`, `quest_items`, `pages`, `blocks`, `media`, `block_people`,
`earned_stickers`, `collections`, `day_summaries`, plus the `movie_shelf` and
`place_visits` views. Row-level security is enabled everywhere, scoped by
`auth.uid()`.

Auth is email/password via Supabase Auth (sign up requires confirming the email
before signing in, unless email confirmation is turned off in the Supabase project's
Auth settings).

## Deploying to Cloudflare

This repo deploys as a Cloudflare Worker with static assets (the current unified
replacement for the old separate "Pages" product), configured by `wrangler.jsonc`:
it serves everything in `dist/` and falls back to `index.html` for client-side
routes (`not_found_handling: "single-page-application"`).

In the Cloudflare dashboard, **Create a Worker → connect this Git repo**:

1. **Build command:** `npm run build`
2. **Deploy command:** `npx wrangler deploy` (reads `wrangler.jsonc`, uploads `dist/`)
3. **Environment variables** (same screen, for the build step): add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values as your
   `.env.local`. These get baked into the client bundle at build time — that's
   expected, they're safe to expose client-side since the anon/publishable key
   only works within each table's RLS policies.
4. Deploy. Every push to the connected branch triggers a new build.

`public/_redirects` is also included for compatibility if you ever deploy this to
classic Cloudflare Pages instead.

## What's implemented vs. stubbed

Implemented and wired to Supabase: auth, loose pile, adding a block (photo/note/place/
meal/movie/person/gratitude), filing a block to a day page, day pages, calendar month
view (from `day_summaries`), quests (count + checklist progress), movie/place/meal
shelves, people + person detail.

Stubbed for now: actual photo upload (there's no Supabase Storage bucket wired up yet —
photo blocks take a caption and get a generated gradient placeholder instead of a real
image), the "Customize a page" screen (background/polaroid-style/block-color
preferences from the design mockup), and quest completion / sticker awarding logic.
