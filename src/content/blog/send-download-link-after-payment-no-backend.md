---
title: "Paid Download Lab: Expiring Links, Public URLs, and Refunds"
description: "Run a private download experiment: verify bytes, reject altered links, revoke refunded access, and reproduce why redirects to public files stay exposed."
pubDate: 2026-10-10
updatedDate: 2026-11-02
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-send-download-link-after-payment-no-backend.jpg
faq:
  - question: "Is this a real payment test?"
    answer: "No. It is a recorded local HTTP and SQLite experiment with synthetic orders, non-secret teaching keys, and a 197-byte fixture ZIP."
  - question: "Does an expiring signed link prevent sharing?"
    answer: "No. The lab confirms that the same bearer link can be reused before expiry. Single-use access requires additional persistent state."
  - question: "Can a refund retract a file already downloaded?"
    answer: "No. The lab revokes subsequent server requests. It cannot remove bytes a customer has already received."
---

A download URL can expire while the file remains publicly accessible. The mistake is checking a short-lived token and then redirecting to a permanent public file: the browser learns that destination and can request it directly later.

This guide reproduces that failure using a **public canary file**, then checks a private-delivery implementation. Both are in the [separate verification repository](https://github.com/zhoupeng20188/shiptocash-verification-labs/tree/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab). The [recorded evidence](https://github.com/zhoupeng20188/shiptocash-verification-labs/blob/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab/evidence/reference-run.json) comes from a local Node server built with **Astro 7.4.4, Node adapter 11.1.9, and Node 22.23.4**. No real product, payment, buyer, or cloud bucket was used.

## Decide whether you need custom delivery

For a one-off ZIP, PDF, or template, hosted file delivery may be sufficient. [Lemon Squeezy's product documentation](https://docs.lemonsqueezy.com/help/products/adding-products) describes attaching files to products. Your [static Astro sales page](/payments/lemon-squeezy-checkout-astro-static-site/) can link to that hosted checkout without operating its delivery service.

This experiment addresses the other case: your application needs to authorize downloads from private storage. That requires server-side logic, even if the sales page is static. A browser `?success=true` flag cannot prove payment. Stripe's [fulfillment documentation](https://docs.stripe.com/checkout/fulfillment) also separates fulfillment from the customer's return to a landing page.

## Run the built application and checks

```sh
git clone https://github.com/zhoupeng20188/shiptocash-verification-labs.git
cd shiptocash-verification-labs
git checkout 6537765e7d9493673e744602e388f5cd06b7a2c9
nvm install
nvm use
cd payment-delivery-lab
npm ci
npm run verify
```

If you do not use nvm, install the Node version in `.nvmrc` another way. Verification builds the server, uses a temporary database and private directory, exercises actual HTTP routes, and writes fresh output under `runs/`.

The reference run on **November 2, 2026 at 02:23:40 UTC** passed **45 checks** across this case and the [webhook experiment](/payments/lemon-squeezy-webhook-signature-astro/). Read the [individual results](https://github.com/zhoupeng20188/shiptocash-verification-labs/blob/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab/evidence/reference-output.txt) rather than treating the count as a security certification.

## Experiment 1: an expired gate, a working public destination

The deliberately broken endpoint is disabled by default. The verifier enables it only for this experiment, and the endpoint can redirect only to a harmless public canary. It never exposes the private ZIP.

The sequence is:

1. Issue a correctly signed link with a two-second lifetime.
2. Request the broken endpoint and observe its **302** destination.
3. Save that public destination URL.
4. Wait until the **same signed link** expires.
5. Request the expired gate, then the saved destination directly.

The recorded output was:

```text
public-redirect-survives-token-expiry:
  initialRedirect: 302
  expiredGate: 410
  publicDestination: 200
  privateDataUsed: false
```

The token checker rejected the expired request correctly. The public file remained accessible because its own URL had no authorization boundary. The experiment distinguishes a broken delivery architecture from a broken HMAC calculation.

## Experiment 2: return private bytes instead of a public redirect

The working implementation stores the fixture outside Astro's public output. After validating the token, it reads the durable order state, confirms that the order remains paid for the configured product, and returns the allowed file bytes.

The [download implementation](https://github.com/zhoupeng20188/shiptocash-verification-labs/blob/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab/src/lib/downloads.mjs) uses a fixed server-side asset mapping. It does not join an arbitrary user-supplied path into a filesystem location. The database directory and signing key come from the local server environment.

For the successful download, the run recorded:

| Observation | Actual result |
|---|---|
| HTTP status | 200 |
| Content type | `application/zip` |
| Bytes | 197 |
| Redirect | None |
| Cache control | `private, no-store` |
| Direct `/private/starter-kit.zip` request | 404 |

The verifier compared the complete response bytes to the fixture and recorded their SHA-256:

```text
b571244ceadd86693a2aa7328fac4dba3b1b48a897d0bad1fc6d85926c88f63c
```

It also scanned the built client output: no private ZIP and no fixture signing keys appeared there. That observation applies to this build and these keys, not every possible way to leak a secret.

## Bind the token to the order, asset, and lifetime

The link signature covers a versioned representation of the order ID, fixed asset name, issuance time, and expiry. A separate key signs downloads; the webhook key is not reused.

The endpoint requires each query field exactly once, rejects malformed timestamps, and enforces a maximum five-minute lifetime. It authenticates the fields before accepting the time bounds.

| Request in the recorded run | Actual status |
|---|---|
| Change the order ID without resigning | 401 |
| Extend the expiry without resigning | 401 |
| Request a different asset path | 403 |
| Add a second expiry parameter | 400 |
| Empty or non-integer expiry | 400 |
| Correctly signed but expired link | 410 |
| Signed future issuance or excessive lifetime | 400 |
| Missing private object for a paid order | 503 |
| Open the download with only `?success=true` | 400 |

Expired links in most checks are created with an already-expired signed timestamp to avoid unnecessary waiting. The public-canary experiment specifically waits for its original short-lived link to expire.

## Expiry is not single-use access

The verifier requests the valid link twice and receives **200** both times. That is expected bearer-token behavior. Someone who receives the link may share it before it expires.

Single-use access would need an additional persistent consumption rule, including a decision about interrupted downloads and retries. The lab does not implement or claim that behavior. Likewise, revocation cannot remove a file already downloaded to a buyer's computer.

## Recheck entitlement after a refund

A valid token is not enough when an order has been revoked. Every download reads the current durable entitlement.

The synthetic full refund returned **200 `revoked`**. The original still-unexpired download link then returned **403**. A later signed paid snapshot did not restore access, and restarting the server preserved the revocation. The [webhook case](/payments/lemon-squeezy-webhook-signature-astro/) explains the transaction and terminal-revocation policy.

To inspect the flow manually, start `npm run demo` in one terminal. In another, run:

```sh
npm run send -- paid-order
npm run link -- 73001
```

Request the printed local link. Then run `npm run send -- refunded-order` and request that same link again. The local operator issues the link directly from the database; the example contains no public order-ID-to-download endpoint and no customer login system.

## What this case does not establish

The private store is a temporary local directory, not an R2 or S3 integration. A cloud implementation needs its own object permissions, signed-URL configuration, and tests. [R2's presigned URL documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) describes that storage-specific option.

The synthetic orders cover one product and full refunds. Buyer authentication, email delivery, partial refunds, subscriptions, distributed persistence, real provider callbacks, and production rate limits are outside the experiment. The supported server command binds only to loopback and uses intentionally non-secret teaching credentials.

For a simple file sale, provider-hosted delivery remains the shorter implementation. If a paid buyer cannot find their receipt, start with the [missing-download triage](/payments/buyer-didnt-receive-download-email/) before building a custom delivery service.
