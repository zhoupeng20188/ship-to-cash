---
title: "AdSense Low Value Content: What Google Actually Checks"
description: "Rejected for 'low value content'? Google's definition is narrower than the blogs claim. What gets checked, what to fix, and when reapplying is pointless."
pubDate: 2026-10-21
category: monetize
difficulty: beginner
author: "Peng Zhou"
image: /og-adsense-low-value-content-rejected.jpg
faq:
  - question: "What does 'low value content' actually mean in Google's policy?"
    answer: "Google's publisher glossary defines it narrowly: content that is difficult to understand and provides no value to users, with filler text or Lorem ipsum given as the example. The rejection label, however, is a bucket that also covers pages with no publisher content, pages still under construction, and screens used only for navigation. So the phrase is not a word-count rule — there is no official minimum length."
  - question: "How many articles do I need before AdSense will approve my site?"
    answer: "Google does not publish a minimum. Any specific number you see — 15, 20, 30 posts — is someone's anecdote, not a policy. What the reviewer can actually judge is whether each indexable URL has a reason to exist. A 12-page site where every page answers a distinct question is stronger than a 60-page site padded to hit a quota."
  - question: "Should I delete thin posts or rewrite them?"
    answer: "Neither, by default. First decide whether the page serves a distinct purpose. If two posts cover the same query, merge them into one and 301 the weaker URL. If a post is thin but unique, expand it with something only you can add — a real result, a screenshot, a failure you hit. Deleting everything resets your site history and is rarely the right first move."
  - question: "How long should I wait before reapplying after a rejection?"
    answer: "Google does not publish a waiting period. The widely repeated two-to-four weeks is community consensus, not policy. What matters mechanically is that Google reviews the version of your site it has crawled, not the version on your laptop. Confirm your changed pages are indexed in Search Console before you resubmit, or the reviewer may still be looking at the old pages."
  - question: "Can AI-assisted content get approved?"
    answer: "The policy does not ban AI. It bans content that adds no value and author identities that are deceptive — Google explicitly calls out AI-generated headshots, invented names, and fake credentials. If automation helped you draft, the page still has to contain something a model could not produce: your test results, your screenshots, your specific errors. Disclosure helps when the reader would otherwise wonder how the page was made."
  - question: "Is a 'low value content' rejection permanent?"
    answer: "No, but it is also not guaranteed to flip. The label is a judgment about the site at review time, and substantial changes can change the answer. If two serious attempts after real structural work both fail, the blocker is more likely your niche, traffic pattern, or business model than a missing paragraph — and the honest move is to stop reapplying and earn through direct sales while the site matures."
---

The email is three sentences long. It says your site doesn't meet AdSense program policies, names **low value content**, and links to a policy page. Then you search the phrase and get forty guides that all say the same thing: write 600 words per post, add an About page, wait two weeks, reapply.

Most of that advice isn't wrong. It just isn't what the phrase means.

## Google's own definition is narrower than the blogs claim

