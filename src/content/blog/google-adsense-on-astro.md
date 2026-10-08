---
title: "Google AdSense on Astro: 5 Reasons Your Ads Never Show"
description: "I added Google AdSense to my Astro site and the ads only showed on the first page. Five Astro-specific reasons, from is:inline to View Transitions and CSP."
pubDate: 2026-10-08
category: monetize
difficulty: intermediate
author: "Peng Zhou"
image: /og-google-adsense-on-astro.jpg
faq:
  - question: "Do I need an ads.txt file for AdSense to work at all?"
    answer: "Ads will technically serve without it, but Google has been moving to require it, and the dashboard will warn 'Earnings at risk' until it finds your publisher ID at the domain root. Many advertisers now bid only on ads.txt-verified inventory, so missing it can quietly cut a large share of your revenue. In Astro you create public/ads.txt and it is copied to the site root automatically."
  - question: "Why do my AdSense ads show on the first page but disappear after I navigate?"
    answer: "You enabled Astro client-side routing (ClientRouter or the older ViewTransitions component). That makes navigation SPA-like: the browser does not do a full reload, so the head script that loads AdSense runs once and never fires again. Re-trigger it on the astro:page-load event, which fires on the initial load and on every client-side navigation."
  - question: "Can I just paste the AdSense script into an Astro component like a normal script tag?"
    answer: "Not without is:inline. By default Astro bundles and processes every script tag as a local module — TypeScript, deduping, type=module. A remote URL like pagead2.googlesyndication.com has nothing to bundle, so Astro either fails at build or emits an empty module and the ad script never loads. Add is:inline so Astro copies the tag to the HTML exactly as written."
  - question: "Will AdSense work if I deploy my Astro site to Cloudflare Pages or Vercel?"
    answer: "Yes. AdSense needs no backend — it is a script plus a text file. Anything in your project's public/ folder is copied verbatim to the deploy root, so public/ads.txt becomes https://yourdomain.com/ads.txt and public/ is where your _headers or security-header config usually lives too. The platform only matters for where you set CSP and cache headers."
  - question: "My dashboard says 'Earnings at risk' — what does that mean?"
    answer: "Almost always ads.txt: either the file is missing at the domain root, or the publisher ID in it does not match the one in your ad code. It can also appear if you put ads.txt on www.example.com but your canonical site is example.com. Fix the file, then allow up to 24–48 hours for Google to crawl it and clear the warning."
  - question: "Can I click my own AdSense ads to see if they work?"
    answer: "No. Self-clicks are invalid traffic and a fast route to a disabled account. Gate the ad script behind import.meta.env.PROD so it never ships to your dev server, and verify in an incognito window on a different network or by asking a friend. Seeing no ads on your own IP is normal — ad targeting and policy often suppress them for the publisher."
---

I added Google AdSense to my Astro site the way every generic tutorial told me to: copy the snippet into the `<head>`, drop an ad unit where I wanted it, deploy. The dashboard flipped to "Active." Then three days passed with almost no impressions, a few ad slots rendered as empty boxes, and a yellow "Earnings at risk" banner appeared. None of the top search results mentioned any of this, because they were all written for WordPress and plain HTML.

Astro is not plain HTML. The framework does things to your `<script>` tags and your static files that a vanilla tutorial never accounts for. Here are the five Astro-specific reasons your AdSense ads don't show — in the order I hit them.

If you already wired up [Lemon Squeezy checkout on your Astro site](/payments/lemon-squeezy-checkout-astro-static-site/), AdSense is the slower second revenue stream; checkout pays per sale, ads pay per view, and you'll wait weeks for the latter to matter.

## 1. Astro bundled your script and broke the remote URL

This is the one that cost me the most time, and it is the one no AdSense guide mentions because no AdSense guide is written for Astro.

