---
title: "Application Error: a Client-Side Exception on Vercel (4 Fixes)"
description: "Page goes blank with 'a client-side exception has occurred' on Vercel? Four ranked causes: env vars, hydration, stale chunks, missing error boundary."
pubDate: 2026-09-11
category: deploy
difficulty: intermediate
author: "Peng Zhou"
image: /og-application-error-client-side-exception-vercel.jpg
faq:
  - question: "Why does my app work locally but show a client-side exception on Vercel?"
    answer: "Because development and production are two different builds. Locally you run a dev server that compiles on demand, has every variable from .env.local, and renders in a browser that has never seen a cached version of your app. On Vercel you get a frozen production build, only the environment variables you actually configured for that environment, and real users arriving with old HTML or stale chunks. The bug is usually present locally too — it's just not triggered."
  - question: "Why can't I see the real error message in production?"
    answer: "That's deliberate. The page says 'see the browser console for more information' because the details are in the browser, not on the server. In production, Next.js also stops forwarding full error messages from Server Components to the client to avoid leaking sensitive values, replacing them with a generic message plus a digest hash you can match against server logs."
  - question: "Is this always an environment variable problem?"
    answer: "No, but it's the most common cause for an app that was fine before a deploy. If the page loads and then goes blank while fetching data, check variables first. If it goes blank instantly on every route including static ones, it's more likely a hydration mismatch or a missing error boundary."
  - question: "Does Vercel's skew protection cause this error?"
    answer: "It prevents more of them than it causes. Skew protection keeps requests from an older client pointed at the deployment that version belongs to, so a tab left open during a deploy doesn't request JavaScript files that no longer exist. It's on by default for projects created after November 19, 2024; older projects need it enabled in Settings, and its default maximum age is one day."
  - question: "What is the difference between error.tsx and global-error.tsx?"
    answer: "error.tsx wraps the route segment below it — pages, nested layouts, loading and not-found files — but not the layout above it in the same segment. global-error.tsx is the fallback for errors thrown in the root layout itself, and because it replaces that layout it must render its own html and body tags. It also does not inherit your global styles, so it looks unstyled unless you style it yourself."
  - question: "Should I use reset or retry in my error boundary?"
    answer: "Use retry. It became a stable API in Next.js 16.3.0, after landing as unstable_retry in 16.2.0. retry() re-fetches and re-renders the segment, which is what you want after a transient failure. reset() still exists, but the docs now say to use retry in most cases and reserve reset for when you want to clear the error state and re-render without re-fetching."
---

A friend sent me a link to their Next.js dashboard last month: "works on my machine, white page in production." I opened it and got one line of grey text in the middle of an empty screen:

```
Application error: a client-side exception has occurred (see the browser console for more information)
```

No stack trace. No component name. Nothing in the Vercel deploy log either, because the build had succeeded. That's what makes this error so irritating: **the deploy is green, the server is up, and the page is still dead.**

But first, make sure you're on the right page — "blank page" and "broken deploy" get mixed up constantly, and they have completely different fixes.

| What you see | The real cause | Go here |
|---|---|---|
| Page loads, then **goes blank** with a client-side exception, console has a JS error | Browser-side crash — this guide | ↓ keep reading |
| Variable reads as `undefined` but the **page still renders** | Variable not set for that environment | [Environment variables on Vercel](/deploy/vercel-environment-variables/) |
| Build fails outright, or "No Output Directory" | Build settings / output directory | [Vercel build failed](/deploy/vercel-build-failed/) |
| Build succeeds but a module can't be resolved | Import missing from the deployed bundle | [Module not found on Vercel](/deploy/vercel-module-not-found-works-locally/) |
| Deep link 404s on refresh, homepage is fine | No SPA fallback | [404 on refresh](/deploy/client-side-routing-404-vercel-netlify-cloudflare/) |
| Page loads but fetches are blocked by the browser | Missing CORS header | [CORS error on Vercel](/deploy/cors-error-vercel/) |

## What the message actually means

"Client-side exception" is not a specific bug. It's Next.js saying: *the HTML arrived, the JavaScript ran, and something threw before the page finished rendering.* The browser showed you the framework's generic production error page instead of your app.

