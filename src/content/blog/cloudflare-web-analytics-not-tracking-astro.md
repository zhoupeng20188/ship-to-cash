---
title: "Cloudflare Web Analytics Not Tracking on Astro"
description: "Cloudflare Web Analytics shows zero page views on your Astro site? Check the HTML for the beacon, then fix injection, CSP and SPA route tracking."
pubDate: 2026-11-09
category: monetize
difficulty: intermediate
author: "Peng Zhou"
image: /og-cloudflare-web-analytics-not-tracking-astro.jpg
faq:
  - question: "Does enabling Web Analytics in the Cloudflare dashboard guarantee data?"
    answer: "No. Enabling records a configuration state, not an outcome. Cloudflare's setup guide says automatic injection applies to proxied sites, that a Cache-Control header of public, no-transform prevents the proxy from modifying the response, and that for Pages projects the snippet is added on the next deployment. Check the served HTML for the beacon before waiting for data."
  - question: "Why does my Cloudflare Pages project have a separate Web Analytics toggle?"
    answer: "Cloudflare's setup guide documents a one-click path for Pages projects: Workers & Pages, select the project, then Metrics and Enable under Web Analytics. The guide says Cloudflare adds the snippet on the next deployment. A zone-level Add a site entry can exist alongside it, so confirm which setup your project actually uses."
  - question: "Do I need to add the beacon script manually if my domain is proxied through Cloudflare?"
    answer: "Usually not. For proxied sites, automatic setup is enabled by default. Cloudflare's FAQ says a DNS-only domain cannot use automatic setup and requires a manual snippet instead. It also states that only one JS snippet can be rendered and used per page, so do not enable automatic injection and paste the snippet as well."
  - question: "Does Astro's ClientRouter stop Cloudflare Web Analytics from counting navigations?"
    answer: "Cloudflare documents automatic SPA tracking through the Soft Navigations API, the Navigation API, or by patching History API pushState and listening to onpopstate. Astro's ClientRouter makes a site SPA-like and bundled module scripts run only once. Cloudflare's FAQ says additional metrics are sent for every SPA route change, so check your own network panel rather than assuming either product covers the other."
  - question: "Should I re-inject the beacon on astro:page-load like I rebind a checkout script?"
    answer: "No. Cloudflare's FAQ says only one JS snippet can be rendered and used per page, and duplicate snippets are a known cause of inflated page views. The rebind pattern used for Lemon.js or an AdSense loader applies to their own lifecycle, not to injecting a second beacon."
  - question: "What CSP entries does the Web Analytics beacon need?"
    answer: "Cloudflare's FAQ lists https://static.cloudflareinsights.com/beacon.min.js in script-src. For connect-src it says automatic injection reports to your own domain, so include 'self'; manual embedding reports to cloudflareinsights.com instead. Cloudflare recommends validating CSP changes with Content-Security-Policy-Report-Only before production."
  - question: "Is a 405 from /cdn-cgi/rum a broken integration?"
    answer: "Usually not. Cloudflare's FAQ says that endpoint only accepts POST for ingestion and that the beacon always uses POST. A GET, PUT or DELETE returning 405 typically comes from an automated testing tool, not from the beacon."
---

Cloudflare Web Analytics can be switched on and still report zero page views. The setting looks enabled, the DNS record is proxied, `cf-ray` headers appear on every response — and no beacon ever reaches the browser. Most setup tutorials stop at "enable it in the dashboard". Troubleshooting starts from the HTML your site actually serves.

Typical symptoms, in the words you will see them:

> `Page views: 0` in Web Analytics
>
> `Refused to load the script 'https://static.cloudflareinsights.com/beacon.min.js' because it violates ... script-src`
>
> `... is not allowed by Access-Control-Allow-Origin`
>
> `405 Method Not Allowed` from `/cdn-cgi/rum`

This is a documentation-based checklist, not a report of a live analytics account: the commands are checks you run against your own build, and no page-view figures here are measured results. Dashboard labels and product behaviour change, so verify each claim against the linked Cloudflare and Astro docs. ShipToCash uses a static Astro build; Web Analytics is not claimed as configured on it.

## First: prove the beacon is in the response

Before opening the dashboard again, answer the only question that decides the next step:

```sh
curl -s https://your-domain.example/ | grep -c cloudflareinsights
```

