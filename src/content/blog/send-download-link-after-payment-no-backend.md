---
title: "Send a Download Link After Payment (No Backend)"
description: "Send a download link after payment with no backend — without leaking your storage secret or trusting ?success=true. Here's the safe way."
pubDate: 2026-10-10
category: payments
difficulty: intermediate
author: "Peng Zhou"
image: /og-send-download-link-after-payment-no-backend.jpg
faq:
  - question: "Can I deliver a download link after payment with no backend at all?"
    answer: "Yes — but 'no backend' means no server you operate, not 'no code that runs on a server.' A single serverless function (a Cloudflare Pages Function, an Astro SSR endpoint, or a Netlify Function) can verify the payment and mint a short-lived signed URL while your storage secret stays server-side. If you sell through a merchant of record like Lemon Squeezy, the platform emails the download link for you and you write zero delivery code."
  - question: "Why is putting my Cloudinary API secret in the browser dangerous?"
    answer: "The secret proves you own the account. Anyone who opens DevTools on your page can read btoa('API_KEY:API_SECRET'), base64-decode it, and call the Cloudinary Admin API to read, overwrite, or delete every asset in your account — not just the one file. Cloudinary's own signed-URL guide states the API secret must never be exposed in the client. Sign a time-limited URL in a function instead."
  - question: "Is ?success=true a safe way to confirm payment?"
    answer: "No. If your page downloads the file whenever the URL contains ?success=true, anyone can type your-site.com/?success=true into their browser and get the file without paying. Stripe's success_url is a browser redirect the customer controls, not a server-verified signal. Confirm the payment server-side — by verifying a webhook signature or checking the order through your merchant-of-record dashboard — before you hand over a link."
  - question: "How does Lemon Squeezy deliver files with no code?"
    answer: "When you attach files to a product, Lemon Squeezy emails each buyer a unique download link tied to their order the moment payment clears. You don't write a webhook, a function, or a database. It's the zero-code path, and it's why a merchant of record is the fastest way to start selling a one-off file."
  - question: "What's the safest no-backend delivery pattern?"
    answer: "A serverless function receives the payment webhook, verifies its HMAC signature with a secret that never leaves the function, then generates a download URL signed with a short expiry (an hour is plenty) and emails or redirects to it. The file stays on private storage; the public link is useless after it expires and can't be forged without the signing key."
  - question: "How do I check my own delivery isn't leaking?"
    answer: "Open your live success page in an incognito window and append ?success=true (or whatever flag your tutorial used). If the download starts, you're trusting the URL. Then open DevTools → Network and look for any request whose Authorization header contains a base64 string — that's a secret in the browser. Both mean you need to move the logic into a serverless function."
---

I went looking for a no-backend way to hand buyers a file after they paid, because my store is a folder of static HTML on Cloudflare Pages and I didn't want to stand up a server just to email a zip. The top results were confident and short. They were also two different ways of giving your product away for free, and one of them hands over your entire media account on the way out.

This is the version I wish those tutorials had written: what the dangerous pattern actually does, why it fails, and the delivery setup that keeps the secret server-side while still running on a static site.

## Why "no backend" is a real goal, not laziness

You can take money on a static site. [Lemon Squeezy checkout on an Astro page](/payments/lemon-squeezy-checkout-astro-static-site/) is two files and no server, and [Ko-fi wired to PayPal](/payments/getting-paid-without-stripe-kofi-paypal/) is even less. The hard part isn't collecting the payment — it's proving, on the buyer's machine, that a payment happened, so you can safely point them at the file.

Both dangerous tutorials below are answering that real question. They just answer it by moving the proof into the one place it can't be trusted: the browser.

That proof is the whole job. Everything below is either a shortcut that skips it or the serverless function that does it properly. The shortcuts rank well because they're ten lines and a smug headline; the function ranks lower in effort but it's the only one that survives contact with a curious buyer.

## The two patterns that are quietly dangerous

Both come from tutorials that rank on the first page for "send download link after payment no backend." I'm quoting them because the failure is in the code, not in how I'm summarizing it.

