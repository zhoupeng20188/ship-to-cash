---
title: "Vercel Build Failed: 5 Real Causes and Exact Fixes"
description: "Build works locally but Vercel says 'Build failed'? The 5 causes behind almost every red deployment — with the exact error text and fixes, from real build logs."
pubDate: 2026-08-19
category: deploy
difficulty: beginner
author: "Peng Zhou"
faq:
  - question: "Where do I find the logs for a failed Vercel build?"
    answer: "In your Vercel dashboard, open the project, click the Deployments tab, then click the failed deployment. The build log is the 'Building' section — scroll to the first red line, not the last. Vercel keeps build logs indefinitely, so you can go back to old failed deployments at any time."
  - question: "Why does my app build locally but fail on Vercel?"
    answer: "Because your laptop and Vercel's build container are different environments. The usual gaps: file-name casing (macOS doesn't care, Linux does), a Node version mismatch, dependencies that are installed locally but missing from package.json, and environment variables that exist in your .env but were never added to the project."
  - question: "Can I skip TypeScript errors to get the build passing?"
    answer: "You can — set typescript.ignoreBuildErrors in next.config — and it's fine as a one-evening escape hatch. But it hides real breakage that will resurface at runtime. Fix the errors, or at least come back to them before your next feature."
  - question: "How do I retry a failed deployment?"
    answer: "Deployments tab → the latest deployment → ⋯ → Redeploy. Keep 'Use existing Build Cache' checked for a quick retry; uncheck it for a clean build if you suspect a stale cache. Redeploy rebuilds the same commit — it won't pick up new local changes until you push."
  - question: "What does 'Build Failed' mean on Vercel?"
    answer: "It means Vercel's build container could not finish compiling and packaging your app, so it never produced a deployable output. The cause is almost always one of five things: a dependency mismatch, a Node version gap, a TypeScript error, a wrong build/output setting, or a timeout. The exact reason is in the first red line of the build log — scroll up, not down."
---

The first time I saw a red "Error" status on a Vercel deployment, I stared at the log for twenty minutes. The app built fine on my laptop. It built fine five minutes earlier. What changed?

That was my first deploy, and the lesson I learned — the one this guide is built on — is that Vercel build failures are almost never mysterious. Your laptop quietly forgives things that Vercel's Linux build container does not. Once you know the five things it's strict about, you can read any failed build log and usually know the fix within a minute.

One thing before we start: if your error literally says `Module not found`, that's usually a file-casing problem, and it has its own guide — [why Module not found happens on Vercel but not locally](/deploy/vercel-module-not-found-works-locally/). For everything else, read on.

## First: read the log the right way

Open your project in the Vercel dashboard, click **Deployments**, then click the failed deployment. The build log is the **Building** section.

The mistake everyone makes (me included, for those twenty minutes) is reading the log bottom-up. The end of a failed log is full of cleanup noise — "build failed," exit codes, "Deployment failed" repeated three ways. None of it is the actual error.

**Scroll up to the first red line.** That's the real error. Everything after it is the build process falling over. Vercel keeps build logs indefinitely, so you can always come back to an old failure and re-read it — useful when the same error shows up a week later and you've forgotten the fix.

Now, the five causes.

Here's the quick map — match your log's first red line to the cause, then scroll to it:

| Your log shows… | The cause | Which one |
|---|---|---|
| `ERESOLVE` / `command not found` | Dependencies differ from local | Cause 1 |
| Node syntax error / cryptic crash | Node version mismatch | Cause 2 |
| `Type error:` / `Cannot find module` | TypeScript error surfaces at build | Cause 3 |
| `No Output Directory` / 404 after build | Wrong build command or output | Cause 4 |
| `heap out of memory` / build times out | Out of time or memory | Cause 5 |

## 1. Dependencies install fine locally but break on Vercel

**What the log says:**

```
npm ERR! code ERESOLVE
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^18.2.0" from next@14.1.0
```

Or sometimes:

```
error pnpm: command not found
```

**Why it works locally:** your laptop has a `node_modules` folder that's been accumulating for weeks. Half-installed packages, versions you upgraded manually, a package manager you switched away from. Vercel starts from scratch every build, from whatever `package.json` and lockfile you actually committed. If those two disagree with what's on your machine, you find out here.

**The fix:**

1. Delete your local `node_modules` and lockfile, then reinstall from scratch: `rm -rf node_modules package-lock.json && npm install`
2. Commit the fresh `package-lock.json` (or `pnpm-lock.yaml` — whichever your project uses, it must be in git)
3. Push and let Vercel rebuild

If you get the `ERESOLVE` peer-dependency error specifically, it means two packages want incompatible versions of the same thing. Run the install locally — npm will print the exact conflict — and resolve it there, not by guessing.

If you use pnpm and see `command not found`, Vercel didn't know to use pnpm. Pin it by adding `"packageManager": "pnpm@9.x.x"` (your actual version) to `package.json`, or set the install command in **Settings → General → Build & Development Settings**.

## 2. Your Node version doesn't match

**What the log says:** the error is often misleading — a syntax error in code that looks fine, or a cryptic crash in a dependency. Scroll up to the top of the log and check the line that says which Node version the build ran on.

