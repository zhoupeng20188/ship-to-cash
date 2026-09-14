---
title: "Cloudflare Pages Environment Variables Not Working (5 Fixes)"
description: "Variable set in Cloudflare Pages but your build still reads undefined? Five ranked causes, including the one where secrets simply don't exist at build time."
pubDate: 2026-09-14
category: deploy
difficulty: intermediate
author: "Peng Zhou"
image: /og-cloudflare-pages-environment-variables-not-working.jpg
faq:
  - question: "Why does my Cloudflare Pages build say a variable is undefined when I can see it in the dashboard?"
    answer: "Because the dashboard list and the build are two different things. The dashboard shows what will be injected into the next deployment, while the build you're reading ran with whatever was configured when it started. Cloudflare Pages adds an extra wrinkle: encrypted variables (Secrets) are only exposed to Pages Functions at runtime, so a build step that reads them gets nothing. Check which type the variable is, then redeploy."
  - question: "What is the difference between a variable and a secret in Cloudflare Pages?"
    answer: "A plaintext variable is stored as text and is available at both build time and runtime. A secret is encrypted, cannot be read back from the dashboard after you save it, and Cloudflare's docs say secrets can only be accessed programmatically on context.env — which means inside a Pages Function at runtime, not inside your build command. If a build step needs the value, store it as a plaintext variable."
  - question: "Do I need to redeploy after changing an environment variable on Cloudflare Pages?"
    answer: "Yes, always. Deployments are frozen snapshots, so a change has no effect on the deployment that's already live — it applies to the next build. Click Retry deployment on the latest deployment or push a new commit, then confirm the new build actually reads the new value."
  - question: "Why can't my static site read environment variables in the browser?"
    answer: "A purely static site has no server runtime, so there's nothing to inject a value into at request time. Every value has to be baked into the files during the build. Anything you want in the browser must use your framework's public prefix — PUBLIC_ in Astro, VITE_ in Vite, NEXT_PUBLIC_ in Next.js. Variables without that prefix are unavailable on the client, and putting a real secret behind that prefix exposes it to anyone who opens DevTools."
  - question: "Where is the Environment variables section in the Cloudflare dashboard now?"
    answer: "Cloudflare's own documentation is inconsistent about this. The build configuration page still says Settings > Environment variables, while the Pages Functions bindings page says Settings > Variables and Secrets > Add. Depending on when your project was created and which page you land on, you'll see one or the other. Both paths lead to the same setting, so if you can't find one, look for the other."
  - question: "Do .env files work on Cloudflare Pages?"
    answer: "Not the way you'd expect. Your committed .env file is not read by the Pages build unless your framework loads it, and it should never hold production secrets anyway. For local development Cloudflare reads .dev.vars or .env next to your Wrangler config, but you must choose one — if a .dev.vars file exists, values in .env are ignored locally. Add both patterns to .gitignore."
---

A reader emailed me two screenshots last month. The first was her Cloudflare Pages build log, with a red `Error: PUBLIC_SUPABASE_URL is not defined` near the bottom. The second was the dashboard tab behind it, where that exact variable sat in the list, spelled correctly, value intact.

Both screenshots were true. That's what makes this the most expensive kind of deployment bug: **there's no error to chase, because nothing failed. The value just wasn't there when the build looked for it.**

The Vercel version of this is common enough that I wrote [a whole guide to it](/deploy/vercel-environment-variables/). Cloudflare Pages looks similar and behaves differently in ways that matter — if you've carried Vercel habits over, this is where they break.

## First, work out which failure you actually have

"Variable not working" covers four different mistakes with four different fixes. Find your symptom before changing anything.

| What you see | Where the value got lost | Go here |
|---|---|---|
| Build log shows `undefined` for a variable you can see in the dashboard | The build never received it | Keep reading |
| Works in a Function via `context.env.X`, `undefined` in your page code | Stored as a Secret, which has no build-time channel | Cause 2 |
| Works locally, `undefined` in the browser on a static site | Static sites have no runtime to inject into | Cause 3 |
| Same variable works on Vercel but not on Cloudflare | Platform scoping rules differ | [The Vercel guide](/deploy/vercel-environment-variables/) |
| The build fails outright instead of returning undefined | Build command or output directory | [Vercel build failed](/deploy/vercel-build-failed/) |
| Page renders then crashes with a JS error | A value missing at runtime, not at build | [Client-side exception](/deploy/application-error-client-side-exception-vercel/) |

