# 内容策略修订：暂停对比文（2026-09-04）

> 决策：新站（DR 低 / 域名年龄 < 1 年）**不再新增「X vs Y」对比类选题**，直到域名权重起来。
> 原 `cluster-1-deploy-topics.md` 中的对比类选题暂停，选题池按本文重排。

## 1. 为什么停

对比类关键词（vercel vs netlify、paddle vs lemon squeezy、gumroad vs kofi）的 SERP 有三个特征，对新站全是劣势：

1. **商业意图最强 → 大站内容军备竞赛**。2026-09-04 实测 `Stripe vs Paddle vs Lemon Squeezy`：前 5 位是 dev.to 长文、fintechspecs、comparisonmath、startupik，全是 3000+ 词、带对比表格和 FAQ schema 的站点。
2. **E-E-A-T 门槛高**。要"评测"多个产品，Google 期望作者真的用过。新站没有历史内容支撑这个信号。
3. **CPC 高 → 竞品投放**。同一批词基本都有付费竞争，排名位被挤。

对照实测：报错类长尾 `404 on refresh vercel` 前 5 位 = **2 条 Stack Overflow 线程** + 1 个 AI 内容小站 + CSDN + jsschools.com。**这个 SERP 新站能打穿。**

## 2. 选题判别规则（以后每篇都过一遍）

打开目标关键词的 Google 前 5 位：

| SERP 前 5 组成 | 判定 | 动作 |
|---|---|---|
| ≥2 条 UGC（Reddit / Stack Overflow / GitHub Discussions / 论坛帖） | **可打** | 写，用"步骤 + 可复制代码 + 为什么报错"的结构 |
| 前 5 有 1 条个人博客 / 小站 | **可打** | 写，做得比它更细、更新 |
| 全是 DR70+ 媒体站 / 厂商内容营销页 | **放弃** | 换词，别陪跑 |
| 出现 "vs" 且前 3 都是商业站 | **放弃** | 拆成单平台 how-to |

## 3. 替代打法：三级阶梯

- **Tier 1（现在做）—— 报错/长尾排查**：搜索意图极准，用户带着报错信息来，SERP 被论坛占据。写"症状 → 原因 → 修复代码"。
- **Tier 2（现在做）—— 单平台操作教程**：`how to add X to Y`，不是 `X vs Y`。同样能挂 affiliate 链接，且**转化比对比文更高**（读者已在实施阶段，不是调研阶段）。
- **Tier 3（以后做）—— 对比横评**：等 DR ≥ 25、站内已有 5+ 篇单平台教程做内链支撑时，再回头写对比文，那时它是"收割页"而不是"陪跑页"。

## 4. 修订后的选题池（全部非对比）

| # | 标题（工作稿） | 集群 | 目标关键词 | SERP 类型 | 优先级 |
|---|---|---|---|---|---|
| 1 | 404 on Refresh: Fixing Client-Side Routing on Vercel, Netlify & Cloudflare Pages | deploy | spa 404 on refresh | 2×Stack Overflow | **P0** |
| 2 | CORS Errors on Vercel: What `Access-Control-Allow-Origin` Means and Where to Add It | deploy | cors error vercel production | 论坛为主 | **P0**（换框架，见 §4.1） |
| 3 | ~~How to Add Lemon Squeezy Checkout to an Astro/Next.js Site~~ → **已发 2026-09-09**：Lemon Squeezy Checkout on an Astro Site (No Backend)（`lemon-squeezy-checkout-astro-static-site.md`） | payments | lemon squeezy astro integration | 官方文档为主，博客位有空间 | ✅ 已发 |
| 4 | How to Submit Your Vercel Site to Google Search Console (and Submit a Sitemap) | deploy | vercel google search console sitemap | 官方 + 博客 | P1 |
| 5 | How to Roll Back a Bad Deploy on Vercel in 30 Seconds | deploy | vercel rollback deployment | 官方文档 | P1 |
| 6 | Vercel Serverless Function Timeout: Why It Works Locally and 504s in Production | deploy | vercel function timeout 504 | GitHub Issues 为主 | P1 |
| 7 | How to Accept Payments on a Static Site with No Backend | monetize | accept payments static site | 混合 | P1（开簇） |
| 8 | EU VAT for a Solo Seller With No Company: What You Actually Owe | payments | vat digital products no company | 会计站为主，慎选 | P2 |

## 4.1 症状分工表（防站内内耗）

查库确认（2026-09-04）：**没有写过 404-on-refresh 专题**，但已发文章里擦边两处，且 deploy 集群已有 4 篇共用「本地能跑 / 线上不行」这一叙事框架。继续按同一框架写会造成关键词内耗（Google 把多个页面判为同一意图，只挑一个排）。

因此新增报错类文章必须用**症状**而不是**框架**来切分，并在文首放一张区分表：

| 症状 | 归属文章 | 状态 |
|---|---|---|
| 首页也 404 / `No Output Directory` | `vercel-build-failed.md` Cause 4 | 已覆盖 |
| 首页正常，点进子路由正常，**刷新子路由才 404** | `client-side-routing-404-vercel-netlify-cloudflare.md` | 已发 |
| **页面能加载，随后白屏，控制台有 JS 报错** | `application-error-client-side-exception-vercel.md` | **已发 2026-09-11（升为专题，取代 `deploy-first-app-vercel.md` 里的一句话排查）** |
| 构建阶段 `Module not found` | `vercel-module-not-found-works-locally.md` | 已覆盖 |
| 环境变量加了但还是 undefined（页面仍能渲染） | `vercel-environment-variables.md` | 已覆盖 |
| 页面能加载但 fetch 被浏览器拦下 | `cors-error-vercel.md` | 已发 |