**Why it works locally:** you're probably running a different major version of Node than Vercel's build container. If your AI tool used syntax from a newer Node — optional chaining was the classic, newer built-ins are the current one — it runs fine on your Node 22 laptop and dies on an older build image, or vice versa.

**The fix:** pin the version explicitly in `package.json`:

```json
{
  "engines": {
    "node": "22.x"
  }
}
```

Match whatever you run locally (`node -v` to check). Vercel respects the `engines` field, and now your laptop and the build container agree. This takes thirty seconds and eliminates a whole category of "but it works on my machine."

## 3. TypeScript errors that only surface during build

**What the log says:**

```
Failed to compile.
./src/components/Header.tsx:14:21
Type error: Cannot find module '@/components/Logo' or its corresponding type declarations.
```

**Why it works locally:** two common reasons. First, `next dev` in development mode doesn't run the full type check that `next build` does — dev is optimized for speed, build for correctness. Second, path aliases like `@/components` come from `tsconfig.json`, and if that file didn't get committed (or the alias was added locally and never pushed), the build can't resolve them.

**The fix:**

1. Run the build locally before pushing: `npm run build`. If it fails locally, you get the same error with faster iteration — fix it there.
2. Check `tsconfig.json` is committed and its `paths` section matches your imports:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": { "@/*": ["./src/*"] }
     }
   }
   ```
3. Escape hatch only: `typescript: { ignoreBuildErrors: true }` in `next.config` will skip the check. I've used it to ship on a Friday. It's a bad permanent state — the errors don't go away, they just move from build time to runtime, where they're harder to see.

## 4. The build command or output directory is wrong

**What the log says:**

```
Error: No Output Directory named "dist" found using the Vercel Speed API.
```

Or your build "succeeds" in the log but the deployment still 404s.

**Why it works locally:** your local dev command doesn't care about output directories — it serves from memory. Vercel needs to know which folder contains the built site, and the auto-detection is only as good as your project's signals. This bites hardest with Vite projects that set a `base` path in `vite.config.ts`, monorepos where the app lives in a subfolder, and projects that copy-pasted a `vercel.json` from an old tutorial.

**The fix, in order:**

1. Check **Settings → General → Build & Development Settings**. For Vite, Build Command `npm run build`, Output Directory `dist`. For Astro, `dist`. For Next.js, leave it alone — Next manages itself.
2. If your app is in a subfolder, set **Root Directory** on the same settings page rather than fighting with paths.
3. Look at your `vercel.json`. If it contains a `builds` array, that's legacy config from an older era — and it *overrides* the dashboard settings entirely. A `builds` array plus framework auto-detection is a known way to get errors that make no sense. Delete it and use the dashboard (or the newer `buildCommand`/`outputDirectory` keys) instead.

## 5. The build runs out of time or memory

**What the log says:**

```
<--- Last few GCs --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

Or the build just… stops, and the deployment fails with a timeout. Vercel's build step has a hard limit of **45 minutes** — after that the build is killed and the deployment fails, no matter what plan you're on.

**Why it works locally:** your laptop probably has more memory available to Node than the build container does, and you've never had a reason to time your local build.

**The fix:**

For memory, raise Node's heap limit in your build command:

```bash
NODE_OPTIONS=--max_old_space_size=4096 next build
```

(Adjust `4096` to taste — that's MB.) That single change fixes most out-of-memory builds on Next.js projects. If it doesn't, the honest fix is making the build smaller: heavy image processing, page-generation loops over thousands of items, and barrel files re-exporting entire component libraries are the usual suspects.

For timeouts, look at what the log says the build is *doing* when it stalls. Ninety percent of the time it's not one slow step — it's a loop generating an unreasonable number of pages, or a build script that's quietly waiting on a network request that never completes. If you're on Next.js with a large static site, incremental static regeneration lets you pre-render a subset at build time and generate the rest on demand.

One rate-limit gotcha while you're iterating on builds: the Hobby plan allows 100 deployments per day and 100 per hour. If you're pipelining fixes with an AI tool, you can hit that wall without noticing — the symptom is builds that won't start, which looks a lot like a build failure but isn't one.

## A 60-second pre-flight check that prevents most of this

Before your next push, run these locally:

```bash
rm -rf node_modules && npm install   # clean install, like Vercel does
npm run build                        # full build, like Vercel does
```

If both pass locally, your odds of a green first deployment go way up. It's the same check I tell everyone to run in the [first-deploy guide](/deploy/deploy-first-app-vercel/) — it exists because I skipped it once and paid for it with those twenty minutes.

## Next steps

Fix the build, and you're back to the fun part: the thing actually being online. If red deployments are becoming a pattern and your project is mostly static, it's worth knowing that [Cloudflare Pages and Vercel trade blows differently](/deploy/vercel-vs-netlify-vs-cloudflare-pages/) — I run projects on both, and build behavior is one of the places they genuinely differ. And once the deploy is green, the next milestone is a custom domain — here's [how to point a domain at Vercel](/deploy/vercel-custom-domain-setup/) when you're ready, or [whether transferring the domain is even worth it](/deploy/transfer-domain-to-vercel/).