If the build succeeded, the page renders, and a `fetch` is being blocked, that's a different problem again — see my [CORS walkthrough](/deploy/cors-error-vercel/).

## Why Cloudflare Pages behaves differently from Vercel

One structural fact explains most of the confusion. On Cloudflare Pages, **a variable is a binding attached to a Pages Function.** The [bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/) says an environment variable is "an injected value that can be accessed by your Functions," stored as plain text, set "for both your production and preview environments at runtime and build-time."

Notice what that sentence implies. Variables are injected at **runtime** (into Functions) *and* at **build-time** (into your build command). Two separate delivery channels, and your code has to be looking in the right one.

Secrets are the exception, and it's the part almost nobody writes about. The same page states secrets "can only be accessed programmatically on `context.env`" — a Functions API. Your build command doesn't have a `context.env`; it's just `npm run build` running in a container. So a secret is a runtime-only value.

## Cause 1: You changed the variable and didn't redeploy

Start here, because it's the most common and the cheapest to rule out.

Deployments are frozen snapshots. Adding or editing a variable changes what the **next** build receives; the deployment already serving your site keeps the values it was built with. So after any change: open **Deployments**, find the latest production deployment, and click **Retry deployment**.

Don't just refresh the URL and hope. I've lost an evening to that — refreshing a page, re-reading the dashboard, certain the name matched. The name did match. The deployment was three days old.

## Cause 2: You stored it as a Secret, and secrets don't exist at build time

This is the Cloudflare-specific trap, and it produces exactly the two-screenshot contradiction above: visibly present, still undefined.

When you add a value you pick a type:

- **Text / plaintext** — stored as text, visible in the dashboard, available to the build command *and* to Functions at runtime.
- **Secret / Encrypt** — encrypted, unreadable after saving, and per the docs only accessible programmatically on `context.env`, meaning inside a Function.

Now think about what a static-ish site does. Astro, Vite, Next in static export — all read environment variables **during the build** to generate the files they ship. The build is where the value gets used, and the build cannot read a secret.

```
BUILD      → looks for PUBLIC_SUPABASE_URL → Secret not exposed here → undefined
                                             (it only exists on context.env)
RUNTIME    → context.env.SUPABASE_URL      → works fine
```

The fix is counterintuitive if you treat every key as sensitive: **if the build has to read it, store it as a plaintext variable.** Encryption buys you nothing here, because the value gets baked into your published files anyway. That's the nature of a static site — anything the build uses is public by definition.