A `0` means there is no script in the HTML. That is an injection problem, not a data problem, and waiting will not fix it. A developer described exactly this in a [public account of three months with zero page views](https://dev.to/heistatlas/cloudflare-web-analytics-on-pages-three-months-of-zero-page-views-and-the-toggle-that-was-5b69): the zone-level entry showed "Automatic setup", the response headers looked right, and `grep -c` returned `0`. Enabling the Pages-level toggle and doing one deploy made the beacon appear. That is a community observation, not a Cloudflare statement — the official wording is in [the setup guide](https://developers.cloudflare.com/web-analytics/get-started/).

Run the inverse check too:

```sh
curl -s https://your-domain.example/ | grep -o 'cloudflareinsights' | wc -l
```

Two or more hits deserve investigation. Cloudflare's FAQ says only one JS snippet can be rendered and used per page, and multiple snippets are a documented cause of inflated page views.

Run both against `dist/` before a deploy and the public URL after it. One extra `grep` in CI turns a silent months-long failure into a build-day failure. A badge describes configuration; the outcome is a non-zero page-view count in the last 24 hours.

## Cause 1 — the beacon was never injected (most common)

[Cloudflare's setup guide](https://developers.cloudflare.com/web-analytics/get-started/) describes three paths, and they are not interchangeable:

| Where the site runs | How the beacon appears | Silent failure mode |
|---|---|---|
| Not proxied through Cloudflare | Copy the JS snippet from **Manage site**, add it before `</body>` | Only pages rendering the snippet report data |
| Proxied through Cloudflare | **Add a site** → automatic setup, enabled by default | `no-transform` blocks edge injection; DNS-only needs manual |
| Cloudflare Pages project | **Workers & Pages → project → Metrics → Enable** | Applies on the **next deployment**, not instantly |

For proxied sites, **Manage Site** offers four states: Enable, Enable excluding visitor data in the EU, Enable with JS Snippet installation, and Disable. Automatic setup injects on all pages under the zone unless Rules restrict it; manual setup reports only pages rendering the snippet. One Astro page that never imports the component quietly shows nothing.

The guide also flags `Cache-Control: public, no-transform`: the proxy cannot modify such a response, so the beacon is not injected. The FAQ adds that automatic setup requires a proxied (orange-clouded) domain and valid HTML — a bare string instead of a document receives no snippet. If your domain is DNS-only, [check how the nameservers are actually set](/deploy/buy-domain-set-up-dns/) before debugging JavaScript.

If you choose the manual route, keep the snippet out of preview builds. An illustrative Astro component shape:

```astro
---
// src/components/CloudflareBeacon.astro — illustrative shape
const token = import.meta.env.PUBLIC_CF_BEACON_TOKEN;
const enabled = import.meta.env.PROD && Boolean(token);
---
{enabled && (
  <script
    is:inline
    type="module"
    src="https://static.cloudflareinsights.com/beacon.min.js"
    data-cf-beacon={`{"token": "${token}"}`}
  ></script>
)}
```

The token is a site identifier in public HTML, not a secret. Gate it to production so preview clicks do not land in the same dataset; a developer's [write-up on replacing Google Analytics](http://blog.gmacario.it/posts/2026-07-25-cloudflare-web-analytics-instead-of-google-analytics) uses a build-time variable for that reason. An attribute beyond `src` already makes a script unprocessed under [Astro's script rules](https://docs.astro.build/en/guides/client-side-scripts/), but check the emitted HTML rather than reasoning about opt-outs. Never paste a snippet onto an active automatic setup.

[Cloudflare Pages environment variables that look set but arrive undefined](/deploy/cloudflare-pages-environment-variables-not-working/) fail in a similar way: a dashboard value with no effect on the built output. Check the artifact, not the control panel.

## Cause 2 — the beacon is present but its request is blocked

Once the tag is in the HTML, the next suspect is the browser refusing to load or send it. Cloudflare's [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/) names the cases.

**CSP.** Add the script to `script-src`, then allow the reporting endpoint in `connect-src`:

```txt
script-src  'self' https://static.cloudflareinsights.com/beacon.min.js
connect-src 'self'
```

`'self'` is for automatic injection, which reports to your own `/cdn-cgi/rum`; a manual snippet reports to `cloudflareinsights.com`, so `connect-src` needs that host instead. With the query-string token form the FAQ says `script-src` must include the query string too. Cloudflare recommends `Content-Security-Policy-Report-Only` first. A strict `script-src 'self'` blocks the beacon — a policy conflict, not a tracking bug. As with [a CORS error on a deployed app](/deploy/cors-error-vercel/), read the exact blocked URL before widening a policy.

**Hostname mismatch.** The FAQ says a CORS error usually means the hostname loading the analytics does not match the site configured in the dashboard. Cloudflare matches by postfix: a site set up as `example.com` allows `www.example.com` and `blog.staging.example.com`, but not `example.com.br`. A missing `Referer` header can produce the same error. Compare the hostname you typed with the hostname in the browser, including `www`.

**Content blockers.** The FAQ acknowledges the beacon is blocked by ad blockers including Adblock Plus, Brave and the DuckDuckGo extension. Test in a clean browser profile before concluding your integration is broken. Edge analytics, measured at the proxy, are a different dataset and are not affected.

**A misleading 405.** `/cdn-cgi/rum` accepts only `POST`; the beacon always uses `POST`. If logs show `405 Method Not Allowed`, the FAQ attributes those requests to an automated testing tool, not the beacon. Do not "fix" a 405 by changing the integration.

## Cause 3 — the beacon works but client-side navigation makes the numbers wrong

This is the layer most Astro tutorials leave open. Cloudflare's [SPA tracking page](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/) says Web Analytics automatically tracks route changes by one of three methods, whichever the browser supports: the Soft Navigations API, `navigate` events via the Navigation API, or patching History API `pushState` plus `onpopstate`. The FAQ adds that a traditional site reports on load and when the user leaves, while an SPA sends additional metrics for every route change.

Astro's [view transitions guide](https://docs.astro.build/en/guides/view-transitions/) explains the other half. By default every link triggers a full browser navigation; adding `<ClientRouter />` turns the site into an SPA-like experience. Bundled module scripts execute only once, and the router keeps existing `<head>` scripts that also exist on the new page — which is not the same as re-running them. The lifecycle event for work that must happen on every navigation is `astro:page-load`.

Two consequences are worth separating:

1. **You probably do not need to re-inject anything.** Cloudflare documents automatic SPA tracking, and its FAQ allows only one snippet per page. Copying a rebind pattern here would create duplicate beacons and inflated counts.
2. **You still have to verify it.** A personal [Astro analytics write-up](http://blog.gmacario.it/posts/2026-07-25-cloudflare-web-analytics-instead-of-google-analytics) says the author had not confirmed whether the beacon counts in-page navigations under view transitions. Cloudflare's docs describe SPA support generally and do not name `ClientRouter`. Navigate between three internal pages with the Network panel open and watch for route-change payloads — a test to run, not a result to assume.

The rebind pattern belongs to scripts that own their own listeners. Three examples already on this site use `astro:page-load` for exactly that: [Lemon.js needs a Refresh() call after a View Transitions swap](/payments/lemon-squeezy-checkout-astro-static-site/), [an AdSense loader needs its own lifecycle check](/monetize/google-adsense-on-astro/), and [a Stripe buy button relies on custom-element upgrades](/payments/stripe-payment-link-astro-static-site/). A beacon injected at the edge is a different object with a different rule: one per page.

If you deliberately want SPA tracking off, the official syntax is `data-cf-beacon='{"token": "...", "spa": false}'` on a manually embedded script, or `?token=...&spa=false` for the Google Tag Manager form. Both require the manual embedding path.

## How to confirm it is actually fixed

| Layer | Check | Pass condition |
|---|---|---|
| Build | `grep -c cloudflareinsights dist/index.html` | Exactly one snippet |
| Public | `curl -s https://your-domain.example/ \| grep -o 'beacon.min.js'` | Present after a real deploy |
| Browser | Network filter `cloudflareinsights` / `cdn-cgi/rum` | Script loads, POST succeeds, no CSP or CORS error |
| Routes | Click through three internal links with `ClientRouter` on | Additional route-change payloads appear |
| Dashboard | Page views in the last 24 hours | Non-zero, from a clean browser profile |

Keep the layers separate: a green badge, a correct HTML file, a successful browser request and real page views are four different pieces of evidence, and one does not imply the next.

## What the numbers do not tell you

Web Analytics is cookieless and measures page views, referrers and Core Web Vitals. It cannot tell you whether a visitor bought anything, and a zero-data dashboard is a measurement failure, not proof the content has no value. If you are resolving a rejection, [audit the content before reapplying](/monetize/adsense-low-value-content-rejected/) on its own track. Once traffic is real, [page views are not customers](/monetize/get-first-customers-developer-template/) — compare against orders, not impressions.

## What I'd do in your position

1. Run both `curl` greps against the live URL. If the beacon is absent, stop debugging the browser.
2. Pick the setup path for your host. On Pages, enable it in the project's Metrics tab and deploy once.
3. Rule out `no-transform`, a DNS-only record, and a snippet covering only some pages.
4. If the tag is present, use a clean browser profile and fix CSP, hostname or blocker issues from the console.
5. With `<ClientRouter />`, verify route-change payloads before adding lifecycle code. Add the CI grep last so a future deploy cannot silently remove it.

Analytics is a dependency like any other: if you cannot see it in the response, it is not there. Once measurement is trustworthy, the next decision is commercial, not technical.
