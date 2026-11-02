# Editorial checklist

- Never invent customer conversations, revenue, elapsed time, first-person experience, or test results. Documentation-based guidance and hypothetical examples must be identifiable as such.
- A real test should record environment, input, expected and observed results, and supporting artifacts. An edit date does not claim a full retest.
- Use official sources for changing facts. Check country, plan, fee base, runtime, and API version rather than generalizing an account-specific observation.
- Distinguish business registration, income reporting, customer-facing taxes, provider onboarding, and payouts. Avoid universal legal conclusions.
- A verification snippet is not production fulfillment: check expected seller/product, paid state, mode, retries, durable writes, and refund behavior before granting access.
- Match structured data to visible content. Do not add FAQ, word count, article count, or screenshots solely to suggest approval readiness.
- Preserve useful URLs and distinct reader tasks. Merge only when the same answer is genuinely duplicated and plan redirects for any retired URL.
- Run `npm run build`, then `python3 scripts/check-site.py`. Review emitted HTML and a browser preview, including on mobile. Recheck public URLs after deployment.
- Verify changed titles against OG images. Keep OG files below 100 KB.
- AdSense approval is an external review, not an outcome guaranteed by this checklist. Ask the owner for the exact account feedback when a further rejection supplies new information.
