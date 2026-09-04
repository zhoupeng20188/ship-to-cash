---
title: "Getting Paid Without Stripe: A Ko-fi + PayPal Setup I Actually Use"
description: "How I get paid without Stripe: Ko-fi wired to PayPal, the real fee math, the default tier that quietly takes 5% of tips, and getting USD out to a bank account."
pubDate: 2026-09-02
category: payments
difficulty: beginner
author: "Peng Zhou"
image: /og-getting-paid-without-stripe-kofi-paypal.jpg
faq:
  - question: "Do I need Stripe to use Ko-fi?"
    answer: "No. Ko-fi requires you to connect either PayPal or Stripe, not both. If Stripe isn't available in your country, connect PayPal and you're done — Ko-fi never processes the payment itself, so it never needs to onboard you as a merchant."
  - question: "Does Ko-fi work in my country?"
    answer: "Almost certainly, because the question is really about PayPal. Ko-fi doesn't process payments or hold balances — it passes them through to whichever account you connected. If PayPal operates in your country and will let you receive payments, Ko-fi works there. Check PayPal's country list, not Ko-fi's."
  - question: "Why did Ko-fi take 5% of my tip? I thought tips were free."
    answer: "Ko-fi's Standard tier is the default for new creators, and it applies a 5% service fee to every payment type including tips. The Free tier is what gives you 0% on tips. Opt out of Standard in your account settings before your first payout — it's a checkbox most people never know they agreed to."
  - question: "How much does it cost to withdraw PayPal USD to a bank account in mainland China?"
    answer: "PayPal charges a flat $35 per wire to a mainland China bank account, taking 3-7 business days. It's a fixed fee, not a percentage, so withdrawing $50 costs 70% while withdrawing $1,000 costs 3.5%. Batch your withdrawals monthly rather than per sale."
  - question: "Is Ko-fi a merchant of record?"
    answer: "No. You are the seller of record on every Ko-fi transaction. That means VAT, sales tax, and chargebacks are your responsibility, not Ko-fi's. A merchant of record like Paddle takes the sale legally and handles tax for you, which is the main thing their higher fee buys."
  - question: "Can I sell a SaaS subscription through Ko-fi?"
    answer: "Digital downloads, one-off purchases, and simple monthly memberships work fine. Metered or usage-based SaaS billing, free trials, and automated dunning do not — Ko-fi has no concept of a subscription seat or a billing cycle tied to usage. For that you want a real billing layer."
---

The first $5 tip I ever received sat in a PayPal balance for eleven days before I worked out how to get it into a bank account. Nothing was broken. I'd simply read a dozen "how to accept payments without Stripe" guides, and every last one of them stopped at the moment the money arrived somewhere.

Getting paid is two problems wearing one coat. The first is the button. The second — the one nobody writes about — is turning the number on the screen into money you can actually spend. Here's the whole route, both halves, with the numbers I actually hit.

## The setup: Ko-fi never holds your money

This is the part that makes Ko-fi work when Stripe doesn't, so it's worth being precise. Ko-fi is not a payment processor. It has no balance, no payout schedule, and no minimum threshold. It's a page and a checkout button that pipes payments straight into **your own** PayPal or Stripe account.

That distinction is the whole ballgame. It's the same one I broke down in [merchant of record vs payment processor](/payments/merchant-of-record-vs-payment-processor/), and here it cuts in your favour: because Ko-fi isn't the seller, it never has to underwrite you as a merchant. You only need a PayPal account in a country PayPal serves — and PayPal's country list is much longer than Stripe's merchant list.

Setup, end to end:

1. **Create a Ko-fi page.** Free, no review, no waiting for approval.
2. **Connect PayPal** under Settings → Payment Methods. Personal, Premier, and Business accounts all work.
3. **Put the link somewhere.** Ko-fi hands you a page URL, a button embed, and a widget.

Ten minutes. The reason it's ten minutes instead of ten days is that nobody is underwriting anything.

The trade-off, stated plainly: **you are the seller of record.** Your name is on the transaction, VAT and sales tax are yours to deal with, and chargebacks land on you. Ko-fi is a tip jar with a storefront bolted on, not a merchant of record.

## Why not just use PayPal buttons directly?

Fair question — PayPal will generate buttons and payment links for free, and at first glance Ko-fi looks like a 5% wrapper around something you already have. Two reasons I still route through it:

- **The page does the explaining.** A bare PayPal button on your site asks a stranger to trust a payment form. A Ko-fi page carries your pitch, samples of your work, and a visible count of people who already paid you. For a first-time seller with no brand, that context is doing real work.
- **One connection, many payment methods.** Connect PayPal and your supporters can pay with PayPal, Apple Pay, Google Pay, Venmo, Cash App, and cards. Wiring those up yourself against PayPal's API is a weekend you don't need to spend.

