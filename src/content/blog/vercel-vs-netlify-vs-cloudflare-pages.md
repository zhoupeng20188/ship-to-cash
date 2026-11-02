---
title: "Vercel vs Netlify vs Cloudflare Pages: Deployment Checklist"
description: "Compare hosting by output type, runtime compatibility, commercial terms, and billing. Includes a migration checklist for static Astro sites."
pubDate: 2026-08-04
updatedDate: 2026-11-02
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-vercel-vs-netlify-vs-cloudflare-pages.jpg
faq:
  - question: "Is a free Vercel Hobby project suitable for commercial use?"
    answer: "The Hobby documentation limits it to personal, non-commercial use. Check an eligible plan before launching a commercial project."
  - question: "Can every app move between these hosts unchanged?"
    answer: "No. Static files are portable, but server adapters, runtime APIs, secrets, storage, redirects, and functions may need changes."
  - question: "Should I compare only bandwidth allowances?"
    answer: "No. Include builds, requests, runtime work, storage, commercial terms, and any add-ons in the comparison."
---

Choose a host by what your app produces: static files, server-rendered pages, functions, or a mixture. A static Astro site and a Next.js app with server actions do not have the same hosting requirements.

This is a documentation-based comparison and a deployment checklist, not a benchmark of speed or reliability. Plan terms and account allowances can change; check the provider's current pages before committing a commercial project.

## Classify the output first

Run your build locally. A directory of HTML, CSS, JavaScript, and images can use static hosting. An app that needs server rendering, database credentials at request time, or payment webhooks also needs a compatible runtime.

ShipToCash is an example of the first case: its `astro.config.mjs` has no server adapter, and its `build` script runs `astro build`. Its guides generate static routes from a content collection. You can inspect the same signals in your own repository.

| Requirement | What to check before choosing |
|---|---|
| Static pages | Build command, output directory, redirects, custom headers |
| Server-rendered routes | Supported framework adapter and runtime APIs |
| Payment webhooks | Public POST endpoint, secrets, signature verification, storage |
| Client-side SPA routes | Fallback routing without masking genuine missing assets |
| Commercial project | Plan terms as well as technical quotas |

## Vercel: check framework support and commercial terms

Vercel is a practical option to evaluate for a Next.js application. For a static project, check the detected build command and output directory before the first deployment. The [first-deploy guide](/deploy/deploy-first-app-vercel/) walks through that workflow.

The [Hobby plan documentation](https://vercel.com/docs/plans/hobby) limits that plan to personal, non-commercial use. A sales site should assess a suitable commercial plan rather than assuming that low traffic makes the free tier eligible. Plan suitability and technical capacity are separate questions.

If the build runs but fails, start with the [build diagnostic table](/deploy/vercel-build-failed/). If a push produces no deployment entry, use the [Git trigger checks](/deploy/vercel-git-push-not-triggering-deploy/) instead.

## Netlify: check the billing model on your account

Use [Netlify's current pricing page](https://www.netlify.com/pricing/) and your account dashboard. Do not reuse an old table of monthly build minutes and bandwidth as if it described every current account. Also inspect function usage, requests, and any add-ons the project enables.

For a static app, confirm the publish directory. For an SPA, configure fallback routing deliberately. A build exit code alone does not identify the failure; [the Netlify error guide](/deploy/netlify-build-failed-exit-code-2/) explains how to find the earlier error.

## Cloudflare Pages: distinguish assets from Functions

Cloudflare Pages can publish a static build directory and run Pages Functions for request-time logic. Their limits and runtime behavior differ. Use the [Pages limits documentation](https://developers.cloudflare.com/pages/platform/limits/) for builds and assets, and check function limits separately when adding backend behavior.

A build-time environment variable does not automatically become a secret available to a function. Before moving payment code, review [Pages environment variables and bindings](/deploy/cloudflare-pages-environment-variables-not-working/). Also verify that any Node APIs used by an integration work in the target runtime.

## Compare a concrete workload

Write down expected production deploys, preview deploys, asset size, requests, function calls, and any database or storage charges. Distinguish included allowances from paid overages and hard limits. Record the plan name and date beside any numbers you use.

Avoid choosing on the phrase “unlimited bandwidth” alone. File-size, build, function, and acceptable-use constraints can still matter. A static documentation site may have negligible runtime cost while a small authenticated application spends most of its budget on functions and storage.

## Rehearse a move before changing DNS

Deploy the same commit to the candidate host using a preview URL. Check direct navigation, refreshes, missing routes, images, response headers, environment values, and any server endpoints. Keep private values out of client bundles.

Then [connect the custom domain](/deploy/vercel-custom-domain-setup/) using the records the chosen host supplies. Keep email records intact and keep the old deployment available until the new one is verified. Static files usually move easily; functions, provider-specific APIs, and stored data require a separate migration plan.
