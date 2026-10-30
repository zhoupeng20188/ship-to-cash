---
title: "Why Buyers Never Get the Download Email"
description: "Buyer paid, no email arrived. Fix it in order: unpaid orders, the signed receipt link you already have, and the Cloudflare record that stalls verification."
pubDate: 2026-10-30
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-buyer-didnt-receive-download-email.jpg
faq:
  - question: "My buyer paid but never got the download email. What should I check first?"
    answer: "Check the order status before you touch DNS. If the order is pending or failed, no delivery email was ever sent, because there was nothing to deliver. Only when the status reads paid should you start looking at email delivery, and even then the fastest fix is to send the buyer the signed receipt URL from your order dashboard rather than resending the email."
  - question: "Does Lemon Squeezy resend the receipt if a customer asks?"
    answer: "Yes. The order object carries a urls.receipt field containing a pre-signed link to the customer's My Orders page, so you can paste that link into a support reply and the buyer gets their downloads without any new email being sent. The receipt email can also be triggered again from the dashboard, but a resent email can land in the same spam folder as the first one."
  - question: "Why does my Resend domain stay stuck on pending verification?"
    answer: "The most common cause on Cloudflare is a CNAME record left on the orange cloud. Resend's domain guide states plainly that proxied CNAMEs prevent verification from completing, because the proxy answers with Cloudflare's address instead of the value Resend is checking for. Set the record to DNS only. Records also take up to 72 hours to propagate globally, and after that you can press Restart verification in the dashboard."
  - question: "My domain says verified but emails still go to spam. Why?"
    answer: "Verification only proves SPF and DKIM. Resend's own documentation says a verified domain means you are already passing SPF and DKIM, and adding DMARC is a separate eighth step you perform after verification. Without a _dmarc TXT record there is no published instruction telling receiving servers what to do with mail that fails authentication, so new domains get filtered on reputation alone."
  - question: "Should I send transactional email from my root domain or a subdomain?"
    answer: "Use a subdomain such as notifications.yourdomain.com. Resend recommends it for reputation isolation, and the reason matters when something goes wrong: a bounce spike or spam complaint damages the subdomain's reputation rather than the domain your website and your own mailbox live on. You can verify several subdomains separately for different kinds of mail."
  - question: "How do I confirm the fix worked instead of guessing?"
    answer: "Send a real message through your actual code path to a Gmail address you control, open it, choose Show original, and read the authentication results. You want spf=pass, dkim=pass and dmarc=pass, and the d= value in the DKIM signature must match the domain you send from. Resend's dashboard reporting stops at Delivered, which only means the receiving server accepted the message, not that it reached the inbox."
---

A buyer emailed me at 2am: paid twenty minutes ago, nothing in the inbox. My first move was to open Cloudflare and stare at DNS records. That was the wrong move, and I spent an hour on it before I looked at the order.

The order was `pending`. No email had ever been generated, because there was nothing to deliver yet. I had been debugging email authentication for a payment that hadn't finished clearing.

This is the pattern behind most "I paid and got nothing" messages. Four different failures produce one identical complaint, and only one of them is an email problem. Working through them in the wrong order is how an afternoon disappears.

## Four failures that look identical from your inbox

| What the buyer says | What actually happened | Where to look |
|---|---|---|
| "I never got an email" | Order never completed | Payment status |
| "I never got an email" | Email sent, filtered or mistyped address | Your order record |
| "I never got an email" | Your own sender failed authentication | DNS records |
| "The link doesn't work" | Old or expired link | Product files |

Only rows three and four involve anything you can fix with DNS. Rows one and two are the majority, and neither is an email deliverability problem at all.

## 1. The money never actually cleared

Lemon Squeezy's [order object](https://docs.lemonsqueezy.com/api/orders) exposes a `status` field with six possible values: `pending`, `failed`, `paid`, `refunded`, `partial_refund` and `fraudulent`. Only `paid` produces a delivery. A `pending` order is a payment still being authorised, and a `fraudulent` one has been held back deliberately.

