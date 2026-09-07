---
title: "CORS Error on Vercel: Add the Right Header"
description: "\"Blocked by CORS policy\" after deploying to Vercel? What the error means, and the exact place to add the header: vercel.json, next.config, or your route."
pubDate: 2026-09-07
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-cors-error-vercel.jpg
faq:
  - question: "Do Vercel Functions add CORS headers automatically?"
    answer: "No. Vercel Functions never add CORS headers for you, whether they run standalone or through a framework. Every function needs an explicit policy, set in the function code, vercel.json, your framework config, or Routing Middleware. Without those headers the browser blocks cross-origin reads of the response."
  - question: "Why does my API work with curl but fail in the browser?"
    answer: "Because CORS is a browser-enforced policy, not a server rule. curl, Postman, and server-side fetch calls ignore it entirely, so they happily read the response. Only the browser compares the Origin of the page against the Access-Control-Allow-Origin header on the response and blocks the read when they don't match."
  - question: "Can I use Access-Control-Allow-Origin: * with credentials?"
    answer: "No. Browsers reject any response that combines a wildcard origin with Access-Control-Allow-Credentials: true. When a request needs cookies or auth headers, the response must name one exact origin. Validate the incoming Origin against your allowlist and echo back the matched value, plus a Vary: Origin header."
  - question: "My headers are set but CORS still fails — what did I miss?"
    answer: "Three usual suspects: the header is on the fetch call instead of the response (it only works as a response header), your vercel.json still has a legacy routes or builds array that conflicts with the headers block, or www and non-www count as two different origins and you only allowlisted one."
  - question: "How do I test whether CORS is fixed?"
    answer: "Run a preflight by hand: curl -i -X OPTIONS https://your-app.vercel.app/api/hello -H \"Origin: https://yoursite.com\" -H \"Access-Control-Request-Method: POST\". A 200 with Access-Control-Allow-Origin in the response means it works. A 401 usually means Deployment Protection is blocking OPTIONS and the path needs to be on the OPTIONS Allowlist."
---

My first app with an actual backend worked perfectly on my laptop. I deployed it to Vercel, opened the live URL, clicked the button that called my API — and the console filled with red. `Access to fetch at 'https://my-api.vercel.app/api/hello' from origin 'https://my-site.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

The API was fine. I could curl it and get JSON back. Only the browser refused to read the response. That difference is the whole confusion, and once you see it, the fix is about ten lines of config.

First, make sure you're on the right page. "It broke after I deployed" covers several different failures:

| What you see | The real cause | Go here |
|---|---|---|
| Console says **"blocked by CORS policy"**, the request itself returns 200 | Missing CORS response headers (this guide) | ↓ keep reading |
| Request returns **undefined** values, or an API key comes back empty | Environment variables not set for the right environment | [Environment variables on Vercel](/deploy/vercel-environment-variables/) |
| The **whole site** 404s, or pages 404 on refresh | Build output or SPA routing, not CORS | [Vercel build failed](/deploy/vercel-build-failed/) or [404 on refresh](/deploy/client-side-routing-404-vercel-netlify-cloudflare/) |
| Page loads but is **blank** with a JS error | Render crash | [First deploy to Vercel](/deploy/deploy-first-app-vercel/) |

If the console specifically says "blocked by CORS policy," you're in the right place.

## The error, in plain words

Here is the message, in the shape Chrome prints it:

```
Access to fetch at 'https://my-api.vercel.app/api/hello' from origin
'https://my-site.vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested
resource. If an opaque response serves your needs, set the request's
mode to 'no-cors' to fetch the resource with CORS disabled.
```

Ignore that last sentence. `mode: 'no-cors'` makes the browser throw the response away — you get a status of `0` and no data. It is never the fix.

What actually happened: your page lives at one origin (`https://my-site.vercel.app`) and asked the browser to read data from a different one (`https://my-api.vercel.app`). An origin is the scheme + host + port together, so `http://localhost:3000` and `http://localhost:3001` are already two different origins, and so are `https://yoursite.com` and `https://www.yoursite.com`.

The browser sent the request. **Your server answered it just fine.** Then the browser looked for an `Access-Control-Allow-Origin` header on the response, didn't find one, and refused to hand the data to your JavaScript. The network tab shows a 200; your code sees an error. That is CORS working as designed — it protects the *user*, not your server.

The critical part: **CORS is enforced by the browser only.** curl, Postman, server-side `fetch`, and Server Components all skip it completely. Which is why "but it works in curl" is the most common symptom report for this bug — and why you can't debug it with curl alone (though you *can* verify the fix with it, see below).

And the header goes on the **response**, not the request. Vercel Functions don't add CORS headers for you — no function type does, standalone or through a framework. If you don't set them, no browser will read your API cross-origin. That single fact is Cause 1.

## Cause 1 (most common): the server never sends the header

This is the overwhelming majority of cases. Your function returns JSON with no `Access-Control-Allow-Origin` attached. There are three places to add it, and which one you pick depends on how much of your app needs it.

### Option A: vercel.json (whole project, static value)

Put this at your **repo root**, not in `src/`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://my-site.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

This runs at the CDN layer, before your function is even invoked. Use it when the same origin is allowed everywhere. If your API is genuinely public, `value` can be `*` — just never alongside credentials (see Cause 3).

One gotcha that eats an afternoon: if your `vercel.json` still has a legacy `routes` or `builds` array, those conflict with the modern `headers` block and can stop it from applying. Delete them and let framework detection handle the build.

### Option B: next.config.ts (Next.js projects)

The framework-level equivalent, same idea:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://my-site.vercel.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Option C: in the route handler (one endpoint)

For a single API route that needs its own policy, set the headers on the response itself:

