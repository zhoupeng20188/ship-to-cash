---
title: "Verify Lemon Squeezy Webhooks in an Astro APIRoute"
description: "Lemon Squeezy signs every webhook with HMAC-SHA256. Verify the signature inside an Astro APIRoute on Vercel — raw body, prerender=false, constant-time compare."
pubDate: 2026-10-16
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-webhook-signature-astro.jpg
faq:
  - question: "Why does my Astro Lemon Squeezy webhook return 404?"
    answer: "Because Astro prerenders every route to a static file at build time by default. A webhook endpoint has to run on the server when the request arrives, so without export const prerender = false the route is frozen into an HTML page and there is nothing left to execute — Lemon Squeezy hits a dead file and the delivery fails. Set prerender = false on the endpoint (and use output: 'hybrid' with an SSR adapter) and the 404 disappears."
  - question: "Can I use Node's crypto.timingSafeEqual in an Astro APIRoute?"
    answer: "Yes, and you should. When you deploy an Astro APIRoute with the Vercel or Node adapter the handler runs in a real Node runtime, so node:crypto is available. That is different from a Cloudflare Pages function, where the Workers runtime has no node:crypto and you have to rebuild the HMAC with the Web Crypto API. On Astro SSR you can import crypto from 'node:crypto' and call timingSafeEqual directly."
  - question: "How do I read the raw webhook body in Astro?"
    answer: "Inside an APIRoute the request is a standard web Request, so await request.text() gives you the exact bytes Lemon Squeezy sent. Hash that string directly. Do not call request.json() and then JSON.stringify it back, because parsing and re-serializing changes key order and whitespace, and the HMAC is computed over the original bytes — so the hash will never match."
  - question: "Where do I put the Lemon Squeezy signing secret in Astro?"
    answer: "In an environment variable without the PUBLIC_ prefix, read through import.meta.env.LEMONSQUEEZY_WEBHOOK_SECRET. Anything prefixed PUBLIC_ gets inlined into the client bundle, which would leak your secret. The prefix-less form stays server-side. If the signature verifies locally but fails after deploy, the value is not reaching the runtime — on Vercel check which environment the variable was scoped to, and on Cloudflare Pages it arrives through a different channel than build-time variables."
  - question: "Does Lemon Squeezy retry webhooks that return 401?"
    answer: "Yes. Any non-200 response counts as a failure, and Lemon Squeezy resends the event up to three more times — four attempts total. So returning 401 on a bad signature is correct, but you must also return 200 quickly for events you accept, or a slow database write will time out and trigger the same retry loop. Verify, persist the payload, return 200, and do the slow work afterwards."
  - question: "How do I test the signature without a real payment?"
    answer: "Generate the HMAC yourself. Pipe a known JSON payload through openssl dgst -sha256 -hmac with your signing secret, then POST it to the endpoint with that value in the X-Signature header. If the handler returns 200, your hashing is correct and any remaining problem is upstream. You can also resend a real event from Settings » Webhooks, or fire one through a tunnel in Test mode on your own machine."
---

I had the Lemon Squeezy checkout working on my Astro site, and the Cloudflare Pages version of the webhook verified fine. Then I rebuilt the same project to deploy on Vercel with the Astro adapter, copied the handler over, and every delivery logged as "failed." The endpoint wasn't rejecting the signature — it was returning a 404, because Astro had prerendered my webhook route into a static HTML file at build time and there was nothing left to run.

That 404 is the first of three traps that only show up when you verify a Lemon Squeezy webhook **inside an Astro APIRoute** rather than in a Cloudflare Pages function or a framework like Express. The other two are that Node's `crypto` is suddenly available (which makes the code simpler, not harder), and that the signing secret lives in `import.meta.env` instead of a runtime binding. None of these are covered by [the Cloudflare Pages functions version](/payments/lemon-squeezy-checkout-astro-static-site/) or by [the framework-agnostic "why won't it fire" guide](/payments/lemon-squeezy-webhook-not-firing/), so this is the walkthrough for the Astro-native path.

## Two ways to receive a Lemon Squeezy webhook from Astro

Before the code, the fork in the road, because it decides which article you should be reading.

