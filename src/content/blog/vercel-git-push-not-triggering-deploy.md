---
title: "Git Push Not Triggering a Vercel Deploy: 9 Checks, in Order"
description: "Pushed to GitHub and Vercel did nothing? No deploy, no error. These 9 checks find the cause, starting with whether the Vercel Bot left a comment."
pubDate: 2026-09-21
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-vercel-git-push-not-triggering-deploy.jpg
faq:
  - question: "Why did Vercel stop deploying my commits after months of working fine?"
    answer: "The usual cause is a commit author identity that Vercel no longer recognizes. Vercel checks the commit author's email against the Git provider account and the Vercel team, and when they don't match it skips the deployment silently — the dashboard shows nothing at all. This commonly appears after moving to a new machine, since a copied-over global git config keeps an old email. It also appears when someone else pushes to your repo, or when a teammate's membership on the team lapses."
  - question: "Why is there no Vercel Bot comment on my commit?"
    answer: "A missing Bot comment is itself a diagnostic signal. Vercel's knowledge base states that comments don't appear when no deployment could be created at all, which happens when pre-deployment validation fails — a malformed vercel.json is a common trigger, as is a missing Git integration. In other words, silence means the problem sits upstream of the permission check, not inside it. If the Bot does comment, it usually links to a request-access page, which points at team membership instead."
  - question: "What exit code should an Ignored Build Step return to build?"
    answer: "A code of 1 or greater builds. This is reversed from normal Unix convention: in the Ignored Build Step, a return code of 0 means skip the build, and 1 or more means create a deployment. Vercel's docs state this explicitly, and it catches people who write a guard script that exits 0 on success — that script silently cancels every deploy. Test it locally and check the exit code of the last command with echo $?."
  - question: "How many deployments per day does the Vercel Hobby plan allow?"
    answer: "Hobby allows 100 deployments per day with one concurrent build. Pro allows 6,000 per day with three concurrent builds by default. Vercel's troubleshooting guide warns that repeatedly reconnecting the Git integration and manually redeploying while troubleshooting can exhaust the Hobby daily cap on its own and reproduce the exact symptom you are investigating — so a deploy that mysteriously stops can be a limit you caused yourself."
  - question: "Can I have two Vercel accounts connected to the same GitHub account?"
    answer: "No. When the Git link is set up on a second Vercel account, it is removed from the first. Vercel's FAQ says to identify which account should own the connection and reconnect from that one. If your pushes stopped working right after you signed up with a different email or joined a team, this is a likely cause — the integration moved to the new account and your original project lost it."
  - question: "How do I force Vercel to deploy after fixing the cause?"
    answer: "Create an empty commit and push it, using git commit --allow-empty -m \"Trigger deploy\" followed by git push. This gives Vercel a fresh push event to evaluate without changing any files. If a deployment still doesn't appear, run vercel deploy from the CLI instead — the CLI surfaces errors the dashboard hides, such as the message stating that the Git author must have access to the team's projects to create deployments."
---

I pushed three commits on a Friday afternoon and refreshed the Vercel dashboard maybe twenty times. Nothing. Not a failed deploy, not a queued one — the deployment list still showed Thursday's build at the top, and there was no record that Vercel had seen anything at all.

That absence is the tell. A broken build leaves a red entry you can click into. A push that never triggers leaves **nothing**, which is why this failure feels like Vercel is down. It almost never is. Nearly every case I've hit was a config boundary quietly saying no, and the order in which you check them matters more than how fast you check them.

One sanity check first, because several deploy symptoms look alike from the outside and their fixes don't overlap at all:

| What you see | What it actually is | Where to go |
|---|---|---|
| Push lands on GitHub, Vercel shows **no new entry at all** | The trigger never fired | This guide |
| Deploy appears, then fails with a build error | Your build command broke | [Vercel build failures](/deploy/vercel-build-failed/) |
| `build script returned non-zero exit code: 2` | Same symptom on Netlify, different causes | [Netlify exit code 2](/deploy/netlify-build-failed-exit-code-2/) |
| Build dies with `Module not found` | File-name casing, or a file that isn't in git | [Module not found on deploy](/deploy/vercel-module-not-found-works-locally/) |
| Build succeeds, environment variables read as `undefined` | Env vars not reaching the build | [Vercel environment variables](/deploy/vercel-environment-variables/) |
| Build succeeds, deep link 404s on refresh | Client-side routing, not a deploy problem | [404s on refresh](/deploy/client-side-routing-404-vercel-netlify-cloudflare/) |
| Site loads, then goes blank with a JS error | Runtime client-side exception | [Client-side exception on deploy](/deploy/application-error-client-side-exception-vercel/) |