配套要求：
- 新文的「3 个原因」必须排除已覆盖项，不再重复讲输出目录/文件大小写/环境变量。
- 新文第 1 屏放上面的区分表，并内链到对应的已有文章，形成「症状 → 分流」枢纽。
- 后续 CORS 文（#2）改框架：不再用「本地能跑线上不行」，改为「浏览器报错原文 → header 缺失 → 在 vercel.json / next.config.js / API route 里分别怎么加」。

## 4.2 SERP 实测记录（2026-09-07 蓝海日，5 个候选）

| 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|
| cors error vercel production | Stack Overflow ×2 + Vercel Community + devhide + exchangetuts = **5/5 UGC/论坛** | 可打 | **P0，本轮最软**。注意 §4.1：改框架为「报错原文 → header 缺失 → 三处分别怎么加」，禁用「本地能跑线上不行」 |
| lemon squeezy astro integration | Astro 官方文档 ×2（含中文镜像）+ LaunchFast 商业落地页 ×2 | 可打 | P0（affiliate）。无独立博客位，需靠一手踩坑出差异化 |
| vercel google search console sitemap | whataboutcoding / syedomer.me / techgist.ng / marthakelly.com / wisemixmedia = **5/5 个人博客小站** | 可打 | P1。无 UGC，说明意图偏教程；竞争低但流量上限也低 |
| vercel function timeout 504 | Vercel 官方 KB + Vercel examples + hivebook.wiki + flowql.com 小站 + Vercel Community | 边缘可打 | P1。官方占位 2/5，需做得比官方文档更「新手向」 |
| connect neon postgres to vercel | Vercel Marketplace + Neon 官方文档 ×2 + Vercel 模板 + adhdecode 小站 = **4/5 厂商官方** | 暂缓 | **P2 放弃**，符合 §2「全是厂商内容营销页 → 放弃」 |
| accept payments static site no backend | 实测搜索结果被中文/中国支付语境污染，无有效英文 SERP | 数据不足 | 词不精准，需换长尾再测 |

## 4.3 SERP 实测记录（2026-09-09 选题日，6 个候选）

| 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|
| lemon squeezy astro integration（复测） | Astro 官方文档 ×2（EN+中文镜像）+ GitHub 源码 + LaunchFast 商业页 | 可打 | **P0 已发 #3**。前 5 无独立博主一手教程，靠一手踩坑出差异化（is:inline / View Transitions 重绑 / Workers 版验签 / test mode 陷阱） |
| application error: a client-side exception on vercel | askhandle 小博客 + GitHub Discussions + SO + vercel/next.js#43772 + Vercel Community = **4/5 UGC** | 可打 | **本轮最软，P0 候补**。症状全新：页面能加载、浏览器 JS 崩白屏，与站内 build-failed / module-not-found / 刷新404 / env-undefined / CORS 均不撞，补齐症状分流枢纽 |
| vercel function timeout 504 | SO ×2 + khaledalam 个人博客 + openillumi ×2（AI 内容农场） | 可打 | P1。⚠️ 必须换框架避开「本地能跑线上不行」（§4.1）；差异化 = maxDuration 默认值≠计划上限（Hobby 10s / Pro 默认 15s 上限 300s），SERP 现存答案（Hobby 5s）已过时 |
| stripe webhook signature verification failed | Stripe 官方 ×3 + RapidDev ×2（AI 农场） | 边缘 | **放弃**。官方占位重 + 作者无 Stripe 账号，E-E-A-T 立不住 |
| mixed content https fix | web.dev + CF 官方 + launchcdn + dns.com + httpsornot = **5/5 厂商/工具站** | 放弃 | 符合 §2「全是厂商内容营销页 → 放弃」，且 0 条 UGC |
| business license sell digital products | dodopayments 内容营销长文 + 4 条中文政务页（地域污染） | 放弃 | 数据不足 + 与已发 do-i-need-an-llc 高度重叠 |

站内查重（2026-09-09 grep）：deploy 簇 12 篇无 504 / client-side exception 覆盖；Lemon Squeezy 在 3 篇 payments 文中仅有顺带提及，无集成教程。

## 4.3 SERP 实测记录（2026-09-09 选题日，6 个新候选）

| 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|
| "application error a client-side exception" vercel | askhandle 小博客 + GitHub Discussions + Stack Overflow + vercel/next.js Issue + Vercel Community = **4/5 UGC** | 可打 | **P0，本轮最软**。症状全新（页面能加载、浏览器 JS 崩），与 §4.1 已有 5 类症状不撞 |
| vercel 504 FUNCTION_INVOCATION_TIMEOUT | Stack Overflow ×2 + khaledalam 个人博客 + openillumi ×2（AI 内容农场）= **2/5 UGC + 3 弱站** | 可打 | P1。⚠️ 必须换框架：禁用「本地能跑线上不行」，改「超时」切分。差异化点 = maxDuration 默认值 vs 计划上限的区别（SERP 里还在说 Hobby 5s，已过时） |
| lemon squeezy astro checkout | Astro 官方文档 ×3（含 CN 镜像 + GitHub 源码）+ LaunchFast 商业页 | 可打 | P0（affiliate）。前 5 **无独立博主一手教程**，靠 test mode / 静态站无后端验签出差异化 |
| lemon squeezy webhook invalid signature | Stack Overflow + LS 官方文档 ×2 + dev.to 个人一手文 + Strapi 集成页 | 可打 | 作为上一条的姊妹篇，**先不单开**，并入 checkout 文作章节 |
| mixed content blocked https | web.dev + Cloudflare 官方文档 + launchcdn + dns.com + httpsornot = **5/5 官方/厂商/工具站** | 放弃 | 符合 §2「全是厂商内容营销页 → 放弃」，无 UGC 位 |
| do you need a business license to sell digital products | dodopayments 长文（竞品内容营销）+ 4 条中文政务页（地域污染，英文 SERP 数据不可用） | 放弃 | 数据不足；且与已发 `do-i-need-an-llc-to-sell-digital-products` 高度重叠 |
| stripe webhook signature verification failed | Stripe 官方文档 ×3 + RapidDev ×2（AI 农场）= **官方 3/5** | 不推荐 | 官方占位重；作者无 Stripe 账号，一手 E-E-A-T 缺失 |

