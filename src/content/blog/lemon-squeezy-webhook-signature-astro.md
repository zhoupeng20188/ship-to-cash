---
title: "Astro Webhook Verification Lab: Signatures, Retries, and Refunds"
description: "Run a pinned Astro webhook lab: reject changed bodies, deduplicate deliveries, persist grants, and prevent paid replays from restoring refunded access."
pubDate: 2026-10-16
updatedDate: 2026-11-02
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-webhook-signature-astro.jpg
faq:
  - question: "Was a real Lemon Squeezy payment used?"
    answer: "No. The experiment sends locally signed synthetic order fixtures to a built Astro Node server. It does not contact the provider."
  - question: "Does a valid signature prove the right product was paid for?"
    answer: "No. Validate the store, product, mode, event, payment state, and your own entitlement rules separately."
  - question: "Does the experiment guarantee exactly-once email delivery?"
    answer: "No. It verifies atomic order state and event recording in a local SQLite database. It includes no external email integration."
---

A webhook can have a valid signature and still be the wrong event to grant access. It might refer to a different product, carry test-mode data, or arrive again after a refund. This walkthrough uses a runnable local project to check those boundaries through the actual built HTTP endpoint.

The [source repository](https://github.com/zhoupeng20188/shiptocash-verification-labs/tree/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab) contains the application, synthetic order fixtures, verification script, and [recorded run](https://github.com/zhoupeng20188/shiptocash-verification-labs/blob/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab/evidence/reference-run.json). The linked revision fixes the source used for the results below. The experiment uses **Node 22.23.4, Astro 7.4.4, and the Node adapter 11.1.9**. It does not make a payment or contact Lemon Squeezy.

## Reproduce the recorded experiment

Clone the separate lab repository and check out the recorded revision:

```sh
git clone https://github.com/zhoupeng20188/shiptocash-verification-labs.git
cd shiptocash-verification-labs
git checkout 6537765e7d9493673e744602e388f5cd06b7a2c9
```

Install the Node version specified by `.nvmrc`. With nvm:

```sh
nvm install
nvm use
cd payment-delivery-lab
npm ci
npm run verify
```

The verifier builds the application, starts its standalone Node server on an ephemeral loopback port, sends real HTTP requests, and reads SQLite through a separate connection. It writes fresh results to `runs/latest.json` and `runs/latest.txt`, then stops its child processes and deletes its temporary database and files.

The reference run completed on **November 2, 2026 at 02:23:40 UTC** with **45 checks passing** across the webhook and download experiments. That total includes [private-file delivery](/payments/send-download-link-after-payment-no-backend/); it is not 45 checks of signatures alone. The [plain-text output](https://github.com/zhoupeng20188/shiptocash-verification-labs/blob/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab/evidence/reference-output.txt) records each observation.

## First make the route executable

The lab keeps its homepage static and makes the webhook an on-demand endpoint:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  server: { host: '127.0.0.1' },
});
```

```js
// src/pages/api/webhook.js
import { receiveWebhook } from '../../lib/webhook.mjs';
export const prerender = false;
export const POST = ({ request }) => receiveWebhook(request);
```

This is a Node deployment. It is not a Cloudflare Workers runtime test. A Vercel deployment also needs its appropriate adapter and deployment verification; a working local server does not prove that a hosted route is configured.

Older Astro examples may show `output: 'hybrid'`. [Astro 5 removed that option](https://docs.astro.build/en/guides/upgrade-to/v5/#removed-hybrid-rendering-mode); static output can opt individual routes into on-demand execution when an adapter is configured. Consult the [Node adapter documentation](https://docs.astro.build/en/guides/integrations-guide/node/) for its deployment modes.

## Authenticate the exact body before decoding it

[Lemon Squeezy documents HMAC-SHA256 signing](https://docs.lemonsqueezy.com/help/webhooks/signing-requests) over the request body. The lab reads bytes, computes the expected digest with the webhook key, and rejects a malformed or mismatched `X-Signature` before parsing JSON.

```js
const raw = Buffer.from(await request.arrayBuffer());
if (raw.length > 65536) {
  return json(413, { error: 'body_too_large' });
}
if (!matchesHex(hmac(cfg.webhookKey, raw), request.headers.get('x-signature'))) {
  return json(401, { error: 'invalid_signature' });
}
```

These lines come from [`src/lib/webhook.mjs`](https://github.com/zhoupeng20188/shiptocash-verification-labs/blob/6537765e7d9493673e744602e388f5cd06b7a2c9/payment-delivery-lab/src/lib/webhook.mjs); the helper requires a 64-character lowercase hexadecimal signature and uses Node's `timingSafeEqual`. The body-size check happens after reading the body. It is a fixture validation rule, not a network-level defense against large requests.

The `changed-raw-body` check signs one serialization, appends a space, and sends the changed body with the original signature. The actual result was **401**, with the database unchanged. The JSON meaning need not change for the signature to fail. Do not parse and reserialize before verifying.

## A valid signature is only the first gate

The [order object reference](https://docs.lemonsqueezy.com/api/orders/the-order-object) describes the provider fields. The fixture intentionally supports one product and full refunds, using artificial order IDs and a minimal order shape.

Before granting access, it checks the expected store and product, an explicit boolean `test_mode`, the supported event type, paid status, refund state, and a valid update timestamp. Test-mode events are acknowledged but never create production entitlements. Unsupported event types are also acknowledged without a grant.

| Scenario from the recorded run | HTTP result | Database observation |
|---|---|---|
| Correct synthetic paid order | 200, `granted` | One paid order and one event |
| Wrong signing key or altered body | 401 | Unchanged |
| Wrong store or product | 422 | Unchanged |
| Unpaid order | 422 | Unchanged |
| Missing or non-boolean mode | 422 | Unchanged |
| Test-mode order | 200, `ignored_test_mode` | Zero orders and zero events |
| Unsupported event | 200, `ignored_unsupported_event` | No event persisted |

A `test_mode: false` value in a local fixture does not make it a real production order. Every event in this experiment is generated locally with a published teaching key.

## Commit the grant and duplicate marker together

An in-memory set would forget deliveries when the process restarts. The lab instead stores orders and event fingerprints in SQLite. One immediate transaction applies the order state and records the fingerprint before returning success.

Identical raw payloads produce the same SHA-256 fingerprint. A different serialization can have a different fingerprint, so deduplication cannot rely on that hash alone: the unique `(store, order ID)` key and state-transition rules also prevent a second entitlement.

The observed duplicate cases were:

```text
Exact retry:             200 duplicate; one paid order
Reserialized payload:    200 ignored_stale; one paid order
8 concurrent deliveries: one granted, seven duplicate
After process restart:   200 duplicate; durable state retained
```

The concurrent check means eight requests sent to one local server process. It does not measure distributed concurrency or production throughput.

## Do not acknowledge work that failed to persist

The verifier starts another server with a state path that cannot be used as a database directory. A valid signed order returns **503 `persistence_failed`**, rather than a misleading 200. After restoring usable storage, retrying that event returns **200 `granted`**.

This shows the order decision can be retried after a persistence failure. There is no email sender in the experiment, so it does not establish exactly-once email delivery. External side effects would need their own durable workflow.

## Refunds must survive delayed paid notifications

The lab uses a deliberately conservative rule: revocation is terminal for the same order ID. A full refund creates a tombstone even if it arrives before the paid event. A later paid snapshot cannot restore that order.

The run observed **200 `revoked`** for the refund and **403** for the same unexpired download link. A later signed paid snapshot returned **200 `ignored_revoked`**; downloading still returned **403**. Restarting the server retained the revoked state.

This is a bounded teaching policy. Partial refunds, subscriptions, mixed carts, amount reconciliation, chargebacks, and reactivation are not implemented. Do not silently reuse it for a different commercial lifecycle.

## Continue from authorization to private bytes

The repository includes an interactive path:

```sh
npm run demo
```

In another terminal using the same Node version and lab directory:

```sh
npm run send -- paid-order
npm run link -- 73001
npm run send -- refunded-order
```

The link command is a local operator tool. It is not a public customer-authentication endpoint. The [download experiment](/payments/send-download-link-after-payment-no-backend/) follows that link through direct private-byte delivery, expiry, tampering, and refund checks. For missing requests from an actual integration, use the separate [webhook delivery diagnostic guide](/payments/lemon-squeezy-webhook-not-firing/).