- **Cloudflare Pages `functions/` directory.** Your site is a static build, and the webhook is a separate file in `functions/api/ls-webhook.js` that ships alongside it. It runs in the Workers runtime, which has no `node:crypto`, so the HMAC is built with the Web Crypto API. That's the earlier article.
- **A native Astro `APIRoute`.** You add an SSR adapter (Vercel or Node), write `src/pages/api/ls-webhook.ts`, and the handler runs in a real Node process. This is what you want when the rest of your app already uses Astro endpoints, or when you're on Vercel's free tier and don't want a second runtime.

This article is the second path. If you're on Cloudflare Pages, stop here and read the other one — the code below will not run in a Worker.

## Step 1: make the route run on the server

This is the trap that cost me an evening. Astro prerenders every route to a static file at build time unless you tell it otherwise. A webhook endpoint has to execute when the request arrives, so it must be an on-demand server route.

Two things make that happen. First, the adapter and the `hybrid` output mode in `astro.config.mjs`:

```ts
// astro.config.mjs
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "hybrid",
  adapter: vercel(),
});
```

`hybrid` keeps your marketing pages static (fast, cheap) while letting specific routes run on the server. Then, on the endpoint itself, you opt out of prerendering:

Why `hybrid` and not `output: 'server'`? Server mode pushes your entire site to SSR, which throws away the static-speed advantage of a marketing site and can raise your function bill. Hybrid keeps the pages you already ship static and only spins up a function for the routes you flag with `prerender = false`. On Vercel that endpoint becomes a Node function in your configured region; it cold-starts like any serverless function, so the "return 200 fast" rule in Step 5 is not only about retries — a slow first response also makes your webhook look flaky to Lemon Squeezy during traffic spikes.

```ts
// src/pages/api/ls-webhook.ts
import type { APIRoute } from "astro";

export const prerender = false; // run on the server, do NOT freeze into a static file
```

Without that one line the route is built into `dist/api/ls-webhook.html` and Lemon Squeezy hits a dead file — the 404 I started with. The `prerender = false` export is the single most important part of this whole setup, and it has no equivalent in the Cloudflare functions world because those files are never prerendered in the first place.

## Step 2: read the raw body

Lemon Squeezy computes an HMAC-SHA256 hex digest over the **exact bytes** it sends and puts it in the `X-Signature` header. The hash covers the wire bytes, so anything that parses the JSON and re-serializes it — shifting key order or whitespace — produces different bytes and a different hash.

Inside an `APIRoute`, the request is a standard web `Request`, so the raw body is one call away:

```ts
export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text(); // the exact bytes, untouched
  // ...
};
```

Read `request.text()` and hash that string. Do not call `request.json()` and then `JSON.stringify()` it back, because that round-trip changes the bytes and the signature will never match. This is the same rule as every other Lemon Squeezy integration; the Astro-specific part is just that `request.text()` is the right call on an `APIRoute`, and there is no body-parsing middleware in front of it to mangle the bytes the way Express does.

## Step 3: compute the HMAC with Node crypto

Here is where the Astro-native path is easier than Cloudflare Pages. Because the handler runs in Node, `node:crypto` is available, so you can build the HMAC and do a constant-time compare with the standard library — no Web Crypto dance:

```ts
import crypto from "node:crypto";

const SECRET = import.meta.env.LEMONSQUEEZY_WEBHOOK_SECRET;

const digest = crypto
  .createHmac("sha256", SECRET)
  .update(rawBody)
  .digest("hex");
```

`digest("hex")` gives you the 64-character string that `X-Signature` carries. That's the whole hashing step. Compare it against the header.

## Step 4: compare in constant time

A digest is 32 bytes; the header is those bytes written as 64 hex characters. Comparing them is a string compare, but do it the safe way: check the length first, then use `timingSafeEqual`.

```ts
const a = Buffer.from(digest, "utf8");
const b = Buffer.from(signature, "utf8");

if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
  return new Response("Invalid signature", { status: 401 });
}
```

The length check is not optional. `timingSafeEqual` throws — it does not return false — when the two buffers differ in length, and a missing or truncated header is exactly a length mismatch. Without the guard, a malformed request turns into a 500, and Lemon Squeezy treats that as a failed delivery and retries it. Length isn't a secret, so short-circuiting on it leaks nothing. Return 401 on a real mismatch and move on.