## 4.4 SERP 实测记录（2026-09-11 选题日，8 个候选）

已发 17 篇后查重：deploy 簇 12 篇无「客户端异常 / 504 / CF Pages 环境变量」覆盖；payments 簇 5 篇均为「怎么收 / 怎么接」，**无「收款后怎么交付」**。

| 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|
| "application error: a client-side exception has occurred" vercel | GitHub Discussions + Stack Overflow + vercel/next.js#43772 + Vercel Community + askhandle 小站 = **4/5 UGC** | **可打** | ✅ **已发 2026-09-11**：`application-error-client-side-exception-vercel.md`。症状全新，补齐分流枢纽第 6 类 |
| cloudflare pages environment variables not working production build | eastondev ×2 + vdaluz.com + mrobles.work = **4/5 个人博客一手** + deepwiki 聚合 | **可打** | **P0（E-E-A-T 最强）**。⚠️ 与已发 `vercel-environment-variables` 有内耗风险：必须按「平台 × 症状」切分 —— 该文是 Vercel「加了还是 undefined」，本篇是 CF Pages「设了但构建读不到」，文首放区分表 |
| send download link after payment digital product no backend | dev.to ×2（同一作者，AI 味重）+ tmdm.cn（dev.to 机翻镜像）+ PayRequest + SendOwl = **2/5 可打 + 2/5 厂商** | 边缘可打 | P1（affiliate 位最好）。⚠️ 必须与 `getting-paid-without-stripe-kofi-paypal`（怎么收）和 `lemon-squeezy-checkout-astro-static-site`（怎么接）切分：本篇只讲「付完款文件怎么到买家手里」 |
| vercel 504 FUNCTION_INVOCATION_TIMEOUT | Vercel examples + vercel.com/guides = **官方 2/5** + prismix.dev / afterbuildlabs / generalistprogrammer（AI 内容农场 ×3） | **降级** | 从 09-09 的「P1 可打」降为 P2。农场站已把 maxDuration 表格 / streaming / QStash 铺满，**0/5 可打位**。唯一缝隙：SERP 里计划限额仍是旧口径（Hobby 5s/10s、Pro 60s），官方 KB 现在讲 Fluid Compute（免费 5 分钟 / 付费 800s） |
| supabase auth astro tutorial protect route | freecodecamp（DR 极高）+ Supabase 官方文档 + deepwiki ×2 + mihai-andrei.com 个人博客 | 偏硬 | 放弃。freecodecamp + 官方占 3/5，新站排不进 |
| astro form submission no backend serverless function | forminit + formigo + rizzness（表单 SaaS 厂商内容营销页 ×3）+ dev.to + research.io | **放弃** | 符合 §2「全是厂商内容营销页」 |
| vercel rollback deployment to previous version | Vercel 官方文档 ×2 + Vercel Academy + Vercel changelog + vercel-ship 子域 = **5/5 官方** | **放弃** | 符合 §2「全官方占位」 |
| how to accept payments on a static site without a backend | kleap 文档 + **kinsta 大站** + dashbuilds.dev（个人一手）+ dev.to（转载）+ Gatsby 官方教程 | 混合 | 词太宽导致大站进场，需换长尾再测；先并入「收款后交付」方向使用 |

配套要求（本轮新增）：
- 「客户端异常」新文第 1 屏必须放 §4.1 症状区分表（升级为 6 行），内链到已发的刷新 404 / build-failed / module-not-found / env-undefined / CORS 五篇。
- 「CF Pages 环境变量」新文第 1 屏放「平台 × 症状」双列表，明确与 `vercel-environment-variables` 的分工，两文互链但不重讲同一症状。
- 「收款后交付」新文只写交付环节，不回讲收款方式（避免与 payments 簇 5 篇内耗）。

### #1 交付回顾（2026-09-11）—— 一手来源就是最强差异化

`application-error-client-side-exception-vercel.md`：1779 词、H2 ×8、无 H1、FAQ ×6、内链 6 个目标（症状分流表）、外链 4（Next.js ×3 + Vercel ×1）、OG 60KB；构建 28 页全过，canonical / og:image / FAQPage schema / sitemap / 内链落点全部验证通过。

SERP 前 5 全是零散 UGC 帖、没有一篇完整答案，四把差异化武器：

1. **Next.js `retry` vs `reset`**：官方版本历史显示 `retry` 到 16.3.0 才转正（16.2.0 为 `unstable_retry`），而 SERP 与 AI 生成的 `error.tsx` 几乎清一色还在写 `reset`。补上行为差异：`retry` 会重新请求并重渲染，`reset` 只重渲染。
2. **`global-error` 不含全局样式**：官方明说它渲染自己的 document，主题切换与字体都到不了 → 解释了"为什么错误页像裸 HTML"。
3. **Skew Protection 默认上限一天**：把"部署后旧标签页崩"这个高频症状归因清楚，并给出「2024-11-19 之后创建的项目默认开启」的适用边界。
4. **hydration 的 4 类真因 + 浏览器扩展**：含"无痕窗口复现不了 = 扩展干的"这一判别动作。

可复用教训：**写前先抓官方文档的 Version History 与默认值**，比读同题材博客更容易挖到可验证的时间敏感事实（与第 17 篇 Lemon Squeezy「官方示例已过时」同一打法）。

## 4.5 SERP 实测记录（2026-09-14 选题日，17 个候选）

已发 18 篇后查重：**deploy 13 篇 / payments 5 篇 / monetize 0 篇 / legal 0 篇 / tools 0 篇** —— monetize、legal、tools 三个分类页目前是空的，三个空分类页既无内链枢纽价值也属薄内容页，本轮起应优先补 monetize。

