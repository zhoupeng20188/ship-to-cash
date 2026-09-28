---
title: "Lemon Squeezy Webhook Not Firing or Invalid Signature: 5 Fixes"
description: "Lemon Squeezy says the webhook was sent but your handler never runs — or X-Signature never matches. Five causes in order, with Node, Next.js and Go fixes."
pubDate: 2026-09-28
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-webhook-not-firing.jpg
faq:
  - question: "Why does my Lemon Squeezy webhook signature never match?"
    answer: "Almost always because the bytes you hash are not the bytes Lemon Squeezy signed. Lemon Squeezy computes an HMAC-SHA256 hex digest over the exact request body, so if a body parser reads and re-serializes the JSON first — changing key order, whitespace or number formatting — the hash changes too. Read the raw body before anything touches it: express.raw() on Express, await req.text() in a Next.js App Router route handler, or bodyParser: false plus a manual stream read in Pages Router."
  - question: "Does Lemon Squeezy retry failed webhooks?"
    answer: "Yes. Any response that is not HTTP 200 counts as a failure, and the event is sent again up to three more times — four attempts in total. After the fourth failed attempt Lemon Squeezy stops retrying automatically, and you resend the event by hand from Settings » Webhooks. If you are seeing the same order_created event four times, your handler is returning something other than 200, often a 500 from an uncaught throw."
  - question: "Why does crypto.timingSafeEqual throw instead of returning false?"
    answer: "Node's timingSafeEqual requires both arguments to be Buffers of identical length and throws ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH when they are not. An X-Signature header that is missing or truncated produces a length mismatch, so the comparison throws rather than returning false, your framework turns that into a 500, and Lemon Squeezy retries. Compare lengths first and return false early, then call timingSafeEqual."
  - question: "Is request.rawBody available in Express?"
    answer: "No. rawBody is not an Express property — it exists in environments that add it, such as Firebase Cloud Functions. Lemon Squeezy's own signing example uses request.rawBody, so copying it into a plain Express app gives you undefined, and hmac.update(undefined) throws. Mount express.raw({ type: 'application/json' }) on the webhook route so req.body arrives as an untouched Buffer."
  - question: "How can I test a Lemon Squeezy webhook without waiting for a real payment?"
    answer: "Generate the signature yourself. Pipe a known JSON payload through openssl dgst -sha256 -hmac with your signing secret, then POST it to your endpoint with that value in the X-Signature header. If your handler accepts it, the hashing is right and any remaining problem is upstream. You can also resend real events from Settings » Webhooks, and in Test mode the Simulate event button fires subscription events on demand — though subscription_payment_* only appears after at least one real renewal has happened on a test subscription."
  - question: "How long can a Lemon Squeezy signing secret be?"
    answer: "Between 6 and 40 characters. The dashboard enforces this when you create the webhook, so a longer secret you generated elsewhere will be rejected at creation time rather than failing later. The secret is per webhook, not per store: if you delete and recreate an endpoint, the old secret dies with it and any deployment still holding it will fail every signature check."
---

Payments were working. That was the annoying part. I had [Lemon Squeezy checkout running on a static site](/payments/lemon-squeezy-checkout-astro-static-site/), real money was arriving, and my webhook handler had logged exactly nothing. When I finally did get a request through, `X-Signature` failed on every single one — and then the same event arrived four times in a row.

Three hours later the picture was clear. The signature check itself is four lines. What breaks is everything around it: your framework already consumed the request body, you are comparing a hex string against raw bytes, or your handler is returning the wrong status code and Lemon Squeezy is quietly retrying behind your back.

This post is for the case where the endpoint exists and doesn't work. If you are still building one on a static site, read the checkout walkthrough first — it has the full Cloudflare Workers version, which is the one runtime where this is genuinely easy.

## Which symptom is yours

Narrow it down before you change code, because the fixes are unrelated.

| What you see | Most likely | Jump to |
|---|---|---|
| Dashboard says sent, your logs show nothing | URL, routing, or the deploy never shipped the handler | Cause 5 |
| Request arrives, signature fails every time | wrong bytes, or hex-vs-bytes | Cause 1, Cause 2 |
| Signature passes, same event arrives 4× | you returned something other than 200 | Cause 4 |
| Signature fails only in production | secret not reaching the runtime | Cause 3 |
| Nothing in the dashboard at all | event not subscribed, or wrong mode | Cause 5 |