```ts
const ALLOWED_ORIGIN =
  process.env.NODE_ENV === 'production' ? 'https://my-site.vercel.app' : '*';

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  return Response.json(
    { ok: true },
    { headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } },
  );
}
```

Notice the exported `OPTIONS` handler — that leads straight to Cause 2.

**Verify it worked:** deploy, then run the preflight by hand:

```bash
curl -i -X OPTIONS https://my-api.vercel.app/api/hello \
  -H "Origin: https://my-site.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

You want a `200` and an `Access-Control-Allow-Origin` line in the output. Then reload the page, and the red console error should be gone.

## Cause 2 (very common): the preflight never made it through

You added `Access-Control-Allow-Origin` to your `GET` handler and CORS *still* fails — usually on `POST`, `PUT`, `DELETE`, or anything sending `Content-Type: application/json` or an `Authorization` header.

Here's why. For those requests the browser sends a **preflight** first: an `OPTIONS` request asking "am I allowed to do this?" Only if the `OPTIONS` response carries the right headers does the browser send your real request. If your handler only covers `GET`, the preflight gets no CORS headers and the real request is never sent at all — which looks identical to Cause 1 in the console.

The fix is to answer `OPTIONS` explicitly. Either export an `OPTIONS` handler in the route (Option C above), or — cleaner when you have many routes — handle preflight in Routing Middleware:

```ts
import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://my-site.vercel.app']
    : ['http://localhost:3000'];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin !== null && allowedOrigins.includes(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        ...(isAllowedOrigin ? { 'Access-Control-Allow-Origin': origin } : {}),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  }

  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export const config = { matcher: '/api/:path*' };
```

Middleware runs before your function does, so preflights get answered warm and fast — a cold function can time out mid-preflight and surface as yet another CORS error. Middleware is also the only place you can make the *decision* dynamically: `vercel.json` and `next.config.ts` only hold static values, so they can't allow different origins per environment.

**There's a Vercel-specific trap here.** If Deployment Protection (Vercel Authentication, Password Protection, or Trusted IPs) is on, an unauthenticated `OPTIONS` request gets a `401` from Vercel *before* your middleware or function runs. The browser never sees your headers. The fix is the OPTIONS Allowlist in project settings — add `/api` and it covers every path beneath it. New projects have `/api/*` allowlisted by default; if your curl above returned `401`, this is your answer.

**Verify it worked:** rerun that same `curl -X OPTIONS` command. A `200` with your headers means preflight is good. A `401` means the path needs to go on the OPTIONS Allowlist.

## Cause 3 (less common): the header is there, but the value is wrong

Sometimes you've done everything above and it still breaks. Three things account for nearly all of it.

**You put the header on the fetch call.** I did exactly this. It looks so plausible:

```js
// ❌ Wrong — these are RESPONSE headers. Setting them on the request does nothing.
const res = await fetch(url, {
  headers: { 'Access-Control-Allow-Origin': '*' },
});
```

`Access-Control-Allow-*` headers are instructions from the server to the browser. Sending them *from* the browser is meaningless, and worse, adding custom headers to a request can trigger a preflight you then fail. Delete them from your fetch and set them on the response instead.

**You allowlisted one spelling of your own domain.** `https://yoursite.com` and `https://www.yoursite.com` are different origins. If users land on `www` but you allowlisted the bare domain, every request is blocked. Check the `Origin` value in the failing request's headers, and either allowlist both or pick one canonical host and redirect.

**You combined `*` with credentials.** If your request sends cookies or an `Authorization` header with `credentials: 'include'`, then `Access-Control-Allow-Origin: *` is rejected outright by the browser. Credentialed requests need one exact origin echoed back — which is what the middleware above does. While you're there, add `Vary: Origin`, because otherwise the CDN can cache a response approved for one origin and serve it to another, and the browser will block it as a mismatch. And don't allowlist the `null` origin: an attacker can send `Origin: null` from a sandboxed iframe.

**Verify it worked:** in DevTools → Network, click the failing request and read the `Origin` in the request headers and `Access-Control-Allow-Origin` in the response headers. They have to match character for character.

## The shortcut: skip CORS entirely

Before you write any headers, ask whether you need cross-origin at all. If your frontend and API live on the same Vercel project, they're already same-origin — just fetch a relative path (`fetch('/api/hello')`) and CORS never enters the picture. This is why localhost felt so easy.

If you're calling a third-party API that doesn't handle preflight well, proxy it instead of fighting headers:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://external-api.com/:path*" }
  ]
}
```

The rewrite runs server-to-server, so the browser sees a same-origin response. Same reason Server Components and Server Actions never hit CORS: a request made on the server isn't subject to the browser's same-origin policy.

## The 60-second checklist

1. The failing request returns 200 in the Network tab but the console says "blocked by CORS policy" → it's headers, not your code.
2. `Access-Control-Allow-Origin` is set on the **response**, never in your `fetch` call.
3. Pick one layer: `vercel.json` (project-wide, static), `next.config.ts` (Next.js, static), the route handler (one endpoint), or middleware (dynamic origins).
4. Any request that isn't a simple `GET` needs an `OPTIONS` answer. Check the OPTIONS Allowlist if you're behind Deployment Protection.
5. Using cookies or auth headers? Name one exact origin — not `*` — and add `Vary: Origin`.
6. Verify with `curl -i -X OPTIONS ... -H "Origin: ..."` before you touch the browser again.

## Next steps

Once the API answers cross-origin, the next thing that usually bites is credentials disappearing in production — [environment variables on Vercel](/deploy/vercel-environment-variables/) covers why they read as `undefined` until you redeploy. And when you're ready to put a real domain in front of both halves, here's [how to point a custom domain at Vercel](/deploy/vercel-custom-domain-setup/) without breaking what you just fixed.