That's what the 0–5% buys. Early on, it's a good trade.

## What it actually costs — and the default that quietly takes 5%

Ko-fi has [three tiers](https://ko-fi.com/pricing), and the middle one is the trap.

| Tier | Tips | Shop / memberships / commissions | Monthly cost |
|---|---|---|---|
| Free | 0% | 5% | $0 |
| Standard *(default for new creators)* | 5% | 5% | $0 |
| Gold | 0% | 0% | $12/mo |

Read that middle row again. **Standard is the default for new creators, and it applies 5% to tips too.** The Free tier's headline feature — 0% on tips — is what you get by opting *out* of the default. Ko-fi describes Standard as "your contributions help keep Ko-fi running," which is honest, but it's not how most people would describe a setting they never knowingly chose.

If tips are your main income and you're under $240/month, staying on Free beats paying $12 for Gold. Opt out of Standard during setup, before the first payment lands.

On top of Ko-fi's cut, PayPal takes its own. The standard commercial rate is roughly **2.9% + $0.30** on domestic transactions, and cross-border payments add roughly another 1–2% depending on where your buyer is. Rates vary by country, so [check PayPal's merchant fees page](https://www.paypal.com/c2/webapps/mpp/merchant-fees?locale.x=zh_c2) for yours rather than trusting my number.

Real numbers on a $10 tip:

- **On Free:** PayPal keeps about $0.59. You keep **$9.41**.
- **On Standard:** Ko-fi takes $0.50, PayPal about $0.56. You keep **$8.94**.

Same tip, same buyer, same day. The difference is a checkbox nobody told you about.

## The last mile: getting USD out of PayPal

This is where I lost those eleven days, and it's the part no "how to get paid" guide covers — because most of them are written by people whose bank account is in the same currency they're paid in.

PayPal will wire USD to a bank account in mainland China. Per [PayPal's own China fee page](https://www.paypal.com/c2/cgi-bin/?cmd=_fees-rate-about-outside&fli=true): **$35 per withdrawal, flat, 3–7 business days.** Not 3.5% — thirty-five dollars whether you withdraw $50 or $5,000.

Run that math before you set anything up:

- Withdraw $50 → **70% fee**
- Withdraw $500 → **7%**
- Withdraw $1,000 → **3.5%**

**So: batch.** Withdraw monthly, not per sale. That one habit is the difference between a 3% business and a 70% hobby, and no fee table will tell you it.

Three more things that will bite you:

1. **The $50,000/year quota.** Individual foreign exchange settlement in mainland China is capped at $50,000 per person per year. Below it, nothing to think about. Above it, you need a different structure — and that's roughly where [forming a real company stops being overkill](/payments/do-i-need-an-llc-to-sell-digital-products/).
2. **Your bank may just reject it.** Inbound international wires to personal accounts get scrutinized, and some people get asked for contracts, invoices, or shipping records. If the wire bounces, the $35 doesn't come back.
3. **Check whether an HKD account is reachable for you.** PayPal withdraws to Hong Kong bank accounts free at HKD 1,000 or more — a completely different cost curve than $35 a pop. Whether that's available to you depends on your situation, not on PayPal.

Past a few hundred dollars a month, third-party receivers — Wise, Payoneer, WorldFirst and similar — usually beat the direct wire on both cost and reliability. They aren't free either: compare the rate they quote against the mid-market rate, because the spread is where they make their money.

## What this setup is bad at

I use it, and I'd use it again, but not for everything.

- **No tax handling.** You're the seller of record, so EU VAT and US sales tax are yours. [A merchant of record](/payments/merchant-of-record-vs-payment-processor/) solves this by legally taking the sale, and that's most of what Paddle's fee pays for.
- **It's a tip jar, not a billing system.** Digital downloads, one-off sales, and simple memberships are fine. Metered SaaS billing, trials, and dunning are not.
- **PayPal, with everything that implies.** Dispute resolution leans toward buyers, and account-level holds are a real risk if your volume spikes unexpectedly.

In [the three routes for when Stripe isn't available](/payments/stripe-not-available-in-my-country/), this is the smallest and fastest. It isn't the endgame — it's the thing that lets you charge money this week instead of next quarter.

## What I'd do in your position

1. Create the Ko-fi page and connect PayPal today.
2. **Opt out of Standard** before your first tip.
3. Put one digital product on the shop at a real price — not "pay what you want."
4. Leave money in PayPal and withdraw once a month, in as few transactions as possible.
5. Revisit the whole stack once you're consistently past ~$300/month. Below that, the $35 withdrawal fee dominates every other cost here.

The first sale is the only market research that counts. Everything above is just plumbing to make it possible.
