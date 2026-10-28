---
title: "Lemon Squeezy Black Friday Discount: Full Setup"
description: "Build a Lemon Squeezy Black Friday discount that starts and ends on time: the four timing fields, the encoded checkout link, and the kill switch."
pubDate: 2026-10-28
category: monetize
difficulty: intermediate
author: "Peng Zhou"
image: /og-lemon-squeezy-black-friday-discount.jpg
faq:
  - question: "How do I create a Black Friday discount code in Lemon Squeezy?"
    answer: "Create it through the discounts API or the dashboard with amount_type set to percent, a code like BF30, a starts_at timestamp, and an expires_at timestamp. The two timestamps are what make it a Black Friday discount rather than a permanent price cut. Set status to draft while you build it, then flip it to published a few hours before you announce the sale."
  - question: "Why did my Lemon Squeezy discount stop working early?"
    answer: "Almost always a timezone mistake. starts_at and expires_at are ISO 8601 timestamps in UTC, so an expiry written as 2026-11-30T23:59:59Z means 23:59 UTC — not 23:59 in your local time. If you are in UTC-5, the code dies at 6:59 PM your time on the last day of the sale, which looks like the discount broke mid-evening."
  - question: "Does the duration field matter for a one-time product?"
    answer: "No. duration only affects subscriptions. once applies the discount to the first payment only, repeating applies it for duration_in_months, and forever applies it to every payment forever. For a one-time template or license purchase there is only one payment, so duration changes nothing — but for a subscription, forever is a permanent cut to your average revenue per user."
  - question: "How do I stop a Lemon Squeezy discount immediately?"
    answer: "Set the discount status to draft. That is an instant off switch: checkout stops accepting the code while the discount, its redemption history, and its reporting stay intact. Deleting the discount also works, but you lose the record of how many people used it, which is exactly the number you want the week after Black Friday."
  - question: "Can I test a Black Friday discount before the sale starts?"
    answer: "Yes, and you should. Flip test mode on, create the discount there with the same timestamps, and run a purchase with test card 4242 4242 4242 4242. Test-mode discounts are separate from live ones, so the timestamps you set in test mode do not carry over — copy the exact values into the live discount instead of retyping them by hand."
  - question: "Should I extend my sale if it is going well?"
    answer: "Change the existing discount's expires_at rather than creating a second code. Two live codes with different discounts means a buyer who finds the older link can still use the expired price, and you cannot tell from the dashboard which link actually sold. One code, one end date, moved deliberately."
---

Black Friday 2026 is Friday, November 27, and Cyber Monday is November 30. If you sell a template, a plugin, or a license key, that is four weeks away — enough time to set the discount up properly instead of doing it at 11 PM on Thanksgiving.

I have watched this go wrong in both directions. One year the code went live two days early, and the people who had paid full price the week before noticed. Another year it simply never stopped — it stayed valid into January, and every new buyer for six weeks got 30% off a price I had spent months establishing.

Both failures come from the same place. In the Lemon Squeezy dashboard, creating a discount feels like a two-field form — a code and a percentage. But *when* a discount is usable is actually spread across four separate fields that do four different things, and the form does not tell you that. This is the setup I use now, with the exact fields and the two traps that cost me money.

## The four fields that actually control timing

Here is the whole timing model — smaller than it looks:

| Field | What it really does | What happens if you skip it |
|---|---|---|
| `starts_at` | Checkout rejects the code before this moment | Code works the second you publish it |
| `expires_at` | Checkout rejects the code after this moment | Code works forever |
| `status` | `draft` or `published` — the on/off switch | You cannot build a code quietly |
| `max_redemptions` | Caps total redemptions when `is_limited_redemptions` is `true` | Unlimited use, even past Cyber Monday traffic |

Only the first two are about the calendar. `status` is about control, and `max_redemptions` is about blast radius.

Be precise about what `expires_at` governs: whether checkout will *accept* the code, not what happens to orders that already happened. A customer who bought on Friday keeps their discount, their license, and their receipt after the code dies on Monday. That is why ending a sale is safe rather than something that can claw back revenue.

