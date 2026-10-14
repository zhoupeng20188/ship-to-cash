---
title: "Lemon Squeezy Test Mode: Catch Checkout Bugs Before Going Live"
description: "Run your Lemon Squeezy checkout and webhooks in test mode on localhost with test cards and a tunnel. Catch bugs before your first real charge, not after."
pubDate: 2026-10-14
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-test-mode-local.jpg
faq:
  - question: "Can I test a Lemon Squeezy checkout without charging a real card?"
    answer: "Yes. Flip Test mode on in the dashboard and every purchase you make — including your own — runs against test products with test cards like 4242 4242 4242 4242. No money moves, and the order still fires a real webhook (carrying test_mode: true) so you can exercise your whole handler locally."
  - question: "Do Lemon Squeezy test products carry over to the live store?"
    answer: "No. Test mode is a separate catalogue. Products, variants, and checkout URLs you create there stay in test mode, and the live store has its own IDs. This is the single most common launch bug: you wire your code to a test product ID, flip to live, and nothing matches. Keep test and live IDs in separate environment variables and swap on NODE_ENV."
  - question: "How do I test a Lemon Squeezy webhook from localhost?"
    answer: "Lemon Squeezy can't reach http://localhost, so you put a tunnel in front of your dev server — ngrok (ngrok http 8788) or Cloudflare tunnel (cloudflared tunnel --url http://localhost:8788). Point the webhook URL at the public tunnel address, do a test purchase, and watch the event land on your machine. The signature check is identical to production; only the data is fake."
  - question: "Will my webhook handler grant real access during a test purchase?"
    answer: "Only if you forget to check test_mode. Every test-mode payload carries test_mode: true in its attributes. Short-circuit with a 200 response the moment you see it, before any access-granting code runs. If you skip that check, a $0 test order will unlock your product just like a paid one."
  - question: "What can't Lemon Squeezy test mode verify?"
    answer: "Two things: real payouts (no actual money moves, so you can't confirm the bank side or payout timing) and tax amounts in your customer's jurisdiction beyond what the sandbox computes. Everything about your code path — checkout, webhook, signature, access logic — is fully testable before you take a cent."
---

I shipped my first paid product on a Friday night and didn't sleep until I'd made a real $29 purchase with my own card to prove it worked. It did. Then I realized I had no idea whether the webhook would behave the same on a live order as it had on the three test orders I'd clicked through that afternoon — because I'd never actually built the live side the way I'd built the test side.

