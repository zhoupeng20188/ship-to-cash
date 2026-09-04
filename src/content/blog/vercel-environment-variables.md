---
title: "Environment Variables on Vercel: Where Your API Keys Should Live"
description: "Where do your API keys actually go on Vercel? How to add environment variables, why they stay undefined until you redeploy, and the prefix that leaks keys."
pubDate: 2026-08-31
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-vercel-environment-variables.jpg
faq:
  - question: "Do environment variables work immediately after I add them on Vercel?"
    answer: "No. Adding or changing a variable only affects new deployments, so you have to redeploy for the value to take effect. This is the number-one source of 'but I added the variable!' confusion. Open Deployments, click the ⋯ menu on the latest deployment, and choose Redeploy."
  - question: "Is it safe to put my API key in a NEXT_PUBLIC_ variable?"
    answer: "No. The NEXT_PUBLIC_ prefix (VITE_ in Vite, PUBLIC_ in Astro) tells the framework to inline that value into the JavaScript bundle that ships to the browser, which means anyone can read it. Only put non-secret values there, like a Supabase anon key or a public analytics ID. Real secrets go in unprefixed variables that stay server-side."
  - question: "Should I commit my .env file to Git?"
    answer: "Never. Your .env holds raw API keys, and pushing it to a public (or even private) repo means those keys get scraped. Add .env to .gitignore — most framework templates already do — and double-check with git status before your first push."
  - question: "What's the difference between the Production, Preview, and Development environments on Vercel?"
    answer: "Production applies to your main deployment, Preview to pull-request and branch deployments, and Development to anything run locally with the Vercel CLI. You can give each environment different values — a live Stripe key in Production, a test key everywhere else — and you can leave a variable unset in one environment on purpose."
---

A friend asked me to look at his app last week. It built fine, the homepage loaded, but every button that touched an API returned `401 Unauthorized`. He'd spent two evenings on it. The whole bug was one missing environment variable — the key existed in his local `.env`, and he'd assumed Vercel would just pick it up somehow.

That's the mental model almost every new vibe coder starts with, and it's wrong in a way that costs real time. Your laptop and Vercel are two different machines. Nothing about your `.env` travels to Vercel unless you explicitly put it there. This guide covers how that actually works, where keys should live, and the three mistakes that leak them.

## What an environment variable actually is

An environment variable is just a named value your code reads at runtime instead of having written into it. Instead of:

```js
const apiKey = "sk-live-0f8a3b1c..."; // hardcoded, and now in your git history forever
```

you write:

```js
const apiKey = process.env.API_KEY; // read from the environment at runtime
```

The point isn't secrecy for its own sake — it's that the same code can run in different places with different values. Your test key on your laptop, your live key on Vercel, and your code never has to know the difference.

## Why your key shouldn't live in your code

The hardcoded version feels harmless when it's just you and a personal project. It is not harmless, for three reasons:

1. **Git never forgets.** Once a key is committed, deleting it later doesn't help — it's in the history. The only reliable fix is rotating the key, which means regenerating it everywhere and updating every reference.
2. **Bots scrape public repos for keys within minutes.** OpenAI, Stripe, and Supabase all run automated key detection, but attackers run their own scrapers that don't wait for the official warning email. The first I heard about one of my leaked keys was a $60 bill, not a notification.
3. **You'll deploy to more than one place.** Vercel for the site, a cron somewhere, a second project for testing. Hardcoded keys means editing code for every one of them; variables means changing one value.

I still remember the first time I got burned: I shipped a little tool with a key hardcoded in the front end because "it's just a side project." The key showed up in the browser source, and within a few hours someone was using it. Nothing important was lost — it was a free-tier key — but it taught me that "just a side project" is exactly where you're most likely to be sloppy, because you're moving fast.

## The local setup: your .env file

Locally, your values live in a file called `.env` at the root of your project:

```
API_KEY=sk-live-0f8a3b1c...
DATABASE_URL=postgresql://...
```

A few rules that will save you pain later:

- **No spaces around the `=`**, and **no quotes around the value**. `API_KEY="abc"` gives your code the value with literal quote characters in it, which breaks things in ways that are genuinely hard to spot.
- **Names are case-sensitive.** `API_KEY` and `api_key` are different variables, and your framework won't warn you about the mismatch.
- **The file must never be committed.** Add `.env` to your `.gitignore` (most templates already do), then run `git status` before your first push and confirm it's not listed. I cover the local-vs-Vercel mismatch in more detail in my guide on [why module-not-found errors appear on Vercel but not locally](/deploy/vercel-module-not-found-works-locally/) — the same "two different machines" logic applies here.

