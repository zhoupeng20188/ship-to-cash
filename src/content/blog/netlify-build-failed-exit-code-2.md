---
title: "Netlify Build Failed: What Exit Code 2 Actually Means (3 Fixes)"
description: "'Build script returned non-zero exit code: 2' on Netlify isn't the real error. Here are the 3 causes behind it, ranked, with the exact fix for each."
pubDate: 2026-09-18
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-netlify-build-failed-exit-code-2.jpg
faq:
  - question: "What does 'build script returned non-zero exit code: 2' mean on Netlify?"
    answer: "It means your build command finished with a non-zero status and Netlify stopped the deploy. It is not the error itself. Netlify's support guide says the same thing about the near-identical 'Build script exited with Error 1' line — that it is a symptom of some prior error from your build script. Scroll up past the exit code to the first real error line, which is usually a page or two above it."
  - question: "Why does my Netlify build fail when it builds fine locally?"
    answer: "Because Netlify's build image is a different machine with different rules: it sets CI=true, which makes some libraries treat warnings as errors; it runs a Linux filesystem that cares about file-name casing when macOS does not; and it installs dependencies from your committed lockfile rather than from your accumulated local node_modules. Any of the three produces a build that passes on your laptop and fails on Netlify."
  - question: "Should I set CI=false to fix a Netlify build failure?"
    answer: "No, use CI='' instead. Netlify's docs warn that setting CI=false may not work, because environment variable values arrive as strings and many libraries treat any non-empty string as true — so CI=false is still true. The documented fix is to prepend CI='' to your build command, making it CI='' npm run build."
  - question: "How do I change the Node version Netlify builds with?"
    answer: "Add an .nvmrc or .node-version file to your repository base directory with the major version, for example 22. Both override the NODE_VERSION environment variable and the Netlify UI setting. Netlify pins each site to the Node version that was default when the site was created, so an older site can still be on Node 18 even though the current build image defaults to Node 24. Redeploy after changing it."
  - question: "Does Netlify run npm ci or npm install?"
    answer: "Netlify runs npm install unless your repository contains a yarn.lock, pnpm-lock.yaml, or bun.lockb file, in which case it uses that package manager instead. Several popular tutorials claim Netlify uses npm ci by default; the dependency management docs say npm install. The practical difference is that npm install can reconcile and rewrite your lockfile instead of failing on it, so a mismatch shows up as a weird build error rather than an obvious dependency error."
  - question: "How do I retry a failed Netlify build with a clean cache?"
    answer: "Go to Deploys, open the options on your latest deploy, and choose Clear cache and deploy site. Netlify caches dependencies, not build output, and a cached dependency set can keep satisfying the installer even after you change package.json. Clearing the cache is worth doing whenever a failure survives a fix that should have worked."
---

My Netlify deploy log ended like this:

```
9:34:12 PM: Build ready to start
9:34:15 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2
```

The first time it happened, I did what the top Stack Overflow answer said and set `CI` to `false` in my environment variables. Same failure, same exit code. Then I cleared the cache. Same failure. The actual error turned out to be about fourteen lines above the exit code, and it had nothing to do with CI.

Here's the thing about this message: **the number is not the error.** Netlify's own support guide says as much about its near-identical cousin, `Build script exited with Error 1` — that it "is a SYMPTOM of some prior error from your build script." Exit code 2 works exactly the same way. It tells you your build command ended with a non-zero status. It does not tell you why.

So the whole job is finding the real error, and on Netlify there are only three things it usually is. Before that, one sanity check — a few of these symptoms get confused with each other, and the fixes don't overlap:

| What your log says | What it actually is | Where to go |
|---|---|---|
| `Build script returned non-zero exit code: 2` | Your build command failed; the real error is above it | This guide |
| `Build fails with exit status 128` | Netlify has no permission to clone your repo | Relink the repository in **Project configuration → Developer settings → Continuous deployment → Repository** |
| `Failed during stage 'building site'` on Vercel | Same symptom, different platform, different causes | [Vercel build failures](/deploy/vercel-build-failed/) |
| `Module not found` at build time | File-name casing or a file that isn't in git | [Module not found on deploy](/deploy/vercel-module-not-found-works-locally/) |
| Build succeeded, deep link 404s on refresh | Client-side routing, not a build problem | [404s on refresh](/deploy/client-side-routing-404-vercel-netlify-cloudflare/) |
| Site loads, then goes blank with a JS error | Client-side exception at runtime | [Client-side exception on deploy](/deploy/application-error-client-side-exception-vercel/) |

If you're on `exit status 128` specifically, stop here — that's a repo permissions problem, and Netlify's fix is to relink the repository, not to touch your build command.

## Read the log upward, not downward

Open the failed deploy and read the log from the point where your build command starts. The bottom of a failed Netlify log is cleanup: the same failure restated three times, the exit code, a summary. None of it is diagnostic.

The real error is the **first** thing that went wrong. Three patterns cover nearly everything:

- The line above the failure mentions a **warning** — an unused variable, an ESLint rule, a deprecation. That's cause 1.
- It mentions a **dependency, peer conflict, Node version, or `command not found`**. That's cause 2.
- It mentions a **file path or `Cannot find module`**. That's cause 3.

## 1. `CI=true` turned a warning into a hard failure

This is the most common one, and it's the reason your build works locally and dies on Netlify.

Netlify sets a `CI=true` environment variable during builds, the same convention other CI systems use. Plenty of libraries check for it and change behavior: they drop progress spinners, skip interactive prompts, and — this is the part that breaks you — **treat warnings as errors**. Create React App is the famous case; a lint warning that prints harmlessly on your laptop becomes a build-stopping failure the moment `CI` is set.

The documented fix is to prepend `CI=''` to your build command:

```bash
CI='' npm run build
```

Set it in **Project configuration → Build & deploy → Continuous deployment → Build settings → Build command**, or in `netlify.toml`:

```toml
[build]
  command = "CI='' npm run build"
  publish = "dist"
```

**Don't set `CI=false`.** This is where most of the advice online goes wrong, including answers on the highest-voted Stack Overflow thread for this error. Netlify's docs call it out explicitly: environment variable values are strings, and many libraries interpret *any* non-empty string as `true`. `CI=false` is a non-empty string. It's still true. That's why people set it, redeploy, and get the identical exit code back.

`CI=''` is an escape hatch, not a fix. If it makes your build pass, you've confirmed the failure was a warning — go fix the warning when you have ten minutes, because the same thing will bite you again on the next dependency bump.

## 2. Netlify's build image isn't the machine you built on

Two separate mismatches hide in here: the Node version and the way dependencies get installed.

**Node version.** Netlify's current build image is Ubuntu 24.04 and defaults to Node 24, with npm matched to whatever ships with that Node. But here's the detail that explains why nobody online agrees on the default: **Netlify pins each site to the Node version that was default when the site was created**, so your builds don't silently change when the image updates. A site you connected in 2024 can still be building on Node 18 while a site you created last month runs Node 24. You can see the versions your build actually used in the deploy log, which is worth checking before you copy anyone's version number.

To pin it deliberately, add a `.nvmrc` (or `.node-version`) file to your repository's base directory:

```
22
```

Both override the `NODE_VERSION` environment variable and the Netlify UI setting, in that order of precedence — a version in `.nvmrc` wins over everything else. Match whatever `node -v` says locally, then redeploy, because the change doesn't apply to builds already in flight.

**Dependency install.** Netlify runs `npm install` when your repo has no `yarn.lock`, `pnpm-lock.yaml`, or `bun.lockb`. A lot of tutorials — and a lot of AI answers — claim Netlify uses `npm ci`. Per the dependency management docs, it doesn't by default.

