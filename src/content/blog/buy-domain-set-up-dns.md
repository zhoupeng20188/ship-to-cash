---
title: "How to Buy a Domain and Set Up DNS for the First Time (2026)"
description: "How to buy a domain and set up DNS for the first time: fair .com prices in 2026, the DNS records that actually matter, and the beginner mistakes to avoid."
pubDate: 2026-08-10
updatedDate: 2026-08-21
category: deploy
difficulty: beginner
author: "Peng Zhou"
faq:
  - question: "How much should a .com domain cost?"
    answer: "Around $10-16 per year is the fair range in 2026. Cloudflare Registrar charges $10.46 flat (registration and renewal, no markup). Be suspicious of $1-4 first-year deals — Wix sells .com at $3.95 for year one, then renews at $21.35. Always check the renewal price before buying."
  - question: "Do I need a .com, or is .dev / .io / .app fine?"
    answer: "For a product you want people to trust, get the .com if it's available — it's still the extension people type by default. If the .com is taken, .dev, .app, and .io are all legitimate for developer tools; just know they cost more and .io in particular has gotten pricey. Don't hyphenate or misspell your name just to keep the .com."
  - question: "Can I manage DNS somewhere other than where I bought the domain?"
    answer: "Yes, and it's common. You change the domain's nameservers at your registrar to point at another DNS provider (Cloudflare is the usual choice, and free). The domain stays registered at the registrar; all your DNS records then live at the DNS provider."
  - question: "I added my DNS records but the domain isn't working yet. Why?"
    answer: "Almost always one of three things: DNS propagation is still in progress (wait up to a few hours), old parking records from the registrar are conflicting with your new ones (delete them), or you're checking before your host finished verifying the domain. Run dig yourdomain.com +short to see what the internet currently sees."
---

Every side project hits the same two moments: buying the domain (easy, fun) and setting up DNS (confusing, full of acronyms). Registrars happily take your money in three clicks, then abandon you at a DNS management screen with no explanation.

I've bought domains for every project I've shipped — most recently the one this site runs on. This is the walkthrough I wish someone had handed me the first time: what to pay, where to buy, and what those DNS records actually do.

## Part 1: Buying the domain

### What a fair price looks like in 2026

A .com should cost you **$10-16 per year**. Here's what the big options charge right now (I checked registrar price lists while writing this):

| Registrar | First year | Renewal |
|---|---|---|
| Cloudflare | $10.46 | $10.46 |
| Spaceship | $9.08 | $10.18 |
| Namecheap | $15.18 (often ~$7 with a new-customer promo) | $18.68 |

Cloudflare sells domains **at cost** — $10.46 today, same price at renewal, zero markup, forever. The catch: your domain must use Cloudflare's nameservers. That's barely a catch, since Cloudflare's DNS is excellent, but know it going in.

The trap to avoid is teaser pricing. Wix will sell you a .com for $3.95 — then renew it at $21.35. Namecheap's ~$7 promo only applies to your first year as a new customer. The number that matters is always the **renewal** price, because you'll pay it for years.

One more line item to expect: ICANN, the organization that coordinates the domain system, charges a mandatory $0.20/year fee that some registrars add at checkout. That's legitimate, not a scam fee.

### The buying walkthrough (Namecheap)

I'll use Namecheap for the walkthrough since it's the most common first registrar — the flow is nearly identical everywhere:

