---
title: "How to Price a Developer Template: $49, $99, or $199?"
description: "Creator-economy pricing advice keeps underselling code. Here's how I price a developer template or boilerplate, with the fee math at each tier."
pubDate: 2026-09-16
category: monetize
difficulty: beginner
author: "Peng Zhou"
image: /og-how-to-price-a-developer-template.jpg
faq:
  - question: "Should I price a developer template at $27 like the digital product guides say?"
    answer: "No. Those guides are written for impulse buys from a general audience. A template buyer is a developer comparing your price against the hours it saves them, and cheap code reads as abandoned code rather than a deal. Price against the hours removed, not against what a Notion dashboard costs."
  - question: "How do I know which price band my template belongs in?"
    answer: "By what's wired up, not by how long you spent building it. A single-integration starter sits around $39-$99, a full SaaS kit with auth, payments, database and email around $149-$299, and multi-tenant B2B kits at $299-$499. Read the band off public template catalogs before you invent a number."
  - question: "Do I need a live demo before I can charge for a template?"
    answer: "Yes. Buyers who can't click the thing assume it doesn't work. A free-tier deployment on your own subdomain is enough and takes an afternoon. Without a demo you're selling a repo, and repos are free."
  - question: "Is a launch discount a good idea for a boilerplate?"
    answer: "I'd skip it. Discounts work on impulse purchases. A $199 template is a considered purchase, and a half-price launch mostly tells the buyer the real price is half. If you want a launch lever, add a bonus integration instead of cutting the number."
  - question: "How much does Lemon Squeezy take from a $199 sale?"
    answer: "At the published rate of 5% + 50c, they take $10.45, so you keep $188.55. That's about 5.3%, versus roughly 7.6% of a $19 sale. The fixed 50c hurts cheap products far more than expensive ones. Some payment methods add 0.5-1%, and non-US transactions may carry small extra fees."
  - question: "Do I need an LLC or a company to sell a template?"
    answer: "Not at first. You can sell as an individual through a merchant-of-record platform that handles sales tax for you. A company structure starts to make sense when your personal tax or foreign-exchange situation gets awkward, not at your first sale."
---

Somebody asked in a Discord I'm in what to charge for a Next.js starter template. Three answers came back inside a minute: $9, $49, and "if it's actually good, $199."

The $9 guy had a reason. He'd read the pricing guides, and they all say to start around $17 to $27 — you have no audience, you need testimonials fast, and a low price removes the friction.

Those guides aren't wrong. They're written for people selling Notion dashboards and printable planners. A codebase is a different product with a different buyer, and that buyer is running a different calculation. Get this wrong and you don't just earn less. You make fewer sales.

Here's how I'd price a starter template or boilerplate in 2026, and the fee arithmetic that decides where in the range you land.

## Why the $27 advice doesn't transfer to code

The creator-economy canon starts from what feels fair and what your audience can buy on impulse. Both are the wrong inputs for a template.

Your buyer is a developer, and developers price in hours. When they hit your sales page, the comparison happening in their head isn't "is this worth $199." It's "how long would this take me." If your kit removes two weeks of auth, payments, webhooks and email setup, you are not competing against a $27 ebook. You're competing against forty hours of their own time — and at a modest $60/hour, that's $2,400.

Against that anchor, $199 isn't aggressive. It's obviously cheap.

The second effect is stranger, and it's the one that costs people sales: **developers read your price as a signal about your code.** A $9 SaaS boilerplate doesn't read as a bargain. It reads as abandoned, or unmaintained, or about to cost them a weekend in support tickets. Cheap code isn't a discount. It's a risk premium.

I'd rather charge $199 and lose the bargain hunters than charge $19 and have every buyer arrive suspicious of what they got.

## Find the band before you pick the number

Don't choose a price by feel. The market has already published the bands — they're sitting in open catalogs, and you can read them off in half an hour.

Here's the ladder for developer products, from what's currently on sale:

| What it is | Typical one-time price | Reference points |
|---|---|---|
| Single-purpose starter (one integration, one framework) | $39–$99 | framework starters, auth-only kits |
| Full SaaS kit (auth + payments + DB + email + landing page) | $149–$299 | ShipFast at $199; supastarter and MakerKit at $299 |
| B2B / multi-tenant kit (orgs, roles, admin, i18n) | $299–$499 | multi-tenant SaaS starters |
| Component or UI kit | $79–$199 | dashboard and marketing section libraries |

