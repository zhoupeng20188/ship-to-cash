---
title: "Transfer a Domain to Vercel or Just Change DNS?"
description: "Separate registrar transfers from DNS changes. Preserve email records, check transfer eligibility, and connect a Vercel domain using dashboard values."
pubDate: 2026-08-17
updatedDate: 2026-11-02
category: deploy
difficulty: beginner
author: "Peng Zhou"
image: /og-transfer-domain-to-vercel.jpg
faq:
  - question: "Do I need to transfer the registrar to use Vercel hosting?"
    answer: "No. Add the domain to the project and configure the required records at the authoritative DNS provider."
  - question: "Will a registrar transfer always break email?"
    answer: "No. The outcome depends on whether authoritative DNS and its records remain available. Preserve the full zone if moving nameservers."
  - question: "Should I copy an apex IP from a tutorial?"
    answer: "Use the exact record values shown for your project in the current dashboard."
---

You do not need to transfer a domain's registration to Vercel to use it with a Vercel deployment. You can normally leave the registrar in place and edit DNS at the authoritative DNS provider.

A transfer changes the company managing registration and renewal. A DNS change alters where a hostname resolves. Those operations can happen separately; a registrar transfer does not inherently require a nameserver change.

## Choose the operation that matches the task

| Task | Operation |
|---|---|
| Put an existing domain on a deployed app | Add the domain to the project and configure its DNS records |
| Consolidate registration and renewal | Evaluate a registrar transfer |
| Move authoritative DNS management | Plan a nameserver change and copy the full zone |
| Fix a certificate or redirect | Diagnose verification and HTTPS first |

The [Vercel domain setup documentation](https://vercel.com/docs/domains/working-with-domains/add-a-domain) is the starting point for connecting a hostname. The [transfer-in documentation](https://vercel.com/docs/domains/working-with-domains/transfer-your-domain#transfer-a-domain-to-vercel) applies when you actually want to change registrar.

## Connect with DNS first

Add the domain in the project's domain settings. Copy the exact records requested for that project. Do not assume a historical apex IP or a CNAME from another project's tutorial is still the right value.

At the authoritative DNS provider, replace only the records that conflict with the web-hosting change. Preserve MX records and mail-related TXT/CNAME records. If you are unsure which provider is authoritative, inspect the domain's nameservers before editing a registrar dashboard.

Use the [custom-domain walkthrough](/deploy/vercel-custom-domain-setup/) for the connection steps. Then check both the apex and `www`, HTTPS, and the preferred-host redirect. [HTTPS diagnosis](/deploy/vercel-custom-domain-ssl-not-working/) is a separate task from changing registrar.

## Evaluate a transfer deliberately

Compare renewal prices, supported TLDs, account security, support, and DNS-management needs. Export or record the full DNS zone before starting. Note which service currently hosts that zone and whether it remains available after transfer.

Check eligibility with both registrars. Locks and restrictions can depend on the domain's age, previous transfers, contact changes, registry rules, and TLD. Do not assume one fixed waiting period covers every domain. ICANN explains the general process in its [domain transfer guidance](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en).

If eligible, follow the receiving registrar's documented process: unlock where appropriate, obtain the authorization code, start the transfer, and complete the required approvals. Treat the authorization code as sensitive. Use the registrar's status rather than a guessed completion date.

## Protect email during a DNS move

If you also change nameservers, create the destination zone before switching. Copy MX records, SPF, DKIM, DMARC, ownership verification, and service-specific records as well as A/AAAA/CNAME records.

A registrar transfer that preserves the same working authoritative DNS is different from a nameserver migration. Email failure is a risk to plan for, not an inevitable consequence of every transfer.

After the change, verify authoritative DNS answers, load the app, and send and receive test email through the relevant mailbox service. Keep the old DNS zone available while caches expire where possible. If your only goal was to launch the app, stop after the working domain connection rather than adding an unnecessary registrar migration.

For the underlying record types, see [buying a domain and configuring DNS](/deploy/buy-domain-set-up-dns/).