| # | 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|---|
| 1 | cloudflare pages environment variables not working production build | deepwiki 聚合 + eastondev（EN/ZH 各一）+ mrobles.work ×2 = **4/5 个人博客一手** | **可打** | **P0（遗留池，E-E-A-T 最强）**。与已发 `vercel-environment-variables` 按「平台 × 症状」切分：本站是 CF Pages「设了但构建读不到」 |
| 2 | cloudflare pages custom domain not working 522 | CF 官方 docs + CF Community ×2 + witch.work 个人博客 + answeroverflow = **3/5 UGC** | **可打** | **P0**。⚠️ 与已发 `vercel-custom-domain-ssl-not-working` 同症状换平台，须按平台切分。差异化：CF 特有「只加 DNS CNAME 必 522，必须走 Pages 面板 Add custom domain」 |
| 3 | send download link after payment digital product no backend | dev.to ×2（同一作者，AI 味重）+ tmdm 镜像 + wpsmartpay + vellir = **2/5 可打 + 2/5 厂商** | 边缘可打 | **P1（affiliate 位最好，遗留池）**。承接 `lemon-squeezy-checkout-astro-static-site`；只讲交付不讲收款 |
| 4 | how to price a digital product for the first time | 60minuteapps + flows4 + dev.to + eaglesdigital + shegrowsvirtual = **5/5 小站（无大站）** | **可打** | **P1**。竞争最低、可开 monetize 簇第一篇。⚠️ 无 affiliate 落点，纯 AdSense/权威向 |
| 5 | vercel deploy success but site shows old version | Vercel Community ×2 + Vercel 官方 ×3 = 官方 3/5 | 边缘可打 | **P1**。症状全新（不撞 §4.1 已有 6 类）。差异化真因：`.vercel/output` 被误提交仓库导致永远走预构建产物（Vercel Community 实证）+ service worker + 三层缓存分流 |
| 6 | vibe coded app deployment failed / ai generated code broken | vibego.io + Railway 官方 + deploymyvibe.com + lowcloud.io + blog.vibecoder.me = **4/5 新兴垂直小站** | 可打（需窄化） | **P1**。受众完全对上（vibe coder），0 条传统 UGC 但有 4 个同级别新站。⚠️ 话题太宽，须窄化到单一症状，否则与 deploy 簇 13 篇内耗 |
| 7 | cloudflare pages nodejs_compat error deployment | CF Community + SO（高赞）+ radar.cloudflare.com + eastondev ×2 | 可打 | **P2**。差异化：dashboard 里输入 `nodejs_compat` 后按 Enter 会误选其他 flag（CF Community 实证）；`FinalizationRegistry is not defined` 需抬 compatibility date |
| 8 | astro environment variables not working import.meta.env undefined | SO ×2 + Astro 官方 ×2 + eastondev = 混合 | 不单开 | 与 #1 及 `vercel-environment-variables` 三方内耗，并入 #1 作章节 |
| 9 | cloudflare pages functions 500 internal server error | lobehub skill 页 + CF Community + Latenode 社区 + eastondev + CF 官方 | 边缘可打 | P2。根部与 #1/#7 重叠（env vars 未复制到 preview 分支、nodejs_compat 缺失），暂不单开 |
| 10 | astro sitemap not generating robots.txt | Astro 官方 ×2 + skillmd.ai + thatdevpro + GitHub Issue #6416 | 边缘 | P2。词太窄，流量上限低 |
| 11 | how to generate license keys for digital products without backend | toolsbox + generatorcollection + ud5 + conversionproplus（**4/5 工具站**）+ shipanjodder 个人博客 | 偏硬 | P2。可作为 #3 的姊妹章节（RSA 签名离线验签），不单开 |
| 12 | vercel build failed javascript heap out of memory | Vercel examples + community.vercel.com + vercel-ship + turbostarter + qasimcode 个人博客 | 边缘 | P2。官方 3/5 占位重 |
| 13 | vercel preview deployment environment variables not available | Vercel 官方 ×3 + edge-cases.com + env.dev | 放弃 | 官方占位重，符合 §2 |
| 14 | vercel domain already in use another project | Vercel 官方 ×4 + SO ×1 | 放弃 | 5/5 官方/厂商 |
| 15 | where to sell digital products without your own website | mediasaf + stgnx + resellready + checkoutpage + useclima = **5/5 厂商内容营销页** | 放弃 | 符合 §2「全是厂商内容营销页」 |
| 16 | paddle checkout integration astro static site no backend | SERP 被中文出海教程 + 完全无关内容（讯飞 Astron、CAT 工具）污染 | 放弃 | 无有效英文 SERP；且 Paddle 需 KYC/护照/地址证明，对新手受众门槛过高 |
| 17 | astro images not loading after deploy | devhide（SO 镜像）+ astro-aws + GitHub repro + eastondev + gitcode | 边缘 | P2。`base` 配置 + SSR imageService 两类，做完即窄 |

### ⚠️ 竞争格局观察（本轮新增，重要）

SERP 里反复出现同一批**同级别 2026 新站**，说明赛道已被专门玩家盯上：

- **eastondev.com（比邻）**：CF Pages / Astro 话题铺得最广，中英双版本，在候选 #1/#7/#8/#9/#17 的 SERP 里都出现。**最需要盯的同赛道对手。**
- **vibe coding 部署垂直矩阵**：vibego.io / deploymyvibe.com / blog.vibecoder.me / lowcloud.io —— 2026 年新起的一批站，专打 "vibe coded app won't deploy"。候选 #6 的 SERP 已被它们占满。
- **mrobles.work**：个人博客，CF Pages 环境变量两篇一手文，E-E-A-T 强。

结论：**护城河必须靠「一手实测 + 症状分流枢纽」**（站内 6 类症状互链），通用「部署失败合集」这类宽题已经打不动，会被垂直站以量取胜。

## 4.6 SERP 实测记录（2026-09-16 选题日，5 个候选）

