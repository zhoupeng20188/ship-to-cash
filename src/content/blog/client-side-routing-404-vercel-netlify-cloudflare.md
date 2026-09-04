---
title: "404 on Refresh: Fix SPA Routing on Vercel, Netlify & CF Pages"
description: "Refresh a deep link and get a 404 though your homepage works? Client-side routing on static hosts — exact fixes for Vercel, Netlify, and Cloudflare Pages."
pubDate: 2026-09-04
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-client-side-routing-404-vercel-netlify-cloudflare.jpg
faq:
  - question: "Why does my app work when I click links but 404 on refresh?"
    answer: "Because clicking a link never leaves index.html — your router intercepts the click and swaps the view in the browser. Refreshing sends a real request to the server for /dashboard, and the static host has no file there, so it returns 404. The fix is telling the host to serve index.html for any unknown path."
  - question: "Do I need this if my site is built with Astro?"
    answer: "Usually not. Astro's default static output pre-renders a real HTML file for every route, so refreshing /blog/my-post hits an actual file and works. You only hit this 404 if you run a client-side router framework (React Router, Vue Router, SvelteKit SPA mode) inside Astro, or ship a pure SPA."
  - question: "What is the exact _redirects line for Netlify and Cloudflare Pages?"
    answer: "One line: /* /index.html 200 — placed in your public/ folder so the build copies it into the output directory. The 200 means 'serve index.html' rather than redirect, so the URL stays clean and the router takes over."
  - question: "My vercel.json rewrites still give a 404, what did I miss?"
    answer: "Two common misses: the file must be at the repo root (not in src/), and the destination should be /index.html exactly. Also confirm Vercel isn't still using a legacy builds array in the same file — that overrides dashboard settings and can swallow the rewrite."
  - question: "Will the SPA fallback break my real asset URLs like /assets/app.js?"
    answer: "No. The rewrite or _redirects rule only catches paths with no matching file. Requests for real built assets (/assets/*.js, /favicon.ico) resolve to the actual file first; only unknown paths fall through to index.html."
---

The first time I shipped a React Router app, the homepage loaded, I clicked into the dashboard, everything looked great — then I hit refresh and got a bare 404 page. The app I had just "deployed" was gone the moment anyone refreshed a deep link. That's the bug that catches almost every first-time SPA deploy, and it's the one this guide fixes.

Before you touch anything, make sure you're on the right page. A 404 has a few different causes, and they need different fixes:

| What you see | The real cause | Go here |
|---|---|---|
| Homepage loads, clicking works, but **refreshing a sub-page 404s** | Client-side routing with no SPA fallback (this guide) | ↓ keep reading |
| **Homepage itself 404s**, or the whole site is "not found" | Build output directory wrong / no deployable files | [Vercel build failed: No Output Directory](/deploy/vercel-build-failed/) |
| Page loads but is **blank** with a JS error in the console | Wrong router `base` path or a render crash | [First deploy to Vercel](/deploy/deploy-first-app-vercel/) |

If your symptom is the first row, you're in the right place.

## The error, in plain words

You deploy a single-page app. Someone visits `https://yoursite.com`, lands on `index.html`, and clicks a link to `/dashboard`. The app renders the dashboard view. So far so good.

Then they refresh the tab — or they bookmark `/dashboard` and open it later, or they paste the link into Slack and a colleague clicks it cold. Now the browser asks the server directly: *"give me the file at `/dashboard`."*

The server looks. There is no `/dashboard` file and no `/dashboard/index.html`. There is only `index.html` at the root. So the host returns **404 Not Found**. Your app never even gets a chance to run.

Here is the exact shape of it:

```
GET https://yoursite.com/dashboard  ->  404 Not Found
```

In the Network tab you'll see that single 404 for the document itself, not for your JS or CSS. That distinction matters — if your JS and CSS were also 404ing, that's the `base` path problem linked above, not this one.

## Why this happens

A single-page app is, on disk, **one HTML file** (`index.html`) plus a JavaScript bundle. All the "pages" — `/dashboard`, `/settings`, `/pricing` — exist only inside that JavaScript, as routes the router matches in the browser.

When you *click* a link inside the app, no network request happens. The router intercepts the click, updates the URL with the History API, and swaps the view. The server is never involved, so it can't 404 you.

When you *refresh*, the browser throws the full URL at the server. The server is dumb about routes — it only knows files. No file named `dashboard` exists, so: 404.

The fix is to tell the host: *"for any path you don't have a real file for, send index.html instead."* The browser loads the app, the router reads the URL, and the right view appears. This is called an **SPA fallback** (or "rewrite to index"), and every static host supports it — they just don't turn it on for you, because they can't know you're running a SPA.

There are three reasons this bites people, in order of how often they happen.

## Cause 1 (most common): no SPA fallback configured

This is 90% of cases. You shipped a client-side router app but never added the rewrite rule for your host. The good news: each host needs exactly one small file.

### Vercel

Add a `vercel.json` at your **repo root** (not in `src/`):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The `source` `/ (.*)` matches every path; the `destination` `/index.html` is what Vercel serves. Push the file and Vercel redeploys automatically.

