---
title: "Stripe Payment Links on a Static Astro Site"
description: "Put a Stripe Payment Link or buy button on a static Astro site with no backend, and know exactly when an adapter and a webhook become necessary."
pubDate: 2026-11-04
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-stripe-payment-link-astro-static-site.jpg
faq:
  - question: "Do I need a backend to accept Stripe payments on an Astro site?"
    answer: "No. A Payment Link is a complete Stripe-hosted checkout page, so a plain anchor tag on a prerendered Astro page can take a payment with no server at all. Stripe's embeddable buy button is also static: one script tag and one web component. You only need a server route when you create Checkout Sessions yourself or when your own application has to react to a payment event through a webhook."
  - question: "Why do older Astro payment tutorials set output: 'hybrid'?"
    answer: "Astro 5 removed that option. The hybrid and static output modes were merged, and the new default static mode already allows individual routes to opt out of prerendering. Add an adapter for your host, then put export const prerender = false on the single endpoint that needs to run on demand. Every other page stays a static HTML file. Astro 5 removed that option, so a config copied from an older tutorial is no longer current — use the upgrade guide as the source of truth rather than assuming the old setting still works."
  - question: "Can I deliver the product from my success page instead of a webhook?"
    answer: "No. Stripe's fulfillment guide says you cannot rely on triggering fulfillment only from the checkout landing page, because customers are not guaranteed to visit it — someone can pay and lose their connection before the page loads. Use the success page for the buyer's convenience and a webhook for the actual grant of access. Listen for checkout.session.completed and, if you accept bank debits or vouchers, checkout.session.async_payment_succeeded."
  - question: "Why does my Stripe buy button not render when I open the page locally?"
    answer: "Stripe's buy button documentation states that rendering the button requires a website domain. Opening an Astro file directly with a file:// URL will not work. Serve the built page over a local HTTP server on localhost, and check that https://js.stripe.com is allowed by both your script-src and frame-src Content Security Policy directives."
  - question: "What is the difference between client_reference_id and UTM parameters on a Payment Link?"
    answer: "The client_reference_id query parameter (or client-reference-id attribute on the buy button) attaches an internal identifier of up to 200 characters to the Checkout Session and arrives in the checkout.session.completed webhook. The five utm_* parameters are for campaign tracking and appear on your redirect URL after payment. UTM values are limited to 150 characters and require the redirect confirmation behaviour; neither channel should carry secrets."
  - question: "Does Stripe handle sales tax and VAT like a merchant of record does?"
    answer: "No. Stripe is the payment processor, so you remain the seller on the receipt and keep the tax registration, invoicing and refund-policy work. Stripe Tax is a separate add-on that calculates and reports tax where you are registered to collect it; it does not make Stripe the legal seller. If that distinction is the reason you chose your provider, check what a merchant of record actually assumes before you build the checkout."
---

A static Astro site can take a Stripe payment with no server route at all. Stripe hosts checkout; your site needs a link. A server is needed when you build the cart, and a webhook when your own application must react to the payment — two separate decisions that most guides collapse into one.

What that link cannot do is decide who is allowed to read a page. [Where taking a payment stops and restricting a page begins](/payments/static-site-paywall-no-server/) is a different boundary, and it needs code that runs on each request.

This guide separates three routes — a plain Payment Link, an embeddable buy button, and a Checkout Session behind an Astro endpoint — and where each stops. Code samples are illustrative shapes from current official documentation, not a record of a live store or a tested production integration. Field names, fees and dashboard labels change; verify them against the linked docs and your own dashboard. Never place a secret API key in a static component.

First confirm [whether Stripe can accept a seller in your country](/payments/stripe-not-available-in-my-country/). A working link is no help if the account cannot be opened.

## Three routes, and which one you need

| Route | What runs on your site | When it is enough | What you take on |
|---|---|---|---|
| Payment Link | One anchor tag | One product, one price, one-off or subscription | Nothing server-side |
| Embeddable buy button | One CDN script + a web component | Same, but branded to your page | CSP entries and a publishable key |
| Checkout Session | An on-demand Astro endpoint + an adapter | A cart, dynamic prices, server-owned price IDs | A runtime, two endpoints, key storage |

