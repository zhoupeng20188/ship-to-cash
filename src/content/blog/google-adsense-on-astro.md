---
title: "Google AdSense on Astro: Setup and Output Checks"
description: "Add the AdSense loader and ads.txt to a static Astro site, inspect the generated HTML, and separate code installation from site approval."
pubDate: 2026-10-08
updatedDate: 2026-11-02
category: monetize
difficulty: intermediate
author: "Peng Zhou"
image: /og-google-adsense-on-astro.jpg
faq:
  - question: "Does installing the script mean my site is approved?"
    answer: "No. The account review state is separate from whether the loader is present in the HTML."
  - question: "Does every external Astro script require explicit is:inline?"
    answer: "No. Astro also leaves scripts with attributes other than src unprocessed. Explicit is:inline can still document the intent."
  - question: "Should I click an ad to test it?"
    answer: "No. Check the generated HTML, network requests, placement configuration, and account status without clicking ads."
---

An Astro site can include the AdSense loader in its shared layout and publish `ads.txt` from `public/`. Those steps install the integration. They do not establish that Google has approved the domain or that an ad will fill a particular visit.

ShipToCash uses a static Astro build. The file paths below describe this site's integration, so you can compare them with your own project. This is not a report of an approved account or successful ad earnings.

## Put one loader in the shared layout

A small component keeps the publisher ID in one place:

```astro
---
const publisher = 'ca-pub-REPLACE_WITH_YOUR_ID';
---
<script
  is:inline
  async
  src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`}
  crossorigin="anonymous"
></script>
```

Import that component once in the layout's `<head>`. Obtain the actual code and publisher ID from your AdSense account rather than using the example value.

In this project, `src/components/AdScript.astro` reads the publisher configuration from `src/config/site.ts`, and `src/layouts/BaseLayout.astro` includes the component. Look for an equivalent pair of files in your site before adding another loader.

[Astro's script documentation](https://docs.astro.build/en/guides/client-side-scripts/) distinguishes processed scripts from scripts rendered as written. An attribute other than `src`, including `async`, already makes a script unprocessed. Explicit `is:inline` makes the intent clear; its absence on an `async` external script is not by itself a bundling bug.

The loader is separate from manual ad units. Do not add an empty `adsbygoogle.push({})` merely to test whether the loader works. If using manual units, use the unit markup supplied by Google and initialize the corresponding slot. For Auto ads, follow the account's Auto ads setup.

## Publish the account's ads.txt entry

Place the exact line supplied by AdSense in `public/ads.txt`. In a static build, it becomes `dist/ads.txt` and should be accessible at `https://your-domain.example/ads.txt`.

Check the publisher number and the public response, especially after a domain change. Google explains the setup and status checks in its [ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en). Do not interpret a valid ads.txt file as site approval; it serves a different purpose.

## Check the emitted files

Run these commands from the project root:

```sh
npm run build
rg 'pagead2.googlesyndication.com' dist/index.html
cat dist/ads.txt
```

Inspect an article HTML file too. Confirm the loader occurs once, the client ID matches your account, and the file includes the article content. After deploying, use View Source and the Network panel to check the public version. The same output check applies to a statistics script: [checking whether the analytics beacon reaches the HTML](/monetize/cloudflare-web-analytics-not-tracking-astro/) takes one `grep` before any dashboard debugging.

Record the result of each layer separately:

| Layer | Evidence |
|---|---|
| Build | HTML contains one loader with the intended publisher ID |
| Static file | Public `/ads.txt` returns the account entry |
| Network | Loader request is not blocked by browser settings or CSP |
| Account | AdSense reports the site's actual review state |
| Placement | Auto ads or the intended manual unit is configured |

A content blocker or restrictive Content Security Policy can block requests even when the HTML is correct. Diagnose the blocked URL in the browser console before changing CSP. Follow Google's current domain requirements rather than treating a copied allowlist as permanent.

## Client-side navigation needs a separate test

This site's shared layout does not use Astro's `ClientRouter`. Ordinary links perform a page navigation. If your project enables [Astro view transitions](https://docs.astro.build/en/guides/view-transitions/), test direct page loads and navigation between pages separately. Do not repeatedly inject duplicate loaders to force ads to appear. Keep manual-unit lifecycle code consistent with Google's integration requirements.

## Review state comes before impressions

If the site is rejected for low value content, use the [content audit](/monetize/adsense-low-value-content-rejected/) before treating blank placements as a JavaScript defect. Google's [readiness guidance](https://support.google.com/adsense/answer/12176698?hl=en) covers connection, access, content, and review separately.

Never click your own ads to test the installation or ask someone else to generate test clicks. Use source inspection, network diagnostics, and the account status instead. Keep payment checkout independent of this integration; [hosted checkout on Astro](/payments/lemon-squeezy-checkout-astro-static-site/) solves a different task.