1. Search your name on the homepage. If the .com is taken, see the FAQ below before settling for something weird.
2. Add to cart. At checkout, **decline the upsells** — you don't need their hosting, email, or SSL certificate (your host provides SSL free).
3. Do keep **Domain Privacy** on (it's free forever at Namecheap and Cloudflare). Without it, your name, address, and email are public in the WHOIS database, and the spam starts within days.
4. Turn on **auto-renew**. A lapsed domain is the dumbest way to kill a live product.
5. Pay. Done — you own a domain.

## Part 2: DNS, in plain language

DNS (Domain Name System) is the lookup system that turns `yourapp.com` into the IP address of a server. When someone visits your domain, their browser asks DNS "where does this name point?" and gets back an address.

Your job when "setting up DNS" is just editing the records that answer that question. Here are the ones that matter:

| Record | What it does | Example |
|---|---|---|
| **A** | Points a name at an IPv4 address | `yourapp.com` → `76.76.21.21` |
| **AAAA** | Same, for IPv6 | rarely needed for your first app |
| **CNAME** | Points a name at *another name* | `www.yourapp.com` → your host's address |
| **MX** | Where your email goes | set if you want you@yourapp.com |
| **TXT** | Arbitrary text, mostly for verification | proving domain ownership to Google or Vercel |
| **NS** | Which DNS provider manages the domain | more on this below |

Each record also has a **TTL** (time to live) — how long other servers may cache the answer before asking again. Leave it on "Automatic." It only matters when you're changing records and wondering why the old answer is still floating around.

### The one distinction everyone misses: nameservers vs records

Your DNS records live *somewhere* — by default, at your registrar's DNS service. The **NS records** say where that somewhere is.

So there are two completely different ways to point a domain at a host:

1. **Keep your registrar's DNS** and add A/CNAME records pointing at your host (what most tutorials show)
2. **Change the nameservers** to your host's DNS (e.g., `ns1.vercel-dns.com`), and manage records there

Both work. Option 1 gives you more flexibility; option 2 is less to think about. What you should never do is half of each — if you change nameservers to Vercel, your registrar's DNS screen becomes dead weight and edits there do nothing.

One thing neither option involves: *moving* your domain. Pointing DNS at a host is not the same as transferring the domain's registration to that host — a distinction that trips up almost everyone the first time. If you're on Vercel and wondering whether you need to transfer, [you almost certainly don't](/deploy/transfer-domain-to-vercel/).

## Part 3: Pointing the domain at your host

The generic flow, same at every host:

1. Add the domain in your host's dashboard
2. The host shows you the records it expects
3. You add those exact records at your DNS provider
4. The host verifies them and issues your SSL certificate

For the concrete click-by-click version with Vercel (including Namecheap and Cloudflare screenshots-level detail), follow my [Vercel custom domain setup guide](/deploy/vercel-custom-domain-setup/). The short version: an A record for `@` pointing at your host's IP, and a CNAME for `www` pointing at the address your host gives you.

Two rules that will save you an afternoon:

**Delete the parking records first.** Fresh domains come with records pointing at the registrar's parking page. They conflict with your new records and silently break verification.

**A CNAME can't sit at the apex.** You can CNAME `www` but not the bare `yourapp.com` — that's a DNS rule, not a registrar limitation. The apex gets an A record. (Some providers cheat with "CNAME flattening" or "ALIAS" records; if your host demands that setup, they'll tell you.)

### Did it work?

Records can take a few minutes to a few hours to propagate — the official worst case is 48 hours. To see what the internet currently thinks, run:

```bash
dig yourapp.com +short
```

If it prints your host's IP, the world sees your new record. If it prints a registrar parking IP, old records are still winning. If it prints nothing, your records didn't save.

## Mistakes I see beginners make

- **Judging registrars by the first-year price.** Renewal price is the real price. $3.95 → $21.35 is not a deal.
- **Editing records at the registrar after moving nameservers.** Once nameservers point elsewhere, the registrar's DNS screen is a museum exhibit.
- **Expecting instant results.** Propagation takes minutes to hours. Make the change, walk away, check with `dig`.
- **Turning on Cloudflare's orange-cloud proxy during host verification.** It hides your real records and the host can't verify or issue SSL. DNS-only until verified — I covered the details in the [Vercel domain guide](/deploy/vercel-custom-domain-setup/).
- **Forgetting auto-renew.** Set it the day you buy.

## Next steps

Domain bought, records pointing at your host, `dig` showing the right answer — you're set. If your host is Vercel, the [step-by-step connection guide](/deploy/vercel-custom-domain-setup/) takes it from here; if you haven't picked a host yet, I [deployed to Vercel, Netlify, and Cloudflare Pages](/deploy/vercel-vs-netlify-vs-cloudflare-pages/) and compared them honestly. Next up in this series: what HTTPS actually does and why that padlock matters more than you think.
