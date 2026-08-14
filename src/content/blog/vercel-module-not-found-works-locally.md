---
title: "Module Not Found on Vercel (Works Locally): 5 Causes & Fixes"
description: "Module not found on Vercel but works locally? The build server isn't your laptop. The 5 real causes — case mismatches, Git traps, missing deps — and fixes."
pubDate: 2026-08-13
category: deploy
difficulty: beginner
author: "Peng Zhou"
ogIcon: none
faq:
  - question: "Why does my app build locally but fail on Vercel with module not found?"
    answer: "Your laptop (macOS or Windows) uses a case-insensitive filesystem, so Header.tsx and header.tsx resolve to the same file. Vercel builds on a case-sensitive Linux filesystem, where those are two different paths. Most works-locally-fails-on-Vercel errors come down to this difference."
  - question: "Does git config core.ignorecase false fix the error?"
    answer: "Not by itself. It only makes Git report case-only renames going forward — it won't retroactively fix a rename Git already missed. For a file that's already wrong in your commit history, do a two-step rename through a temporary name (git mv header.tsx temp.tsx, then git mv temp.tsx Header.tsx) and commit both steps together."
  - question: "The error names an npm package, not a local file. What now?"
    answer: "That package isn't reaching Vercel's build. Check that it's listed in package.json (not just installed on your machine), and that both package.json and your lockfile are committed and pushed. A package installed globally or in the wrong folder never makes it to the build server."
  - question: "Should I clear the build cache?"
    answer: "It's worth trying after you've ruled out the other causes. Redeploy from the Deployments tab with Use existing Build Cache unchecked — a corrupted cache occasionally holds on to old paths. But clearing the cache won't fix a genuine casing or dependency problem, so check those first."
---

The error feels personal: `Module not found: Can't resolve './components/Header'`. You stare at your screen. The file is *right there*. It built on your machine ten minutes ago. You push again. Same error.

This is the most common first deployment error on Vercel, and the mental model that fixes it is one sentence: **the build server is not your laptop.** Your machine is forgiving in ways the Linux build environment isn't. Once you know what to look for, this error takes five minutes to fix — here are the five causes, ordered by how often they're actually the culprit.

First, though, read the error properly, because it tells you which cause you have. Open your project's **Deployments** tab, click the failed deployment, and scroll the build log to the red line:

- `Can't resolve './...'` or `'@/...'` — a **local file path** problem (causes 1–3)
- `Can't resolve 'some-package'` — an **npm dependency** problem (causes 4–5)

Vercel's build logs are genuinely the clearest of the big three hosts here — one of the things I noted when I [compared Vercel, Netlify, and Cloudflare Pages](/deploy/vercel-vs-netlify-vs-cloudflare-pages/). The answer is always in that red line.

## Cause 1: Case mismatch (the usual suspect)

Your Mac or Windows PC uses a **case-insensitive** filesystem: `Header.tsx` and `header.tsx` are the same file. Vercel builds on **case-sensitive Linux**, where those are two different paths. So `import Header from './components/header'` works on your machine and fails in the cloud.

The sneaky version: you renamed a file and only changed the casing (`header.tsx` → `Header.tsx`). Git on a case-insensitive filesystem often **doesn't register that as a change** — your editor shows the new name, but your commit history still has the old one, and that's what Vercel builds from.

The fix is a two-step rename through a temporary name:

```bash
git mv header.tsx temp.tsx
git mv temp.tsx Header.tsx
git commit -m "Fix filename casing"
```

One step doesn't work — the OS sees both names as the same path and Git shrugs. Also run `git config core.ignorecase false` so Git reports case-only renames from now on, but know that the setting alone won't repair renames Git already missed. That's why the two-step dance matters.

## Cause 2: A relative path or alias your IDE resolves but Vercel can't

Your editor is helpful to a fault. With path aliases configured (`@/components/Header`), it happily resolves imports that are subtly wrong — one `../` short, or an alias that only exists in your editor's config and not in the build config.

Count the `../` segments against the file's real folder depth. And if you use `@/` aliases, confirm they're defined where the *bundler* reads them (`tsconfig.json` / `jsconfig.json` `paths`, committed to the repo), not just in your editor. Vercel builds from a clean checkout — anything that only exists in your local IDE setup doesn't exist there.

## Cause 3: The file never made it to GitHub

Embarrassing, universal, quickly checked: the file exists on your disk but was never committed — or it's covered by a line in `.gitignore` (people gitignore `lib/`, `.env`, entire `utils` folders and forget).

Open your repo on GitHub in the browser and navigate to the exact path from the error. Is the file there? If not, `git status` locally will tell you why. This takes thirty seconds and saves you from debugging causes 1–2 when the file simply isn't in the repo.

## Cause 4: The package isn't in package.json

If the error names a package (`Can't resolve 'date-fns'`), that package never reached the build server. The usual story: you installed it globally, or ran `npm install` in the wrong directory, or installed it with a flag that skipped saving. Locally it resolves because it exists *somewhere* on your machine; Vercel only installs what's written in `package.json`.

From the project root:

```bash
npm install some-package
```

Then commit **both** `package.json` and your lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) and push. The lockfile is not optional luggage — it's how Vercel knows exactly what to install.

## Cause 5: A stale build cache

Rare, but real: Vercel caches your build to make deploys faster, and occasionally that cache holds onto an old state — a path that existed two commits ago, a half-installed dependency tree.

The fix is a clean rebuild. In **Deployments**, click **⋯ → Redeploy** on the latest deployment, and in the dialog **uncheck "Use existing Build Cache"**. (I wrote about the [redeploy flow and what that checkbox does](/deploy/deploy-first-app-vercel/) — unchecked means a full clean build.)

Do this one *last*. Clearing the cache won't fix a genuine casing or dependency problem — the error will come right back, just slower.

## The 30-second triage

Next time this error hits:

1. Read the red line. Local path or package name?
2. Local path → check the file **exists on GitHub** (cause 3), then check **casing** (cause 1), then **alias/`../` depth** (cause 2)
3. Package name → check it's **in `package.json` and the lockfile is committed** (cause 4), then **redeploy without cache** (cause 5)

That order resolves essentially every instance of this error. "Works on my machine" stops being a mystery once you remember the machine doing the building isn't yours.

## Next steps

Error cleared, deploy green. If you hit a *different* failure next — build succeeds but the app misbehaves, or environment variables come up undefined — those are their own rabbit holes with their own fixes, and this series covers them. The foundation everything builds on is the [first deploy walkthrough](/deploy/deploy-first-app-vercel/) if you landed here from a search and want the full picture.