Two things make it hard to debug. The real message is in **the browser**, not the server — DevTools → Console has the first red error and its stack trace, while your Vercel logs often show nothing, because from the server's point of view the request returned a clean 200. And production deliberately hides detail: Next.js stops forwarding full error messages from Server Components to the client so sensitive values don't leak, replacing them with a generic message plus a `digest` hash you can match against server-side logs.

## Why production breaks and localhost doesn't

Three structural differences do most of the damage.

**You get a frozen build.** `npm run dev` compiles on demand. Vercel ships one immutable production build with minified code and content-hashed filenames.

**You get only the variables you configured.** Your laptop has `.env.local`. Vercel has whatever you typed into the dashboard, *per environment*, and Vercel's docs state plainly that "any change you make to environment variables are not applied to previous deployments, they only apply to new deployments."

**Real users arrive with history** — a cached document, a tab left open since before your last deploy, a slow connection loading HTML from version 12 and JavaScript from version 13.

Here are the three causes, ranked by how often they turn out to be the answer.

## Cause 1 (most common): the variable exists in Production only

This is the single most frequent cause I've run into, and it's sneaky because the app works — right up until it needs to render something that came from an API.

Every Vercel variable has independent environment scopes: **Production**, **Preview**, **Development**, plus custom environments. Adding a key to Production does not add it to Preview. So this happens constantly: you add your API key on the Production tab, ship to `main`, everything works — then a preview deployment hits the API with `undefined`, gets an error response back, and the component that expected data crashes on render.