Pull the order and read the status before anything else:

```bash
curl "https://api.lemonsqueezy.com/v1/orders?filter[store_id]=YOUR_STORE_ID" \
  -H "Accept: application/vnd.api+json" \
  -H "Authorization: Bearer $LEMON_SQUEEZY_API_KEY"
```

If it comes back `pending`, the honest answer to the buyer is that the payment hasn't completed and their bank may still be holding it. Do not resend anything. There's nothing to resend, and a second delivery attempt on an unpaid order just confuses the record.

The other half of this row is the typo'd address. Checkout forms accept `gmail.cob` without complaint, because the field only has to look like an address. The buyer is checking an inbox that will never receive your mail, and no amount of SPF tuning changes that. Confirm the address on the order matches the one they're writing to you from.

## 2. The money cleared, and the email is out of your hands

If you sell through a merchant of record, the delivery email is not yours. Lemon Squeezy sends it from its own infrastructure, on its own domain. You can't add DKIM to it, you can't move it to a subdomain, and you can't read its rejection reason. That's the trade you made — [what a merchant of record actually takes off your plate](/payments/merchant-of-record-vs-payment-processor/) includes the tax filing and the delivery plumbing, and the cost is that neither is yours to tune.

So when a paid buyer says nothing arrived, the useful question isn't "how do I fix my email" but "how do I get this person their file without email at all."

### The receipt URL nobody uses