That gap is exactly what [Lemon Squeezy's test mode](https://www.lemonsqueezy.com/pricing) is for, and most people treat it like a toy. It isn't. Test mode is a complete, separate copy of your store where you can run the entire purchase flow — checkout, webhook, signature, access grant — against fake money on your own laptop. If you use it right, your launch day is a non-event instead of a fire drill.

This is the walkthrough I wish I'd had: how to rehearse the whole thing on localhost, including the webhook, before a single real card is charged.

## What test mode is — and the part that surprises everyone

Flip the toggle at the bottom-left of the Lemon Squeezy dashboard and the store you're looking at becomes a sandbox. Purchases are free, orders are clearly marked, and any webhook you fire carries `test_mode: true` in its payload. You can build your [checkout on a static site](/payments/lemon-squeezy-checkout-astro-static-site/) against it exactly as you would against production.

The surprise is that test mode is a *separate catalogue*, not a flag on your real one. [Indie tooling write-ups](https://www.indietools.app/blog/lemon-squeezy-test-live-catalogue-review) and Lemon Squeezy's own docs are explicit about this: products, variants, and checkout URLs created in test mode stay in test mode. They do not copy over when you go live. Your live store has its own product IDs, its own variant IDs, and its own checkout URLs.

That single fact causes more broken launches than anything else. You build against test product `123`, flip to live, and suddenly your code is pointing at an ID that doesn't exist in the production catalogue. We'll fix that properly in Step 3, because it's the difference between "tested" and "tested for the right thing."

Two more things test mode gives you that are easy to miss:

- **A separate API key.** If you call the API, test mode uses a test API key that only talks to test data. A live key can't see test orders and vice versa. If you're only using checkout links and webhooks, this doesn't affect you — but if you ever copy a key between modes, nothing will line up.
- **Genuine webhooks.** Test purchases fire real webhook events at your endpoint, with the same shape and the same signature as live ones. The only difference is the `test_mode` flag. That means your signature verification and access logic get exercised for real — you just aren't taking money.

## Step 1: create a test product and grab test cards

With test mode on, create a product the way you normally would. Copy its checkout URL — it's a fully working checkout that accepts test cards instead of real ones. Drop it onto your localhost page using the same [static-site checkout setup](/payments/lemon-squeezy-checkout-astro-static-site/) you'd use in production.

Now buy it with a test card. These are the standard ones Lemon Squeezy lists in test mode:

| Card number | Brand | What it simulates |
|---|---|---|
| `4242 4242 4242 4242` | Visa | A successful payment |
| `5555 5555 5555 4444` | Mastercard | A successful payment |
| `3782 822463 10005` | Amex | A successful payment |
| `4000 0000 0000 9995` | Visa | **Insufficient funds** — the failure path |
| `4000 0000 0000 0069` | Visa | **Expired card** |
| `4000 0027 6000 3184` | Visa | **3D Secure** challenge |

The first three let you confirm a happy-path purchase. The last three are the ones that actually earn their place in a test plan, because they're how you prove your code *rejects* a bad order instead of happily granting access. If you only ever test with `4242`, you've verified that money-in works — not that money-out-fails-safe.

When the `4242` purchase goes through, check your Lemon Squeezy dashboard: a test order appears, marked as such, and no card is charged. That's your baseline.

## Step 2: fire the webhook from localhost with a tunnel

This is the step people skip, and it's the one most likely to break on launch day. [A webhook that never arrives](/payments/lemon-squeezy-webhook-not-firing/) is a different problem from a webhook you've never tested at all — and the second one is entirely avoidable.

Lemon Squeezy can't POST to `http://localhost:3000`. It needs a public URL. So you put a tunnel in front of your dev server. Two options, both free to start:

```bash
# Option A: ngrok
# https://ngrok.com/
ngrok http 8788
# → gives you https://abcd-1234.ngrok-free.dev

# Option B: Cloudflare tunnel
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/
cloudflared tunnel --url http://localhost:8788
# → gives you a https://*.trycloudflare.com URL
```

Point your Lemon Squeezy webhook at the tunnel URL, set a **test** signing secret, and do a `4242` purchase. Watch the event land on your laptop. Your handler should verify the signature (the [webhook signing rules](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks) are identical in test and live) and then hit the `test_mode` short-circuit:

```js
// functions/api/ls-webhook.js
const payload = JSON.parse(rawBody);
const event = payload?.meta?.event_name;

// Test purchases must never grant real access.
if (payload?.data?.attributes?.test_mode) {
  return new Response("ok", { status: 200 });
}

if (event === "order_created") {
  // grant access, send the download, write the record
}
```

Then run the failure path. Buy with `4000 0000 0000 9995` (insufficient funds). The checkout should reject the card and — crucially — **no webhook should arrive**, because no order was created. If your local handler logs an `order_created` for that attempt, your access code is firing on the wrong signal. That's a launch-day refund waiting to happen, and you just caught it on a Tuesday for free.

## Step 3: stop the test/live ID mismatch before it ships

Remember the separate-catalogue trap from the top. Here's the concrete fix. Never hardcode a product or variant ID that came from test mode into code you'll deploy. Keep both worlds in environment variables and switch on the environment:

```bash
# .env (local, test mode)
LEMONSQUEEZY_CHECKOUT_URL=https://yourstore.lemonsqueezy.com/checkout/custom/test-abc123
LEMONSQUEEZY_PRODUCT_ID=123
LEMONSQUEEZY_WEBHOOK_SECRET=test-secret

# .env.production (live)
LEMONSQUEEZY_CHECKOUT_URL=https://yourstore.lemonsqueezy.com/checkout/custom/live-def456
LEMONSQUEEZY_PRODUCT_ID=789
LEMONSQUEEZY_WEBHOOK_SECRET=live-secret
```

On Cloudflare Pages, the test values live in a gitignored `.dev.vars` file and the live values go in the dashboard under **Settings → Variables and Secrets**. The [difference between those two channels](/deploy/cloudflare-pages-environment-variables-not-working/) is its own footgun — a value present in the dashboard but undefined in your function is the classic "works locally, breaks in prod" bug, and test mode is where you'll first see it if your IDs are wrong.

The rule of thumb: if an ID came from clicking around in test mode, it dies the moment you flip the toggle. Only IDs you created in the live store belong in production code.

## Step 4: exercise the license flow while you're here

If your product uses [license keys](/payments/lemon-squeezy-license-key-api/), test mode is where you prove the activate/validate/deactivate cycle works before a customer hits it. Create a test product with keys enabled, activate it with `4242`, save the `instance.id` the response returns *once*, then deactivate and confirm the usage count drops. The ownership check — confirming a key from a different test product gets rejected with 403 — is the test most people skip, and it's the only one that proves your validation actually validates.

Do this in test mode, not after launch, because the License API has no API key and `access-control-allow-origin: *`. A bug there is exploitable the moment it's live.

One more subscription note: if you sell recurring plans, test-mode renewals need a real renewal to exist first. The dashboard's "Simulate event" button only offers `subscription_payment_*` after at least one actual renewal has happened on a test subscription — and the fastest way to get one is a test product with a **daily** billing interval, which means your renewal test spans two days. Plan for that instead of discovering it the night before launch.

## What test mode will not catch

Be honest about the edges so you don't over-trust a green test:

- **No real payouts.** Test mode moves no money, so you can't confirm the bank side — payout timing, currency conversion, the wire to your account. That part is verified the first time a real order pays out, not before.
- **Tax is computed but not authoritative.** Test mode runs tax logic, but the amounts your customers see in their jurisdiction at launch can differ from what the sandbox showed. Treat tax totals as "probably right," not "confirmed."
- **Email deliverability.** Lemon Squeezy sends test-order emails to the address you enter. If your [download link fires from the webhook](/payments/send-download-link-after-payment-no-backend/), test that the email actually arrives and the link works — sandbox email hops are not production email hops.

Everything about *your* code path — checkout, webhook, signature, access grant, license cycle — is fully rehearsable. The parts you can't test are the parts that were never your responsibility to begin with, because [Lemon Squeezy is the merchant of record](/payments/merchant-of-record-vs-payment-processor/).

## Your pre-launch checklist

Before you flip test mode off:

1. One `4242` purchase completes and the webhook lands locally with a passing signature.
2. One `4000 0000 0000 9995` purchase fails and grants nothing.
3. `test_mode: true` short-circuits before any access code runs.
4. All product/variant IDs in your deployed code are live IDs, not test IDs.
5. If you use keys, activate → save `instance.id` → deactivate works, and a foreign key is rejected.

Run that list and launch day is boring — which is the highest compliment you can pay a payment integration.

## What I'd do next

Set up the tunnel once and keep it running while you build; testing a purchase should be a five-second loop, not a redeploy. Then the real question stops being "does it work" and becomes "what should I charge for it" — [pricing a developer template](/monetize/how-to-price-a-developer-template/) is where most of the upside actually lives, and it's a better use of your evening than refreshing a dashboard.
