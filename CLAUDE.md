# ShipToCash 项目规范

英文内容站（shiptocash.com），面向海外 vibe coder，变现依赖 Google AdSense + 联盟营销。**AdSense 审核会人工检查内容质量，AI 生成痕迹过重可能被拒**，因此所有文章必须遵守以下写作规范。

## SEO 规范

- `title` ≤ 70 字符，包含目标关键词（尽量靠前）
- `description` ≤ 160 字符，包含关键词，写得像搜索结果里的卖点文案
- 每篇文章只聚焦一个目标关键词，动笔前先确认搜索意图（Google 自动补全 / AlsoAsked）
- H2/H3 结构清晰，关键词的自然变体进入小标题
- 内链：每篇至少链向同集群 2–3 篇相关文章；报错类文章链回核心教程
- 尽量配 FAQ（frontmatter 的 `faq` 字段），命中 "People Also Ask" 并生成 FAQPage 结构化数据
- 图片必须有描述性 alt 文本；文件名用关键词小写连字符
- URL slug 短、含关键词、不带停用词

## 去 AI 味（重要）

- **写第一人称真实经验**："I ran into this when deploying my own app" 而不是泛泛而谈。步骤基于实际操作，标注工具当前版本的具体 UI 位置
- **给具体数字和细节**：真实的等待时长、具体的报错原文、确切的价格，而不是 "blazing fast" "seamless"
- **禁用 AI 高频词**：delve, landscape, realm, game-changer, unlock, unleash, elevate, seamless, robust, leverage, navigate (figurative), "in today's fast-paced world", "whether you're a beginner or an expert"
- **禁用 AI 句式**："In conclusion"、"It's important to note"、"Let's dive in"、每段长度整齐划一、过度使用 "First, Second, Finally"
- **允许短句和不规则节奏**，口语化表达（"Here's the thing"、"This trips everyone up"）
- **观点要明确**：有推荐就说推荐什么、为什么，不要 "it depends on your needs" 和稀泥
- 结尾给出明确的下一步，不要总结复述全文

## 文章技术规范

- frontmatter 必填：title, description, pubDate, category, difficulty；可选：updatedDate, faq, image
- **每篇文章必须有专属 OG 图**：写完文章后运行 `node scripts/generate-og-images.mjs`，会自动扫描全部文章重新生成（含新文章的 `og-<slug>.jpg`）；需自定义时可在 frontmatter 用 `image` 字段覆盖
- 正文 1200–1800 词；步骤类内容给截图级细节
- 代码块标注语言；行内代码用反引号
- 写完后 `npm run build` 验证无错误