One gotcha: if your `vercel.json` already contains a legacy `builds` array, that overrides the dashboard build settings and can swallow the rewrite. Delete the `builds` array and let framework detection handle the build — the `rewrites` key then applies cleanly.

### Netlify

Create `public/_redirects` with this single line:

```
/* /index.html 200
```

The `/*` catches every path, `/index.html` is the destination, and `200` means "serve it" (not a redirect — the URL stays exactly what the user typed). Netlify reads this file from your build output, which is why it goes in `public/`: the build copies it into `dist/` automatically.

### Cloudflare Pages

Cloudflare Pages reads the same `_redirects` format as Netlify. Drop the identical line in `public/_redirects`:

```
/* /index.html 200
```

Vite and Astro copy `public/` straight into the output directory, so this file lands in `dist/_redirects` and Cloudflare picks it up. No dashboard toggle, no function required.

**Verify it worked:** deploy, then open a deep link directly (don't click into it — type `https://yoursite.com/dashboard` and hit Enter, or refresh a sub-page). The page should load with a `200` in the Network tab, and the URL should stay `/dashboard` (not flip to `/index.html`). If you still see 404, go to Cause 2.

## Cause 2 (less common): the rule is there but not taking effect

You added the file, redeployed, and it still 404s. Almost always one of these:

**The file isn't in the build output.** For Vite and Astro, anything in `public/` is copied verbatim to the output folder. If you created `_redirects` at the project root instead of `public/`, the build ignored it. Move it into `public/` and redeploy. You can confirm by opening your deployed site's `/_redirects` URL directly — if it 404s, the file didn't ship.

**Wrong destination on Vercel.** The rewrite must point at `/index.html` (the actual file), not `/` and not `/index`. A typo here sends requests to a path that doesn't resolve, and you're back to 404.

**A more specific rule won the match.** On Netlify and Cloudflare, `_redirects` is evaluated top to bottom, and the first match wins. If you have a rule like `/blog/* /articles/:splat 301` *above* the SPA fallback, it only affects `/blog` paths — fine. But if a `200` redirect sits above `/* /index.html 200` and matches too broadly, it can intercept deep links. Keep the SPA fallback as the **last** line, as a catch-all.

**You're on Cloudflare Pages with Pages Functions.** If your project has a `/functions` directory, some paths are handled by a worker instead of static files, and the `_redirects` catch-all may not cover them the way you expect. For a pure SPA with no functions, this doesn't apply — remove or scope the functions and the static `_redirects` fallback works as described.

**Verify it worked:** after fixing, re-open the deep link. If it loads, you're done. If `index.html` itself loads but the *wrong view* shows (router renders the homepage instead of `/dashboard`), that's a router `basename` mismatch, not a host problem — see Cause 3's neighbor note below.

## Cause 3 (rare): it's not a SPA at all — the build didn't emit the route

Sometimes the 404 isn't about routing; your deploy simply has no files for that route because the build misconfigured the output. Telltale signs: the homepage 404s too, or the deployment log said "No Output Directory." That's a build-settings problem, not a routing one, and it has its own fix — [the Vercel build-failed guide walks through output directory and build command](/deploy/vercel-build-failed/) exactly.

A close cousin, specific to SPAs: if `index.html` loads on refresh but renders the **homepage** instead of the route you asked for, your router and your host disagree on the base path. If you deploy under a sub-path (e.g. `https://yoursite.com/app/`), set the router `basename` to match and set the matching `base` in `vite.config.ts` (or `homepage` in `package.json` for CRA). Mismatched values make every deep link land on the wrong view even though the host "works."

## A note for Astro users (and why my own site doesn't hit this)

If your site is plain Astro with the default static output, you can close this tab. Astro pre-renders a real HTML file for every route at build time, so `/blog/my-post` is an actual file on disk — refresh it and the server serves that file. No fallback needed.

You only meet this 404 when you run a client-side router *inside* Astro (a `client:only` React/Vue island using React Router or Vue Router, or a SPA-mode framework), or when you ship a pure Vite/React/Vue SPA to one of these hosts. That's the situation the three fixes above solve. My own ShipToCash site is Astro static, so it never needed a `_redirects` — but every React side-project I've put on Cloudflare Pages has, and the one-line file has saved each of them.

## The 60-second checklist

Before you redeploy, confirm:

1. You're running a client-side router (React Router, Vue Router, SvelteKit SPA, etc.) — not a framework that emits real HTML per route.
2. Vercel → `vercel.json` with the `rewrites` block, at repo root.
3. Netlify or Cloudflare Pages → `public/_redirects` with `/* /index.html 200`, and you've redeployed so the file is in the output.
4. The SPA fallback line is the **last** rule in `_redirects`.
5. You tested by *typing* a deep link, not by clicking into it.

Do those, and a refresh on any sub-page returns `200` with your app intact.

## Next steps

With routing solid, the deploy is actually done — the boring part is behind you. If deep links were 404ing because the build never produced files, the [build-failed walkthrough covers output directories and build commands](/deploy/vercel-build-failed/). And once the site is stable, the usual next milestone is a custom domain — here's [how to point a domain at Vercel](/deploy/vercel-custom-domain-setup/) when you're ready, or [whether transferring a domain is even worth it](/deploy/transfer-domain-to-vercel/) before you commit.
