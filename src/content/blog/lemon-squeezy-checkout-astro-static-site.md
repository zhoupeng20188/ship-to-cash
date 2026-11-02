---
title: "Lemon Squeezy Checkout on an Astro Site (No Backend)"
description: "Add Lemon Squeezy checkout to a static Astro site with no backend: lemon.js button, Cloudflare Pages webhook, raw-body signature checks, test-mode traps."
pubDate: 2026-09-09
updatedDate: 2026-11-02
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-checkout-astro-static-site.jpg
faq:
  - question: "Do I need a backend to accept Lemon Squeezy payments?"
    answer: "No. A checkout link or a Lemon.js overlay button works on a plain static HTML page with no server at all. You only need one small server-side function if you want webhooks — and on Cloudflare Pages that's a single file in a functions/ directory, not a separate app."
  - question: "Why does my Lemon Squeezy webhook signature never match?"
    answer: "Almost always because the request body was parsed and re-serialized before you hashed it. HMAC signs the exact bytes Lemon Squeezy sent, so JSON.parse followed by JSON.stringify changes key order or whitespace and breaks the hash. On Cloudflare Pages Functions this is easy to avoid — call await request.text() and hash that string directly, since the Workers runtime has no body-parsing middleware to mangle it."
  - question: "Can I copy Lemon Squeezy's Node.js signature example into a Cloudflare Pages Function?"
    answer: "Not directly. The official example imports node:crypto and calls crypto.timingSafeEqual, neither of which exists in the Workers runtime by default. Use the Web Crypto API (crypto.subtle.importKey and crypto.subtle.sign) to build the HMAC, then compare the hex strings with your own constant-time loop."
  - question: "Why does my buy button stop working after navigating between pages?"
    answer: "Lemon.js binds click listeners once, when the script loads. If you use Astro View Transitions, the page swaps without a full reload, so buttons on the new page never get bound. Call window.LemonSqueezy.Refresh() inside an astro:page-load listener to rebind them."
  - question: "Is Lemon Squeezy the merchant of record?"
    answer: "Yes. Lemon Squeezy is the legal seller on every transaction, which means they calculate, collect, and file sales tax and VAT on your behalf. That's the main thing their 5% + 50¢ per transaction fee buys, and it's the reason a solo seller without a company can sell internationally without registering for VAT in every country."
  - question: "How do I stop test purchases from granting real access?"
    answer: "Every webhook payload carries a test_mode boolean in the attributes object. Check it before you grant anything and short-circuit with a 200 response when it's true. Lemon Squeezy also retries any non-200 response up to three more times, so returning 200 for events you're deliberately ignoring matters."
---

A static Astro page can link to hosted checkout without a backend. A webhook is needed only when your own application must react to payment events.

This guide separates the public checkout link from optional server-side fulfillment. Do not put an API key or signing secret into a static component.

## Why Lemon Squeezy is the right shape for a static site

Before the code, the reason this pairing works at all: [Lemon Squeezy is a merchant of record](/payments/merchant-of-record-vs-payment-processor/). They are legally the seller on every transaction, which means they calculate, collect, and file sales tax and VAT on your behalf across jurisdictions.

That matters enormously when your site is a folder of HTML files. Review the platform agreement for customer-tax and invoice handling, and retain the records your own business needs. Compare that with a tip-jar setup like [Ko-fi wired to PayPal](/payments/getting-paid-without-stripe-kofi-paypal/), where you are the seller of record and every one of those problems is yours.