## Step 5: return 200, then think about the edge cases

Once the signature checks out, parse the body and act on the event — but keep the handler fast:

```ts
const payload = JSON.parse(rawBody);
const event = payload?.meta?.event_name;

// Test purchases must never grant real access.
if (payload?.data?.attributes?.test_mode) {
  return new Response("ok", { status: 200 });
}

if (event === "order_created") {
  // grant access, email the download, write the record
}

return new Response("ok", { status: 200 });
```

Two things matter here. First, **return 200 before doing slow work.** Per [the webhook guide](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks), any non-200 response counts as a failure and Lemon Squeezy resends the event up to three more times. A database write or email send that outlasts the platform's timeout turns a successful verification into a retry loop. Verify, persist the payload, return 200, process after.

Second, **deduplicate.** Because of those retries, your handler will see the same `order_created` more than once. Store the event id (or the order id) in a seen-set — KV, Redis, a table with a unique index — and return 200 early if you've already handled it. Key on the right id: `subscription_payment_success` fires every billing period by design, so keying on the subscription id would silently drop every renewal after the first. This is the same idempotency logic you need [before you pick between one-time and recurring pricing](/monetize/how-to-price-a-developer-template/), because it changes which events your access logic has to survive.

If you're granting access by [emailing a download link once the payment clears](/payments/send-download-link-after-payment-no-backend/), or [issuing and validating license keys](/payments/lemon-squeezy-license-key-api/) from the event, those are the next steps after the signature passes.

## The signing secret lives in import.meta.env

On Cloudflare Pages the secret is a runtime binding; on Astro SSR it's a plain environment variable, read through `import.meta.env`:

```ts
const SECRET = import.meta.env.LEMONSQUEEZY_WEBHOOK_SECRET;
```

One rule that is easy to violate: **do not prefix it `PUBLIC_`.** Any variable named `PUBLIC_` gets inlined into the client bundle at build time, which would ship your signing secret to every visitor's browser. The prefix-less form stays server-side and is only visible inside the endpoint. Set it in your host's dashboard — on Vercel under Environment Variables, scoped to Production (or all environments).

If the signature verifies in your terminal but fails after deploy, the value isn't reaching the runtime. The usual cause on Vercel is [which environment the variable was scoped to](/deploy/vercel-environment-variables/), and on Cloudflare Pages it's a [different channel entirely](/deploy/cloudflare-pages-environment-variables-not-working/) — a secret is not a stronger variable, it's a separate path that nothing else sees. Log `typeof SECRET` and its length once (never the value) to tell the two apart.

## How to verify it's actually fixed

Don't wait for a real purchase. Build the signature yourself and see whether your handler accepts it:

```bash
SECRET='your-signing-secret'
BODY='{"meta":{"event_name":"order_created"},"data":{"id":"1"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

curl -X POST https://your-site.vercel.app/api/ls-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -d "$BODY"
```

A 200 means the hashing is correct and any remaining problem is upstream of your code. A 401 means print both values: the digest should be 64 hex characters and so should the header. Identical lengths that don't match means you hashed the wrong bytes or the wrong secret. Then confirm the real path once — [fire an event through a tunnel in Test mode](/payments/lemon-squeezy-test-mode-local/) and watch for exactly one delivery, not four.

You can run this locally against `astro dev` without deploying first. The APIRoute runs on the dev server and honors `prerender = false`, so point the openssl test at `http://localhost:4321/api/ls-webhook` and you'll catch a wrong secret or a bad `import.meta.env` read before you ship. The one thing `dev` won't catch is the prerender trap, because the dev server never prerenders — that bug only appears after `astro build`, which is exactly why the 404 tends to surface on your first real deploy rather than on your laptop.

## What this setup gives you

Lemon Squeezy is the merchant of record, so they own the tax side and you only react to a verified event. With an Astro APIRoute on Vercel you get that reaction in about forty lines, running in the same Node runtime as the rest of your app, with no second service to keep alive. The three Astro-specific things — `prerender = false`, `node:crypto`, and `import.meta.env` — are the difference between this working and a 404 that looks like a signature bug. Get those right and the signature check itself is the easy part.
