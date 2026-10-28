/**
 * Platform fee data for the reverse fee calculator.
 *
 * Every number here was read off the provider's own pricing page in
 * October 2026. Rates drift, so the calculator lets the reader override
 * both fields — the presets are a starting point, not a source of truth.
 *
 * `percent` and `fixed` describe the fee on a single order. Everything is
 * in USD, which is how all of these platforms quote to US-based sellers.
 */

export const RATES_VERIFIED = "October 2026";

export type SurchargeId = "international" | "paypal" | "subscription" | "conversion";

export interface Surcharge {
  id: SurchargeId;
  label: string;
  percent: number;
}

export interface Provider {
  id: string;
  name: string;
  /** Percentage of the fee base, e.g. 5 for 5%. */
  percent: number;
  /** Flat amount per transaction, in USD. */
  fixed: number;
  surcharges: Surcharge[];
  /** One line the reader needs to know before trusting the preset. */
  note: string;
  source: string;
  /** Whether the provider charges its percentage on the tax-inclusive total. */
  taxInclusive: boolean;
}

export const PROVIDERS: Provider[] = [
  {
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    percent: 5,
    fixed: 0.5,
    surcharges: [
      { id: "international", label: "Buyer outside the US (+1.5%)", percent: 1.5 },
      { id: "paypal", label: "Paid with PayPal (+1.5%)", percent: 1.5 },
      { id: "subscription", label: "Subscription payment (+0.5%)", percent: 0.5 },
    ],
    note: "5% + 50¢. Surcharges stack — an international subscriber paying by PayPal is 8.5% + 50¢.",
    source: "https://www.lemonsqueezy.com/pricing",
    taxInclusive: true,
  },
  {
    id: "paddle",
    name: "Paddle",
    percent: 5,
    fixed: 0.5,
    surcharges: [],
    note: "5% + 50¢, all-inclusive. No surcharge for international cards, PayPal or subscriptions.",
    source: "https://www.paddle.com/pricing",
    taxInclusive: true,
  },
  {
    id: "polar",
    name: "Polar",
    percent: 5,
    fixed: 0.5,
    surcharges: [{ id: "international", label: "Buyer outside the US (+1.5%)", percent: 1.5 }],
    note: "Starter plan is 5% + 50¢ since May 2026. Paid plans buy the rate down (Pro, $20/mo: 3.8% + 40¢).",
    source: "https://polar.sh/pricing",
    taxInclusive: true,
  },
  {
    id: "gumroad",
    name: "Gumroad",
    percent: 12.9,
    fixed: 0.8,
    surcharges: [],
    note: "10% + 50¢ platform fee plus 2.9% + 30¢ card processing, charged separately. Discover marketplace sales are a flat 30%.",
    source: "https://gumroad.com/help/article/66-gumroads-fees",
    taxInclusive: true,
  },
  {
    id: "stripe",
    name: "Stripe (direct)",
    percent: 2.9,
    fixed: 0.3,
    surcharges: [
      { id: "international", label: "International card (+1.5%)", percent: 1.5 },
      { id: "conversion", label: "Currency conversion (+1%)", percent: 1 },
    ],
    note: "2.9% + 30¢ on US cards. You are the merchant of record here, so the tax filing is yours.",
    source: "https://stripe.com/pricing",
    taxInclusive: true,
  },
  {
    id: "custom",
    name: "Custom / other",
    percent: 5,
    fixed: 0.5,
    surcharges: [],
    note: "Enter the percentage and flat fee from your own agreement.",
    source: "",
    taxInclusive: true,
  },
];

export function getProvider(id: string): Provider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}
