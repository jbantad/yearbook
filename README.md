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

## Deploying to Cloudflare Pages

This repo builds as a static site, so it's a straightforward Pages "Git integration"
project — no API token needed on your end:

1. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
   and pick this repository.
2. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Environment variables** (Settings → Environment variables, for both Production
   and Preview): add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same
   values as your `.env.local`. These are safe to expose client-side — the anon key
   only works within the RLS policies defined on each table.
4. Save and deploy. Every push to the branch you connect will trigger a new build.

Client-side routing (React Router) is handled via `public/_redirects`, which Cloudflare
Pages picks up automatically.

## What's implemented vs. stubbed

Implemented and wired to Supabase: auth, loose pile, adding a block (photo/note/place/
meal/movie/person/gratitude), filing a block to a day page, day pages, calendar month
view (from `day_summaries`), quests (count + checklist progress), movie/place/meal
shelves, people + person detail.

Stubbed for now: actual photo upload (there's no Supabase Storage bucket wired up yet —
photo blocks take a caption and get a generated gradient placeholder instead of a real
image), the "Customize a page" screen (background/polaroid-style/block-color
preferences from the design mockup), and quest completion / sticker awarding logic.
