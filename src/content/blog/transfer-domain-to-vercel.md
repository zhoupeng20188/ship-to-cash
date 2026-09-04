---
title: "How to Transfer a Domain to Vercel (and Whether You Should)"
description: "Thinking of moving your domain to Vercel? Here's the catch most guides skip: you probably don't need to. Transfer vs DNS-only, when to do each, and the exact steps."
pubDate: 2026-08-17
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-transfer-domain-to-vercel.jpg
faq:
  - question: "Do I need to transfer my domain to Vercel to use it?"
    answer: "No. You can keep the domain at your current registrar (Namecheap, Cloudflare, GoDaddy) and just point DNS records at Vercel. The domain stays where it is; only the DNS routing changes. Transferring is optional and only worth it if you want Vercel to be your registrar too."
  - question: "How long does a domain transfer to Vercel take?"
    answer: "Usually 5–7 days. The delay isn't Vercel being slow — it's the losing registrar and the domain registry. ICANN rules also lock a domain for 60 days after certain changes, which can block a transfer entirely if you just renewed or edited contacts."
  - question: "Can I transfer a domain I bought less than 60 days ago?"
    answer: "No. ICANN forbids transferring a domain within 60 days of registration or a previous transfer. You'll have to wait it out, or just use DNS-only pointing in the meantime (which works immediately)."
  - question: "Will transferring my domain break my email?"
    answer: "It can. If your email runs on MX records at your old registrar (Google Workspace, Zoho, a forwarded inbox), those records don't automatically follow the domain to Vercel. You must re-add them after the transfer, or your mail stops. DNS-only pointing avoids this risk entirely."
  - question: "Is Vercel a good domain registrar?"
    answer: "It's convenient if Vercel is already your whole stack, but as a registrar it's thinner than Cloudflare or even Namecheap — fewer TLDs, weaker DNS tooling, and less competitive renewal pricing. I keep my domains at Cloudflare and point DNS at Vercel. Best of both."
  - question: "How do I transfer a domain to Vercel step by step?"
    answer: "Unlock the domain at your current registrar, get the EPP/auth code, paste it into Vercel's Domains tab under Transfer, approve the confirmation emails from both registrars, then wait 5–7 days. After it completes, re-add any MX and TXT records the transfer dropped — otherwise your email or verification can break."
---

You just deployed your app. Vercel's dashboard is nudging you: **"Add your domain."** So you go looking for a *Transfer* button, assuming you need to move the domain into Vercel.

I did exactly this the first time. Spent 20 minutes hunting for a transfer flow, convinced I'd break something if I didn't. Then I realized Vercel didn't need my domain at all — it just needed two DNS records pointing at it.

This guide clears up the confusion, because the "transfer vs point DNS" decision trips up almost everyone, and getting it wrong wastes a week of waiting (and can quietly kill your email).

## The short answer

**You almost certainly do NOT need to transfer your domain to Vercel.** You need to *point* it at Vercel using DNS records. The domain stays at your registrar; only the traffic routing changes.

Transferring is a different, heavier operation: it moves the domain's *registration* from your current registrar into Vercel. That's only worth it in a few specific cases (below). For a first app, skip it.

If you haven't deployed yet, start here: [my 15-minute Vercel deploy guide](/deploy/deploy-first-app-vercel/). If you already have a domain and just want it on your app, the DNS-only path is here: [connect a custom domain to Vercel with Namecheap & Cloudflare](/deploy/vercel-custom-domain-setup/).

## The difference, in plain terms

Think of your domain like your home address.

- **Pointing DNS** = telling the post office "deliver my mail to this new building." Your address (domain) is still registered to you at the same city hall (registrar). You just updated where mail goes.
- **Transferring** = moving your address registration from one city hall to another. Same address, but now a different office handles your renewal, your records, everything.

For 95% of vibe coders, you want the first one. The second is administrative overhead you don't need yet.

Here's the concrete comparison:

| | DNS-only pointing | Full transfer to Vercel |
|---|---|---|
| Domain stays at current registrar | ✅ | ❌ (moves to Vercel) |
| Works in | ~10 min (DNS propagation) | 5–7 days |
| Email (MX) affected? | No | Yes — must re-add |
| Renewal price | Your registrar's | Vercel's (often higher) |
| DNS features (proxy, etc.) | Full control at registrar | Limited to Vercel's tooling |
| Good for | Everyone deploying an app | People who want one dashboard |

## What "transfer" actually means

A domain has two separate things attached to it:

1. **Registration** — who legally owns it and pays to renew it (your registrar: Namecheap, Cloudflare, GoDaddy).
2. **DNS** — the records that say where the domain points (can live at the registrar or elsewhere).

