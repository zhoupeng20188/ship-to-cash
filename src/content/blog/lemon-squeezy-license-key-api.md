---
title: "Lemon Squeezy License Key API: Activate, Validate, Deactivate"
description: "Three endpoints, no API key, Access-Control-Allow-Origin: *. Working Lemon Squeezy license key code, plus 5 traps that leak emails and burn activation slots."
pubDate: 2026-09-23
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-license-key-api.jpg
faq:
  - question: "Does the Lemon Squeezy License API need an API key?"
    answer: "No. The License API is documented as a separate API from the main Lemon Squeezy API, and its own curl examples contain no Authorization header. I confirmed this by calling the validate endpoint with a made-up key and no credentials: instead of a 401, it returned HTTP 404 with a body of {\"valid\":false,\"error\":\"license_key not found.\"}. That is what makes it usable from a small edge function with no secrets at all — but it also means anyone else can call it, which is why your own endpoint needs to check that the key belongs to your product."
  - question: "Can I call the License API straight from the browser?"
    answer: "Technically yes. The response includes the header access-control-allow-origin: *, so a fetch from any origin will not be blocked. You should not do it anyway. Two reasons: the response body contains the buyer's name, email address, and order ID, which you would be handing to whatever page made the call, and an unauthenticated endpoint anyone can hit means a leaked key can be activated repeatedly until the activation limit is exhausted. Put a thin server-side proxy in front instead — even a free Cloudflare Worker is enough."
  - question: "Why does validate return valid true for a key that isn't mine?"
    answer: "Because valid only means the key exists and is currently usable — it says nothing about which store or product it belongs to. Every response carries a meta object with store_id and product_id. Compare both against your own values before you unlock anything. Without that check, a key issued for somebody else's $9 product will happily unlock your $199 one."
  - question: "What does the license key status inactive mean?"
    answer: "It means the key is valid but has zero activations, not that it has been revoked. The four statuses are inactive (valid, no activations), active (one or more activations), expired (past its license length, or the linked subscription lapsed), and disabled (turned off manually in the dashboard). So a key can come back with valid true and status inactive at the same time. Gate on valid, and treat status as extra information rather than the decision itself."
  - question: "How do I free up an activation slot when a buyer switches machines?"
    answer: "Call the deactivate endpoint with the instance_id you stored when you activated. That is the only way to release a slot, and instance_id is a required field — the API returns HTTP 422 with \"The instance id field is required.\" if you omit it. This is why the activate response matters so much: the instance id appears exactly once, in that response. If you did not save it, the slot stays occupied until the key expires or you disable it by hand."
  - question: "What happens when a license key hits its activation limit?"
    answer: "Activate returns activated false with the error message \"This license key has reached the activation limit.\" The limit itself is a per-product setting in the Lemon Squeezy dashboard — the docs use the example of a $9 product limited to one computer and a $19 variant of the same product allowing three. If buyers regularly run out of activations, raise the limit on the variant or add a higher-priced one rather than resetting keys manually."
---

I added [Lemon Squeezy checkout to a static site](/payments/lemon-squeezy-checkout-astro-static-site/) and felt finished. Payments went through, webhooks fired, the money landed. Then a buyer asked how to move his license to a new laptop, and I had no answer, because I had shipped a paid product with no way to tell a customer from someone who'd been forwarded the download link.

License keys are the fix, and the API behind them is small enough to hold in your head: three endpoints, no authentication, no SDK. I wired up all three in an afternoon. Five things about it surprised me, and four of them would have shipped as bugs if I'd written the obvious version and moved on.

## The License API is not the Lemon Squeezy API

This is the first thing to internalize, because the two share a hostname and nothing else.

| | Lemon Squeezy API | License API |
|---|---|---|
| Authentication | `Authorization: Bearer <key>` from Settings → API | None |
| Request body | JSON:API (`application/vnd.api+json`) | Form-encoded (`application/x-www-form-urlencoded`) |
| Rate limit | 300 requests/minute | Docs say 60/min; response headers I got said 300 |

The docs ask for `application/x-www-form-urlencoded` on POSTs. In my testing the endpoint parsed a JSON body too — it returned the same 404 rather than a 422 — but I still send form-encoded, because that's what's documented and I have no reason to bet on undocumented behaviour.

