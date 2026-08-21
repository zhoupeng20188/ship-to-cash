---
title: "How to Deploy Your First App to Vercel (No DevOps Experience Needed)"
description: "You built an app with AI. Here's how to get it off your laptop and onto the internet with Vercel — step by step, no prior deployment experience required."
pubDate: 2026-08-04
updatedDate: 2026-08-21
category: deploy
difficulty: beginner
author: "Peng Zhou"
faq:
  - question: "Is Vercel free for personal projects?"
    answer: "Yes. The Hobby tier is free for non-commercial personal projects and includes automatic HTTPS, preview deployments, and 100 GB of bandwidth per month."
  - question: "Do I need to know Git to deploy to Vercel?"
    answer: "You need the basics: init a repository, commit, and push to GitHub. Vercel handles everything after that — each push to main redeploys automatically."
  - question: "Can I use Vercel without GitHub?"
    answer: "Yes. Vercel also supports GitLab and Bitbucket, and you can deploy directly from your terminal with the Vercel CLI (`npx vercel`)."
---

So you built something with Cursor, v0, or Claude — and it works on your laptop. Now what?

Right now your app only exists at `localhost:3000`, which means exactly one person on Earth can see it: you. Deploying puts it on a server that's always on, with a URL anyone can open. This takes about 15 minutes with Vercel's free tier, and you don't need to know anything about servers.

Full disclosure: I ship my own projects on Cloudflare Pages these days (cheaper at scale). But when someone asks me how to deploy their very first app, I still point them at Vercel — its framework detection is the most forgiving, and the error messages actually tell you what's wrong. Everything below transfers to other hosts later.

## What you'll need

- A GitHub account (free)
- A Vercel account (free — you sign up *with* GitHub, one click)
- Your app building locally without errors
- About 15 minutes

## Step 0: Make sure your project builds

Run this in your project folder:

```bash
npm run build
```

If it fails, fix it now. Build errors don't fix themselves in the cloud — they just get harder to read. I skipped this check on my first deploy and spent 20 minutes staring at a Vercel log before realizing my local build was broken too. The usual culprit is a TypeScript or lint error your AI tool left behind; paste the error back into it and ask for a fix.

## Step 1: Push your code to GitHub

Vercel deploys straight from a Git repository, so your code needs to live on GitHub first.