By default, Astro [processes every `<script>` tag](https://docs.astro.build/en/guides/client-side-scripts/) in your components. It treats them as local modules: it adds TypeScript support, bundles imports, marks them `type="module"`, dedupes them, and even auto-inlines small ones. That is great for your own interactivity code. It is fatal for a third-party script.

When you paste this without thinking:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" crossorigin="anonymous"></script>
```

Astro sees a `<script>` with no `is:inline` and decides it is a local module to bundle. There is nothing local to bundle — the `src` points at Google's CDN — so the build either fails or, worse, emits an empty module and the ad loader never actually loads. Your dashboard says active because the *tag* is there; it just does nothing.

The fix is one directive:

```html
<script is:inline async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
  crossorigin="anonymous"></script>
```

`is:inline` tells Astro to copy the tag into the HTML **exactly as written** — no bundling, no TypeScript transform, no module wrapping. This applies to any external script (analytics, fonts, pixels), not just AdSense. If the script lives outside your `src/` folder, it needs `is:inline`.

One detail worth knowing: the modern snippet uses `?client=ca-pub-...` as a query parameter. The old `data-ad-client` attribute still appears in screenshots from 2022 tutorials; Google deprecated it in favor of the `client` param, so use the URL form above.

## 2. ads.txt lives in public/, not where you think

Google requires `ads.txt` to be served from the [**root of your domain**](https://support.google.com/adsense/answer/1053208): `https://example.com/ads.txt`. Not a subfolder, not `https://example.com/blog/ads.txt`. Miss this and the dashboard shows "Earnings at risk," and — the part that actually hurts — a growing share of advertisers only bid on ads.txt-verified inventory, so your fill rate drops even when everything else is correct.

In a normal static site this means "upload the file to the root of your hosting." In Astro it means something more specific: **put it in `public/`.** Astro copies the entire `public/` folder verbatim to the build output root. So `public/ads.txt` becomes `https://yourdomain.com/ads.txt` automatically. Put it anywhere else — `src/`, a component folder — and it either won't be copied or won't land at the root.

The file contents are one line (replace the ID with your own):

```text
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

Two traps here:

- **www vs non-www.** If your canonical site is `example.com`, the file must be reachable at `example.com/ads.txt`. If you parked it on `www.example.com/ads.txt` but your canonical is the bare domain, Google won't find it. Set up a redirect or serve it on both.
- **The pub ID must match your ad code.** A typo or a copied ID from a tutorial leaves the warning up indefinitely. Copy it from your own AdSense account, not from a blog post.

Before you monetize with ads, [price the thing you're actually selling](/monetize/how-to-price-a-developer-template/) — at low traffic, a $49 template earns more in one sale than ads earn in a month, and ads-only thinking is how dev sites stay broke.

## 3. View Transitions silently kill ads on the second page

This was the most confusing one. Ads showed on the first page load, then went completely blank on every page I navigated to. No error in the dashboard, no console message, just emptiness.

The cause: I had enabled Astro [client-side routing](https://docs.astro.build/en/guides/view-transitions/) — `<ClientRouter />` in Astro 5, or the older `<ViewTransitions />` component in 3 and 4. That makes navigation feel like a native app: clicking a link swaps the page content via a DOM diff instead of a full browser reload. The benefit is the smooth transition. The side effect is that scripts in your `<head>` run **once**, on the first load, and are never re-executed on client-side navigation.

AdSense's auto-ads script fires on that first load and then sits there. When you navigate, the new page's ad slots render, but nothing tells AdSense to fill them, so they stay empty. If enabling client-side routing also gave you 404s on hard refresh, that is a separate [client-side routing issue](/deploy/client-side-routing-404-vercel-netlify-cloudflare/) — the two often appear together because both come from the same SPA-style navigation.

The fix is to re-trigger the loader on `astro:page-load` — an event Astro fires on the initial load *and* on every client-side navigation:

```html
<script is:inline>
  document.addEventListener('astro:page-load', () => {
    if (window.adsbygoogleloaded) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456';
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    window.adsbygoogleloaded = true;
  });
</script>
```

If you use manual ad units (`<ins class="adsbygoogle">` blocks), you also need to re-push them on that same event:

```html
<script is:inline>
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll('.adsbygoogle').forEach(el => {
      if (!el.dataset.adDone) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.dataset.adDone = 'true';
      }
    });
  });