## Cause 1: you hashed different bytes than Lemon Squeezy did

Lemon Squeezy signs an HMAC-SHA256 **hex digest** of the request body and sends it in the `X-Signature` header — that much is [in their signing docs](https://docs.lemonsqueezy.com/help/webhooks/signing-requests). The hash covers the exact bytes on the wire. Anything that parses the JSON and re-serializes it — changing key order, whitespace, or how a number is written — produces different bytes and therefore a different hash.

This is why the failure looks arbitrary. The payload is identical as far as you are concerned. It is not identical as bytes.

The trap is that most web frameworks have already read the body before your handler runs:

```js
// Express — raw, on this route only
app.post(
  "/api/ls-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const rawBody = req.body; // Buffer, untouched
    // ...
  }
);
```

```js
// Next.js App Router — read text before you parse
export async function POST(req) {
  const rawBody = await req.text();
  // ... verify, then JSON.parse(rawBody)
}
```

```js
// Next.js Pages Router — disable the parser entirely
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");
  // ...
}
```

One thing worth knowing before you copy the official example: it hashes `request.rawBody`. That is not an Express property. It exists in environments that add it, such as Firebase Cloud Functions. In a plain Express app `request.rawBody` is `undefined`, and `hmac.update(undefined)` throws — which, as you will see in Cause 4, turns into a retry loop rather than a clean rejection.

## Cause 2: you compared a hex string against raw bytes

A digest is 32 bytes of binary. The `X-Signature` header is those same 32 bytes written out as 64 hexadecimal characters. Comparing them directly never matches, and no amount of checking the secret will fix it.

This is the exact bug in a [GitHub issue against the Go SDK](https://github.com/NdoleStudio/lemonsqueezy-go/issues/7): the code did `hmac.Equal([]byte(signature), digest)`, where `signature` is the header string and `digest` is `mac.Sum(nil)`. `[]byte` of a hex string is 64 characters of ASCII; the digest is 32 raw bytes. The lengths differ, so the comparison is false on every request. The asker noticed that re-indenting the test JSON changed the digest — which was a correct observation about Cause 1, sitting right next to the actual bug.

```go
signature := r.Header.Get("X-Signature")
mac := hmac.New(sha256.New, []byte(secret))
mac.Write(body) // body read with io.ReadAll(r.Body)
digest := hex.EncodeToString(mac.Sum(nil))

if !hmac.Equal([]byte(digest), []byte(signature)) {
    http.Error(w, "invalid signature", http.StatusUnauthorized)
    return
}
```

Encode both sides the same way, then compare. The same class of bug shows up in Node as a crash rather than a silent false, which is worse:

```js
const digest = crypto
  .createHmac("sha256", process.env.LS_SIGNING_SECRET)
  .update(rawBody)
  .digest("hex");

const a = Buffer.from(digest, "utf8");
const b = Buffer.from(req.get("X-Signature") ?? "", "utf8");

if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
  return res.status(401).send("invalid signature");
}
```

`crypto.timingSafeEqual` does not return false on a length mismatch — it throws `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`. A missing or malformed header is exactly a length mismatch, so you get an exception, your framework turns it into a 500, and Lemon Squeezy retries it three more times. Check length first; it is not a secret, so short-circuiting on it leaks nothing.

## Cause 3: the secret you verify with isn't the one on the webhook

Three ways this happens, in the order I would check them:

- **You recreated the endpoint.** The signing secret belongs to the webhook, not to your store. Delete and recreate it and the old secret dies; anything still deployed with it now fails everything.
- **The secret never reached the runtime.** An environment variable that is present in the dashboard and `undefined` in the function is a known failure mode on Cloudflare Pages, where [the value arrives through a different channel than build-time variables](/deploy/cloudflare-pages-environment-variables-not-working/). The same misconfiguration on Vercel is a matter of [which environment the variable was scoped to](/deploy/vercel-environment-variables/).
- **You used the API key.** The signing secret is a 6–40 character string you choose when creating the webhook. The API key is a different thing from a different screen.

Log `typeof secret` and its length once, not the value. `undefined` and the wrong string are indistinguishable from the outside, and both produce the same silent mismatch.

## Cause 4: your handler returned something other than 200

Per [the webhook guide](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks), every non-200 response counts as a failure, and Lemon Squeezy sends the event again **up to three more times**. Four attempts total, then it stops — you can resend by hand from Settings » Webhooks, which is also how you replay an event you fixed code for.

Two ways to trip this by accident:

1. **Throwing instead of responding.** The official snippet ends with `throw new Error('Invalid signature.')`. In Express that becomes a 500, so genuinely forged requests get retried three times. Return 401 and stop.
2. **Doing slow work inside the handler.** A database write or an email send that outlasts the platform's limit turns a successful verification into a timeout. Verify, persist the payload, return 200, and process afterwards.

The retry behaviour is also your diagnostic: four identical `order_created` events in your logs is not Lemon Squeezy being redundant, it is Lemon Squeezy telling you your handler failed.

## What the retries force on you: idempotency

Four attempts per event means your handler will see the same `order_created` more than once, and that is by design — a timeout on attempt one does not mean attempt two didn't reach your database. Lemon Squeezy's own recommendation is to store incoming events, at least temporarily, which also gives you the payload to debug with later.

The minimum viable version is a seen-set keyed on the object ID:

```js
const id = payload?.data?.id;

// KV, Redis, or a table with a unique index — anything that rejects a second write.
if (await seen.has(`ls:${id}`)) {
  return new Response("ok", { status: 200 });
}

// ...grant access, send the download, write the record...

await seen.add(`ls:${id}`, { ttlSeconds: 86400 });
return new Response("ok", { status: 200 });
```

Note which events you are deduplicating. `order_created` should fire once per order. `subscription_payment_success` fires every billing period by design, so keying on the subscription ID would silently drop every renewal after the first — key on the invoice ID instead. The same distinction is worth thinking about [before you pick between one-time and recurring pricing](/monetize/how-to-price-a-developer-template/), because it changes which events your access logic has to survive.

Then handle the events that take things away. `order_refunded` and `subscription_expired` are the ones people wire up last and regret: without them, your handler grants access and never revokes it.

## Cause 5: it never fired at all

If the dashboard has no delivery records, none of the above applies.

- **The event isn't subscribed.** Each webhook carries an explicit event list. Nothing arrives for events you didn't tick — including `license_key_created`, which is the one you need if you are [issuing and validating license keys](/payments/lemon-squeezy-license-key-api/).
- **You're testing against localhost.** Lemon Squeezy cannot reach `http://localhost:3000`. Put a tunnel in front of it, or deploy first and test there.
- **Your code isn't deployed yet.** A webhook fix that never shipped looks identical to one that didn't work — [the same trap as a git push that didn't trigger a deploy](/deploy/vercel-git-push-not-triggering-deploy/).
- **You're looking at the wrong mode.** Test-mode purchases send test-mode events, and the payload carries `test_mode` in its attributes. Check it and return 200 early, or your test purchases will grant real access.

## How to verify it's actually fixed

Don't wait for a real payment. Build the signature yourself and see whether your handler accepts it:

```bash
SECRET='your-signing-secret'
BODY='{"meta":{"event_name":"order_created"},"data":{"id":"1"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

curl -X POST http://localhost:8788/api/ls-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -d "$BODY"
```

If that returns 200, the hashing is correct and any remaining problem is upstream of your code. If it returns 401, print both values: the digest should be 64 hex characters, and so should the header. A length difference means Cause 2. Identical lengths that don't match means Cause 1 or Cause 3.

Then confirm the real path once: resend an event from the dashboard and watch for exactly one delivery.

## If you'd rather not run an endpoint at all

A webhook is only needed when your code has to react to a payment. Lemon Squeezy will email the buyer their download and handle the invoice without one, and for a first product that is a legitimate endpoint-free setup — [the same conclusion I reached with Ko-fi and PayPal](/payments/getting-paid-without-stripe-kofi-paypal/). Being a [merchant of record](/payments/merchant-of-record-vs-payment-processor/) means they own the tax side too, so the only thing you're giving up is automatic access control.

Add the endpoint when you have something to grant. Until then, ship the product.