Create a repo at [github.com/new](https://github.com/new). Two choices that matter:

- **Private is fine.** Vercel deploys from private repos. Your code stays hidden; only the built site is public.
- **Don't add a README or .gitignore** if your project already has files — it just creates a merge conflict on your first push.

Then:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourname/your-app.git
git push -u origin main
```

**One check before you push:** your `.env` file must *not* be included. Run `git status` — if `.env` shows up, add it to `.gitignore` first (most frameworks generate one that already excludes it). API keys pushed to GitHub get scraped by bots within minutes. I know someone who lost $400 in OpenAI credits this way before breakfast.

## Step 2: Import the project in Vercel

1. Sign up at [vercel.com](https://vercel.com) with **Continue with GitHub** — this connects your repos automatically.
2. Go to [vercel.com/new](https://vercel.com/new) and click **Import** next to your project.
3. Vercel detects your framework (Next.js, Vite, Astro…) and fills in the build settings. Leave the defaults — the detection is right about 95% of the time.
4. Click **Deploy**.

The build takes 60–90 seconds. When it finishes: confetti, and your app is live at `your-app.vercel.app`.

Open the URL and click through every page. Things that worked on localhost occasionally break in production — better you find it than your first user.

## Step 3: Add your environment variables

If your app uses API keys (OpenAI, Supabase, Stripe…), it works locally because of your `.env` — which you correctly did *not* push. Production needs those values too:

1. In your Vercel project: **Settings → Environment Variables**.
2. Add each key-value pair from your `.env`.
3. **Redeploy** — variables only apply to new deployments. **Deployments → ⋯ → Redeploy**.

Forgetting the redeploy step cost me an embarrassing amount of "but I ADDED the variable!" confusion. Everyone does it once.

One naming trap: variables prefixed with `NEXT_PUBLIC_` (or `VITE_` in Vite) get baked into the browser bundle and are **publicly visible**. Never put secret keys behind those prefixes — only values that are safe to expose, like a Supabase anon key.

## Step 4: Understand what you just set up

This is the part that makes it worth it:

- **Every push to `main` redeploys automatically.** Your workflow from now on: ask AI for changes → commit → push → site updates in about a minute.
- **Pull requests get preview URLs.** Work in a branch, and each PR deploys to its own temporary URL for testing.
- **HTTPS is automatic.** Vercel provisions and renews the certificate; you never touch it.
- **Rollbacks are one click.** Deployed something broken? **Deployments → ⋯ → Promote** an older deployment.

## How to redeploy your app (without pushing code)

Pushing to `main` redeploys automatically — but sometimes you need to rebuild the *same* code: you added environment variables, a build flaked out halfway, or you just want a clean slate.

Go to your project's **Deployments** tab, find the latest deployment, click **⋯ → Redeploy**. One dialog appears with a single meaningful choice: **"Use existing Build Cache."**

- **Checked (default):** faster, reuses cached dependencies and build artifacts. Fine for picking up new env vars.
- **Unchecked:** a full clean build. Choose this if you changed dependencies, or a previous build left something weird in the cache and you're getting errors that make no sense.

Two things beginners get wrong here:

1. **Redeploy rebuilds the same commit.** It does not pull your newest local code — if you want new changes live, push them.
2. **Redeploy ≠ rollback.** Redeploy rebuilds the current version; to go *back* to an older working version, use **⋯ → Promote** on that older deployment instead.

## Common first-deploy errors

| Error | Cause | Fix |
|---|---|---|
| `Module not found: './Components/...'` | macOS/Windows ignore file-name casing; Linux servers don't | Match the exact casing in your imports (`components` vs `Components`) |
| `Environment variable is undefined` | Vars not added in Vercel, or added but never redeployed | Settings → Environment Variables, then **redeploy** |
| Build succeeds but page is blank | Client-side JS error or wrong router `base` path | Open DevTools console on the live site — the error is there |
| `npm ERR! peer dep` during build | Dependency conflict your local install tolerated | Run `npm install` locally, commit the updated `package-lock.json`, push |
| Deploy hangs or times out | A dev-server command ended up in your build script | Check the framework preset — build must produce output and exit |

That first error, `Module not found`, deserves special mention — it's the one that works locally and only breaks on Vercel, and the fix is usually a single character. I broke down [why Module not found happens on Vercel but not locally](/deploy/vercel-module-not-found-works-locally/) (file casing, mostly) in its own guide.

Hit something not in this table? If the build itself failed, I keep a running list of [the Vercel build failures I hit most often](/deploy/vercel-build-failed/) and what fixed each one. Otherwise, copy the exact error from the Vercel build log and paste it into your AI tool along with "my Vercel deploy fails with this error." Deploy errors are one of the things AI debugs best, because build logs are extremely literal.

## What the free tier actually covers

Hobby gives you 100 GB of bandwidth a month, unlimited sites, and everything above. For a new project that's effectively unlimited — you'd need tens of thousands of monthly visitors to notice the ceiling.

The two restrictions worth knowing: Hobby is licensed for **non-commercial use**, and serverless functions have execution time limits. Neither matters on day one. By the time it does, you'll happily pay the $20/month for Pro.

## Next steps

Your `.vercel.app` subdomain works, but it screams "weekend project." A custom domain costs about $10 a year and takes 20 minutes to connect — my [Vercel custom domain setup guide](/deploy/vercel-custom-domain-setup/) walks through it with Namecheap and Cloudflare. Don't have a domain yet? Start with [how to buy one and set up DNS](/deploy/buy-domain-set-up-dns/). (And no, you don't need to [transfer your domain to Vercel](/deploy/transfer-domain-to-vercel/) — pointing it is enough.) Then set up analytics, because watching your first real visitor arrive is the moment this stops being a toy.