Every Lemon Squeezy order carries a `urls.receipt` field. The [order API documentation](https://docs.lemonsqueezy.com/api/orders) describes it as a pre-signed URL for viewing the order on the customer's My Orders page — it's a signed link, not a login wall, and it opens that buyer's downloads directly.

```json
"urls": {
  "receipt": "https://app.lemonsqueezy.com/my-orders/104e18a2-...?signature=8847fff0..."
}
```

Paste that into your reply and the buyer clicks straight through to their files. No new email, no spam folder, no DNS. In my experience this resolves the case in under a minute, and it's the single most useful thing in this article.

The dashboard's "resend receipt" action exists too, but it sends another email to the same address through the same filters that already ate the first one. If the original went to spam, the duplicate usually follows it.

## 3. You send the email yourself, and Cloudflare quietly breaks verification

The rest of this article only applies if you run your own sending — a Resend account, your own domain, a function that mails the download link. This is the setup where you actually own the deliverability, which means you can also be the one who breaks it.

The failure I see most often on Cloudflare is a CNAME record left on the orange cloud. Resend's [domain setup guide](https://resend.com/docs/add-a-domain) is unusually blunt about it: when the dashboard shows you a CNAME, do not enable proxying, because it will prevent verification from completing.

That's the whole mechanism. The proxy answers DNS queries with Cloudflare's anycast address instead of the value Resend generated. Resend checks for its own token, finds the wrong one, and the domain sits in `pending` forever while the dashboard's status dot stays grey and unhelpful.

Set the record to DNS only. Then wait, and know what you're waiting for: [Resend's own verification timeline](https://resend.com/docs/add-a-domain) puts the usual case at 15 minutes, though DNS propagation can take up to 72 hours globally. Before you assume something is broken, look the records up publicly with `dns.email`, which is Resend's own checking tool. If you're past 72 hours with correct records, use the Restart verification button in the dashboard to force a fresh check instead of waiting on a queue that has already given up.

One more thing worth knowing before you debug: Resend recommends sending from a subdomain such as `notifications.example.com` rather than your root domain, and it's not just cosmetic. Reputation is tracked per sending domain, so a bounce spike or a spam complaint hits the subdomain instead of the domain your site and your own mailbox live on. You can verify several subdomains separately for different mail — receipts on one, marketing on another — and a problem in one doesn't contaminate the other.

## 4. "Verified" doesn't mean "authenticated"

Here is the trap that produces the most frustrating version of this bug: green checkmark in the dashboard, mail still landing in spam.

[Resend's DMARC guide](https://resend.com/docs/dashboard/domains/dmarc) states that having a verified domain means you're already passing SPF and DKIM. That's the entire scope of verification. DMARC is a separate record, and the domain setup flow lists it as an eighth step performed *after* your domain verifies.

So a verified domain with no `_dmarc` TXT record is fully expected by the dashboard and half-authenticated in reality. SPF says which servers may send for you; DKIM proves the message wasn't altered. Neither one tells the receiving server what to do when a message fails both. That instruction is DMARC, and without it a brand-new domain is judged on reputation it hasn't earned yet.

Adding it is one record:

```txt
Name: _dmarc.yourdomain.com
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com;
```

Start at `p=none`, which requests reports without quarantining anything. Resend recommends exactly this, then moving to `p=quarantine` and later `p=reject` only once you've confirmed every legitimate sender is aligned. Jumping straight to `reject` is how people block their own receipts and can't work out why.

The `rua` address has to be a mailbox that actually accepts mail. If it bounces, you get silence, not reports.

## How to confirm you actually fixed it

Don't trust the dashboard. Resend's reporting stops at `Delivered`, and delivered only means the receiving server answered with a 250. It says nothing about whether the message reached the inbox, the spam folder, or a corporate quarantine.

Send a real message through your real code path to a Gmail address you control. Open it, choose Show original, and read the authentication block:

- `spf=pass` with the sending IP Resend uses
- `dkim=pass` with `d=` matching the domain you actually send from
- `dmarc=pass`

If `d=` is not your domain, you're sending from a different identity than you think, and DMARC alignment will fail even though DKIM itself passes. That mismatch is invisible in every dashboard I've used and obvious in the raw headers.

## The fix that doesn't depend on email at all

The strategic point, and the one most tutorials skip: email is a single point of failure you can't fully control, so don't let it be the only path to the product.

Two additions remove most of the support load. Show the download on the success page itself, so the buyer who never leaves the tab doesn't need an email — the pattern is the same one behind [handing over the file only after the payment is verified](/payments/send-download-link-after-payment-no-backend/), and [the checkout setup itself](/payments/lemon-squeezy-checkout-astro-static-site/) is where that page lives. Then give buyers a way back in without you: a My Orders link in the footer, or the signed receipt URL kept on the order record.

If your product needs ongoing access rather than a one-off file, [license keys that can be re-checked later](/payments/lemon-squeezy-license-key-api/) survive a lost email entirely, because the key can be reissued from the order without touching delivery infrastructure. And if you're wiring your own webhook to trigger all this, a delivery that silently fails has the same shape as [a webhook that never arrives](/payments/lemon-squeezy-webhook-not-firing/) — the message left, and something downstream dropped it.

Two environment details will bite you while you're building that. Secrets for your sending function belong in [Cloudflare's environment variable settings](/deploy/cloudflare-pages-environment-variables-not-working/) rather than in a build-time variable, and if you're still [pointing a new domain at your host](/deploy/buy-domain-set-up-dns/), get that stable before you add mail records on top of it. Debugging DNS and email at the same time is how a two-minute fix becomes a two-day one.

## What I'd do in your position

1. Read the order status first. `pending`, `failed` or `refunded` means there's no email to chase.
2. If it's `paid`, reply with the `urls.receipt` link from the order. Don't resend the email into the same filter that ate it.
3. If you send your own mail, check every CNAME in the Resend records tab for the orange cloud, and set it to DNS only.
4. Add the `_dmarc` record at `p=none` even though your domain already says verified. Verified covers SPF and DKIM and stops there.
5. Read a real Gmail header after the change. `dmarc=pass` with your own `d=` is the only proof that matters.
6. Then add a non-email path to the product, because the next one of these will arrive at 2am too.

The email is a delivery mechanism, not the delivery itself. Treat it that way and a lost message becomes a thirty-second support reply instead of a refund conversation — and the difference in how that feels to a buyer is worth more than the fix. If you're still deciding [what the product is actually worth](/monetize/how-to-price-a-developer-template/) before you build any of this, settle the price first; the delivery engineering only needs to be as serious as the money at stake.
