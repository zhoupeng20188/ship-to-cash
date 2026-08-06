---
title: "Vercel Custom Domain Setup 2026: Namecheap & Cloudflare in 10 Minutes"
description: "Vercel custom domain setup for Namecheap & Cloudflare: the exact DNS records (A + CNAME), auto SSL, www vs apex, and the mistakes that break verification."
pubDate: 2026-08-06
category: deploy
difficulty: beginner
author: "Peng Zhou"
faq:
  - question: "Do I need to transfer my domain to Vercel?"
    answer: "No. You keep the domain at your registrar (Namecheap, Cloudflare, wherever) and just point two DNS records at Vercel. Transferring the domain itself is optional and only worth doing if you want to manage everything in one dashboard."
  - question: "How long does Vercel domain verification take?"
    answer: "Usually 5-30 minutes once your DNS records are saved. DNS propagation can technically take up to 48 hours, but with Namecheap or Cloudflare it's almost always under an hour. If it's been longer, check for leftover parking records or a proxied Cloudflare record."
  - question: "Can I keep Cloudflare's proxy (orange cloud) enabled?"
    answer: "Not during setup. Vercel's docs say a proxied record blocks domain verification and the SSL certificate challenge. Set the record to DNS only (grey cloud), wait for Vercel to verify and issue the certificate, then you can re-enable the proxy if you want Cloudflare's features in front."
  - question: "Should I use www or the bare domain as my main URL?"
    answer: "Either works — pick one and redirect the other. Vercel nudges you toward www when you add an apex domain, and that's a fine default. What matters for SEO is choosing one canonical version so you don't split ranking signals between two URLs."
---

Your app is live on a `*.vercel.app` subdomain, and now you want it on a real domain. Good call — nothing says "weekend toy" like a free subdomain, and a proper domain costs about $10 a year.

I did this for a Next.js side project I hosted on Vercel. The actual work is two DNS records and about 10 minutes of clicking; the waiting for DNS propagation is what pads it out. This guide covers the two registrars I see most often — Namecheap and Cloudflare — because their DNS screens are where people get lost.

If you haven't deployed yet, do that first: [my 15-minute Vercel deploy guide](/deploy/deploy-first-app-vercel/) gets you from local folder to live URL. And if you bought a domain through Cloudflare and are wondering whether to just host there too, I [compared Vercel, Netlify, and Cloudflare Pages](/deploy/vercel-vs-netlify-vs-cloudflare-pages/) after using all three.

## What you need

- A project deployed on Vercel (any framework)
- A domain you own, with access to its DNS settings
- About 10 minutes, plus propagation time

One thing to know before you start: you're not moving your domain anywhere. It stays at your registrar. You're just telling the internet "when someone asks for this name, send them to Vercel."

## Step 1: Add the domain in Vercel

In your Vercel dashboard, open your project, then go to **Settings → Domains**.

Type your domain (say `yourapp.com`) and click **Add**. Vercel will suggest adding the `www` version too — accept that. You want both pointing at your project; you'll pick a primary one later.

Vercel now shows you the DNS records it expects:

- For the apex domain (`yourapp.com`): an **A record** pointing to `76.76.21.21`
- For `www`: a **CNAME record** — and here's what trips people up — the value is **unique to your project**, something like `d1d4fc829fe7bc7c.vercel-dns-017.com`

Older tutorials tell you to use `cname.vercel-dns.com`. That's outdated. Copy the exact CNAME value your dashboard shows, character for character.

Leave this tab open. You'll come back to check verification.

## Step 2a: DNS records on Namecheap

Log in to Namecheap, go to **Domain List**, click **Manage** next to your domain, then the **Advanced DNS** tab.

First, clean house. A fresh Namecheap domain comes with parking records — usually a **URL Redirect Record** for `@` pointing at their parking page, and a **CNAME** for `www` pointing at `parkingpage.namecheap.com`. Delete both. If you skip this, your new records fight the old ones and verification fails. This is the #1 Namecheap mistake.

Then add your two records (**Add New Record**):

1. **A Record** — Host: `@`, Value: `76.76.21.21`, TTL: Automatic
2. **CNAME Record** — Host: `www`, Value: your project-specific value from Vercel (the `...vercel-dns-017.com` one), TTL: Automatic

Save and you're done on the Namecheap side.

## Step 2b: DNS records on Cloudflare

In your Cloudflare dashboard, select the domain, then go to **DNS → Records** and click **Add record**. Same two records:

1. **A** — Name: `@`, IPv4 address: `76.76.21.21`
2. **CNAME** — Name: `www`, Target: your project-specific Vercel value

Now the Cloudflare-specific gotcha: **the proxy toggle**. Each record has an orange-cloud "Proxied" option, on by default. Turn it off — you want **DNS only** (grey cloud) for both records right now.

This isn't superstition. Vercel's own docs say a proxied record sits between public DNS and the A record Vercel expects, which blocks both domain verification and the SSL certificate challenge. People who leave the orange cloud on end up stuck on "Failed to generate cert" in the Vercel dashboard. Once Vercel verifies the domain and issues the certificate, you can flip the proxy back on if you want Cloudflare's caching and WAF in front — but leave it off until then.

## Step 3: Verification and SSL

Back in **Settings → Domains** on Vercel, watch the status next to your domain. It starts as "Pending" or shows a configuration warning, then flips to a healthy state once Vercel sees your records.

In my experience with Namecheap and Cloudflare, this takes 5 to 30 minutes. The official line is that DNS propagation can take up to 48 hours, but I've never seen it take more than an hour with these two registrars.

Once verified, Vercel automatically provisions a free SSL certificate (via Let's Encrypt). You don't configure anything — your site just works on `https://`. If you visit too early and get a certificate error in the browser, that's normal; give it a few more minutes.

## www vs apex: pick one

You now have both `yourapp.com` and `www.yourapp.com` serving your app. Don't leave it that way — two live URLs split your SEO signals.

In **Settings → Domains**, Vercel lets you set a redirect from one to the other. I redirect the apex to `www` (which is also what Vercel recommends), but honestly either direction is fine. What matters is that one canonical URL answers and the other 301-redirects to it.

## When it doesn't work

**"This domain is in use by another Vercel account."** Someone (maybe you, on an old account or an old team) already attached this domain to a Vercel project. Vercel will ask you to prove ownership with a TXT record — add it at your registrar, wait a few minutes, and verification proceeds. Note the TXT record alone doesn't move the domain; it just lets your project use it.

**Stuck on pending or "Invalid Configuration" for over an hour.** Check, in order: leftover parking records at your registrar (delete them), Cloudflare proxy still on (switch to DNS only), a typo in the CNAME value (re-copy from Vercel, don't type it). To see what the internet actually sees, run `dig yourapp.com +short` — it should return `76.76.21.21`. If it returns a Namecheap parking IP, old records are still live.

**SSL errors after the domain resolves.** The certificate is issued after verification, not simultaneously. Wait 10 minutes. If it persists past an hour and you're on Cloudflare, that proxy is almost certainly on.

## Next steps

Domain connected, SSL green padlock, canonical URL picked — your app now looks like a real product. If you're wondering why that padlock matters beyond appearances (and what HTTPS actually does), that's exactly what the next guide covers. And if this DNS stuff felt like magic incantations, the upcoming DNS-for-beginners walkthrough will make records actually make sense.
