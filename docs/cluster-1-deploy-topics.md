# 集群 1：Deploy — 20 篇选题清单

> 写作顺序即发布顺序：先「核心漏斗」（新手必经路径），再「长尾问题」（报错排查类，搜索意图强、竞争低）。
> 每篇发布前用 Google 自动补全 + AlsoAsked 验证关键词，确认搜索意图后再动笔。

## A. 核心漏斗（新手从零到上线，8 篇）

| # | 标题（工作稿） | 目标关键词 | 难度 |
|---|---|---|---|
| 1 | How to Deploy Your First App to Vercel (No DevOps Experience Needed) | deploy app to vercel | beginner |
| 2 | Vercel vs Netlify vs Cloudflare Pages: Which Free Host for Your First App? | vercel vs netlify vs cloudflare pages | beginner |
| 3 | How to Connect a Custom Domain to Vercel (Namecheap & Cloudflare) | vercel custom domain setup | beginner |
| 4 | How to Buy a Domain and Set Up DNS for the First Time | how to set up dns for domain | beginner |
| 5 | Do I Need to Buy an SSL Certificate? No — and Here's Why (2026) | do i need to buy an ssl certificate（原 free ssl certificate setup 竞争过强，SERP 检查后换长尾） | beginner |
| 6 | Environment Variables: Where Your API Keys Should Live | environment variables nextjs vercel | beginner |
| 7 | Supabase vs Neon vs PlanetScale: Picking Your First Database | supabase vs neon | intermediate |
| 8 | How to Add a Database to Your Deployed App (Supabase Step by Step) | connect supabase to nextjs | intermediate |

## B. 长尾报错排查（搜索意图强、易排名，7 篇）

| # | 标题（工作稿） | 目标关键词 | 难度 |
|---|---|---|---|
| 9 | "Module Not Found" on Vercel but Works Locally? Here's Why | vercel module not found works locally | beginner |
| 10 | Vercel Build Failed: The 5 Most Common Causes and Fixes | vercel build failed | beginner |
| 11 | Why Your Environment Variables Are Undefined in Production | env variable undefined production | beginner |
| 12 | 404 on Refresh: Fixing Client-Side Routing on Static Hosts | spa 404 on refresh netlify vercel | intermediate |
| 13 | CORS Errors Explained for People Who Just Want Their App to Work | cors error how to fix | beginner |
| 14 | Your App Is Live but Google Can't Find It: SEO Basics for New Sites | new website not showing on google | beginner |
| 15 | Mixed Content Warnings: Why HTTP Resources Break Your HTTPS Site | mixed content error fix | intermediate |

## C. 进阶与迁移（建立权威，5 篇）

| # | 标题（工作稿） | 目标关键词 | 难度 |
|---|---|---|---|
| 16 | Vercel Pricing: When Does the Free Tier Run Out? | vercel pricing free tier limits | intermediate |
| 17 | How to Move Your App from Vercel to a VPS (Hetzner + Coolify) | self host nextjs on vps | intermediate |
| 18 | Cloudflare Pages vs Vercel for High-Traffic Sites (Bandwidth Costs) | cloudflare pages vs vercel bandwidth | intermediate |
| 19 | Preview Deployments: Test Every Change Before It Goes Live | vercel preview deployments | beginner |
| 20 | How to Roll Back a Bad Deploy in 30 Seconds | vercel rollback deployment | beginner |

## 写作规范

- 每篇 1200–1800 词，截图级步骤，每个步骤标注当前 UI 位置（工具更新后便于修订）
- 文内互链：报错类文章链回核心漏斗文章，漏斗文章互相串联
- frontmatter 复用 `src/content/blog/deploy-first-app-vercel.md` 的格式
- 发布节奏：每周 2–4 篇，先写完 A 组再写 B 组

## GSC 发现的清单外候选词

| 词 | 首次出现 | 状态 |
|---|---|---|
| how to redeploy vercel app | 2026-08-10 | 已作为小节加入文章 1（2026-08-10），观察排名；曝光涨则拆独立文 |
| transfer domain to vercel | 2026-08-13 | ✅ 已发布：`transfer-domain-to-vercel.md`（2026-08-17），角度"该不该转移 vs 只改 DNS"，链 #1/#3 |
