---
title: "Vercel Build Failed? 5 Causes Matched to Your Error Log"
description: "Match a failed Vercel build to its first error: dependency install, Node version, TypeScript, output settings, or resource limits."
pubDate: 2026-08-19
updatedDate: 2026-11-02
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-vercel-build-failed.jpg
faq:
  - question: "Where do I find the logs for a failed Vercel build?"
    answer: "In your Vercel dashboard, open the project, click the Deployments tab, then click the failed deployment. The build log is the 'Building' section — scroll to the first red line, not the last. Check deployment retention before relying on an old log; save the relevant output with your incident record."
  - question: "Why does my app build locally but fail on Vercel?"
    answer: "Because your laptop and Vercel's build container are different environments. The usual gaps: file-name casing (macOS doesn't care, Linux does), a Node version mismatch, dependencies that are installed locally but missing from package.json, and environment variables that exist in your .env but were never added to the project."
  - question: "Can I skip TypeScript errors to get the build passing?"
    answer: "You can — set typescript.ignoreBuildErrors in next.config — and it's fine as a one-evening escape hatch. But it hides real breakage that will resurface at runtime. Fix the errors, or at least come back to them before your next feature."
  - question: "How do I retry a failed deployment?"
    answer: "Deployments tab → the latest deployment → ⋯ → Redeploy. Keep 'Use existing Build Cache' checked for a quick retry; uncheck it for a clean build if you suspect a stale cache. Redeploy rebuilds the same commit — it won't pick up new local changes until you push."
  - question: "What does 'Build Failed' mean on Vercel?"
    answer: "It means Vercel's build container could not finish compiling and packaging your app, so it never produced a deployable output. The cause is almost always one of five things: a dependency mismatch, a Node version gap, a TypeScript error, a wrong build/output setting, or a timeout. The exact reason is in the first red line of the build log — scroll up, not down."
---

A Vercel build can fail even when local development appears to work. Start by finding the first failing stage in the build log.

Common differences include dependency installation, Node versions, file-name casing, environment variables, and build configuration. Use the log to choose which difference to investigate.

Three failures look like build failures but aren't, and each has its own fix. `Module not found` is usually file casing — [why Vercel says Module not found when your laptop doesn't](/deploy/vercel-module-not-found-works-locally/). Pages that render fine but [404 the moment you refresh a deep link](/deploy/client-side-routing-404-vercel-netlify-cloudflare/) are a routing problem. And when Vercel shows no new deployment at all, the trigger never fired — [Vercel never even started a deployment](/deploy/vercel-git-push-not-triggering-deploy/), so there's no log to read. Off Vercel entirely? Netlify's `build script returned non-zero exit code: 2` is [its own flavor of this error](/deploy/netlify-build-failed-exit-code-2/).

## First: read the log the right way

Open your project in the Vercel dashboard, click **Deployments**, then click the failed deployment. The build log is the **Building** section.

Read above the final exit-code summary. Cleanup messages explain that the build failed; the earlier command error explains why.

**Scroll up to the first red line.** That's the real error. Everything after it is the build process falling over. Retain a copy of the relevant error output: deployment retention settings can remove old deployment data.

Now, the five causes.

Use this table to distinguish a generic wrapper message from an actionable error:

| Exact string in your log | What it actually means | Jump to |
|---|---|---|
| `Command "npm run build" exited with 1` | The wrapper, not the error. The real one is 10–20 lines above it | Cause 1–3, scroll up |
| `npm ERR! code ERESOLVE` | Two packages want incompatible peer versions | Cause 1 |
| `Error: Command "npm install" exited with 1` | Install died before your build ever started | Cause 1 |
| `ELIFECYCLE Command failed with exit code 1` | Your own build script threw — read the first error above it | Cause 3 |
| `ERR_PNPM_OUTDATED_LOCKFILE` | `package.json` and `pnpm-lock.yaml` disagree | Cause 1 |
| `SyntaxError: Unexpected token` inside a dependency | Build image's Node is older than that package expects | Cause 2 |
| `Type error:` / `error TS2307` | Type check ran at build; dev mode skips it | Cause 3 |
| `No Output Directory named "dist" found` | Build succeeded, output landed somewhere else | Cause 4 |
| `Module not found: Can't resolve` | File casing, or a dependency missing from `package.json` | Cause 1 |
| `heap out of memory` / `Build exceeded maximum allowed runtime` | Hit the memory wall or the 45-minute cap | Cause 5 |

Two of those strings actively lie to you. `exited with 1` and `ELIFECYCLE` are both generic wrappers that npm prints after *something* failed — neither tells you what failed, and both are the last line of the log rather than the first. If the section under them is only cleanup noise, scroll up.

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

1. Reproduce a clean install without discarding dependency reproducibility: `npm ci` (for an npm project with a committed, matching lockfile)
2. If the manifest and lockfile disagree, run your package manager’s install command locally, review the dependency changes, and commit the matching manifest and lockfile.
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
3. `typescript: { ignoreBuildErrors: true }` skips a check rather than fixing the error. Prefer resolving the type error before deploying.

## 4. The build command or output directory is wrong

**What the log says:**

```
Error: No Output Directory named "dist" found after the Build completed.
Error: No Output Directory named "public" found after the Build completed.
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

One rate-limit gotcha while you're iterating on builds: the Hobby plan caps you at 100 deployments per day. If you're pipelining fixes with an AI tool, you can hit that wall without noticing — the symptom is builds that won't start, which looks like a build failure but isn't.

## A 60-second pre-flight check that prevents most of this

Before your next push, run these locally:

```bash
npm ci   # clean install, like Vercel does
npm run build                        # full build, like Vercel does
```

A successful clean install and build narrow the remaining differences to deployment settings and the remote environment. See the [first-deploy checks](/deploy/deploy-first-app-vercel/).

## Next steps

Once the build succeeds, check the deployed page and [connect the custom domain](/deploy/vercel-custom-domain-setup/). If the host is a poor fit for the app’s output or commercial use, use the [hosting checklist](/deploy/vercel-vs-netlify-vs-cloudflare-pages/).

And when the deploy has stayed green for a week, the next wall stops being technical. Usually the reason you wanted this thing deployed is to charge for it, and that turns out to be [taking money without a Stripe account](/payments/getting-paid-without-stripe-kofi-paypal/) — fees, payouts, and the parts nobody explains up front.

## Official references

- [Troubleshooting builds](https://vercel.com/docs/deployments/troubleshoot-a-build)
- [Deployment retention](https://vercel.com/docs/deployment-retention)
