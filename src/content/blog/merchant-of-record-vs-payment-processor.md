---
title: "Merchant of Record vs Payment Processor: Responsibilities"
description: "Compare seller responsibilities, eligibility, tax handling, and total cost before choosing a payment model for a digital product."
pubDate: 2026-08-21
updatedDate: 2026-11-02
category: payments
difficulty: beginner
author: "Peng Zhou"
image: /og-merchant-of-record-vs-payment-processor.jpg
faq:
  - question: "Does a merchant of record handle my income tax?"
    answer: "Do not assume so. Its customer-facing tax role and your own income reporting are separate responsibilities."
  - question: "Is a hosted checkout automatically a merchant of record?"
    answer: "No. Determine the legal seller from the service agreement, not the appearance of the checkout page."
  - question: "Are the example fees provider quotes?"
    answer: "No. They are hypothetical inputs illustrating the calculation. Use your current agreement and all applicable charges."
---

A payment processor helps you accept money. A merchant of record is the legal seller to the customer for the transactions covered by its agreement. The distinction affects customer-facing sales tax, refunds, disputes, and the records your own business still needs to keep.

Evaluate the exact product and contract, not only a brand name. A company may offer different services with different seller responsibilities.

## Map responsibilities before comparing prices

| Responsibility | Direct processing model | Merchant-of-record model |
|---|---|---|
| Customer-facing seller | Usually your business | The MoR for covered transactions |
| Sales tax and VAT | Determine your obligations and arrange compliance | Check what the agreement covers |
| Refund and dispute operations | Your policies and provider requirements | MoR terms plus your operating workflow |
| Your income and payout reporting | Still yours | Still yours |
| Product delivery and support | Your implementation or hosted service | Check which services are included |

[Lemon Squeezy describes its MoR role](https://docs.lemonsqueezy.com/help/payments/merchant-of-record) and its [customer sales-tax handling](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat). Those descriptions do not mean the platform handles every obligation of the supplier in every country.

For direct payments, [Stripe Tax documentation](https://docs.stripe.com/tax) separates tax calculation from registration and reporting workflows. Confirm the services you enable and what you remain responsible for rather than assuming a standard checkout includes everything.

## Check eligibility independently

Either model can have identity checks, product restrictions, supported-country limits, and payout requirements. A merchant of record is not a universal way to bypass onboarding. Before implementation, complete the [country and payout worksheet](/payments/stripe-not-available-in-my-country/).

Business structure is another decision. A working individual seller account does not establish that no registration or reporting is needed. Use the [US business-structure orientation](/payments/do-i-need-an-llc-to-sell-digital-products/) only within its stated scope.

## Compare the same hypothetical order

For an illustration, suppose Model A charges 3% plus $0.30 and Model B charges 5% plus $0.50, both on a tax-exclusive $20 order with no other charges:

| Model | Fee | Net before other costs |
|---|---|---|
| A | $0.90 | $19.10 |
| B | $1.50 | $18.50 |

The $0.60 difference is arithmetic, not a quote from either provider. It excludes subscriptions, international cards, conversion, withdrawal, refunds, disputes, and the cost of compliance work. Do not describe it as the complete price of either business model.

Check the fee base too. If a provider charges 5% on a $24 tax-inclusive total rather than the $20 subtotal, that percentage costs $1.20 instead of $1.00. A [fee calculator with editable assumptions](/tools/fee-reverse-calculator/) helps model the contract you actually have.

## Delivery is a separate integration

A hosted checkout may collect payment while your application still needs to create an account, grant access, or synchronize a subscription. For a one-off file, provider-hosted downloads may be enough. For custom access, use verified events, idempotent writes, and persistent entitlements.

The [static Astro checkout guide](/payments/lemon-squeezy-checkout-astro-static-site/) separates the buy link from webhook handling. The [delivery checklist](/payments/send-download-link-after-payment-no-backend/) covers private files, link expiry, and duplicate events.

## Record the decision

Keep a short list of eligible providers and the contract terms relevant to your product. Record who sells to the customer, who handles each tax workflow, how fees are calculated, where payouts arrive, how refunds work, and what migration would require.

Choose the model whose responsibilities you can actually operate. Revisit it when your product, country, customer mix, or scale changes. A lower headline processing rate is useful only when the remaining work and risks are understood.