The framework's own rules settle whether a value should be public at all. Astro's [environment variables docs](https://docs.astro.build/en/guides/environment-variables/) are blunt: "only environment variables prefixed with `PUBLIC_` are available in client-side code." If it carries that prefix, it's public and a Secret type protects nothing. If it doesn't, it's server-side only and your build can't use it either way.

One related detail: the docs note secrets "need to be done before a deployment that uses those secrets." Adding one afterwards won't retrofit that deployment — retry it so the runtime picks it up.

## Cause 3: Your static site has no runtime at all

This one sinks in slowly.

On Vercel you might have an API route; on Cloudflare you might have a Pages Function in a `functions/` directory. The moment you have one, you have a runtime — somewhere for Cloudflare to inject values per request, and somewhere a secret is readable.

A **purely static site has no such place.** No server executes your code when someone loads the page; there's just HTML, CSS and JavaScript on a CDN. Which means every value must be written into those files **at build time**, nothing can be injected at request time, and no variable — plaintext or secret — is readable from client-side JavaScript unless the build put it there.

So in Astro this works, because `PUBLIC_` values are "statically replaced at build time" (their wording — not read at runtime, *replaced*, like find-and-replace on your source):

```js
// src/pages/index.astro — baked into the output during the build
const url = import.meta.env.PUBLIC_API_URL;
```

And this gives you `undefined` on a static site no matter what the dashboard says, because there's no runtime to read it from:

```js
// client-side script on a static site
const url = import.meta.env.API_URL; // no PUBLIC_ prefix → not available client-side
```

The rule that follows: **on a static site, the only environment variables that exist are the ones the build wrote into your files.** If you were hoping to rotate a value without rebuilding, this route won't do it — you need a Function, or a config fetched at runtime.

That has a real consequence if you're selling something. In [my Lemon Squeezy + Astro setup](/payments/lemon-squeezy-checkout-astro-static-site/), the static page renders the checkout button while a Pages Function verifies webhook signatures — the signing secret can only live in that Function. That isn't a style preference, it's the runtime boundary.

## Cause 4: The setting moved, and you're reading stale instructions

Small thing, disproportionately annoying: Cloudflare's documentation disagrees with itself about where this lives.

- The [build configuration page](https://developers.cloudflare.com/pages/configuration/build-configuration/) says **Settings** > **Environment variables**.
- The [bindings page](https://developers.cloudflare.com/pages/functions/bindings/) says **Settings** > **Variables and Secrets** > **Add**.

Both are live on developers.cloudflare.com as I write this. Depending on your project's age and which doc you landed on, you'll hunt for a menu item that isn't there. Both paths reach the same setting — if you can't find "Environment variables," look for "Variables and Secrets," and vice versa.

More importantly: **check the environment selector every time.** Variables are scoped separately for production and preview. Adding a value to Preview and then wondering why production still reads `undefined` is a genuinely common loop, and it's invisible unless you're looking at the selector.

## Two Astro traps worth knowing

If you're on Astro, two details from their docs will save you time.

**Config files can't see your `.env`.** Astro "evaluates configuration files before it loads your other files," so `import.meta.env` inside `astro.config.mjs` won't find variables that came from a `.env` file. If your config needs one, use `process.env` or Vite's `loadEnv` helper. This bites people who put a site URL or integration key in the config and can't work out why it's empty in production but fine locally.

**Secrets get validated during the build.** With Astro's typed `astro:env` schema, secrets are validated whenever anything imports from `astro:env/server` — "secrets may be validated even when they are not imported." The docs' own advice is telling: "You may need to pass dummy environment variables to satisfy this validation during the build." A missing secret can therefore fail your build in code paths you aren't even using.

## Bonus: five variables Cloudflare injects for you

Free win, and I've never seen it in a blog post about this: Pages injects system variables into every build, and you can override them.

| Variable | Value | Use it for |
|---|---|---|
| `CI` | `true` | Branch behaviour on CI vs local |
| `CF_PAGES` | `1` | Detect that you're building on Pages |
| `CF_PAGES_COMMIT_SHA` | current commit SHA | Tag releases, feed error reporting |
| `CF_PAGES_BRANCH` | current branch name | Skip debug logging on `main`, enable it on previews |
| `CF_PAGES_URL` | this deployment's URL | Build absolute links without hardcoding a domain |

`CF_PAGES_BRANCH` is the useful one if you run preview branches — enable verbose logging or point at a staging API without maintaining a second variable set. And `CF_PAGES_URL` solves the "my canonical URLs are wrong in preview" problem, a quiet SEO issue you don't notice until you read your own sitemap.

## The 60-second checklist

Run this in order; each step eliminates a whole cause.

1. **Which type?** Secret → your build can't read it. Store it as plaintext if the build needs it.
2. **Which environment?** Confirm production vs preview in the selector — they're separate.
3. **Which prefix?** Client-side values need `PUBLIC_` (Astro), `VITE_` (Vite), `NEXT_PUBLIC_` (Next.js).
4. **Build or runtime?** Static site → build only. Pages Function → runtime.
5. **Did you retry the deployment?** If not, nothing above matters.

Then verify, because "it works now" isn't proof: trigger a fresh deployment and check the build log is clean; confirm the value is in the deployed page source, not just on localhost; for runtime values, log inside the Function and read it via `wrangler pages deployment tail`.

## Where this fits

On Cloudflare the runtime/build-time split is real, secrets live on one side of it, and the dashboard quietly renamed the door. Get the type and scope right and this stops being a source of mystery bugs.

Once they're sorted, the next wall is usually routing — a deep link that 404s on refresh is a different mechanism entirely, and I've written up [the fix across Vercel, Netlify and Cloudflare Pages](/deploy/client-side-routing-404-vercel-netlify-cloudflare/). And if you're doing all this to sell something, deployment is the easy half; [getting paid without Stripe](/payments/getting-paid-without-stripe-kofi-paypal/) is where the real constraints show up.
