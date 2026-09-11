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
