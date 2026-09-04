---
title: "Merchant of Record vs Payment Processor (Solo Dev's Guide)"
description: "Merchant of record vs payment processor: the difference decides who files your sales tax. Real fees at $500 MRR, and which one I'd pick for a first paid app."
pubDate: 2026-08-21
category: payments
difficulty: beginner
author: "Peng Zhou"
image: /og-merchant-of-record-vs-payment-processor.jpg
faq:
  - question: "Is Stripe a merchant of record?"
    answer: "No. Stripe is a payment processor — you remain the legal seller, and collecting, filing, and remitting sales tax or VAT is your problem. Stripe Tax can calculate the right amount at checkout, but you still register and file in each jurisdiction yourself. Merchant-of-record services like Paddle and Lemon Squeezy take that whole job off your plate."
  - question: "What is the difference between a merchant of record and a seller of record?"
    answer: "The seller of record owns the product, sets the price, and owns the customer relationship — that's you. The merchant of record is the legal entity that appears on the customer's card statement and carries the tax and compliance liability for the transaction. With Paddle or Lemon Squeezy, you stay seller of record while they act as merchant of record."
  - question: "Is PayPal a merchant of record?"
    answer: "No. PayPal is a payment processor, same category as Stripe. You are the seller and you carry the tax liability. This surprises people because PayPal feels like a 'full' solution, but the tax obligation stays with you."
  - question: "Can I switch from a merchant of record to Stripe later?"
    answer: "You can, but it's the painful direction. Your subscriptions live inside the MoR's billing system, and moving them to Stripe usually means asking customers to re-enter their card details — expect churn. Going the other way (Stripe to MoR) is also a migration, but MoRs have done it enough that they have playbooks for it. Pick the one you can live with for a year or two."
  - question: "Does a merchant of record own my customers?"
    answer: "No. You keep the product, the pricing, and the customer relationship. What changes is the paperwork: the MoR's name appears on the card statement, their checkout collects the tax, and their team handles chargebacks. Your customers still buy from your site and log into your app."
  - question: "Do I need to collect sales tax if I use Stripe?"
    answer: "Almost certainly yes, once you have real volume. In the US, most states make you register after you cross an economic nexus threshold (commonly $100,000 in sales or 200 transactions in that state). The EU makes you charge VAT from the very first digital sale to an EU consumer. Stripe Tax calculates the amounts, but registering, filing, and paying is on you."
---

The first time I tried to charge money for a side project, I did what every developer does: opened a Stripe account, dropped a Checkout link into the app, and felt done. Then someone on a forum asked me how I was handling EU VAT.

I was not handling EU VAT. I didn't know that was a thing I was supposed to handle.

That rabbit hole ends at a distinction nobody explains upfront: **payment processor vs merchant of record**. It sounds like accounting jargon. It is actually the single biggest decision in how you get paid, because it decides who goes to jail if the taxes are wrong. (Not literally jail. Usually. But fines, back-taxes, and penalty interest — real money.)

If your app is already live and you're staring at the "now add payments" step — the same spot you'd be in after [deploying your first app to Vercel](/deploy/deploy-first-app-vercel/) — this is the article I wish I'd read that night.

## The 60-second answer

A **payment processor** (Stripe, PayPal, Braintree) moves money from your customer's card to your bank account. That's it. You are the legal seller. Every obligation that comes with selling — sales tax, VAT, GST, invoicing rules, chargebacks — stays with you.

A **merchant of record** (Paddle, Lemon Squeezy, FastSpring, Polar) *becomes the seller*. Their legal entity sells your product to your customer, collects the tax, files it in every country, fights the chargebacks, and then pays you your cut as a supplier payout.

| | Payment processor | Merchant of record |
|---|---|---|
| Legal seller | You | Them |
| Who calculates sales tax / VAT | You (or Stripe Tax, 0.5% extra) | Them |
| Who registers and files taxes | You, in every jurisdiction | Them |
| Chargebacks | You fight them, $15 fee each | They handle them |
| Name on customer's card statement | Your company | Their company |
| Typical fee (Aug 2026) | 2.9% + 30¢ (Stripe, US cards) | 5% + 50¢ (Paddle, Lemon Squeezy) |
| Checkout flexibility | Total control | Their hosted checkout |

The fee gap is real, and we'll do the math below. But notice what's *not* in the processor column: any help with the law.

## Why the tax part is the whole ballgame

Here's what "you handle the taxes" means in practice for a solo dev selling a $9/month subscription:

**In the EU**, you owe VAT from your *first* sale to an EU consumer. No threshold, no grace period. The standard mechanism (VAT OSS) means registering, filing quarterly, and keeping evidence of each customer's location for ten years.

**In the US**, each state has an "economic nexus" threshold — commonly $100k/year or 200 transactions in that state — after which you must register for a sales tax permit there, collect the right rate (there are thousands of overlapping city/county/state rates), and file on that state's schedule. Miss a filing and penalties start compounding.