If you have a deploy that succeeded but the live site still shows old content, that's a caching problem rather than a trigger problem, and the fixes below won't help you.

## Start here: did the Vercel Bot comment on your commit?

This one check splits the whole problem in half, and it takes five seconds.

Open the commit on GitHub and look for a comment from the Vercel Bot.

**If the Bot left a comment**, it usually links to a request-access page. That means Vercel received the push and rejected it on permissions — the commit author isn't recognized as someone allowed to deploy to this project. Jump to cause 1.

**If the Bot said nothing at all**, that silence is itself the signal. Vercel's knowledge base puts it directly: comments don't appear when no deployment could be created at all, which happens when pre-deployment validation fails — "a malformed `vercel.json` is a common trigger, as is a missing Git integration." So no comment means the failure happened *before* the permission check ever ran. Jump to cause 2.

I wasted an afternoon on this once by starting at the wrong end: reconnecting GitHub over and over when the real problem was a trailing comma in `vercel.json` that failed validation before Vercel looked at anything else.

## 1. Your commit author isn't recognized

Vercel checks the commit author's email before it builds. When the email doesn't match an identity with access to the project, the push goes nowhere — and the dashboard shows nothing, because nothing was ever created.

The check:

```bash
git config --global user.email
git log -1 --format='%ae'
```

The second line shows the email actually stamped on your latest commit, which is what Vercel reads. Compare both against the email on your GitHub account.

Two things trip people up here:

**Plus-addresses count as different identities.** `dev+work@example.com` and `dev@example.com` route to the same inbox, but Vercel treats them as two separate people. If your local config has the plus-address and your GitHub account doesn't, that alone stops deployments.

**Old configs survive machine migrations.** A developer who moved to a new Windows PC described exactly this on his blog: he carried over his old git config, so the email on his commits belonged to an account he'd stopped using. He disconnected and reconnected the GitHub integration, deleted and recreated the project, and verified the repo URL matched — none of it helped. The dashboard showed nothing. Running `vercel deploy` from the CLI finally surfaced the real message:

```
Error: Git author XXXXXXX must have access to the team XXXXXXX's projects on Vercel to create deployments.
```

That's the whole trick for this class of failure: **the CLI says what the dashboard won't.**

Fix it, then give Vercel a fresh push to evaluate:

```bash
git config user.email "you@example.com"

git commit --allow-empty -m "Trigger deploy"
git push
```

The empty commit changes no files but creates a new commit authored under the corrected email. If your fix was right, a deployment appears within seconds.

One more boundary in this group: for a **private** repo on a team project, the person pushing has to be a member of the Pro team, or the owner of the Hobby team. A teammate whose membership lapsed will hit this with no dashboard error.

## 2. The Git connection broke somewhere

If the Bot stayed silent, work down this list. Vercel publishes it as an ordered checklist, and the order is deliberate — the first item is the most common cause and the fastest to fix.

1. **Git login connection** — Account Settings, then Authentication. If the connection lapsed, nothing downstream matters.
2. **Commit author access** — covered above; check the Activity log for a Bot comment.
3. **Local `git config user.email`** — matches the Git provider, including plus-addresses.
4. **Production branch name** — Project Settings, Git. Confirm it's exact. A push to a non-production branch should still produce a *preview* deployment, so if you're getting nothing at all on any branch, the break is earlier in this list.
5. **The GitHub webhook** — repo Settings, Webhooks. Look for a Vercel webhook. If there isn't one, disconnect and reconnect the repository.
6. **GitHub App repository access** — GitHub Settings, Applications, Vercel, Repository Access. The repo has to be in the allowed list; "All repositories" avoids this entirely.

Two edge cases worth knowing before you start reconnecting things:

**Two Vercel accounts cannot share one GitHub account.** Set up the link on a second Vercel account and it's removed from the first. If your deploys died right after you joined a team or signed up with a different email, this is probably it.