*Pointing DNS* changes #2 only. *Transferring* changes #1 — it moves the registration itself from registrar A to registrar B (Vercel, in this case). The DNS can follow, but the ownership record is what actually moves.

That's why a transfer takes days and a DNS change takes minutes: you're not just editing a setting, you're re-registering the domain under a new company, and ICANN rules deliberately slow that down to prevent fraud.

## When you SHOULD transfer to Vercel

Three situations where it's actually the right call:

**1. You want one bill and one login for everything.** If Vercel is your host, your CI, and now your domain, some people prefer not to also keep a Namecheap tab open. Fair. Just know the trade-off (pricing, DNS features) below.

**2. Your current registrar is a nightmare.** I've met people on registrars with predatory renewal pricing or a dashboard from 2009. Moving to Vercel (or Cloudflare) is reasonable then — though Cloudflare is the better registrar target for most.

**3. You bought the domain *through* Vercel originally.** Then it's already there; nothing to transfer. This guide is for domains bought elsewhere.

## If you still want to transfer: the steps

Fine. Here's the real flow — slower and fussier than pointing DNS. If you're not sure you actually need this, read the DNS-only section below first.

### Step 1: Unlock the domain at your current registrar
Look for "Registrar lock" or "Transfer lock" and disable it. Namecheap hides this under **Domain List → Manage → Sharing & Transfer**. Cloudflare has it under **Registration → Configuration**.

### Step 2: Get the authorization (EPP) code
This is the password that proves you own the domain. Namecheap emails it to you on request; Cloudflare shows it in the same transfer settings panel.

### Step 3: Start the transfer in Vercel
In Vercel, go to the Domains tab and choose Transfer. Enter the domain and paste the auth code. Vercel checks eligibility — if it's within the 60-day lock or has a recent contact edit, it'll reject you here.

### Step 4: Approve the confirmation emails
Both your old registrar and the registry send confirmation links. Ignore them and the transfer stalls. Click through within a few days.

### Step 5: Wait 5–7 days
You'll get a completion notice. Don't touch DNS during this window or you can reset the clock.

### Step 6: Re-add anything the transfer dropped
This is the part people forget. After the transfer:
- Re-create your **MX records** if you have domain email.
- Re-create any **TXT records** (SPF, DKIM, verification codes).
- Double-check the A/CNAME still point at Vercel.

## When you should NOT transfer

The default case. Specifically:

- **You use Cloudflare for DNS.** Keep it. Cloudflare's DNS, proxy, and free SSL beat Vercel's registrar tooling. Point DNS at Vercel and leave the domain at Cloudflare. I do this for every project, including this site.
- **Your email runs on your domain.** Transferring forces you to rebuild MX records at Vercel or your mail dies. DNS-only pointing leaves email untouched.
- **You registered the domain less than 60 days ago.** ICANN locks it. You literally can't transfer yet — and pointing DNS works right now, so there's no reason to wait.
- **You just want the app live.** Then you need DNS records, not a registrar change. Full stop.

The biggest trap: people transfer *because they think they have to*, then spend a week waiting, then discover their contact form's email stopped working because the MX records didn't follow. DNS-only avoids all of it.

## If you go DNS-only (recommended): the 10-minute path

You're done here — this is covered step by step in [the custom domain setup guide](/deploy/vercel-custom-domain-setup/). Quick version:

1. In Vercel **Settings → Domains**, add your domain. Copy the **A record** (`76.76.21.21`) and your project-specific **CNAME**.
2. At your registrar, add those two records. Clean up old parking records first.
3. Wait 5–30 min. Vercel issues the SSL cert automatically.

No transfer, no waiting period, email keeps working.

## After a transfer: what changes

- **Renewal** now goes through Vercel. Check the price — Vercel's renewal isn't always cheaper than where you started.
- **DNS editing** happens in Vercel's dashboard, which is fine for simple records but lacks Cloudflare's proxy, page rules, and analytics.
- **Support** for domain issues now routes through Vercel, not your old registrar.

None of this is catastrophic. It's just more than most first-app deployments need.

## My recommendation

Point DNS. Don't transfer.

The only reason to transfer is convenience — one fewer account — and the cost is a 5–7 day wait, possible email downtime, and weaker DNS tooling. For a side project you're still iterating on, that's a bad trade.

Keep the domain at Cloudflare (cheapest renewals, best DNS, free proxy) and point it at Vercel. You get Vercel's deploy experience with Cloudflare's infrastructure behind it. That's the setup I run, and the one I'd hand any friend deploying their first app.

## Next steps

Domain pointed at Vercel and SSL green? Good — your app now has a real URL. The next thing worth doing is making sure people can actually *find* it: [SEO basics for new sites](/deploy/) covers the few things that move the needle when you're starting from zero.
