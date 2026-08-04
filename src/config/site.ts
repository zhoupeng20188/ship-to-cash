export const SITE = {
  name: "ShipToCash",
  description:
    "Step-by-step guides for vibe coders: deploy your app, set up payments, handle the legal stuff, and turn your project into income.",
  url: "https://shiptocash.com",
  author: "Peng Zhou",
  github: "https://github.com/zhoupeng20188",
  avatar: "/avatar-256.jpg",
  lang: "en",
  nav: [
    { label: "Home", href: "/" },
    { label: "Deploy", href: "/deploy/" },
    { label: "Payments", href: "/payments/" },
    { label: "Monetize", href: "/monetize/" },
    { label: "Legal", href: "/legal/" },
    { label: "Tools", href: "/tools/" },
  ],
};

export const ANALYTICS = {
  ga4Id: "", // 申请到 GA4 Measurement ID 后填入
};

export const ADSENSE = {
  client: "", // AdSense 过审后填入 ca-pub-xxxx
  enabled: false,
};

export const CATEGORIES = [
  {
    slug: "deploy",
    name: "Deploy",
    description:
      "Get your app off localhost: hosting, domains, HTTPS, databases, and fixing deploy errors.",
  },
  {
    slug: "payments",
    name: "Payments",
    description:
      "Stripe, Paddle, Lemon Squeezy — choose a provider, open an account from anywhere, and handle taxes.",
  },
  {
    slug: "monetize",
    name: "Monetize",
    description: "Ads, subscriptions, and pricing: turn your shipped app into revenue.",
  },
  {
    slug: "legal",
    name: "Legal",
    description: "Privacy policies, GDPR, and terms — the boring stuff that keeps you safe.",
  },
  {
    slug: "tools",
    name: "Tools",
    description: "Free tools to help you ship and earn faster.",
  },
];

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
