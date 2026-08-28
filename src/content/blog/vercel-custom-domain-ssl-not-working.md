---
title: "Vercel Custom Domain SSL Not Working: Redirect Loop & DNS Fixes"
description: "Your Vercel domain shows 'not secure', throws a redirect loop, or stays pending? Here are the exact fixes for SSL cert errors, too-many-redirects, and DNS that won't propagate — including the Cloudflare setting that causes most of them."
pubDate: 2026-08-28
updatedDate: 2026-08-28
category: deploy
difficulty: intermediate
author: "Peng Zhou"
faq:
  - question: "Why is my Vercel custom domain showing 'not secure'?"
    answer: "Because Vercel can't issue the free SSL certificate until your DNS actually points at Vercel. Open the Domains tab in your project — if the domain says 'Invalid Configuration' or 'Pending', the A/CNAME records haven't propagated yet, or the CNAME value is wrong. Once DNS is correct, the cert usually appears within a few minutes."
  - question: "How long does a Vercel SSL certificate take to activate?"
    answer: "Once your DNS records correctly point at Vercel, the certificate is typically issued in 1–15 minutes. If it's been more than an hour, the DNS records are almost certainly still wrong or not propagated — check them at whatsmydns.net rather than waiting."
  - question: "How do I fix a Vercel redirect loop (too many redirects)?"
    answer: "In nine cases out of ten it's a Cloudflare SSL/TLS mode set to 'Flexible'. Cloudflare then talks to Vercel over plain HTTP, Vercel forces HTTPS, and the browser bounces forever. Change Cloudflare SSL/TLS → Overview to 'Full (strict)'. Also make sure you're not running a redirect rule in both Cloudflare and Vercel at the same time."
  - question: "Do I need to buy an SSL certificate for a Vercel domain?"
    answer: "No. Vercel provisions and renews a valid SSL certificate automatically for every domain you add — free, including the renewal. You never buy or upload one. If you're hitting an SSL error, it's a DNS or proxy misconfiguration, not a missing certificate."
---

You followed the [Vercel custom domain setup guide](/deploy/vercel-custom-domain-setup/), pasted the DNS records, waited… and instead of your site you get a browser warning that the connection is "not secure," or the page reloads until Chrome gives up with "ERR_TOO_MANY_REDIRECTS," or the domain just sits there saying "Pending Verification" forever.

I've done all three. The worst was the redirect loop: I'd set up Cloudflare, flipped one dropdown, and spent an hour convinced Vercel was broken — it wasn't. None of these are a missing certificate. Vercel gives you a valid, auto-renewing SSL cert for free on every domain. When it "isn't working," it's almost always that your DNS or proxy settings are stopping Vercel from either issuing the cert or serving it correctly.

Here's the exact fix for each symptom, in the order I'd check them.

## Symptom → cause quick index