**Everywhere else** has its own version. India has GST on digital services. Japan has consumption tax. Australia has GST with a low registration threshold.

Nobody doing this solo actually registers in 40 jurisdictions. What actually happens with processors is one of two things: people ignore it and hope (a lot of indie projects quietly run on hope), or they hit $2-3k MRR, get scared, and pay an accountant to unwind it.

A merchant of record makes the entire problem disappear, because legally *you never sold anything to those customers* — the MoR did. You have one supplier relationship, with them.

That's the trade. Now the honest part: what it costs.

## The real fee math at solo-dev scale

The comparison sites love to say "2.9% vs 5%" and stop there. Both halves of that are wrong once you look at actual numbers. I ran the math on my own pricing: a $9/month subscription.

**Stripe, US customer:**
- 2.9% + 30¢ = $0.56 per $9 charge → **6.2% effective** (the flat 30¢ hurts on small charges)
- Add Stripe Tax at 0.5% → ~6.7%
- You still owe the filing, or an accountant

**Stripe, EU customer paying in EUR:**
- 2.9% + 30¢ + 1.5% international card + 1% currency conversion → ~9.2% before Tax
- And you *definitely* owe VAT registration for this customer

**Paddle (flat, all-inclusive):**
- 5% + 50¢ per checkout transaction = $0.95 per $9 charge → **10.6%**
- Tax: calculated, collected, filed, done. International, PayPal, subscriptions: same rate.

**Lemon Squeezy:**
- 5% + 50¢ base → 10.6% on $9
- But watch the surcharges: +0.5% for subscriptions, +1.5% for non-US customers, +1.5% for PayPal. A French subscriber paying by PayPal is at 8.5% + 50¢ → **~14%**
- Payouts run twice a month; free to US bank accounts, 1% to non-US banks

So at $500 MRR (about 56 subscribers), the real monthly cost is roughly:

- **Stripe (domestic-ish mix): ~$34** — plus your time, plus registration and filing exposure
- **Paddle: ~$53** — plus nothing
- **Lemon Squeezy: ~$53–65** depending on your customer mix — plus nothing

Call it **$20–30 a month** at $500 MRR to never think about sales tax again. That gap grows with revenue, which is why this decision is worth revisiting later — but at the stage where $500 MRR is a good month, $20 is the cheapest insurance you'll ever buy.

One more processor gotcha the headline rate hides: chargebacks. Stripe charges $15 per dispute, you write the evidence yourself, and you lose the fee even if you win. MoRs absorb that workload as part of their cut.

## When Stripe is the right answer anyway

I'd be lying if I said everyone should pick an MoR. Stripe wins clearly in a few situations:

- **Your customers are US businesses.** B2B sales between US entities are usually exempt or reverse-charged, so the tax monster mostly sleeps. Paying 4 extra points to insure against a risk you don't have is waste.
- **You need billing weirdness.** Usage-based pricing, per-seat tiers, metered API credits, marketplaces paying out to third parties (Stripe Connect) — Stripe's billing engine is years ahead of any MoR here.
- **You're venture-scaling.** At $50k+ MRR the 4-point gap is $2,000/month, you can afford an accountant, and investors expect you to own your revenue stack.
- **You want checkout to look exactly like your app.** MoR checkouts are hosted and themable-ish. Stripe gives you the raw components.

If two or more of those describe you, skip the MoR and budget for a CPA instead.

## When a merchant of record is the right answer

- **You sell to consumers globally.** EU VAT alone justifies it from your first French customer.
- **You're solo.** Every hour in a tax portal is an hour not shipping.
- **Your product is simple.** A subscription, a one-time download, a license key. MoRs eat these for breakfast — Lemon Squeezy even bundles license keys, download delivery, and an affiliate program into the same 5%.
- **It's your first paid thing.** The goal is learning whether anyone will pay, not building a finance department.

Between the two big indie MoRs: **Paddle** is flatter (one 5% + 50¢ rate, no surcharge surprises) and more SaaS-serious. **Lemon Squeezy** is faster to set up and friendlier for downloads and licenses, but read the surcharge list twice — international PayPal subscribers stack up to 8.5% + 50¢. Paddle has also been an Apple-style gatekeeper about what products it approves, so read their acceptable-use policy before building on either.

## What I'd do again

For my own stuff, I use an MoR for anything consumer-facing and global, and Stripe for anything B2B. If I were starting my very first paid side project tonight: Lemon Squeezy or Paddle, hosted checkout, done by dinner. The 4-point fee gap is the price of never reading a VAT OSS guide at 1am again, and I say that having read the VAT OSS guide at 1am.

The one thing I'd do differently than my first attempt: decide *before* launch. Migrating a few hundred subscribers between billing systems later means re-asking customers for card details, and some of them will quietly churn instead. Pick the rail you can live with for two years.

Already have an app live and a domain connected ([that part's 20 minutes](/deploy/vercel-custom-domain-setup/))? Then you're one hosted checkout page away from your first dollar. Go make the dollar.