Below all of them sits $0. [Vercel](https://vercel.com/templates) and [Astro](https://astro.build/themes/) both host hundreds of free starters, and there's a free Vercel-backed SaaS starter. That's your real competition — not the $49 guy.

Two rules for picking your row:

**Price what's wired up, not what you built.** The band is set by the integrations, not by your hours. A kit with Stripe webhooks, subscriptions and a customer portal is in a different row than one with a checkout button, and buyers know the difference even if they can't articulate it. The same holds for [license key activation](/payments/lemon-squeezy-license-key-api/) — a buyer who can move their license to a second machine is paying for wiring, not for files.

**Anchor at the bottom of your band until you have proof.** No live demo, no docs, no testimonials: bottom of the row. Live demo, screenshots in the README, three buyers who shipped something: middle of the row. You move up by adding things, not by waiting.

The catalogs are also full of kits priced exactly like yours. That's fine. You're not picking a price to be unique — you're picking one the buyer can place in ten seconds. A price outside every band makes them stop and evaluate you, which is precisely what you don't want happening on a $199 page.

## Free starters exist. So what is anyone paying for?

Sit with that objection for a minute, because it kills most first templates: every framework already ships a free starter.

What people pay for is the boring middle that free starters deliberately skip. Free templates get you to "runs on localhost." They stop right where the work gets tedious and specific:

- webhook handling that survives a retry
- tax and VAT, if you're not routing through a merchant of record
- transactional email that lands in the inbox instead of the spam folder — the SPF, DKIM and DMARC setup nobody enjoys
- deploy config and environment variables that don't fall over on the second deploy
- updates that track the framework instead of drifting
- docs with real screenshots of the current UI, not the UI from two versions ago
- somewhere to ask a question at 1am

That list is the product. If you can't point at specific items on it and say "I did that part for you," you don't have a $199 template. You have a repo.

A deflated formula I still use to sanity-check a number: take the hours you're removing, multiply by a modest hourly rate, then take a tenth of it. Sixty hours of setup work at $60/hour is $3,600, and a tenth of that is $360. That tells me $199 is not a stretch. It doesn't tell me the exact number — the band does that.

## The fee math decides where in the band you sit

Fees change the shape of the decision at low prices, and almost nobody does this arithmetic before setting a number.

Lemon Squeezy's [published rate](https://www.lemonsqueezy.com/pricing) is **5% + 50¢ per transaction**, with 0.5–1% added for certain payment methods and possible extra fees on non-US transactions. The fixed 50¢ is the part that matters, because it doesn't shrink with your price:

| Price | Platform keeps | You keep | Effective rate |
|---|---|---|---|
| $19 | $1.45 | $17.55 | 7.6% |
| $49 | $2.95 | $46.05 | 6.0% |
| $99 | $5.45 | $93.55 | 5.5% |
| $199 | $10.45 | $188.55 | 5.3% |

Going from $19 to $199 doesn't just multiply revenue. It nearly halves the share of each sale that leaves your account before you ever see it.

The percentage is still a distraction, though. The number that decides things is how many sales you need:

| Price | Sales needed for $1,000 |
|---|---|
| $19 | 53 |
| $49 | 21 |
| $99 | 11 |
| $199 | 6 |

One $199 sale replaces ten $19 sales, and it costs you one support conversation instead of ten. That's the argument for pricing higher, and it's arithmetic rather than attitude.

If you're weighing platforms, Gumroad's [published pricing](https://gumroad.com/pricing) is 10% + 50¢ on sales you bring yourself, and a flat 30% when the buyer finds you through Gumroad Discover. That gap is the entire story of discovery — the marketplace charges you for customers you didn't have. One honest caveat: third-party breakdowns disagree about whether card processing is included in that 10%, so model it from Gumroad's own page, not from a blog post. Including this one.

Choosing a platform is a separate decision. On a static site with no backend, the checkout setup I use is [Lemon Squeezy on an Astro site](/payments/lemon-squeezy-checkout-astro-static-site/). The relevant part here is that a fee is a commission on a price *you* chose — so choose the price first, then let the fee table confirm you didn't pick something silly. And if you're outside Stripe's supported countries, that constraint comes before any of this: [your provider options are narrower](/payments/stripe-not-available-in-my-country/) and the fixed costs are higher on some of them. The [Ko-fi and PayPal route](/payments/getting-paid-without-stripe-kofi-paypal/) works and costs more per sale, and its withdrawal fees can eat 70% of a small payout — one more reason a $19 price point is a trap.

## What I'd do in the first week

1. **Sit in a band, not a mood.** Open two catalogs, write down where comparable kits sit, and put your number at the bottom of that row — or the middle, if you already have a live demo and real docs.
2. **Ship a live demo before the sales page.** Buyers who can't click it assume it doesn't exist. It can run on a free tier; [deploying your first app](/deploy/deploy-first-app-vercel/) takes an afternoon. Put it somewhere that looks like a product rather than a raw `*.vercel.app` string, which is a [custom domain job](/deploy/vercel-custom-domain-setup/), not a code job.
3. **Write the setup docs first.** If you can't write them, the template isn't finished — and they double as your sales page copy.
4. **Wire up checkout with a real product and a real price.** A test-mode link on a live page is the most common self-inflicted wound in this niche.
5. **Launch at full price.** I'd skip the 40–50% "launch discount." Discounts work on impulse buys; a $199 template is a considered purchase where the buyer is already comparing you to their own hourly rate, and halving your price mostly signals that you don't believe the number. Add a bonus integration instead of cutting the price.
6. **Raise it when you add something, not on a calendar.** A new integration, a second framework, an admin panel — those justify a higher row. Time passing doesn't.

## Refunds, support, and your hidden hourly rate

Digital code is normally sold without refunds, because repo access is instant. Say it on the sales page, in the same size font as the price. Whether you get to set that policy depends on who the seller is: if you're the merchant of record, [it's your call](/payments/merchant-of-record-vs-payment-processor/); if a platform like Lemon Squeezy or Paddle is, they set the terms and you follow them.

The cost nobody models is support, and it's what ultimately decides whether your price was right. If your $49 template generates three hours of hand-holding per buyer, your effective rate is $16/hour — worse than any job you'd take. If your $199 template generates ten minutes, you're at a rate worth having.

The counterintuitive part: cheaper products attract *more* support per dollar, not less. Lower prices pull in buyers with less context, and they need more of your time to succeed. Pricing at the bottom of the band isn't the conservative choice. It's the one that quietly turns a product into a part-time job.

That's also why you'll eventually want a [real company structure](/payments/do-i-need-an-llc-to-sell-digital-products/). At a few hundred dollars a month, that's a future problem rather than this week's.

## The number is a decision, not a discovery

Pick the band off the catalog. Run the one-tenth check. Confirm the fee table doesn't punish the price you chose. Then say the number out loud to a stranger and see whether you flinch.

The first person who pays $199 without hesitating will teach you more about your product than any amount of tuning. And the first person who tells you it's too expensive was never going to be your buyer.