| What you see | Most likely cause | Jump to |
|---|---|---|
| "Not secure" / `NET::ERR_CERT_AUTHORITY_INVALID` | DNS not pointing at Vercel yet, so no cert can be issued | [Cert error](#cert-error) |
| `ERR_TOO_MANY_REDIRECTS` (redirect loop) | Cloudflare SSL mode = Flexible, or double redirect rules | [Redirect loop](#redirect-loop) |
| Domain says "Pending Verification" / "Invalid Configuration" | CNAME/A value wrong, or DNS not propagated | [Stuck pending](#stuck-pending) |
| Site loads but some assets blocked | Mixed content (HTTP resource on HTTPS page) | [Mixed content](#mixed-content) |

## Cert error: "not secure" on your domain {#cert-error}

### What's actually happening

Vercel requests the SSL certificate *from the certificate authority* only after it can see your domain resolving to Vercel's servers. If the DNS records aren't correct yet, there's nothing to put a certificate on, and your browser shows the site as not secure.

### Step 1: Check the domain status in Vercel

1. Open your project in Vercel → **Settings → Domains**.
2. Look at the status badge next to your domain.
   - **"Valid Configuration"** with a green check → DNS is fine; the cert should follow within minutes.
   - **"Invalid Configuration"** or **"Pending"** → stop here and fix DNS (see [Stuck pending](#stuck-pending) below). The cert error is a *symptom* of bad DNS, not a separate problem.

### Step 2: Confirm the records Vercel is asking for

Vercel shows the exact records it wants at the bottom of that Domains panel. As of 2026 they are:

- **Apex (yourdomain.com):** an `A` record pointing to `76.76.21.21`
- **www:** a `CNAME` record pointing to `cname.vercel-dns.com`

I once typed `your-app.vercel.app` into the CNAME instead of `cname.vercel-dns.com` because it "looked more correct." It isn't — use the `cname.vercel-dns.com` value Vercel prints, exactly.

### Step 3: Wait for propagation (or verify it)

DNS changes can take minutes to a few hours depending on the registrar's TTL. Check whether the world can see your records at [whatsmydns.net](https://whatsmydns.net) — enter your domain, pick `A` or `CNAME`, and watch the map turn green. Only when records show Vercel's values globally will the cert issue.

<a id="redirect-loop"></a>
## Redirect loop: ERR_TOO_MANY_REDIRECTS {#redirect-loop}

This is the one that feels like Vercel is broken but almost never is.

### The cause I see most: Cloudflare "Flexible" SSL

If your domain sits behind Cloudflare (orange cloud active), the **SSL/TLS mode** controls how Cloudflare talks to Vercel:

- **Flexible:** Cloudflare serves HTTPS to your visitor but connects to Vercel over plain **HTTP**.
- Vercel sees an HTTP request and responds with a redirect to HTTPS.
- Cloudflare receives that HTTPS redirect, but its Flexible mode sends the next request to Vercel over HTTP again.
- Repeat forever → `ERR_TOO_MANY_REDIRECTS`.

### Step 1: Switch Cloudflare to Full (strict)

1. In Cloudflare, open your domain → **SSL/TLS → Overview**.
2. Change the mode from **Flexible** to **Full (strict)**.
3. Hard-refresh your browser (Cmd/Ctrl + Shift + R). The loop usually stops within seconds.

`Full (strict)` makes Cloudflare connect to Vercel over HTTPS using Vercel's real certificate — no loop. (Cloudflare's own "Full" also works; "Full (strict)" additionally validates the cert, which is the safer default.)

### Step 2: Check for double redirects

The second cause is running a redirect in *both* places:

- In **Cloudflare**: **Rules → Redirect Rules** (or Page Rules) sending `www` → apex, or apex → `www`.
- In **Vercel**: the **Domains** panel, where you pick which version is primary and Vercel redirects the other.

If both are enforcing the same redirect, you get a loop. Pick one system to own the redirect and leave the other alone. My rule: let **Vercel** handle the www↔apex redirect (it's one click in the Domains panel) and keep Cloudflare redirect rules empty unless I have a specific reason.

<a id="stuck-pending"></a>
## Stuck pending: "Invalid Configuration" or "Pending Verification" {#stuck-pending}

The domain never leaves "Pending." This is purely a DNS problem — Vercel can't confirm you control the domain.

### Step 1: Verify the CNAME value

If you added a `www` CNAME, the value must be exactly `cname.vercel-dns.com` — **not** your project's `.vercel.app` URL. This is the single most common typo.

### Step 2: Verify the apex A record

The root domain needs an `A` record at `76.76.21.21`. If you pointed it at an old IP from a tutorial, or at a different host, Vercel can't verify it.

### Step 3: Check for a CAA record blocking issuance

A `CAA` DNS record tells certificate authorities which ones may issue certs for your domain. If a previous host left a CAA record that only allows *their* CA (e.g. `letsencrypt.org` missing, or allowing only a specific provider), Vercel's CA can be blocked. Either delete the restrictive CAA record or add one allowing Vercel's CA. Most domains have no CAA record at all, which is fine — the problem only appears if one exists and is too narrow.

### Step 4: Re-check propagation, then re-trigger

1. Confirm records at [whatsmydns.net](https://whatsmydns.net).
2. Back in Vercel **Settings → Domains**, click the **⋯** next to the domain and choose **Re-verify** (or remove and re-add the domain — that forces a fresh check).

If records are globally correct and it's still pending after an hour, the registrar may be holding the change (some registrars impose a 60-minute default TTL on new records) — wait it out rather than editing further, because repeated edits reset the clock.

<a id="mixed-content"></a>
## Mixed content: site loads but assets are blocked {#mixed-content}

Less common after setup, but worth knowing: if the page loads with a padlock that's struck through, some resource is still being requested over `http://`. Browsers block mixed content on an HTTPS page. This usually means an image, font, or script URL in your code hard-codes `http://` instead of `https://`, or a third-party widget does. Fix it at the source (change the URL to `https://` or protocol-relative `//`) — it's not a Vercel DNS issue.

## FAQ

### "My domain worked yesterday and broke today — what changed?"

Almost always a DNS edit or a Cloudflare setting someone touched. Re-read the [redirect loop](#redirect-loop) and [stuck pending](#stuck-pending) sections; one small toggle is the usual culprit. Vercel doesn't silently revoke working certs.

### "Can I use my own certificate instead of Vercel's?"

On Pro and above you can upload a custom certificate, but for a personal or indie project there's no reason to. Vercel's automatic cert is valid and renews itself. If you're hitting an SSL error, the fix is DNS/proxy config above — uploading a cert won't help if the records still don't point at Vercel.

## Next steps

Most of these errors trace back to one root cause: DNS not quite pointing at Vercel, or Cloudflare sitting in the middle with the wrong SSL mode. Walk the [custom domain setup guide](/deploy/vercel-custom-domain-setup/) end to end if you set the records up from memory — it has the exact Namecheap and Cloudflare values side by side. If you bought the domain somewhere else and are wondering whether to move it, you don't have to: [pointing DNS is enough](/deploy/transfer-domain-to-vercel/), and transferring can actually reset your records and bring all this back. And no, none of this means you need to [buy an SSL certificate](/deploy/do-i-need-to-buy-ssl-certificate/) — Vercel's is free and automatic.