### Pattern 1: your storage secret, shipped to the browser

One popular walkthrough tells you to fetch a file straight from cloud storage using your account credentials, in client-side JavaScript:

```js
fetch(`https://api.cloudinary.com/v1_1/YOUR_NAME/resources/upload/${fileId}`, {
  headers: {
    'Authorization': 'Basic ' + btoa('API_KEY:API_SECRET')
  }
})
```

`btoa('API_KEY:API_SECRET')` is a base64 string of your API key and secret. It sits in the page's JavaScript, which means it sits in every visitor's browser. Open DevTools, decode it, and you now hold the credentials to the Cloudinary Admin API — read, overwrite, and delete every asset in the account, not just the one product. [Cloudinary's own signed-URL guide](https://cloudinary.com/blog/signed-urls-the-why-and-how) says the API secret must never reach the client, precisely because of this. The tutorial's advice to "use a signed URL" is correct; the implementation is backwards, because the signature has to be computed where the secret lives, and that is not the browser.

And the cost isn't theoretical. With that decoded secret an attacker can rename or delete every asset you've uploaded, swap your product images for something else, and — because Cloudinary bills usage to your plan — run up your bandwidth and transformation charges while they're at it. One leaked string, your whole media library.

### Pattern 2: "if the URL says success, give them the file"

The other top result builds the download entirely on a redirect flag:

```js
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('success') === 'true') {
  document.getElementById('download-trigger').click();
}
```

The page downloads the file whenever the address bar contains `?success=true`. So does anyone who types `your-site.com/?success=true` and never paid. The author even notes this in a footnote and calls it "fine for templates" — it isn't, because the link to your file is already public and the only thing gating it is a string the buyer controls.

Stripe's real `success_url` is the same shape of problem dressed up nicer: it's a redirect the customer's browser follows, and the customer can craft the URL. Treating the redirect as proof of payment is treating "the browser said so" as proof of payment. It isn't, and the [webhook signing docs](https://docs.lemonsqueezy.com/help/webhooks/signing-requests) exist precisely so you don't have to trust the browser.

The "fine for templates" footnote is wrong for a second reason: once the file URL is public, the buyer who actually paid can forward it to anyone, and the `?success=true` gate adds nothing — the link works whether or not the flag is there. You've built a share button labelled "download," not a checkout.

## What "proof of payment" actually requires

A download is safe to hand over only when two things are true, and neither can be checked in the browser:

1. **A trusted party confirmed the money moved.** That's a webhook from your payment provider, or a call to the provider's API from a server you control.
2. **The confirmation can't be forged.** The message is signed with a secret the buyer can't see, and you verify that signature before doing anything.

Everything else — the email, the redirect, the pretty "here's your download" page — is decoration around those two facts. Skip either one and you've built a speed bump, not a checkout.

## Signed URLs: the part the first tutorial got right

A signed URL is the right tool — it's just being minted in the wrong place. The idea is a token your server generates from the file path plus a secret plus an expiry, which the storage service checks before serving the file. The browser only ever receives the token, never the secret, and because the token carries a deadline, a leaked link stops working on its own. Move the minting into a function and Pattern 1 becomes safe instead of catastrophic.

## The safe pattern: one tiny serverless function does the verifying

You don't need a server. You need one function that runs on someone else's server — a Cloudflare Pages Function, an Astro SSR endpoint, or a Netlify Function. It receives the webhook, checks the signature, and mints a download URL that expires. Your storage secret never leaves the function.

Here's the delivery half. The signature check is the same HMAC verification covered in [debugging a webhook that won't fire](/payments/lemon-squeezy-webhook-not-firing/), so I'll show only what's new:

```js
// functions/api/ls-webhook.js
export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();
  // ... verify X-Signature with env.DOWNLOAD_SIGNING_KEY (see webhook guide) ...

  const payload = JSON.parse(rawBody);
  if (payload?.meta?.event_name !== "order_created") {
    return new Response("ok", { status: 200 });
  }

  // Sign a short-lived download URL. The key lives only in this function.
  const expires = Math.floor(Date.now() / 1000) + 3600; // one hour
  const sig = await hmacHex(env.DOWNLOAD_SIGNING_KEY, `${payload.data.id}:${expires}`);
  const downloadUrl = `https://yoursite.com/d/${payload.data.id}?e=${expires}&s=${sig}`;

  await sendDownloadEmail(payload.data.attributes.email, downloadUrl);
  return new Response("ok", { status: 200 });
}
```

The link the buyer receives is useless after an hour and can't be forged without `DOWNLOAD_SIGNING_KEY`. The file itself stays on private storage — Cloudflare R2, an S3 bucket, or Cloudinary authenticated delivery — and is only served after the signature checks out:

```js
// functions/d/[id].js
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const expires = Number(url.searchParams.get("e"));
  const sig = url.searchParams.get("s") ?? "";

  if (!Number.isFinite(expires) || Date.now() / 1000 > expires) {
    return new Response("Link expired", { status: 410 });
  }
  const expected = await hmacHex(env.DOWNLOAD_SIGNING_KEY, `${params.id}:${expires}`);
  if (!safeEqual(expected, sig)) {
    return new Response("Invalid link", { status: 401 });
  }
  return Response.redirect("https://storage.yoursite.com/products/kit.zip", 302);
}
```

Store `DOWNLOAD_SIGNING_KEY` the same way you'd store any secret — encrypted in [Cloudflare Pages variables and secrets](/deploy/cloudflare-pages-environment-variables-not-working/), not in a build-time env var. That single function is the entire backend: it proves the payment, it never exposes a credential, and it runs for free on the same plan as your static site. If you'd rather not run an endpoint at all, the section below is the shorter road.

## If you sell through Lemon Squeezy, skip all of it

This is the part the "no backend" tutorials skip, because it doesn't sell a storage account. When you attach files to a product in Lemon Squeezy, the platform emails each buyer a unique download link tied to their order the moment payment clears. You don't write a webhook, a function, or a database. [As a merchant of record](/payments/merchant-of-record-vs-payment-processor/), Lemon Squeezy owns the tax side and the delivery side, and the download link is one of the things it handles for you.

For a one-off file — a template, a PDF, a zip of assets — that zero-code path is the right answer, and it's the reason I reach for Lemon Squeezy before I reach for a function. If you later need ongoing access control, that's when [issuing and validating license keys](/payments/lemon-squeezy-license-key-api/) earns its keep, because the key can be re-checked on every launch instead of handed over once.

## How to check your own setup isn't leaking

Two thirty-second tests before you ship:

1. **The URL test.** Open your success page in an incognito window and append `?success=true`. If the file downloads, you're trusting the redirect. Move the logic into a function.
2. **The secret test.** Open DevTools → Network on the buy page and look for any request whose `Authorization` header is a base64 blob. That's a credential in the browser. Sign the URL in a function instead.

Both failures are fixable in an afternoon, and both are cheaper to fix before a buyer posts your `?success=true` trick to a forum where the next hundred visitors can read it.

## What I'd do in your position

1. If you're on a merchant of record and selling a one-off file, attach the file to the product and let the platform email it. You're done — no code, no secret, no function.
2. If you need a custom download page or the file lives in your own storage, add one serverless function that verifies the webhook and mints a signed, expiring URL. Keep every secret in the function; the browser gets only the link, and only after payment is proven.
3. Set the link's lifetime to an hour. Buyers don't need a permanent URL, and a short expiry is what stops a forwarded link from becoming a perpetual free download.
4. Price the thing before you over-engineer the delivery — [the rate math on a $29 versus a $199 product](/monetize/how-to-price-a-developer-template/) changes how much a leaked link actually costs you, and it's the number that should decide how much engineering this is worth.

The "no backend" tutorials aren't wrong that you can avoid a server. They're wrong about where the proof of payment is allowed to live. Put it in a function, keep the secret there, and the static site stays static while the download stays safe.
