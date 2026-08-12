---
title: "Do I Need to Buy an SSL Certificate? No — and Here's Why (2026)"
description: "Do I need to buy an SSL certificate? No. Modern hosts issue free SSL automatically. Here's where free certs come from, and when paid ones actually matter."
pubDate: 2026-08-12
category: deploy
difficulty: beginner
author: "Peng Zhou"
faq:
  - question: "Is a free SSL certificate as secure as a paid one?"
    answer: "Yes. The encryption is identical — a free Let's Encrypt certificate and a $50 paid certificate use the same TLS protocols and the same browser trust. What paid certificates add is organization validation paperwork and a monetary warranty, not stronger encryption."
  - question: "Why do registrars sell SSL certificates if hosts give them away free?"
    answer: "The paid-SSL market predates Let's Encrypt, when certificates genuinely cost money everywhere. It survives on traditional shared hosting (where you install certs yourself) and on buyers who don't know their host already handles it."
  - question: "Do I need to renew my SSL certificate?"
    answer: "Let's Encrypt certificates expire every 90 days, but your host renews them automatically — Vercel, Netlify, and Cloudflare all handle this silently. There is nothing to put on your calendar."
  - question: "Does HTTPS mean a website is safe?"
    answer: "No. HTTPS encrypts the connection between the visitor and the server — nobody can read the traffic in between. It says nothing about whether the site itself is trustworthy. Scam sites have padlocks too."
---

You're buying a domain at Namecheap, you get to checkout, and there's the upsell: an SSL certificate, $5.99 a year for the basic one, up to $50 for fancier versions. The copy makes it sound mandatory — "secure your site!" — and since everyone knows the padlock matters, your finger hovers.

Take your finger off the button. If you're hosting on Vercel, Netlify, Cloudflare Pages, or basically any modern platform, **you already have SSL, it's free, and it's already working**. That padlock on your deployed site? You never configured anything for it. This article is about why that upsell exists, where free SSL actually comes from, and the narrow cases where paid certificates still make sense.

I said the same thing in my [domain buying guide](/deploy/buy-domain-set-up-dns/) — decline the add-ons at checkout — and SSL is the upsell people hesitate on most. Here's the full reasoning.

## The short answer

You need HTTPS. You do **not** need to buy a certificate to get it.

Every modern hosting platform — Vercel, Netlify, Cloudflare Pages, Render, Railway, GitHub Pages — automatically issues and renews a free certificate for your custom domain. When I connected my domain to Vercel ([full walkthrough here](/deploy/vercel-custom-domain-setup/)), the certificate showed up on its own a few minutes after verification. There was no SSL step because there never is one.

## What HTTPS actually does (in one paragraph)

HTTPS encrypts the traffic between your visitor's browser and your server. Without it, everything travels as readable text — passwords, form submissions, session cookies — and any Wi-Fi router or ISP between you and your visitor can read or modify it. With it, they see garbage. Quick terminology note: everyone says "SSL," but the actual protocol has been called TLS for years; the certificate sellers just never updated their marketing. Same thing, don't let it confuse you.

## Why you can't skip HTTPS even if you wanted to

This isn't optional polish. It's enforced:

- **Chrome has marked HTTP pages "Not secure" since 2018.** Your visitors see a warning next to your URL before they read a single word. Nothing kills trust in a new product faster.
- **Browsers gate features behind HTTPS.** Geolocation, notifications, service workers (so no PWA), camera/mic access — all refuse to run on plain HTTP.
- **Google uses HTTPS as a ranking signal.** All else equal, the HTTPS page wins.

So yes, you need it. You just don't need to pay for it.

## Where free SSL comes from

Until about a decade ago, certificates genuinely cost money everywhere — $10 to $100+ a year, from a handful of certificate authorities. Then **Let's Encrypt** launched: a nonprofit certificate authority that issues certificates for free, automatically, via an API. It's now the largest certificate authority on the internet.

Two design choices make it work:

1. **Certificates last 90 days** — deliberately short, which limits the damage if one leaks.
2. **Renewal is automated** — your host calls the API and swaps in a fresh cert without asking you. Short expiry only works because no human is in the loop.

Your host plugs into this (Cloudflare additionally runs its own certificate authority), so "SSL setup" on a modern platform is literally: nothing. Add domain, wait a few minutes, padlock.

## So why is Namecheap still selling certificates?

The paid-SSL industry predates Let's Encrypt and survives on two remaining markets:

- **Traditional shared hosting** — older cPanel-style hosts where you install the certificate yourself. Auto-SSL has spread even there, but not everywhere.
- **People who don't know any better** — which was you, five minutes ago, at that checkout page. Registrars know exactly what they're doing with that placement.

Paid certificates do still offer things Let's Encrypt doesn't: **organization validation** (the CA verifies your company legally exists), **monetary warranties** against CA failures, and multi-year terms. Banks, governments, and enterprises with compliance requirements buy these.

Here's the part the sales pages won't tell you: **the encryption is identical.** A $5.99 PositiveSSL and a free Let's Encrypt cert use the same TLS with the same browser trust. Paid certs buy paperwork, not stronger crypto. And the one visible perk paid certs used to have — browsers showing your company name next to the padlock for EV certificates — was removed from Chrome and Firefox years ago because users never looked at it.

Self-hosting on a VPS instead of a platform? You still don't pay: Caddy and Nginx-with-Certbot both fetch and renew Let's Encrypt certs automatically.

## If your site shows "Not secure" anyway

Bought nothing, deployed, and the padlock is missing? It's one of these:

- **The certificate hasn't been issued yet.** It happens *after* domain verification, not simultaneously. Wait 10 minutes. If you're on Cloudflare with the orange-cloud proxy on, that's blocking issuance — [the fix is here](/deploy/vercel-custom-domain-setup/).
- **Mixed content.** Your page loads over HTTPS but pulls an image or script over plain `http://`, and the browser flags it. This one's common enough that it gets its own guide in this series — for now, search your code for `http://` in asset URLs and switch them to `https://` or relative paths.
- **You're visiting the `*.vercel.app`-style preview URL of some old host** — no, those have HTTPS too. If there's genuinely no cert on any modern host, something in the domain setup failed. Check the host's domain dashboard for a warning state.

## Next steps

Padlock sorted, no money spent. If you landed here while connecting a domain, the [Vercel custom domain guide](/deploy/vercel-custom-domain-setup/) finishes that job; if you're still earlier in the journey, start with [deploying your first app](/deploy/deploy-first-app-vercel/). Coming up in this series: environment variables — where your API keys should live now that your traffic is encrypted but your code is on GitHub.