已发 19 篇：**deploy 14 / payments 5 / monetize 0 / legal 0 / tools 0**。09-14 遗留池里的 CF Pages 环境变量已发，剩余候选本轮复测。

| # | 候选词 | SERP 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|---|
| 1 | how to sell a boilerplate / starter template as a solo developer | nuxttitle.vercel.app（自推广教程）+ dev.to ×2（AI Study Room 原文、creatoreconomy 向）+ jakeinsight.com（个人博客，带 Gumroad 2026 实测数字）+ tvglobal.world（no-code 向小站）= **5/5 小站个人博客，0 大站 0 官方** | **可打（本轮最软）** | ✅ **已发 2026-09-16**：`how-to-price-a-developer-template.md`（monetize 簇第一篇）。⚠️ 现有内容 4/5 是「创作者经济模板」（$17/$27/$47 卖 worksheet/course），**没有一篇讲开发者模板/boilerplate 定价**（只有 dev.to 那篇提了 ShipFast 等竞品名，未做费率测算）→ 缺口明确 |
| 2 | cloudflare pages custom domain not working 522 | CF 官方文档 ×2（docs + pages/get-started）+ CF Community ×2（**含官方 Team 成员给出的确切解法**）+ witch.work 个人博客 = **3/5 可打位** | **可打** | **P0**。同 09-14 判定。可验证事实链完整：① 手动加 CNAME 但未在 Pages 面板 Add custom domain → 必 522（CF 官方文档明写）② www 与 apex 必须**分别**注册 hostname（Community 实证）③ CAA 记录拦截证书签发（官方 Known issues）。⚠️ 站内域名类已有 4 篇，这是第 5 篇，必须严格按「平台 × 症状」切分 |
| 3 | vercel deploy success but site shows old version | Vercel Community ×2（**其中一帖给出确诊根因**）+ Vercel 官方 ×3（新 KB + examples + Academy）= 官方 3/5 | **边缘可打（较 09-14 有新料，可升 P1）** | P1。官方占位重，但 SERP 全是「去 dashboard 点 Purge」，**官方文档这轮新增了 CLI 命令族**（`vercel cache purge --type cdn` / `vercel cache invalidate --tag` / `vercel cache dangerously-delete` / `vercel deploy --force --prod`，`vercel httpstat` 为 beta，需 CLI v48.9.0+）——是新的、可验证的时间敏感事实。叠加 Community 一手根因「`.vercel/output` 被误提交 → Vercel 永远复用预构建产物」 |
| 4 | lemon squeezy license keys / deliver download after payment | lemonsqueezy.com 官方 ×2 + aitoolbox.hk 评测 + spectraforgeaudio 法务页 + rockxy.io 法务页 = **4/5 厂商/同类卖家页面** | **降级** | 从 09-14 的「边缘可打 P1」**降为 P2**。原词 SERP 已被厂商页占满，符合 §2。若要救，需换长尾（如 `lemon squeezy license key not working` / 离线签名验签），须另测 |
| 5 | send download link after payment digital product no backend | ⚠️ 本轮搜索被系统拦截，**无有效 SERP 数据** | 数据不足 | 与 #4 同簇，暂缓；下轮换词重测 |

### 本轮结论
- **优先补 monetize**（分类页仍是空的）：候选 #1 既是本轮最软 SERP，又能给 monetize 分类页填第一篇 + 承接 payments 簇 4 篇内链 + Lemon Squeezy affiliate 落点。→ **2026-09-16 已执行**，monetize 分类页不再是空页。
- 候选 #2 保留在池中作第二顺位（deploy 簇续命，但域名话题已偏饱和）。
- 候选 #3 的差异化已从「靠一个新根因」升级为「新 CLI 命令族」，可排 P1。

### #3 交付回顾（2026-09-16）—— 一手来源仍是最强差异化

`how-to-price-a-developer-template.md`：1687 词（正文，不含表格）/ 1794（含表格）、H2 ×7、无 H1、FAQ ×6、内链 7 个目标、外链 4（Vercel / Astro / Lemon Squeezy 定价页 / Gumroad 定价页）、OG 67KB；构建 30 页全过。

四把差异化武器：

1. **「一万美元级」的价格带表**：SERP 里 4/5 是创作者经济定价（$17/$27/$47），没有一篇给开发者模板的分层价格带（$39–$99 / $149–$299 / $299–$499）。带表里点名 ShipFast $199、supastarter 与 MakerKit $299 作为可核实锚点。
2. **固定费率的反向论证**：用 Lemon Squeezy 官方页的 5% + 50¢ 算出「$19 → 7.6%、$199 → 5.3%」的有效费率表，再折算成「凑够 $1,000 需要卖几份」（53 / 21 / 11 / 6）。SERP 现有内容只讲百分比，没人换算成份数。
3. **反向观点（价格越低支持成本越高）**：主流创作者经济建议是「没受众就定低价」，本文给出反论——便宜货吸引上下文更少的买家，每美元支持成本更高，低价把产品变成兼职。
4. **主动标注数据不确定处**：Gumroad 的 10% + 50¢ 是否含卡费，第三方拆解互相矛盾 → 正文与 FAQ 都写明「以 Gumroad 官网为准，别信博客，包括这篇」。这条符合 CLAUDE.md 的事实红线。

可复用教训：**价格/费率类文章的护城河 = 把官方费率页的原始数字自己算一遍**（有效费率、份数、临界点），而不是复述同题材博客的百分比。与第 17 篇「官方示例已过时」、#1 的「官方 Version History」同一打法：**先去官方页抓原始参数，再自己算**。

## 4.7 SERP 实测记录（2026-09-18 选题日，8 个候选）

已发 20 篇：**deploy 15 / payments 5 / monetize 1 / legal 0 / tools 0**。查重：Netlify 仅在 `client-side-routing-404`（9 次）与对比文（10 次）出现，**无 Netlify 主攻文章**；`exit code` / `522` / `license key` 均无专题（license key 仅在 checkout 文与 MoR 文顺带提及 3 次）。