</script>
```

The `data-adDone` guard prevents double-pushing the same unit when the user navigates back and forth. There is also a shorthand: adding `data-astro-rerun` to an inline script forces it to re-execute after every transition, which works for the loader but still needs the per-unit guard for manual units.

## 4. Your own CSP blocks pagead2

If you set a Content-Security-Policy on your Astro site — common for anyone who has read about hardening static sites, and usually applied through a `_headers` file or your platform's dashboard — a strict policy will silently block AdSense. No visible error on the page, just blank ad slots and a console message only a developer would open.

AdSense loads scripts, iframes, images, and makes network calls [across several Google domains](https://support.google.com/adsense/answer/16283098?hl=en). Your CSP must allow them in the relevant directives:

```text
script-src  'self' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.gstatic.com https://*.googleadservices.com;
frame-src   'self' https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net;
img-src     'self' https://*.googlesyndication.com https://*.gstatic.com https://*.google.com data:;
connect-src 'self' https://*.googlesyndication.com https://*.google.com https://*.googleadservices.com https://*.doubleclick.net;
```

The inline push script — `(adsbygoogle = window.adsbygoogle || []).push({})` — is an inline script, so unless you move it into an external file you also need `script-src` to permit `'unsafe-inline'`, or issue a nonce. Most AdSense setups accept `'unsafe-inline'` for script-src because the push snippet is inherently inline.

This is the same class of mistake as [a Cloudflare Pages environment variable that never reaches the runtime](/deploy/cloudflare-pages-environment-variables-not-working/): you set the config, the dashboard confirms it saved, but the page never actually sees it because it landed in the wrong layer. The same cross-origin machinery also shows up in ordinary [CORS errors on a static site](/deploy/cors-error-vercel/) — Google's ad domains are just another set of origins your policy has to permit. Where you set the CSP depends on your host — the [platform comparison](/deploy/vercel-vs-netlify-vs-cloudflare-pages/) covers where each one applies security headers, and the principle is identical across all three.

## 5. You injected it in dev and clicked your own ads

The fastest way to lose an AdSense account is invalid traffic — and the easiest place to generate it is your own dev server, where you'll naturally reload and click to "check if it works." Google's policy treats self-clicks as invalid regardless of intent, and repeated ones get the account disabled.

The fix is to gate the entire script behind a production check so it never ships to `npm run dev`:

```astro
---
const adClient = "ca-pub-1234567890123456";
---
{
  import.meta.env.PROD && (
    <script is:inline async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      crossorigin="anonymous"></script>
  )
}
```

`import.meta.env.PROD` is `true` only in a production build, so the tag is absent in dev. That keeps you from accidentally clicking your own ads, keeps your early metrics clean, and avoids the "Earnings at risk" noise while you're still wiring things up. A [Ko-fi and PayPal setup](/payments/getting-paid-without-stripe-kofi-paypal/) carries you through this quiet period, because it earns from day one while AdSense ramps.

## How to confirm it actually works

Don't trust the dashboard alone. Walk this list:

1. **View source** on the deployed page (not the dev server). The AdSense `<script>` should be present with your exact `ca-pub` ID. If it's missing, you forgot `is:inline` or the `PROD` gate ate it.
2. **Hit `/ads.txt`** directly. It should return 200 with your publisher ID in the `google.com, pub-..., DIRECT, ...` line. If it 404s, it's not in `public/`.
3. **Temporarily disable client-side routing** and reload. If ads appear everywhere now, cause 3 is your problem — re-trigger on `astro:page-load`.
4. **Open the console** and navigate. CSP violations show as blocked-source errors naming `googlesyndication.com` or `doubleclick.net`.
5. **Use an incognito window on a different network** to check rendering. Seeing no ads on your own IP is normal — ad targeting and policy routinely suppress them for the publisher.
6. **Wait 24–48 hours** after fixing ads.txt before panicking about "Earnings at risk"; Google crawls on its own schedule.

Astro makes AdSense harder than a WordPress plugin would, but only at the wiring stage. Once the five points above are right, the script loads once, re-fires on navigation, clears the ads.txt warning, survives your CSP, and stays out of your dev server. After that, the only thing left to fix is the part no framework can help with: getting enough traffic for the impressions to matter.