[Astro's official e-commerce guide](https://docs.astro.build/en/guides/ecommerce/) covers Lemon Squeezy, Paddle and Snipcart overlays; Stripe appears only as a community resource. That is why nearly every tutorial for this pairing starts by installing an adapter. For a single digital product, [Stripe's no-code feature list](https://docs.stripe.com/payment-links) makes that unnecessary: a Payment Link is a Stripe-hosted page with no integration effort.

## Route 1: a plain Payment Link, zero JavaScript

Create a product and a Payment Link in the Dashboard. The result is a URL of the form `https://buy.stripe.com/test_...` in test mode. That URL is a complete checkout page, so this is the entire integration:

```astro
---
// src/pages/pricing.astro — fully prerendered
const checkoutUrl = "https://buy.stripe.com/test_...";
---

<a href={checkoutUrl}>Buy the starter kit — $29</a>
```

No script, no adapter, no environment variable. The link survives View Transitions, works with JavaScript disabled, and keeps the price text in your own HTML.

The hosted page gives you over 40 payment methods, rendering in over 30 languages matched to the browser's language setting, local currency with Adaptive Pricing, automatic receipts, no-code refunds, promotion codes, a purchase-count limit, and subscription links. [The overview](https://docs.stripe.com/payment-links) also makes customisation limits explicit: 20 preset fonts, three border-radius options, and custom logo, background and button colours. If exact typography matters, pick another route.

Two parameters behave differently. `client_reference_id` in the query string attaches your own order or cart ID to the Checkout Session — alphanumeric, dashes and underscores, up to 200 characters — and [Stripe's URL parameters reference](https://docs.stripe.com/payment-links/url-parameters) says it arrives in the `checkout.session.completed` webhook. Invalid values are silently dropped, so a typo costs you reconciliation, not the sale.

The five UTM parameters (`utm_source`, `utm_content`, `utm_medium`, `utm_term`, `utm_campaign`) are attribution only. [The tracking guide](https://docs.stripe.com/payment-links/url-parameters) caps them at 150 characters and requires the `redirect` confirmation behaviour for the values to reach your redirect URL. Payment Links are public URLs, so put no customer data or secrets in either channel.

## Route 2: the embeddable buy button, still no server

Stripe generates a buy button from an existing Payment Link. The embed is one `async` script and one web component:

```astro
---
// src/pages/pricing.astro — still fully prerendered
---

<script
  is:inline
  async
  src="https://js.stripe.com/v3/buy-button.js"
></script>

<stripe-buy-button
  buy-button-id="btn_test_..."
  publishable-key="pk_test_..."
  client-reference-id="starter-kit-pricing-page"
></stripe-buy-button>
```

`is:inline` tells Astro to leave the CDN script alone; [Astro's script handling guide](https://docs.astro.build/en/guides/client-side-scripts/) covers how it treats scripts it can bundle from `src/`. Check the built HTML actually contains the tag rather than reasoning about which attribute opts out of processing.

From [the buy button embed guide](https://docs.stripe.com/payment-links/buy-button):

- The embed uses your **publishable** key (`pk_test_...`), which is safe in HTML. A secret key never belongs on this route. Revoke the publishable key and you must regenerate the embed code.
- `client-reference-id` is the hyphenated twin of the URL parameter, with the same 200-character limit; `customer-email` prefills an address the buyer cannot then edit.
- Rendering requires a website domain: the [buy button guide](https://docs.stripe.com/payment-links/buy-button) says a `file://` URL will not render it, so serve the built page over `localhost`. Stripe lists `script-src` and `frame-src` for `https://js.stripe.com` among its CSP requirements. The docs do not describe how a missing directive surfaces in the browser, so check your own console rather than assuming a particular symptom.

Once the custom element is defined, later DOM additions can be upgraded, so a View Transitions swap generally needs no explicit rebind. Verify that by navigating between two pages in your build; if it fails, load the script once in a layout that survives navigation.

## Route 3: Checkout Sessions, where a server is required

You need this when the price cannot live in a public URL: a cart, quantity changes, per-customer pricing, or any case where accepting a price ID from the browser would let a buyer swap in a cheaper one.

[Astro's on-demand rendering guide](https://docs.astro.build/en/guides/on-demand-rendering/): the site is prerendered by default, add an adapter, then `export const prerender = false` on the individual endpoint. Everything else stays static. It also says to keep the default `static` mode until most pages genuinely need on-demand rendering — the answer to tutorials that flip the whole site to SSR for one checkout route.

This is a shape, not a production handler: add error handling, rate limiting and an SDK version check.

```ts
// src/pages/api/checkout.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

// Price IDs stay on the server. Never accept one from the request body.
const PRICES: Record<string, string> = {
  "starter-kit": "price_...",
};

export const POST: APIRoute = async ({ request, url }) => {
  const form = await request.formData();
  const price = PRICES[String(form.get("product"))];
  if (!price) return new Response("Unknown product", { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${url.origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/pricing`,
  });

  if (!session.url) return new Response("Checkout unavailable", { status: 502 });

  return new Response(null, {
    status: 303,
    headers: { Location: session.url },
  });
};
```

Install the adapter for your host (`npx astro add node`, `netlify`, `vercel` or `cloudflare`); [the adapter requirement](https://docs.astro.build/en/guides/on-demand-rendering/) applies regardless of output mode. Do **not** copy `output: 'hybrid'` from older write-ups: Astro 5 merged hybrid into the default static mode and [removed the option](https://docs.astro.build/en/guides/upgrade-to/v5/#removed-hybrid-rendering-mode). Treat the upgrade guide as the source of truth for the current config, and try the change in a scratch project before editing a working one.

The secret key must reach only this endpoint. Use `import.meta.env.STRIPE_SECRET_KEY` or Astro 5's `astro:env/server` (which marks it as a secret not inlined into the build), not both. [Why a secret can be visible in the dashboard and still undefined at runtime](/deploy/cloudflare-pages-environment-variables-not-working/) is the thread to pull when the first request returns an authentication error.

## The success page is not a receipt

[Stripe's fulfillment guide](https://docs.stripe.com/checkout/fulfillment) is blunt: you cannot rely on triggering fulfillment only from the checkout landing page, because customers are not guaranteed to visit it — someone can pay and lose their connection before it loads. Webhooks are required. The redirect is for the buyer; the webhook is the proof.

For a Dashboard Payment Link, set **After Payment → Don't show confirmation page** with a URL containing `{CHECKOUT_SESSION_ID}`; for a Checkout Session, put the same placeholder in `success_url`. [The official fulfillment checklist](https://docs.stripe.com/checkout/fulfillment) then retrieves that Session with `line_items` expanded, checks `payment_status`, fulfils, and records it.

Four consequences:

1. **More than one event.** `checkout.session.completed` covers instant methods; bank debits and vouchers take 2–14 days and arrive as `checkout.session.async_payment_succeeded` or `async_payment_failed`. [The fulfillment guide](https://docs.stripe.com/checkout/fulfillment) names all three.
2. **Idempotent grants.** Stripe says the same Session ID can hit your function more than once, possibly concurrently. Key the grant on the Session ID, not one row per event.
3. **Checkout waits up to 10 seconds** for your webhook to respond before redirecting, when both `success_url` and a webhook endpoint are configured. A slow handler becomes a slow checkout.
4. **The endpoint needs `prerender = false` too.** Signature verification needs the raw body (`await request.text()`), not parsed JSON. [The prerender = false trap inside an Astro APIRoute](/payments/lemon-squeezy-webhook-signature-astro/) is the same failure with a different signature scheme.

[The fulfillment guide's test procedure](https://docs.stripe.com/checkout/fulfillment) uses `stripe listen --forward-to localhost:4242/webhook` and the test card `4242 4242 4242 4242`. Watch for the forwarded event before writing access-granting code, then resend that event from the Dashboard and confirm nothing is granted twice.

Delivery is separate: [getting the file to the buyer after payment](/payments/send-download-link-after-payment-no-backend/) is its own design, and [a paid buyer whose receipt email never arrived](/payments/buyer-didnt-receive-download-email/) is the 2am version. Stripe's automatic receipts are payment receipts, not your product.

## What Stripe does not take off your plate

Stripe is a processor, not a merchant of record. You remain the seller on the receipt, so tax registration, invoicing, refund policy and delivery plumbing stay yours. [The difference between a processor and a merchant of record](/payments/merchant-of-record-vs-payment-processor/) matters the first time a buyer asks for a VAT invoice. Stripe Tax is a separate add-on that calculates and reports where you are registered; it does not make Stripe the legal seller.

### Read your own pricing page

[Stripe's pricing page](https://stripe.com/pricing) is geolocated. The copy served for this article showed **3.4% + $0.50 per successful domestic card charge**, plus 0.5% for international cards and 2% for currency conversion. Tutorials quote other numbers. Both can be right for different account countries, which is why neither belongs in your spreadsheet — open the page from your own region. Stripe Tax is listed at 0.5% per transaction where registered, and Billing at 0.7% of Billing volume. Checkout is included with Payments; there is no monthly fee for Payment Links.

That leaves the fixed per-transaction amount, which is why [settling the price before you build checkout](/monetize/how-to-price-a-developer-template/) comes first: a flat fee hurts a $5 product far more than a $49 one.

## How to verify the whole thing

- Grep the built HTML for `js.stripe.com` and your buy button ID. If the script is missing, no Dashboard setting will render the button.
- Open `/thanks` with no `session_id`. Nothing should be granted. If it is, fulfillment is on the success page and you have a giveaway bug.
- Complete one test purchase, check the payments overview, and confirm `client_reference_id` arrived on the webhook.
- Resend the same event; confirm a single grant.
- Grep `dist/` for `sk_test_` and `sk_live_`. A secret in a prerendered page is a secret in every CDN cache.

## What I'd do in your position

1. Paste one plain Payment Link into a real Astro page and take one test payment. Skip the button and the adapter.
2. Add a `client_reference_id`; set `redirect` confirmation if you want UTM attribution.
3. Only if the hosted page looks wrong, switch to the buy button and check CSP plus the built HTML.
4. Only for a cart or server-owned prices, add the adapter and the single `prerender = false` endpoint. Keep the rest static.
5. Add the webhook, log payloads for a day, then write the idempotent grant.

The next decision is not technical. It is whether the product is priced high enough that the fixed fee stops mattering, and then [where the first buyers come from](/monetize/get-first-customers-developer-template/). A checkout flow with no traffic is a very well-built form.