| # | 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|---|
| 1 | cloudflare pages custom domain not working 522 | CF 官方（preview 域 llms-full）+ CF Community（**MVP 给出确切解法**）+ 掘金中文 + answeroverflow（CF Developers Discord 实证）+ witch.work 个人博客 = **3/5 UGC** | **可打** | **P0（本轮最软）**。同 09-14/09-16 判定，事实链完整：① 手动加 CNAME 但未在 Pages 面板 Add custom domain → 必 522（官方文档明写）② www 与 apex 必须**分别**注册 hostname（Community + answeroverflow 双实证）③ CAA 记录拦截证书签发（官方 Known issues）。⚠️ 域名类已 4 篇，这是第 5 篇，须严格按「平台 × 症状」切分 |
| 2 | netlify deploy failed / "build script returned non-zero exit code: 2" | Netlify 官方 troubleshooting-tips + **Stack Overflow（高赞，多答案）** + dodatech（AI 味教程）+ answers.netlify.com 官方 Support Guide + codegenes.net（AI 农场）= 官方 2/5 + UGC 1/5 | **边缘可打** | **P1（平台轮换）**。差异化不靠"更全"，靠**报错原文唯一**：`exit code: 2` 是 Netlify 专属字符串，Vercel 的 `vercel-build-failed` 不会报这个 → 与站内 6 类症状零内耗。官方 troubleshooting 页只讲 exit 128 与 warning-as-error，**没讲 exit code 2** |
| 3 | lemon squeezy license key api generate validate | LS 官方 guide + 官方 API 参考 + hashhackers 个人博客 + eliteai.tools（AI 聚合）+ apievangelist（OpenAPI 聚合）= 官方 2/5 | **可打** | **P1（affiliate 落点最好）**。承接 `lemon-squeezy-checkout-astro-static-site`，只讲「付完款怎么把权限交到买家手里」。可挖的一手点：activate/validate/deactivate 是**免 API key 的公开端点**；官方示例里 `activation_limit: 1` 与 `activation_usage: 5` 自相矛盾（文档陈旧）；`instance.id` 必须落库否则无法 deactivate |
| 4 | how to get first customers for a developer template | dev.to ×2 + lovaround + dohost（主机商软文，夹带 VPS 推广）+ agilitypr（PR 公司内容营销）= **5/5 小站但 0 篇专讲开发者模板** | 可打 | **P2**。缺口存在（现有全是通用 SaaS 获客），但意图偏软、无报错型 urgency；且 monetize 刚开 1 篇，第二篇更适合做「交付」而非「获客」 |
| 5 | vercel deploy success but site shows old version | Vercel examples KB（官方）+ CSDN 中文 + solipsxu.xyz（**Vercel docs 镜像**，已完整收录 CLI 命令族）+ solutionfall（SO 镜像）+ Vercel Community（一手根因）= 官方/镜像 3/5 | **降级** | 从 09-16 的「P1 可升」**降为 P2**。⚠️ 关键变化：09-16 赖以差异化的**新 CLI 命令族已被官方收录成 KB 页**（`vercel cache purge --type cdn` / `cache invalidate --tag` / `dangerously-delete` / `deploy --force --prod` / `httpstat` beta），且被 docs 镜像站铺满 → 时间敏感优势消失。仅剩 Community 那条 `.vercel/output` 误提交根因 |
| 6 | vercel hobby plan commercial use | Vercel docs/plans/hobby ×3（含 graph 变体）+ vercel.com/terms + vercel.com/pricing = **5/5 官方** | **放弃** | 符合 §2「全是厂商/官方占位」。话题本身对 vibe coder 高价值，若要救须换长尾（如「Hobby 上能不能挂收款链接」），另测 |
| 7 | vercel bandwidth exceeded hobby plan what happens | Vercel docs/plans/hobby ×3 + temps.sh（**竞品自推广**，推 self-host 替代）+ hivebook.wiki（AI 农场）= 官方 3/5 + 竞品营销 1 | **放弃** | 官方占 3/5；且 SERP 出现竞品替代品内容营销，说明商业意图强、新站排不进 |
| 8 | do i need a privacy policy for my side project saas | privacypolicygenerator.info + lovaround + mylegalpal + termsfeed + launchadvisor = **5/5 法律文档生成工具站** | **放弃** | 符合 §2「全是厂商内容营销页」。legal 簇开簇失败，下轮须换非工具站角度（如「欧盟买家要发票怎么办」） |

### 本轮结论

- **遗留池 #1（CF Pages 522）保持 P0**，三条事实链两轮复测均成立，是最稳的一篇。
- **新增 #2 为平台轮换机会**：deploy 簇 15 篇里 Netlify 从无主攻，`exit code: 2` 这个报错原文与站内 6 类症状零重叠，是唯一不靠「更全」而靠「唯一」的差异化。
- **#5 的降级值得记一笔**：时间敏感型差异化（新 CLI / 新默认值）有保质期——官方文档一收录、镜像站一铺，优势就没了。以后做这类判断要顺带查「官方是否已出对应 KB 页」。

## 4.8 SERP 实测记录（2026-09-21 蓝海日，8 个候选）

已发 21 篇：**deploy 15 / payments 5 / monetize 1 / legal 0 / tools 0**。查重：`git push` / `deploymentEnabled` / `deploy hook PENDING` 站内 0 覆盖；`license key` 仍仅在 checkout 文与 MoR 文顺带提及；`522` 无专题。