## The Vercel setup: where keys actually go

Here's the part that trips everyone up. Your `.env` on your laptop does *not* get read by Vercel. You have to enter the same values again in Vercel's dashboard:

1. Open your project, go to **Settings → Environment Variables**.
2. For each key-value pair from your `.env`, enter the **Key** and **Value**, then pick which environment(s) it applies to (more on that in a second).
3. Click **Save**.
4. **Redeploy.** Variables only apply to new deployments — this step is mandatory and it's the one everyone skips. Go to **Deployments → ⋯ → Redeploy**.

If you have a lot of variables, you can also paste the whole `.env` file's contents into the bulk editor in the same screen. Just make sure it's the *production* values, not leftover test values.

These steps assume your project is already on Vercel. If it isn't yet, start with my [walkthrough for deploying your first app to Vercel](/deploy/deploy-first-app-vercel/) and come back once it's live — you need an existing deployment before any of this has somewhere to apply.

## The three environments, and why they matter

When you add a variable, Vercel asks which environment it belongs to:

| Environment | When it's used |
|---|---|
| **Production** | Your main deployment (the site visitors see) |
| **Preview** | Pull-request and branch deployments |
| **Development** | Anything run locally with the Vercel CLI |

This exists so you can keep a live Stripe key in Production and a test key in Preview, without the test key ever touching your real site. For a first project you'll usually check all three and move on — but the moment you add a payment provider or a database, split them. A test key leaking is annoying; a live key leaking costs money.

## The redeploy gotcha

This is worth its own heading because it's the single most common "bug" I hear about, and I've been the person causing it.

You add a variable, click Save, refresh your site, and... still undefined. You check the name three times. It matches. You start Googling.

The variable is there. It just isn't in the *deployment that's currently running*, because deployments are frozen snapshots. Adding a variable doesn't mutate a live deployment — it only affects the next build. So:

- **Added or changed a variable?** Redeploy.
- **Still undefined after redeploying?** Check whether your framework inlines it at build time (see the prefix section below) — if so, confirm you're actually redeploying, not just editing the variable.

I burned a full evening on this exact loop before I learned it. If your build itself is failing rather than returning `undefined`, I keep a running list of [the Vercel build failures I hit most often](/deploy/vercel-build-failed/) and what fixed each one.

## The prefix trap that leaks keys

Some variables are meant for the browser, and frameworks use a naming prefix to tell them apart:

- **Next.js:** `NEXT_PUBLIC_...`
- **Vite:** `VITE_...`
- **Astro:** `PUBLIC_...`

Anything with that prefix gets **baked into the JavaScript bundle** that ships to the user's browser. That's the point — it lets your front end read a public value without a server round-trip. The catch is that "baked into the bundle" means "anyone can read it by opening DevTools."

So the rule is simple:

- **Public values** (a Supabase anon key, a Google Analytics ID, your app's base URL) → prefix them, they're designed to be exposed.
- **Secret values** (API keys, database passwords, Stripe *secret* keys, service-role keys) → **never** prefix them. They must stay server-side.

The classic mistake is pasting a secret key into a `NEXT_PUBLIC_` variable because the framework's docs use that prefix in every example. If you're not sure whether a key is public or secret, the answer is almost always secret — keep it unprefixed.

## Putting it together

The whole flow, end to end:

1. Keep secrets in `.env` locally, and never commit that file.
2. Add the same values in **Settings → Environment Variables**, choosing the right environment.
3. Use the framework's public prefix *only* for values that are safe to expose.
4. **Redeploy** after any change.
5. If a variable is still `undefined`, re-check steps 2–4 in order.

Get this right once and it becomes invisible — you'll add a key in thirty seconds and never think about it again. That's the goal: environment variables should be the boring plumbing you stop noticing, not a recurring source of mystery bugs.

When you're ready to go further with your deployed app, the natural next step is a real database — which brings its own `DATABASE_URL` variable into the mix. And once your app starts talking to a payment provider, the keys you're guarding here become actual money: before you open a Stripe account, read my breakdown of [merchant of record vs payment processor](/payments/merchant-of-record-vs-payment-processor/) — it decides who files your sales tax, and it's the kind of thing you want to understand before your first charge, not after.