The official [Discount object reference](https://docs.lemonsqueezy.com/api/discounts/the-discount-object) lists all of these attributes if you want the full surface, but those four are the ones that decide whether your Black Friday behaves.

## Step 1: create the discount as a draft

Create it in advance with `status` set to `draft`. That single choice is the difference between "scheduled" and "oh no, it is live."

This is the payload I use for a 30% Black Friday code on a one-time product:

```bash
curl -X POST "https://api.lemonsqueezy.com/v1/discounts" \
  -H "Accept: application/vnd.api+json" \
  -H "Content-Type: application/vnd.api+json" \
  -H "Authorization: Bearer $LEMON_SQUEEZY_API_KEY" \
  -d '{
    "data": {
      "type": "discounts",
      "attributes": {
        "store_id": YOUR_STORE_ID,
        "name": "Black Friday 2026 - 30%",
        "code": "BF30",
        "amount": 30,
        "amount_type": "percent",
        "duration": "once",
        "starts_at": "2026-11-27T05:00:00Z",
        "expires_at": "2026-11-30T23:59:59Z",
        "is_limited_redemptions": true,
        "max_redemptions": 200,
        "status": "draft"
      }
    }
  }'
```

Three details in there are worth pausing on.

**`amount` is 30, not 0.30.** When `amount_type` is `percent`, the number is the percentage itself. Switch to `fixed` and the same field becomes cents, so `500` means $5 off. Mixing these up is how you accidentally give away a product for free.

**`max_redemptions` does nothing unless `is_limited_redemptions` is `true`.** The two travel together. Setting a number without the boolean leaves you with an unlimited code that looks capped in the dashboard.

**Keep the API key out of your frontend.** It belongs in a server environment variable, never a page bundle — and the [dashboard-versus-local variable gap](/deploy/cloudflare-pages-environment-variables-not-working/) is what bites when it "worked yesterday."

## Step 2: put the code inside the link

Most people announce a sale by telling buyers to type a code at checkout. On a phone, that is a lost sale. The fix is a link that arrives with the discount already applied:

```
https://yourstore.lemonsqueezy.com/checkout/buy/PRODUCT_UUID?checkout%5Bdiscount_code%5D=BF30
```

The parameter is `checkout[discount_code]`, and the brackets must be percent-encoded as `%5B` and `%5D`. This is not cosmetic. Unencoded brackets survive in some browsers and get mangled in email clients and messaging-app link previews — and when they break, checkout still loads at full price, so nobody reports a bug. They just pay more or leave.

[Remkus de Vries documented the pattern](https://remkusdevries.com/notes/adding-discount-code-to-lemon-squeezy-product-link) after hitting the same gap in the official docs, and it is still the clearest explanation of how the two pieces combine.

Two rules I follow for the link itself:

- **One link per channel.** `-email`, `-x`, `-newsletter` suffixes on separate codes, so the week after the sale you can say which channel actually converted instead of guessing.
- **The link is the announcement.** Put it in the email, the post, and the link-in-bio. If the discount lives in the code and not the link, half your traffic never sees it.

If your checkout is embedded on a static page instead, the [static-site checkout setup](/payments/lemon-squeezy-checkout-astro-static-site/) wires the same URL through — the parameter works identically.

## Step 3: end it on purpose

`expires_at` handles the scheduled ending, which covers 95% of cases. Keep a manual switch for the other 5%.

Setting the discount's `status` to `draft` is an instant off switch. Checkout stops accepting the code immediately, and unlike deleting the discount, your redemption history survives. That history is the single most useful number you will have on December 1 — how many people actually used it, and at what average order value.

I have needed that switch twice: once when a product hit its support capacity and the code was still driving buyers at it, and once when a large account shared the deal and I wanted to cap the damage rather than ride it.

Avoid deleting a discount mid-sale. It works, but it takes the redemption records with it, and next year you will be starting from zero on the one question that matters: was 30% the right number?

And if you decide to extend into Cyber Monday, **move `expires_at` on the existing code** instead of creating a second one. Two live codes means a buyer holding the older link can still redeem the older price, and your dashboard can no longer tell you which offer sold what.

## The subscription trap: `duration` is not about timing

This is the field most likely to quietly cost you money, because its name sounds like it belongs with the other date fields. It does not.

`duration` only applies to subscriptions, and it answers a different question: after the first payment, does the discount keep applying?

| `duration` | Effect on a subscription | When it makes sense |
|---|---|---|
| `once` | First payment only, full price after | Black Friday on a monthly plan |
| `repeating` | Applies for `duration_in_months`, then full price | A 3-month promo you can plan around |
| `forever` | Every payment, permanently | Almost never for a sale |

For a one-time purchase — a template, a license key, a download — there is only one payment, so `duration` changes nothing at all. Set it to `once` and move on.

For a subscription, `forever` is not a sale — it is a permanent price cut wearing a Black Friday costume. On a $20/month plan, 30% off with `forever` does not cost you 30% of one payment. It costs 30% of every payment, from every buyer who ever used the code, for as long as they stay. That is a different number by an order of magnitude, and it is invisible on the day you set it up.

Different platforms handle this differently — the Eden guide to [running a Black Friday sale on digital products](https://eden.so/blog/black-friday-sale-for-creators) notes that on their store a membership discount only comes off the first payment. Do not assume that behavior carries over. In Lemon Squeezy it is explicit and it is yours to set, which means it is also yours to get wrong.

## The timezone bug that eats your last evening

`starts_at` and `expires_at` are ISO 8601 timestamps in UTC. The `Z` at the end is the tell.

So `2026-11-30T23:59:59Z` is not "midnight at the end of Cyber Monday" in your timezone. It is 23:59 UTC. If you are in New York, that is 6:59 PM — your sale ends while people are still shopping after dinner. If you are in Berlin, it is 12:59 AM Tuesday, which is roughly what you wanted. If you are in Tokyo, it is 8:59 AM Tuesday, which is not.

Two habits fix this permanently:

1. **Compute the UTC value explicitly** instead of typing what "midnight" feels like. Decide the real end moment in your buyers' timezone, convert once, paste that in.
2. **State the end time and timezone in the announcement.** "Ends Monday at 11:59 PM Eastern" is a promise a buyer can check. "Ends Monday" is a rumor. The same guide makes the point that an end time without a timezone is the most common way a real deadline starts looking fake.

There is a commercial cost beyond the annoyance. If the code dies early, buyers who were about to purchase see full price, assume the sale is over, and leave. You get no support ticket about this — just a quieter Monday and no idea why.

## The Friday-morning checklist

Run this the day before, not on the day:

1. **Build the discount as `draft`** with both timestamps set. Do not publish it yet.
2. **Test the whole purchase in test mode** — test-mode discounts are separate objects, so recreate the code there and buy with `4242 4242 4242 4242` to confirm the price drops and the order lands. There is a full [rehearsal walkthrough for test mode](/payments/lemon-squeezy-test-mode-local/) if this is your first time.
3. **Click your own link from a phone.** Confirm the discount applies and the total is what you expect, including tax.
4. **Confirm the webhook still fires on a discounted order.** Same event, different totals — and sale-day traffic is the worst time to discover that [a webhook never arrives](/payments/lemon-squeezy-webhook-not-firing/).
5. **Decide the real end moment** in your buyers' timezone, convert to UTC, and write it in the announcement.
6. **Publish** a few hours before you send the first email, never days before.

If your discounted price ends up below what the product actually costs you to support, the problem is the discount size, not the setup — [how to price a developer template](/monetize/how-to-price-a-developer-template/) is the number to settle first, because a sale that loses money per buyer scales in the wrong direction.

## What I'd do next

Set the discount up this week while you still have slack, and spend the time you saved on the part that decides whether Black Friday means anything: having people to tell about it. A perfect discount code sent to nobody is a config file with ambition. If your list is thin, [getting your first customers without a launch budget](/monetize/get-first-customers-developer-template/) covers the unglamorous version that actually works.

And once orders start landing, the interesting question stops being the discount and becomes how the money reaches you — especially if [Stripe is not available in your country](/payments/stripe-not-available-in-my-country/) and you are routing through a merchant of record instead.