That difference matters more than it sounds. `npm ci` fails loudly when your lockfile and `package.json` disagree. `npm install` quietly reconciles them, which means Netlify can install a slightly different dependency tree than the one on your laptop and then fail somewhere that has nothing to do with dependencies. Commit your lockfile and run a clean install locally before you push:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

For peer-dependency conflicts, Netlify documents an `NPM_FLAGS` environment variable. Setting it to `--legacy-peer-deps` (or `--force`) passes the flag through to the install.

**One trap worth knowing about:** Netlify doesn't set `NODE_ENV` by default — it's `undefined`. If you set it to `production`, devDependencies are **not installed**. Since your build tooling (Vite, TypeScript, ESLint) usually lives in devDependencies, the build fails with a `command not found` or a cryptic crash, and nothing in the log points at `NODE_ENV`. If you set that variable while following some optimization guide, unset it.

Finally: Netlify caches dependencies, not build output, and a cached set can keep satisfying the installer even after you change `package.json`. When a fix should have worked and didn't, retry with **Clear cache and deploy site**.

## 3. Your repository doesn't contain what your laptop has

The last category is the one that makes people insist Netlify is broken.

**File-name casing.** Netlify builds on a case-sensitive Linux filesystem; macOS and Windows mostly aren't. `import Header from './components/header'` resolves fine on your Mac whether the file is `Header.jsx` or `header.jsx`, and fails on Netlify. The docs add a detail that costs people an hour: renaming the file and committing **doesn't fix it**, because git on a case-insensitive filesystem sees no change. You need `git mv`:

```bash
git mv src/components/header.jsx src/components/Header.jsx
```

(or `git rm` the old name and re-add the file.)

**Files you never committed.** A new file that exists locally and is imported by a committed file builds fine on your machine and fails on Netlify, which never received it. This one is easy to confirm — stash everything uncommitted, then build:

```bash
git stash -u
npm run build
git stash pop
```

If the build fails with the stash applied, you've found it: something you're importing isn't in git.

And the related antipattern, straight from Netlify's debugging guide: don't commit `node_modules` or pre-built files into your publish directory. The build system expects to generate the site from source every time.

## How to verify it's actually fixed

Don't redeploy and hope — you'll burn a few minutes per attempt and learn nothing. Reproduce Netlify's conditions locally first:

```bash
CI=true npm run build
```

If that fails on your laptop with the same error, it's the CI warning issue and you can iterate in seconds instead of waiting on deploys. If it passes, the gap is environmental, so test from a clean clone — Netlify builds from a `git clone`, not from your working directory:

```bash
git clone <your-repo> /tmp/fresh-clone
cd /tmp/fresh-clone && npm install && npm run build
```

For anything with Netlify plugins or framework integrations, the CLI gets you closer than a local build does: `netlify build` runs the real build pipeline on your machine, and `netlify deploy --build` will build and push from your repo root.

Then redeploy, clearing the cache if the fix involved dependencies.

## A pre-flight that catches most of this

Before the next push:

```bash
git stash -u           # hide anything uncommitted
CI=true npm run build  # build the way Netlify builds
git stash pop
```

Two commands, and it reproduces the two failures that account for most exit code 2 deploys. It's the same check I suggest in the [first-deploy guide](/deploy/deploy-first-app-vercel/) — it exists because I skipped it and spent those twenty minutes reading a log from the bottom.

## Next steps

Once the deploy is green, the two things people hit next are both environment-shaped. If a variable you set in the UI comes back `undefined` at build time, that's a different failure with its own causes — here's the Vercel version of [environment variables not reaching the build](/deploy/vercel-environment-variables/), and the [Cloudflare Pages version](/deploy/cloudflare-pages-environment-variables-not-working/) if that's where the project lives. And if you're picking a host rather than debugging one, [Vercel, Netlify, and Cloudflare Pages fail differently](/deploy/vercel-vs-netlify-vs-cloudflare-pages/) — build behavior is one of the places the difference actually shows up. After that it's a domain: [pointing one at your deployment](/deploy/vercel-custom-domain-setup/).