**Reconnecting isn't free.** On Hobby you get 100 deployments per day and one concurrent build. Vercel's guide warns that "repeatedly reconnecting and manually redeploying while troubleshooting can exhaust this limit on its own and reproduce the exact symptom under investigation." I've done this — burned through the daily cap while trying to diagnose why deploys weren't happening, which kept them not happening. Check your usage before your fourth reconnect.

## 3. A build filter is skipping your commit

If all six checks above pass, your commit is being deliberately skipped. There are three ways that happens.

**The Ignored Build Step, and its inverted exit code.** This is a script you define in Project Settings, Git, that decides whether a commit deserves a deployment. Here's the part that catches everyone:

> a return code of `0` skips the build, and a code of `1` or greater builds a new deployment.

That's backwards from every other shell convention you use. A guard script written to exit 0 on success — the natural way to write it — cancels every single deployment, silently, forever.

Test it the way Vercel tells you to: run it locally with the same environment variables Vercel provides, then check the exit code of the last command with `echo $?`.

There's also a cost difference worth knowing. The Ignored Build Step runs *after* a build slot is claimed, so a skipped build still counts toward your deployment quota and your concurrency limit. Vercel's automatic skipping of unaffected projects in a monorepo evaluates *before* a slot is claimed and doesn't occupy one. If you're near your concurrency limit, the Ignored Build Step is the more expensive way to skip work.

**`git.deploymentEnabled: false` in `vercel.json`.** Check for it directly:

```bash
grep -R "deploymentEnabled\|enabled.*false" vercel.json
```

There are two spellings in circulation. `git.deploymentEnabled` is current; the older `github.enabled` form does the same thing and is still sitting in plenty of copied configs. Either one set to `false` stops Git-triggered deploys.

**A deploy hook that accepts the job and then does nothing.** The symptom is distinctive — the hook URL returns a 201 with a body like this:

```json
{"job":{"id":"mA0ORkK8IgBb3b6j3wFH","state":"PENDING","createdAt":1769166753635}}
```

and no deployment ever appears. Two causes show up repeatedly in Vercel's community: `github.enabled: false` in `vercel.json`, and in monorepos, an Ignored Build Step whose diff baseline got reset by an unrelated commit between hook calls.

If you need to ship while that's unresolved, you can bypass the hook and create the deployment through the API instead:

```bash
curl -X POST "https://api.vercel.com/v13/deployments?teamId=YOUR_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"your-project","target":"production","gitSource":{"type":"github","repoId":"YOUR_REPO_ID","ref":"main"}}'
```

If that works while Git pushes and deploy hooks both stall, the problem is in the trigger path and not in your build.

One warning while you debug this: **a deploy hook URL is a secret.** Anyone with it can trigger your deployments. People paste theirs into public forum posts when asking for help and then have to rotate them. Don't.

## How to confirm you actually fixed it

Don't trust the dashboard going quiet. Do this instead:

1. Push an empty commit: `git commit --allow-empty -m "Trigger deploy" && git push`.
2. Open the Deployments list. A new entry — even a queued one — means the trigger fired.
3. Still nothing? Run `vercel deploy` from the CLI in your project directory and read the error. The dashboard hides the most useful messages; the CLI prints them.
4. Check the Activity log in Project Settings for anything from the Vercel Bot.

If step 3 works and step 1 doesn't, your build is fine and the trigger path is broken — go back to cause 2.

## Where this sits in the rest of your setup

Once pushes are flowing again, the next failure you'll meet is a build that runs and breaks. That's a different problem with a different fix, and [the build failures I hit most](/deploy/vercel-build-failed/) covers those causes. If you're still on your first deploy, the [first-deploy guide](/deploy/deploy-first-app-vercel/) walks the whole path from `git init` to a live URL, and [connecting a custom domain](/deploy/vercel-custom-domain-setup/) is the step after that.

Past that point the problems stop being deployment problems. Once a site is live and stable, the next question is how it earns money — [adding a Lemon Squeezy checkout to an Astro site](/payments/lemon-squeezy-checkout-astro-static-site/) is the shortest path there if you don't want to run a backend.

And if you're on Netlify instead: the same silence looks completely different there. Netlify reports build failures with `build script returned non-zero exit code: 2`, and the causes behind it have nothing to do with push triggers. I wrote [a separate guide for that Netlify error](/deploy/netlify-build-failed-exit-code-2/).