Check the current [pricing](https://www.lemonsqueezy.com/pricing) and [supported payout countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries) before integration. Base fees may exclude surcharges, and seller approval is separate from a working buy link.

**Confirm store eligibility first.** Complete the provider’s country, identity, product, and payout checks. Do not interpret an accessible registration page as approval.

One more thing the headline rate hides: 5% + 50¢ is the floor, not the ceiling. Lemon Squeezy's own pricing page warns that some payments carry additional fees, see the official [fee breakdown](https://docs.lemonsqueezy.com/help/getting-started/fees) for the applicable surcharges. Confirm the real blended rate in your own dashboard rather than trusting any single number.

## Step 1: the button, on a page with no server

Create a product in your Lemon Squeezy dashboard, then grab its share URL. It looks like `https://yourstore.lemonsqueezy.com/checkout/custom/...` or a plain product URL. That URL is a complete, working checkout page on its own — a bare `<a href>` to it already takes money.

To open it as an overlay instead of navigating away, add Lemon.js and a CSS class:

```astro
---
// src/pages/pricing.astro
---

<html lang="en">
  <head>
    <title>Pricing</title>
    <script src="https://app.lemonsqueezy.com/js/lemon.js" defer is:inline></script>
  </head>
  <body>
    <a href="https://yourstore.lemonsqueezy.com/checkout/custom/..." class="lemonsqueezy-button">
      Buy the kit — $29
    </a>
  </body>
</html>
```

Two Astro-specific notes:

- **`is:inline` is not optional here.** Astro only processes scripts it can bundle from your `src/` folder. A script from a CDN needs `is:inline`, or Astro will try to process it and leave it out of the build entirely. This is [documented behavior](https://docs.astro.build/en/guides/client-side-scripts/), and it's the single most common reason the button silently does nothing.
- **Don't self-host `lemon.js`.** Lemon Squeezy [explicitly advises against it](https://docs.lemonsqueezy.com/guides/developer-guide/lemonjs) — you'd miss security patches on a script that handles payment flows. It's 2.3kB. Let it load from their CDN.

The class name is what does the work. On load, Lemon.js attaches listeners to every `.lemonsqueezy-button` element and turns the click into an iframe overlay.

The overlay keeps the checkout interaction on the current page; a plain hosted link avoids loading the overlay script. Keep a real checkout URL in the anchor so the link still works without JavaScript.

## Step 2: the trap that only Astro sites hit

If you use View Transitions — and if you're on Astro 3+, you probably do — the button will work on the first page you land on and then mysteriously stop working after you navigate.

The reason: Lemon.js binds its click listeners once, at load. View Transitions swap the DOM without a full page load, so the script never re-runs, and any buy button on the new page has no listener attached.

The fix is one line, using the lifecycle event Astro fires after every swap:

```html
<script is:inline>
  document.addEventListener("astro:page-load", () => {
    window.LemonSqueezy?.Refresh();
  });
</script>
```

If using client-side navigation, consult the [Lemon.js method reference](https://docs.lemonsqueezy.com/help/lemonjs/methods) and test links after a page swap. Do not assume that a listener attached on the initial load covers new content.

## Step 3: an optional webhook endpoint

The button takes the payment. If you want to *know* about the payment — grant access, send a download, update a record — you need a webhook endpoint.

On Cloudflare Pages you do not need a server for this. Create a `functions/` directory at the root of your project, and the file path becomes the route:

```
my-astro-site/
├── src/
├── functions/
│   └── api/
│       └── ls-webhook.js      →  https://yoursite.com/api/ls-webhook
└── package.json
```

Pages deploys it alongside your static build, on the same domain, with no CORS and no separate service. Register that URL under **Settings → Webhooks** in Lemon Squeezy, pick a signing secret (6–40 characters), and select only the events you actually handle.

For a first product that list is shorter than you'd expect:

- **`order_created`** — a one-off purchase completed. The only event you need to sell a download.
- **`subscription_created`** and **`subscription_updated`** — a recurring plan starts, and every change to it afterwards.
- **`subscription_payment_success`** — a renewal was actually charged, as opposed to a plan merely existing.
- **`subscription_cancelled`** and **`subscription_expired`** — when to revoke access.

The full catalogue runs to sixteen events including license keys and affiliate activity, but subscribing to events you don't handle just means more requests hitting your function and more 200s you have to remember to return.

## Step 4: verifying the signature — where everyone loses an afternoon

Lemon Squeezy signs every webhook with an HMAC-SHA256 hex digest of the request body, sent in the `X-Signature` header. You recompute it and compare. The rules are laid out in [their signing docs](https://docs.lemonsqueezy.com/help/webhooks/signing-requests), but there are two places the straightforward implementation breaks.

**The body must be the exact bytes sent.** If anything parses the JSON and re-serializes it, key order or whitespace shifts and the hash no longer matches. On Express you fix this with `express.raw()`; on Next.js you disable `bodyParser`. On Cloudflare Pages Functions you don't have to fix it at all — there's no middleware in the Workers runtime, so `await request.text()` *is* the raw body. This is the one place the static-site route is genuinely simpler than a Node server.

**The official example doesn't run on Workers.** Lemon Squeezy's snippet imports `node:crypto` and calls `crypto.timingSafeEqual`. Neither exists in the Workers runtime by default. Here's the Web Crypto version:

```js
// functions/api/ls-webhook.js
async function hmacHex(secret, body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";
  const expected = await hmacHex(env.LEMONSQUEEZY_SIGNING_SECRET, rawBody);

  if (!safeEqual(expected, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload?.meta?.event_name;

  // Test purchases must never grant real access.
  if (payload?.data?.attributes?.test_mode) {
    return new Response("ok", { status: 200 });
  }

  if (event === "order_created") {
    // Verification example only. Before fulfillment, validate paid status,
    // expected store/product and mode; persist an idempotent entitlement.
    // This example deliberately performs no fulfillment.
  }

  return new Response("ok", { status: 200 });
}
```

Two details worth internalizing:

- **Length-check before comparing.** `safeEqual` returns false on a length mismatch first, because the loop would otherwise read past the end of the shorter string. Length isn't a secret, so short-circuiting on it is fine.
- **Return 200 fast.** Per [the webhook guide](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks), any non-2xx response tells Lemon Squeezy the event failed and it will retry **up to three more times**. Do the minimum in the handler and push slow work behind `waitUntil` or into a queue.

Store the signing secret as an encrypted secret, not an environment variable: **Pages → Settings → Variables and Secrets → Add → Encrypt**. Locally, put it in a gitignored `.dev.vars` file and it shows up on `env` automatically. Cloudflare documents this under [Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/).

One thing that instruction hides: **a secret isn't a stronger variable, it's a different channel.** Secrets reach Pages Functions at runtime and nothing else. That's why the dashboard can show a value while your build log calls it undefined — [here's how to tell the four causes apart](/deploy/cloudflare-pages-environment-variables-not-working/).

And if you've done all of the above and it still doesn't work — the dashboard insists the event was sent while your function logs nothing — the problem has moved somewhere else. [Debugging a webhook that never arrives](/payments/lemon-squeezy-webhook-not-firing/) is a separate hunt, and the signature check is only two of the five causes. If your endpoint is a native Astro APIRoute on Vercel rather than a Cloudflare Pages function, the 404 you'll hit first isn't a signature problem at all — [the Astro APIRoute version of the Lemon Squeezy signature check](/payments/lemon-squeezy-webhook-signature-astro/) covers the `prerender = false` trap that causes it.

## Step 5: test mode, and the trap inside it

Turn on Test mode and you can buy your own product with test cards for free. Two things will still catch you — and if you want the full rehearsal, including firing the webhook through a tunnel on your own machine, the [Lemon Squeezy test-mode walkthrough for localhost](/payments/lemon-squeezy-test-mode-local/) covers the whole loop before you flip it off.

**Simulating renewals requires a real renewal first.** The dashboard has a "Simulate event" button, but for `subscription_payment_*` events it only works after at least one renewal has actually happened on a test subscription. Their documented workaround: create a test product with a **daily** billing interval, buy it, wait until tomorrow, and then the simulation options appear. This is not obvious, and it means subscription testing spans two days. Plan for that.

**`subscription_updated` is not good news by default.** Cancellations, failed payments, and grace-period expirations all arrive as `subscription_updated`. The status field decides:

```js
const status = payload?.data?.attributes?.status;
const ACTIVE = new Set(["active", "on_trial"]);

if (event === "subscription_created" || event === "subscription_updated") {
  if (ACTIVE.has(status)) {
    // grant access
  } else {
    // revoke: cancelled, expired, past_due, unpaid
  }
}
```

Treating every `subscription_updated` as "still paid" is how people give away product after a cancellation.

## What this setup doesn't do

It's honest about its limits, and so should you be.

- **There's no database in this example.** The webhook verifies and returns. Actually granting access means writing somewhere — Cloudflare KV or D1 if you want to stay on the platform, or just letting Lemon Squeezy email the download and skipping storage entirely. For a first product, the email option is genuinely sufficient. Once the payment lands, [sending a download link after payment with no backend](/payments/send-download-link-after-payment-no-backend/) is its own problem — the email option covers most first products. It stops covering them the one time a buyer says the email never came, and [that failure looks like a mail problem but usually isn't](/payments/buyer-didnt-receive-download-email/).
- **No license keys or seat management.** Lemon Squeezy has both, but [wiring up the License API is three endpoints](/payments/lemon-squeezy-license-key-api/) you have to call yourself.
- **No discount plumbing.** If you want a code already applied when someone lands, that's the `checkout[discount_code]` parameter — see [how to put a discount code in a Lemon Squeezy checkout link](/monetize/lemon-squeezy-black-friday-discount/). Encode the brackets, or the page silently loads at full price.
- **Merchant of record isn't a legal identity.** They handle tax; they don't make you a company. If you're crossing into real revenue, that's the point where [forming an entity stops being overkill](/payments/do-i-need-an-llc-to-sell-digital-products/).
- **The 50¢ hurts most on cheap products.** On a $29 sale you keep about $27.05 after the base fee. On a $5 sale the flat 50¢ alone takes 10% of the price, before any surcharge — so either price the small thing higher than feels natural or bundle it into something worth more. That fixed fee is one of the quieter arguments for [pricing a developer template higher](/monetize/how-to-price-a-developer-template/): at $199 the same 50¢ costs you 0.25% instead of 10%.

## What I'd do in your position

1. Create one product and paste a plain `<a href>` link to it on a real page today. Skip the overlay. Take one real payment before you optimize anything.
2. Add `lemon.js` with `is:inline`, then add the `astro:page-load` rebind if you use View Transitions — [the same View Transitions rebind also trips up Google AdSense](/monetize/google-adsense-on-astro/) if you add ads later.
3. Add the webhook function and log payloads for a day before you act on them. Reading the real JSON is worth more than any doc.
4. Only then write the access-granting logic, with the `test_mode` check and the status switch already in it.

Two files. A static site that takes money in an afternoon, with someone else doing your VAT.

Once the button works, the harder problem is [where to actually find your first buyers](/monetize/get-first-customers-developer-template/) — long-tail SEO and community answers beat a better landing page.