```jsx
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`)
const data = await res.json()
// API_URL was undefined, so this fetched "undefined/posts";
// `data` is an error object, and now...
return <ul>{data.posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
// TypeError: Cannot read properties of undefined (reading 'map')
```

**The fix has two parts, and you need both.** First, set the variable in every environment you deploy to — tick Production, **Preview** and Development, or set Preview values per branch if you want different data. From the CLI, run the add once per environment:

```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL preview
```

Second — the part people skip — **redeploy**. Environment variable changes never apply retroactively, so without a new deployment you'll be staring at the same old build.

While you're there, stop assuming your data has the shape you expect. An error response shouldn't be able to nuke the page:

```jsx
const posts = data?.posts ?? []
if (posts.length === 0) return <p>Nothing here yet.</p>
```

**Verify it worked:** open the deployed page and run `process.env.NEXT_PUBLIC_API_URL` in the console — you'll get the inlined value. Now run the same thing on a **preview** deployment. If that one is `undefined`, the variable is set for Production only and your next PR deploy will break. That comparison is the real test; Production passing alone proves nothing.

## Cause 2: hydration mismatch

Hydration is React converting your server-rendered HTML into a live app by attaching event handlers. A mismatch means the HTML the server produced and the tree React builds in the browser disagree. Next.js [documents the common causes](https://nextjs.org/docs/messages/react-hydration-error), and these four cover almost everything I've seen:

1. **Invalid HTML nesting** — a `<div>` or `<ul>` inside a `<p>`, an `<a>` inside an `<a>`. Check this first, because browsers silently "fix" invalid nesting while parsing, so the DOM your React tree expects isn't the DOM that exists.
2. **Browser-only APIs in render logic** — reading `window`, `localStorage` or `document` while rendering. On the server they don't exist, so the two renders diverge.
3. **Time-dependent output** — `new Date()` or a random value rendered directly. Server and client will produce different strings, guaranteed.
4. **`typeof window !== 'undefined'` in render** — looks like a safe guard, is actually the bug: it makes the server render one thing and the client another, by design.

One more has nothing to do with your code: **browser extensions that modify the DOM**. A password manager or translation extension injecting elements can trigger hydration errors you cannot reproduce in a private window — because a private window loads no extensions. If the error disappears there, the fix isn't on your side.

**The fix:** move the browser-dependent read into an effect, so the first render matches the server and the client catches up after:

```jsx
'use client'
import { useState, useEffect } from 'react'

export default function LocalTime() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return <span>{mounted ? new Date().toLocaleTimeString() : '--:--'}</span>
}
```

For a component that genuinely can't render on the server, [skip SSR for it](https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr) instead of fighting the mismatch: `dynamic(() => import('../components/chart'), { ssr: false })`.

And fix the markup. `suppressHydrationWarning={true}` is an escape hatch for genuinely unavoidable differences like a timestamp — it works one level deep only, and React won't patch mismatched text when you use it. Reach for it last.

**Verify it worked:** load the production URL, open the console, reload with cache disabled. Hydration problems are almost always on the first error line.

## Cause 3: stale chunks after a new deploy

Your bundle is content-hashed: `main-a1b2c3.js` today, `main-d4e5f6.js` after your next push. Build output is immutable, so the old file is gone. Now picture a user who opened your app an hour ago and left the tab in the background. They return and click a link. The router fetches the chunk it was told about at load time — a filename that no longer exists. The fetch fails, the router throws, and they get the white page, while your deploy log shows a perfectly healthy build. It is healthy. Their client isn't.

You'll see this in the console as a 404 on a `.js` file, usually paired with "Failed to load chunk" or a dynamic import error.

**The fix:** [Vercel's Skew Protection](https://vercel.com/docs/deployments/skew-protection) routes requests carrying a deployment identifier back to the deployment that version belongs to, so an old client keeps getting files that match it. It's on by default for projects created after **November 19, 2024** using a supported framework. For older projects, enable it in Settings → Advanced → Skew Protection, which also requires "Enable access to System Environment Variables." On Next.js 14.1.4+ built on Vercel, no extra config is needed; older versions need `experimental.useDeploymentId` in `next.config.js`.

One limit worth knowing: the **default maximum age is one day**. Requests for an older deployment return 404. For most sites that's right. If you run long-lived sessions — a dashboard left open all day, a checkout flow, anything with unsaved state — raise it.

**Verify it worked:** deploy a change, then return to a tab you opened *before* the deploy and click around. With skew protection working you stay on a coherent version.

## Turn the next crash into a readable error

Everything above fixes the crash you have. This part stops the next one from being a white page with no information — and it's where most AI-generated code is quietly out of date.

Add an [error boundary](https://nextjs.org/docs/app/api-reference/file-conventions/error): an `error.tsx` file in the route segment you want to protect. It must be a Client Component, since error boundaries only work in the browser.

```tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong on this page.</h2>
      <button onClick={() => retry()}>Try again</button>
    </div>
  )
}
```

Two details that trip people up.

**It's `retry` now, not `reset`.** Per the docs' version history, `retry` became stable in **16.3.0** after landing as `unstable_retry` in 16.2.0, and the guidance is now to use it "in most cases." `reset()` still exists, reserved for clearing error state and re-rendering *without* re-fetching. So if your codebase — or an AI assistant — generated `reset`, it isn't broken, just doing something different from what you want: `retry` re-fetches, `reset` only re-renders.

**`error.tsx` doesn't cover the layout above it.** It wraps the pages, nested layouts, `loading.js` and `not-found.js` below it in the segment, but not the `layout.js` in that same segment. Errors thrown in the root layout need `global-error.tsx`, which replaces that layout entirely and must therefore render its own `<html>` and `<body>`. The gotcha nobody warns you about: `global-error` and the built-in 500 page render their own document and **do not include your global styles**, so your fonts and theme toggle won't reach them. If your error page looks like unstyled HTML, that's why.

## The 60-second checklist

1. Console → first red error. That's the real bug; the on-screen text is just the framework's summary.
2. Data coming from an API? Check the variable in **every** environment, then **redeploy**.
3. Console complaining about HTML nesting or hydration? Fix the markup before anything else.
4. 404 on a `.js` file? Stale chunks — enable Skew Protection and raise the maximum age if you have long sessions.
5. No error boundary? Add `error.tsx` with `retry`, so the next failure tells you something.
6. Still stuck? Test in a private window to rule out an extension, then run `vercel logs --environment production --level error --since 30m`.

## Next steps

A blank page is the most opaque failure you can get, because the deploy looks healthy. Once the environment variable side is sorted, [the environment variables guide](/deploy/vercel-environment-variables/) covers where each key should live — build time, runtime, or client. If the same deploy also failed to build, [the build-failed walkthrough](/deploy/vercel-build-failed/) covers output directories and build commands. And when everything finally renders, [pointing a custom domain at Vercel](/deploy/vercel-custom-domain-setup/) is the next thing most people do.