Open the [publisher policy glossary](https://support.google.com/publisherpolicies/table/10563033#low-value-content) and the definition is almost anticlimactic:

> Content that is difficult to understand and provides no value to users (for example, filler text or "Lorem ipsum").

That is the whole official definition. No word count. No minimum number of posts. No traffic threshold. The example Google reaches for is **placeholder text** — the stuff left in a template before anyone writes the real page.

The rejection label, though, is a bucket. The [inventory value section of the publisher policies](https://support.google.com/adsense/answer/10502938) says Google won't serve ads on screens that are:

- without publisher content **or contain low value content**
- **under construction**
- used for alerting, navigation, or other behavioral purposes

So when a reviewer writes "low value content," they are usually pointing at one of four different failures:

1. A URL that exists but has nothing meaningful on it — a placeholder, an empty category, a "coming soon" page.
2. A page that restates what ten other pages already say, with nothing added from experience.
3. A site that is technically incomplete: no About, no contact route, broken navigation, pages a reviewer cannot reach.
4. Auto-generated or scraped pages with no editorial layer on top.

Only the second one is really about writing. The other three are structural, which is why rewriting your intros for the third time rarely changes the outcome. The question shows up repeatedly in [AdSense's own community forum](https://support.google.com/adsense/thread/461239165/adsense-rejected-my-site-for-low-value-content-what-should-i-fix), almost always from someone who has already rewritten everything.

## The closest thing to a checklist Google publishes

Google's [helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) frames quality as three questions: **who, how, and why**.

- **Who** created it? Is the byline visible, and does it explain the author's background in this topic?
- **How** was it made? If automation or AI was involved, would a reader be surprised to learn that?
- **Why** does it exist? Google calls this "possibly the most important question," and is blunt that content created primarily to attract search visits doesn't meet the bar.

Those map to concrete signals a reviewer can see in a few clicks: a named author with a real About page, pages that contain something only the author could know, and a site structure that doesn't exist purely to host ads.

There is no official article count anywhere in that guidance. Any specific number you read — 15, 20, 30 — is somebody's anecdote wearing a statistic's clothes.

## The audit I ran on my own site

Before applying, I ran five checks on my own Astro site. None of them were "add more words."

### 1. Does every indexable URL have a reason to exist?

My category template used to render a page for every category, including categories with zero published guides. An empty archive page that says "guides are on the way" is the literal definition of *under construction* — and it was indexable.

The fix was to stop generating those pages at all:

```astro
export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return CATEGORIES.filter((category) =>
    posts.some((p) => p.data.category === category)
  ).map((category) => ({ params: { category } }));
}
```

An empty category doesn't need a rewrite. It needs to not exist until it has content. If you'd rather keep the URL alive, `noindex` it and remove it from the sitemap — but don't leave a thin page in the index and hope a paragraph fixes it.

### 2. Are two posts doing the same job?

Search your own site for two URLs that answer the same query. On a site that grew by topic, you will usually find one. Merge them into the stronger URL, 301 the weaker one, and update internal links. That is worth more than padding both to 900 words, and it removes a page that a reviewer would otherwise sample and judge the whole site by.

### 3. Can a stranger tell who wrote this?

A byline is the cheapest E-E-A-T signal you have, and it is the one most template sites skip. Add a real name to every post, a real photo, and an About page that says what you have actually shipped. Then mark it up so the identity is machine-readable: the article template on this site emits `BlogPosting` with an `author` of type `Person`, pointing at the [About page](/about/) and the author's public profiles.

Google's guidance is explicit that fake identities — AI headshots, invented names, invented credentials — are deceptive and erode trust. A thin About page is a problem. A fabricated one is worse.

### 4. Is the site reachable without an excuse?

Reviewers browse like a logged-out stranger. An SSL error, a redirect loop, or a custom domain that times out reads as a navigation problem even when your content is fine. If your domain is half-configured, fix that before anything else — [a custom domain that returns 522](/deploy/vercel-custom-domain-ssl-not-working/) is not a content issue, but it will be judged like one.

### 5. Is the version Google reviews the version you fixed?

This is the one that wastes the most time. Google reviews the **crawled** version of your site, not the build sitting on your laptop. Edit ten pages and resubmit the same afternoon, and the reviewer may still see the old versions.

Before reapplying, open Search Console, inspect the URLs you changed, and confirm they are indexed with the new content. If they are still queued, wait. You are not waiting for Google to be polite; you are waiting for the reviewer to be able to see the fix.

## The fixes, in order

| What the reviewer sees | What it usually is | Fix |
|---|---|---|
| Empty or "coming soon" pages | Under construction | Don't generate the page; `noindex` if the URL must stay |
| Two posts on one query | Duplicate value | Merge, 301 the weaker URL |
| No author anywhere | Trust gap | Byline, About page, `Person` schema |
| Broken nav, SSL error, login wall | Navigation issue | Fix reachability first |
| Padded posts that say nothing | Literal "low value content" | Replace filler with first-hand specifics |

Notice that only the last row is a writing problem, and its fix is subtraction, not addition.

## Reapplying: the step everyone rushes

There is no official waiting period. The two-to-four weeks you see everywhere is community consensus, and it is a reasonable heuristic for one reason only: it gives the crawler time to pick up your changes.

Reapply **once**, after substantive work, and then leave it alone. Repeated identical submissions don't get you a second opinion; they get the same snapshot reviewed again. Google doesn't publish a limit on reapplications, but there is an opportunity cost to burning review cycles on a site that hasn't changed.

The uncomfortable part: approval is a judgment call, and Google doesn't publish its criteria or its reasons in any detail. Two sites with similar content can get different answers. Anyone selling you a guaranteed approval is selling you something they cannot control.

## What doesn't work

- **Padding to hit a word count.** Filler is the example Google uses to define low value content. Adding it to satisfy a number is self-defeating.
- **Deleting everything.** A site with twelve real pages beats sixty padded ones, but a site with zero pages has no history to evaluate.
- **A fake About page.** Invented credentials are explicitly called out as deceptive.
- **Reapplying every few days.** Same snapshot, same answer, more waiting.

## When waiting stops being the answer

If two serious attempts after real structural work both fail, stop assuming the problem is a paragraph. At that point the more likely blockers are niche, traffic pattern, or business model — and no amount of editing changes those.

That's also the moment to remember that ads are the slowest revenue stream you have. A single sale beats a month of ad impressions at low traffic, and [pricing the thing you actually sell](/monetize/how-to-price-a-developer-template/) is arithmetic you control. While AdSense decides, [Ko-fi wired to PayPal](/payments/getting-paid-without-stripe-kofi-paypal/) can take money this week with no approval queue, and [a Lemon Squeezy checkout on a static site](/payments/lemon-squeezy-checkout-astro-static-site/) covers digital products without a backend. If you don't have traffic yet, [getting the first hundred customers](/monetize/get-first-customers-developer-template/) matters more than getting approved.

And once approval does land, the wiring is its own problem — [five Astro-specific reasons ads never show](/monetize/google-adsense-on-astro/) is the next article, not this one.

## The rejection is an audit you needed anyway

The useful reframe: "low value content" is not an accusation about your prose. It is a signal that some URL on your site exists without earning its place — a placeholder, a duplicate, an empty archive, or a page nobody can attribute.

Fix those four things and you have done the audit every site needs before it asks anyone for money, ads or otherwise. Whether AdSense approves you on the next pass is partly out of your hands. Whether your site deserves to be approved is not.
