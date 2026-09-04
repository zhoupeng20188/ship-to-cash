---
title: "Vercel vs Netlify vs Cloudflare Pages: I Deployed to All Three"
description: "Honest comparison of the three big free static hosts — Vercel, Netlify, and Cloudflare Pages — after deploying real apps to each. Which one for your first app?"
pubDate: 2026-08-04
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-vercel-vs-netlify-vs-cloudflare-pages.jpg
faq:
  - question: "Can I use Vercel's free tier for a commercial project?"
    answer: "No. The Hobby plan is licensed for non-commercial use only. If your app makes money (ads, subscriptions, sales), you need Vercel Pro at $20/month — or use Cloudflare Pages, which allows commercial use on the free plan."
  - question: "Can I switch hosts later without rebuilding my app?"
    answer: "Yes. All three deploy from the same Git repository. Moving means connecting your repo to the new host, updating your DNS records, and waiting for propagation — usually under an hour of actual work."
  - question: "Do any of them require a credit card for the free tier?"
    answer: "No. Vercel, Netlify, and Cloudflare Pages all let you sign up and deploy without a credit card."
---

Picking a host is the first decision that actually matters after your app works locally. The three names you'll see everywhere are Vercel, Netlify, and Cloudflare Pages — all free to start, all deploy from Git, all handle HTTPS for you.

I've deployed real projects to all three — this site included. This isn't a feature-list regurgitation; it's what actually differs when you use them, and which one I'd hand to someone deploying their first app today.

My test setup, so you know where the opinions come from: a Next.js side project (Vercel, then migrated), an Astro content site (Cloudflare Pages), and a handful of client demos (Netlify, back when it was my default). So I've hit the real limits of each, not just read the pricing pages.

## The short answer

- **Deploying your very first app?** Use **Vercel**. The onboarding is the smoothest and the error messages are the most readable. (My [step-by-step Vercel guide](/deploy/deploy-first-app-vercel/) takes about 15 minutes.)
- **Expecting real traffic, or monetizing from day one?** Use **Cloudflare Pages**. Unlimited bandwidth, commercial use allowed, free.
- **Netlify** is fine, but in 2026 it's the third choice for most people — keep reading for why.

## What they have in common (so you can stop worrying)

All three give you: Git-based auto-deploys, preview URLs for pull requests, free HTTPS with auto-renewed certificates, a global CDN, custom domains, and no credit card required. If you pick any of them, your app will be fast and secure.

The differences are in pricing limits, framework support, and developer experience.

## Vercel: the best first-deploy experience

Vercel makes Next.js, so its tooling is the most polished for React/Next apps — but it handles Astro, Vite, SvelteKit, and plain HTML just as well.

**What I like:**
- Framework detection is right almost every time. You click Import, it figures out the rest.
- Build logs are the clearest of the three. When a deploy fails, the error usually tells you the actual cause.
- Preview deployments are the most mature — every PR gets a URL you can share.

**The catch:**
- **Hobby tier is non-commercial only.** Running AdSense or charging users on a Hobby account violates the terms. The moment you monetize, that's $20/month for Pro.
- 100 GB/month bandwidth sounds like a lot, and it is — until something goes viral. Then you're paying or migrating.

## Netlify: the original, now mostly middle-of-the-road

Netlify basically invented this category of Git-based static hosting, and it's still solid. But it hasn't pulled ahead anywhere that matters for a first app.

**What I like:**
- Built-in form handling and split testing — nice if you need them, you probably don't yet.
- Very framework-agnostic. No favorite child.

**The catch:**
- The free tier limits **build minutes to 300/month**. Sounds fine until you're iterating with an AI tool and pushing 20 times a day — a 2-minute build means 150 deploys and you're done for the month. I've hit this ceiling. It's annoying.
- Smaller free bandwidth (100 GB) and a community that's quieter than the other two.

## Cloudflare Pages: the one I actually use now

Full disclosure: this is where my own projects live, including this site.

**What I like:**
- **Unlimited bandwidth on the free plan.** Not "generous" — unlimited. A Reddit hug of death costs you nothing.
- **Commercial use is allowed.** Ads, subscriptions, whatever — no tier upgrade required.
- Cloudflare's network is genuinely one of the fastest on the planet, and your DNS, CDN, and host live in one place.
- It plays well with Workers if you later need server-side logic.

**The catch:**
- Developer experience is a notch below Vercel. The dashboard is busier, and error messages are terser.
- If your app needs full server-side rendering (Next.js with API routes, for example), support exists via adapters but it's the roughest edge of the platform. For static/SSG sites — most first apps — you'll never notice.

## Head-to-head

| | Vercel | Netlify | Cloudflare Pages |
|---|---|---|---|
| Free bandwidth | 100 GB/mo | 100 GB/mo | **Unlimited** |
| Commercial use free | ❌ (Pro $20/mo) | ✅ | ✅ |
| Build limit | 100 deploys/day | 300 build min/mo | 500 builds/mo |
| Framework detection | Excellent | Good | Good |
| Full SSR support | Excellent | Good | Okay (adapters) |
| Dashboard/DX | Best | Good | Busy |

## What about GitHub Pages, Render, and Railway?

**GitHub Pages** is free and unlimited-ish, but it only serves plain static files — no build pipeline worth mentioning, no preview deployments, no serverless anything. It's where documentation sites live, not where your app should.

**Render and Railway** are for apps with persistent backends (long-running Node servers, Docker containers, databases). If your AI tool built you a pure frontend or a framework app, you don't need them yet — and their free tiers either sleep your app (Render spins down after 15 minutes idle, meaning 30+ second cold starts for your visitors) or are time-limited trials (Railway). When you outgrow serverless, that's when these enter the conversation.

## So which one?

For a first app, I still say **Vercel** — when you're learning, clear error messages matter more than pricing theory. You'll deploy, break things, read logs, and learn.

But here's the nuance most comparison posts skip: **if you already know you'll monetize** (AdSense, a paid tool, an affiliate site like this one), start on **Cloudflare Pages** instead. Migrating later is easy but not free of friction — you'll touch DNS, and DNS changes make everyone nervous. Starting where you'll end up saves that.

And don't agonize. All three deploy from the same Git repo, so switching later is an hour of work, not a rebuild. The worst host decision is the one that delays your first deploy by a week.

## Next steps

Picked Vercel? Follow the [15-minute deploy guide](/deploy/deploy-first-app-vercel/). Picked Cloudflare Pages? The flow is nearly identical — connect GitHub, set build command to `npm run build`, output directory `dist`, done. Either way, next up is [setting up a custom domain on Vercel](/deploy/vercel-custom-domain-setup/) — and no, [transferring your domain to Vercel](/deploy/transfer-domain-to-vercel/) isn't required; pointing two DNS records at it is enough.