On the rate limit: the [License API page](https://docs.lemonsqueezy.com/api/license-api) states 60 requests per minute. The response headers on my test calls came back with `x-ratelimit-limit: 300` and `x-ratelimit-remaining: 295`. I don't know which number is authoritative, so I design against 60 and treat anything above that as a bonus. Don't build a design that needs more than 60 license calls a minute; if you do, cache validation results locally for a few minutes instead.

## Turn on license keys for the product

In the Lemon Squeezy dashboard, creating or editing a product (or a variant) gives you a **Generate License Keys** toggle. For one-time purchases you also get two knobs: license length and activation limit.

The activation limit is how many machines one key can be activated on. The docs' own example — worth reading before you pick a number, since it's framed as a pricing decision rather than a technical one — is a $9 product limited to one computer, with a $19 variant of the same product allowing three. See [Generating License Keys](https://docs.lemonsqueezy.com/help/licensing/generating-license-keys) for where those settings live. So the limit is a pricing lever, not just an anti-piracy setting. Pick it before you launch: raising it later doesn't retroactively change keys you've already sold.

Subscription products behave differently. Their keys are tied to the subscription lifecycle, so the length options disappear from the form — cancel the subscription and the key stops being valid.

Once the toggle is on, a unique key is generated per purchase, and the buyer can see it in their order receipt email and on the My Orders page.

There's also a `[license_key]` variable you can drop into Button link URLs, which puts the key into your own site as a query parameter after checkout. It's handy for pre-filling a form, but don't treat a key arriving that way as proof of anything: it's visible in the address bar, browser history, and any referrer header. Validate before you unlock.

## 1. Activate: POST /v1/licenses/activate

Activation is what binds a key to a machine. You send the key plus a label for that machine:

```bash
curl -X POST https://api.lemonsqueezy.com/v1/licenses/activate \
  -H "Accept: application/json" \
  -d "license_key=38b1460a-5104-4067-a91d-77b872934d51" \
  -d "instance_name=Priya-MacBook"
```

`instance_name` is just a label you choose — hostname, machine name, whatever helps you recognize it later. It's required: omit it and you get HTTP 422 with `{"message":"The instance name field is required.","errors":{"instance_name":["The instance name field is required."]}}`.

Here's the response shape:

```json
{
  "activated": true,
  "error": null,
  "license_key": {
    "id": 1,
    "status": "active",
    "key": "38b1460a-5104-4067-a91d-77b872934d51",
    "activation_limit": 1,
    "activation_usage": 5,
    "created_at": "2021-01-24T14:15:07.000000Z",
    "expires_at": null
  },
  "instance": {
    "id": "47596ad9-a811-4ebf-ac8a-03fc7b6d2a17",
    "name": "Priya-MacBook",
    "created_at": "2021-04-06T14:15:07.000000Z"
  },
  "meta": {
    "store_id": 1,
    "order_id": 2,
    "order_item_id": 3,
    "product_id": 4,
    "product_name": "Example Product",
    "variant_id": 5,
    "variant_name": "Default",
    "customer_id": 6,
    "customer_name": "John Doe",
    "customer_email": "johndoe@example.com"
  }
}
```

That `instance.id` is the most important string in the whole API. It is returned **once**, here, and never again. Write it down next to the license key in whatever storage you have — a database row, a KV pair, a JSON file in a bucket. Everything in trap 3 below follows from whether you did this.

## 2. Validate: POST /v1/licenses/validate

Validation is the call your app makes on startup, or before it serves a premium feature:

```bash
curl -X POST https://api.lemonsqueezy.com/v1/licenses/validate \
  -H "Accept: application/json" \
  -d "license_key=38b1460a-5104-4067-a91d-77b872934d51" \
  -d "instance_id=47596ad9-a811-4ebf-ac8a-03fc7b6d2a17"
```

`instance_id` is optional here. Leave it out and the response comes back with `"instance": null` — you get the key's status but no instance information.

The response mirrors the activate one, with `valid` instead of `activated`. The `status` field is the one people misread — there are four possible values, and only two of them mean "no" — so it's worth laying out:

| Status | What it means | Should you unlock? |
|---|---|---|
| `inactive` | Key is valid but has **zero** activations | Yes, if `valid` is true |
| `active` | One or more activations exist | Yes |
| `expired` | Past its license length, or the subscription lapsed | No |
| `disabled` | Turned off manually in your dashboard | No |

`inactive` is not a rejection. It's the normal state of a freshly issued key that nobody has activated yet. Gate on `valid`, and read `status` only when you need to explain *why* something failed. The four values are [defined under License key status](https://docs.lemonsqueezy.com/api/license-api#license-key-status), which is worth bookmarking if you write support replies.

## 3. Deactivate: POST /v1/licenses/deactivate

This releases an activation slot so the buyer can move to another machine:

```bash
curl -X POST https://api.lemonsqueezy.com/v1/licenses/deactivate \
  -H "Accept: application/json" \
  -d "license_key=38b1460a-5104-4067-a91d-77b872934d51" \
  -d "instance_id=47596ad9-a811-4ebf-ac8a-03fc7b6d2a17"
```

`instance_id` is required here, not optional. Missing it gets you HTTP 422 with `{"message":"The instance id field is required.","errors":{"instance_id":["The instance id field is required."]}}`. Since the only place you ever receive that id is the activate response, storing it isn't optional either.

In practice, deactivation is a support feature: a buyer emails you about a new laptop, you look up their instance, and you release it. I give buyers a self-serve "deactivate this machine" button in their account page, because otherwise every upgrade is a support ticket.

## Put the three calls behind your own endpoint

A Cloudflare Worker is enough, and it needs no secrets — remember the License API takes no API key. What it *does* need to do is check ownership and strip the response:

```js
const LS = 'https://api.lemonsqueezy.com/v1/licenses';
const STORE_ID = 12345;    // your store id
const PRODUCT_ID = 67890;  // the product this key must belong to

async function callLicense(path, payload) {
  const res = await fetch(`${LS}/${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payload).toString(),
  });
  return { status: res.status, data: await res.json() };
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { action, licenseKey, instanceId, instanceName } = await request.json();
    if (!licenseKey) {
      return Response.json({ ok: false, error: 'Missing license key' }, { status: 400 });
    }

    const payload = { license_key: licenseKey };
    if (action === 'activate') payload.instance_name = instanceName || 'default';
    if (instanceId) payload.instance_id = instanceId;

    const { status, data } = await callLicense(action, payload);

    // 422 responses use a different shape: { message, errors }
    if (status === 422) {
      return Response.json({ ok: false, error: data.message }, { status: 400 });
    }

    // Ownership check — a valid key is not necessarily YOUR valid key
    const meta = data.meta;
    if (meta && (meta.store_id !== STORE_ID || meta.product_id !== PRODUCT_ID)) {
      return Response.json({ ok: false, error: 'This key is not for this product' }, { status: 403 });
    }

    // Only return what the client needs
    return Response.json({
      ok: Boolean(data.valid ?? data.activated ?? data.deactivated),
      status: data.license_key?.status,
      instanceId: data.instance?.id ?? null,
      uses: `${data.license_key?.activation_usage}/${data.license_key?.activation_limit}`,
      error: data.error,
    });
  },
};
```

Two things that code does that most examples don't: it checks `store_id` and `product_id`, and it returns six fields instead of the full response. The full response includes `customer_name`, `customer_email`, and `order_id`, and there's no reason for any of that to reach a browser.

If you're deploying the Worker alongside the rest of your project, keep the store and product IDs in [environment variables rather than literals](/deploy/cloudflare-pages-environment-variables-not-working/) — they're not secrets, but hardcoding them means a new variant means a redeploy.

## Five things that will bite you

**1. No API key, and `access-control-allow-origin: *`.** I checked the response headers on a validate call and got `access-control-allow-origin: *` with `access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`. The browser will happily let a page call these endpoints directly. That's convenient and dangerous at the same time: an endpoint that anyone can call without credentials is an endpoint anyone can hammer with a key they found in a screenshot, burning through the activation limit until the real buyer's key stops working. Keep the calls server-side.

**2. `valid: true` doesn't mean the key is yours.** It means the key exists and is usable. A key from a completely different Lemon Squeezy store validates just as happily against your endpoint unless you compare `meta.store_id` and `meta.product_id`. This is the one check that separates a license system from a speed bump.

**3. Lose `instance.id` and the slot is gone.** Deactivate requires it, and it's only ever returned by activate. No stored id means no deactivation, which means the buyer's activation count climbs with every new machine until they hit the limit and email you. Store it in the same write as the license key.

**4. There are two error shapes.** Business failures return `{"valid":false,"error":"license_key not found."}` with a 404. Validation failures return `{"message":"The instance id field is required.","errors":{"instance_id":["..."]}}` with a 422. If your client only reads `data.error`, every 422 shows up as a blank error message, which is exactly the kind of bug you'll debug for an hour on a Sunday.

**5. The official example contradicts itself.** The activate response in the docs shows `"activation_limit": 1` alongside `"activation_usage": 5` — five activations on a key limited to one. It's stale sample data, but if you write your "how many seats are left" logic by reading that example, you'll build it backwards. Check the real numbers from a live response before trusting either field.

## Test it before you ship

Work through these against a real key in test mode:

1. Activate once, save the `instance.id`, and confirm `activation_usage` goes up by one on the next validate.
2. Activate a second time with a different `instance_name` on a key with a limit of 1, and confirm you get `activated: false` plus "This license key has reached the activation limit."
3. Deactivate with the stored id and confirm the usage count drops.
4. Validate a key from a different test product and confirm your endpoint returns 403, not `ok: true`.
5. Read the response your app actually receives and confirm `customer_email` is not in it.

Step 4 is the one that matters most and the one people skip, because it's the only test that proves your ownership check works.

## Where this fits

A license key is proof of purchase you can re-check at any time. If your product is a one-off file and you never need to re-check anything, you don't need this at all — [a payment link and a delivery email](/payments/getting-paid-without-stripe-kofi-paypal/) will do, and so will [taking payments without Stripe](/payments/stripe-not-available-in-my-country/) in the first place. Keys earn their keep when access is ongoing: a CLI, a plugin, a private repo, a members-only page.

They also cost you nothing extra in fees, because they're bundled into what Lemon Squeezy already charges as a [merchant of record](/payments/merchant-of-record-vs-payment-processor/) rather than sold as an add-on. And if you're deciding what to charge before you wire any of this up, the activation limit is worth setting alongside your [price tiers](/monetize/how-to-price-a-developer-template/) — one seat versus three is a pricing decision, not an implementation detail.