| # | 候选词 | Google 前 5 实际构成 | 判定 | 结论 |
|---|---|---|---|---|
| 1 | cloudflare pages custom domain 522（**第三轮复测**） | answeroverflow（CF Developers Discord，**MVP Cyb3r-Jak3 给出确切解法并引用官方文档原句**）+ 掘金中文 + CF Community（Walshy 解答）+ farrosfr.com（个人博客，讲 www/apex 分别注册）+ CF Community（**CF Team janik1 实证**）= **5/5 UGC，官方 0/5** | **可打** | **P0，三轮复测中最软的一轮**（09-14 与 09-18 均为 3/5，本轮官方页连直接占位都没有，只被引用）。事实链三条依旧成立，且本轮多两条新料：① CF Team 明确要求「**先删掉你自己建的 www 记录**，再到 Pages 面板 Add custom domain」——手动加 CNAME 反而坏事，这是官方实证 ② NuxtHub / preview 环境场景：先 Add custom domain 再改 branch alias 才能生效 |
| 2 | vercel git push not triggering deploy / auto deploy stopped | Vercel 官方 KB ×2（含 staging 镜像）+ lilting.ch（**个人一手根因**）+ Vercel Community ×2（多人实证 + Leaderboard 解答）= 官方 2/5 + UGC 3/5 | **可打** | **P1（症状全新）**。站内 7 类症状全是「部署了但坏了」，**没有一类是「push 了根本没部署」**——枢纽缺口。差异化点：① 官方 KB 明写「反复手动 redeploy 排查会耗尽 Hobby 100/day 限额，反而复现症状」（反直觉）② `git config user.email` 与 Vercel 账号不匹配 → **静默跳过**，dashboard 什么都不显示，只有 CLI 才报错 ③ `github.enabled: false` 与 `git.deploymentEnabled: false` 新旧两种写法 ④ deploy hook 返回 `{"job":{"state":"PENDING"}}` 但永不落地，绕过办法是走 `/v13/deployments` API |
| 3 | lemon squeezy license key api tutorial（开发者侧） | LS 官方 guide + LS 官方 API 参考 + claude-plugins.dev（AI 聚合）+ npm `lemonsqueezy-license-manager` README + lmsqueezy/lemonsqueezy.js GitHub wiki = 官方 2/5 + 包/仓库文档 2/5 + 聚合 1/5 | **可打** | **P1（affiliate 落点最好）**。前 5 **零独立博主教程**，全是官方与包文档。可用一手点：activate/validate/deactivate **免 API key**（官方 sk 注释明写）；官方示例里 `activation_limit: 1` 与 `activation_usage: 5` 自相矛盾（文档陈旧）；`instance.id` 不落库则无法 deactivate；必须校验 `meta.store_id/product_id` 否则别家产品的 key 能解锁你的 app |
| 4 | send download link after payment digital product no backend（重测） | dev.to ×2（**同一作者，AI 味**）+ PayLink（厂商）+ tmdm.cn（dev.to 机翻镜像）+ PayRequest（厂商）= 厂商 2/5 + AI 农场 2/5 | **边缘可打** | **P1（有一手反驳点）**。⚠️ 排名前 2 的教程都教读者把 **Cloudinary API Secret 写进浏览器**（`btoa('API_KEY:API_SECRET')`）或**用 `?success=true` 当支付凭证**（任何人加个 query 就能白嫖下载）——可直接反驳。承接 `getting-paid-without-stripe`（怎么收）与 `lemon-squeezy-checkout-astro-static-site`（怎么接），本篇只讲「付完款文件怎么到买家手里」 |
| 5 | cloudflare pages build failed | CF 官方 docs ×2（含两个 preview 镜像）+ 官方 llms-full + 官方 git-integration troubleshooting + Stack Overflow = **官方 4/5** | **放弃** | 符合 §2「全官方占位」。且唯一可打的 SO 症状 `Output directory "dist/..." not found` 与 `vercel-build-failed` Cause 4 重叠 |
| 6 | netlify forms not receiving submissions | Netlify 官方 ×3（forms troubleshooting / setup / FAQ）+ 官方 2017 blog + Stack Overflow = **官方 4/5** | **放弃** | 官方占位重；且 Netlify Forms 属平台专属功能，与我们「部署 + 收款」主线偏离 |
| 7 | lemon squeezy license key not working（§4.7 #3 的换词尝试） | kit-maker（**卖家给买家的帮助页**）+ LS 官方 ×2 + autodocguide（卖家文档）+ negativelabpro 论坛（**买家求助**）= 卖家页 2/5 + 官方 2/5 + 买家 UGC 1/5 | **放弃** | 🔴 **重要：换长尾后意图错位。** 搜 `license key not working` 的人是**买了软件激活不了的买家**，不是要给自家产品加验证的开发者。原词（#3 `license key api tutorial`）才是开发者意图，别再往「not working」方向换词 |
| 8 | where to sell developer boilerplate / marketplace 2026 | dev.to（AI Study Room 转载）+ SprukoMarket + SellRamp + ScriptRipple + CheckoutPage = **4/5 平台自推广 + 1 AI 农场** | **放弃** | 符合 §2「全是厂商内容营销页」。且 dev.to 那篇的费率数字（ThemeForest 37.5–50% / Creative Market 30% / Gumroad 5–10%）与已发 `how-to-price-a-developer-template` 高度重合 → 内耗风险 |

### 本轮结论

- **遗留池 #1（CF Pages 522）第三轮复测，从 3/5 UGC 升到 5/5**，官方页退出直接占位 → 目前全池最软。但站内域名类已有 4 篇，这是第 5 篇，仍须严格「平台 × 症状」切分。
- **新增 #2 是枢纽缺口**：`vercel git push not triggering deploy` 对应「静默不部署」，是站内症状分流表**唯一没覆盖的前置环节**——现有 7 篇全部假设「部署已经发生」，push 没触发的读者一篇都接不住。
- **#7 的失败值得记一笔（新规则）**：换长尾能降低竞争，但**也可能换掉意图**。以后换词前后必须对比「搜索者身份」——同一个产品，卖家搜的和买家搜的是两套完全不同的词，写错方向等于白写。

