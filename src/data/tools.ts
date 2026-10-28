/**
 * Single source of truth for the free tools under /tools/.
 *
 * Every tool is a hand-written page at `src/pages/tools/<slug>.astro` —
 * tools are NOT blog posts and never live in the `blog` content collection.
 * Keeping the listing here means a new tool appears on /tools/, and can be
 * promoted on the home page, by editing one file instead of three.
 *
 * Adding a tool:
 *   1. create `src/pages/tools/<slug>.astro`
 *   2. add an entry to TOOLS below
 *   3. (optional) give it `featured` to take over the home-page slot
 *
 * ⚠️ Do not create a `category: "tools"` post in `src/content/blog/`. That
 * would make `[category]/index.astro` emit `/tools/index` as well, and the
 * hand-written page silently wins — the tool listing would vanish with no
 * build error. See MEMORY.md for the tested behaviour.
 */

export interface Tool {
  /** URL segment: page lives at `src/pages/tools/<slug>.astro`. */
  slug: string;
  name: string;
  /** Short label shown above the name on the tools index. */
  tagline: string;
  /** One or two sentences: what question the tool answers. */
  body: string;
  /** Three concrete capabilities, rendered as an inline list. */
  points: string[];
  /** Promotes this tool to the home-page slot. Only one tool should have it. */
  featured?: {
    /** Eyebrow text, e.g. "Free tool". */
    eyebrow: string;
    headline: string;
    blurb: string;
    cta: string;
  };
}

export const TOOLS: Tool[] = [
  {
    slug: 'fee-reverse-calculator',
    name: 'Reverse Fee Calculator',
    tagline: 'What to charge so you keep $X',
    body:
      'Start from the money you want to end up with and get the list price, including merchant-of-record fees that are charged on the tax-inclusive total, and the surcharges that stack on top.',
    points: [
      'Reverse or forward calculation',
      'Lemon Squeezy, Paddle, Polar, Gumroad, Stripe presets',
      'Tax-rate sensitivity for worldwide buyers',
    ],
    featured: {
      eyebrow: 'Free tool',
      headline: 'What should you charge to net $30?',
      blurb:
        'Reverse fee calculator for digital products — merchant-of-record fees, stacked surcharges and VAT all included.',
      cta: 'Open calculator',
    },
  },
];

/** Absolute path for a tool page. Always trailing-slash: the site is static. */
export const toolHref = (tool: Tool): string => `/tools/${tool.slug}/`;

/** A tool guaranteed to carry promotion copy. */
export interface FeaturedTool extends Tool {
  featured: NonNullable<Tool['featured']>;
}

/** The tool promoted on the home page. Falls back to the first tool. */
export const FEATURED_TOOL: FeaturedTool =
  (TOOLS.find((t) => t.featured) ?? TOOLS[0]) as FeaturedTool;