### 站点结构提醒（2026-09-21）

deploy 已占 15/21（71%），连续 3 篇新文都是 deploy。按 §7.1，若继续只发 deploy，分类失衡会拖慢 AdSense 申请（需 25–30 篇且结构合理）。**下一轮建议优先 #3（payments）或 #4（payments/monetize）**，除非 #2 的枢纽缺口更急。

## 5. 已暂停（原清单）

| 原选题 | 原因 |
|---|---|
| Supabase vs Neon vs PlanetScale（#7） | 三方对比；改为写"Supabase 连 Vercel 单平台教程" |
| Paddle vs Lemon Squeezy（本次新提） | SERP 已被 2026 长篇对比文占满 |
| Gumroad vs Ko-fi vs Lemon Squeezy（本次新提） | 同上 |
| Vercel vs Netlify vs CF Pages | 已发布，保留（第一篇，不算数） |

## 6. 写作规范补充

- 每篇先做 §2 的 SERP 判别，把结果记到本文 §4 的「SERP 类型」列
- 报错类文章结构固定：症状截图/报错原文 → 3 个可能原因（按概率排序）→ 每个原因的修复代码 → 怎么验证修好了
- 文章内不放"我们下次对比 X 和 Y"这类预告，避免提前挂对比意图

## 7. 推页策略：GSC 复盘结论（2026-09-15）

### 7.1 触发条件：什么时候该停止写新文，转去推老文

8/3–9/12 的 40 天数据：点击 5 / 曝光 4,523 / 平均排名 50.7。表面看是"新站没起量"，实际是**曝光与回报错配**：

| 分组 | 页面数 | 曝光 | 占比 | 点击 |
|---|---|---|---|---|
| 平均排名 ≥50 | 5 | 3,536 | 78% | 0 |
| 平均排名 ≤35 | 5 | 806 | 18% | 5 |

**判据：当站内已有一批页面进入 10–35 名时，推页的期望收益高于发新文。** 新文平均要 30–60 天才积曝光，而这些页面离首页只差 1–3 页，曝光已经在那里，缺的只是排名。此时应把内容资源全部押在「已进 10–35 名」的页面上。

本轮触发的具体信号：
- `vercel-custom-domain-setup` 单篇占 2,424 曝光（54%）却排 53.3 → 典型大词陪跑，不指望它拿点击，改当内链枢纽用
- 全站 5 次点击全部来自排名 ≤35 的页面 → 排名是唯一门槛，不是词量

### 7.2 ⚠️ 平均排名是失真指标，别拿它做判断

8/28 之后连发 4 篇新文，新文初始排名差，会把站内平均排名拉低。**站内均值 50.7 不代表老文水平**——真实家底要看单页（`getting-paid` 11.4 / `llc` 23.9 / `ssl-not-working` 28.4 / `build-failed` 29.9 / `transfer-domain` 34.8）。以后复盘一律看单页排名分布，不看均值。

### 7.3 内链审计（2026-09-15 实测）

**关键发现：入链数与排名严重反相关。**

| 页面 | 平均排名 | 入链数 |
|---|---|---|
| getting-paid-without-stripe | 11.4 | **2** ← 最少之一 |
| do-i-need-an-llc | 23.9 | 4 |
| custom-domain-ssl-not-working | 28.4 | **1** ← 全站最少 |
| vercel-build-failed | 29.9 | 9 |
| transfer-domain-to-vercel | 34.8 | 7 |
| merchant-of-record | 71.0 | 10 |
| custom-domain-setup | 53.3 | **17** ← 最多 |

原因很清楚：内链多的页面是「枢纽型」宽词页（custom-domain-setup、deploy-first-app），它们的出链自然多；而报错类长尾页天然被孤立。**推页的第一动作就是给有排名的页面补编辑性入链。**

**审计口径（必须严格遵守）**：查编辑性入链要 grep `src/content/blog/*.md` **源文件**，不能用 `dist/`——dist 里每个页面都含模板卡片链接（文章标题 + `Read more`），grep dist 会把模板链接误报成编辑性入链。

### 7.4 补链位置的选择原则

本轮 8 条新增链接全部落在**语义相关的位置**，不堆在结尾的「Next steps」：

- **hub 页放到排错段而非结尾**：`custom-domain-setup` 的"When it doesn't work"段落里，`SSL errors after the domain resolves` 那条正是遇到 SSL 问题的读者会停留的地方 → 从这里出链到 `ssl-not-working`，比放在结尾"Next steps"精准得多。
- **优先补齐双向**：`getting-paid ↔ llc` 做成互链闭环，避免只有单向出链导致目标页拿不到锚文本权重。
- **锚文本用目标页的核心关键词**，不用 "click here" / "this article"。

### 7.5 🔴 锚点的正确用法（纠错，此前记录有误）

**Astro 默认就会给 heading 生成 id**（github-slugger 规则：转小写、去标点、空格转连字符；`ERR_TOO_MANY_REDIRECTS` 里的下划线保留）。所以文内 `](#slug)` 跳转是**可以用的**，此前"站内没装 rehype-slug 所以不要写锚点"的结论是错的。

两条硬规则：

1. **必须写自动生成的完整 slug，不能手写短名。** `[Cert error](#cert-error)` 是死链，因为实际 id 是 `cert-error-not-secure-on-your-domain`。
2. **markdown 不支持 `{#custom-id}` 语法**（需额外装 remark-heading-id 才支持）。写了不会生效，而且 `{#cert-error}` 会被**当成正文字符串渲染到页面上给读者看**——2026-09-15 在 `vercel-custom-domain-ssl-not-working.md` 发现 4 个 H2 标题中招，已修。

**校验锚点的正确姿势**（不要靠肉眼比对）：改完 `npm run build`，从 dist 的 HTML 里抽出所有 `href="#xxx"`，逐个 grep 页面里 `id="xxx"` 是否存在。20/20 全解析才算过。
