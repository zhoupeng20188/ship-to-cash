import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import * as brandIcons from "simple-icons";

const rootDir = path.resolve(import.meta.dirname, "..");
const blogDir = path.join(rootDir, "src/content/blog");
const publicDir = path.join(rootDir, "public");

const CATEGORY_LABELS = {
  deploy: "Deploy Guide",
  payments: "Payments Guide",
  monetize: "Monetization Guide",
  legal: "Legal Guide",
  tools: "Free Tool",
};

// 标题关键词 → simple-icons 品牌图标，按出现顺序最多取 3 个
const ICON_KEYWORDS = [
  ["cloudflare", "siCloudflare"],
  ["vercel", "siVercel"],
  ["netlify", "siNetlify"],
  ["namecheap", "siNamecheap"],
  ["stripe", "siStripe"],
  ["paddle", "siPaddle"],
  ["lemon squeezy", "siLemonsqueezy"],
  ["lemonsqueezy", "siLemonsqueezy"],
  ["supabase", "siSupabase"],
  ["neon", "siNeon"],
  ["github", "siGithub"],
  ["adsense", "siGoogleadsense"],
  ["astro", "siAstro"],
  ["next.js", "siNextdotjs"],
  ["nextjs", "siNextdotjs"],
  ["wordpress", "siWordpress"],
  ["render", "siRender"],
  ["railway", "siRailway"],
];

// 分类兜底图标（24x24 viewBox 路径），标题没命中品牌时使用
const CATEGORY_ICONS = {
  deploy: {
    path: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
    color: "#059669",
  },
  payments: {
    path: "M2 5h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm-2 5h24M6 15h4",
    color: "#059669",
    stroke: true,
  },
  monetize: {
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v2m0 8v2m3.5-11c-.7-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5s1.5 2 3.5 2.5 3.5 1 3.5 2.5-1.5 2.5-3.5 2.5c-1.5 0-2.8-.5-3.5-1.5",
    color: "#059669",
    stroke: true,
  },
  legal: {
    path: "M12 2l8 3v6c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V5l8-3z",
    color: "#059669",
  },
  tools: {
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
    color: "#059669",
  },
};

// 图标徽章布局：右侧区域，按数量排布
const BADGE_LAYOUTS = {
  1: [{ x: 890, y: 225, s: 180 }],
  2: [
    { x: 850, y: 160, s: 140 },
    { x: 985, y: 330, s: 140 },
  ],
  3: [
    { x: 875, y: 130, s: 120 },
    { x: 1010, y: 265, s: 120 },
    { x: 875, y: 400, s: 120 },
  ],
};

function parseFrontmatter(file) {
  const content = fs.readFileSync(file, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = match[1];
  const title = fm.match(/^title:\s*"(.+?)"/m)?.[1];
  const category = fm.match(/^category:\s*(\w+)/m)?.[1];
  const ogIcon = fm.match(/^ogIcon:\s*(\w+)/m)?.[1];
  return title ? { title, category, ogIcon } : null;
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function detectIcons(title, category) {
  const lower = title.toLowerCase();
  const found = [];
  for (const [keyword, iconName] of ICON_KEYWORDS) {
    const icon = brandIcons[iconName];
    if (!icon || !lower.includes(keyword)) continue;
    if (found.some((f) => f.path === icon.path)) continue;
    found.push({ path: icon.path, color: `#${icon.hex}`, stroke: false });
    if (found.length === 3) break;
  }
  if (found.length === 0) {
    found.push(CATEGORY_ICONS[category] ?? CATEGORY_ICONS.deploy);
  }
  return found;
}

// 标题按宽度断行：优先 2 行大字，超长则 3 行小字，仍超出则截断
// wide = 无图标时用更宽的版式
function wrapTitle(title, wide = false) {
  const wrap = (maxChars, maxLines) => {
    const words = title.split(" ");
    const lines = [""];
    for (const word of words) {
      const current = lines[lines.length - 1];
      if ((current + " " + word).trim().length > maxChars && current) {
        if (lines.length === maxLines) return null;
        lines.push(word);
      } else {
        lines[lines.length - 1] = (current + " " + word).trim();
      }
    }
    return lines.filter(Boolean);
  };
  const twoLines = wrap(wide ? 24 : 20, 2);
  if (twoLines) return { lines: twoLines, fontSize: wide ? 66 : 62, lineHeight: wide ? 80 : 76, startY: 310 };
  const threeLines = wrap(wide ? 30 : 25, 3);
  if (threeLines) return { lines: threeLines, fontSize: 50, lineHeight: 64, startY: wide ? 285 : 275 };
  // 极端超长：三行截断加省略号
  const truncated = wrap(wide ? 30 : 25, 4);
  const lines = truncated.slice(0, 3);
  lines[2] = lines[2].replace(/:?$/, "…");
  return { lines, fontSize: 50, lineHeight: 64, startY: wide ? 285 : 275 };
}

function iconBadge({ x, y, s }, icon) {
  const scale = (s * 0.52) / 24;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const fill = icon.stroke ? "none" : icon.color;
  const stroke = icon.stroke
    ? ` stroke="${icon.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
    : "";
  return `<g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${Math.round(s * 0.22)}" fill="#ffffff" opacity="0.95"/>
    <g transform="translate(${cx} ${cy}) scale(${scale.toFixed(2)}) translate(-12 -12)">
      <path d="${icon.path}" fill="${fill}"${stroke}/>
    </g>
  </g>`;
}

const template = ({ kicker, title, footer, icons }) => {
  const { lines, fontSize, lineHeight, startY } = wrapTitle(title, icons.length === 0);
  const layout = BADGE_LAYOUTS[Math.min(icons.length, 3)] ?? [];
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ecfdf5"/>
      <stop offset="100%" style="stop-color:#d1fae5"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <circle cx="1080" cy="60" r="120" fill="#a7f3d0" opacity="0.4"/>
  <circle cx="150" cy="520" r="140" fill="#6ee7b7" opacity="0.35"/>

  <g transform="translate(80, 72)">
    <rect width="56" height="56" rx="14" fill="url(#accent)"/>
    <path d="M14 34L28 12L42 34H32V44H24V34H14Z" fill="white"/>
  </g>

  <text x="80" y="200" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="26" font-weight="700" fill="#059669" letter-spacing="0.08em" text-transform="uppercase">
    ${escapeXml(kicker)}
  </text>

  ${lines
    .map(
      (line, i) => `<text x="80" y="${startY + i * lineHeight}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" fill="#0f172a" letter-spacing="-0.02em">
    ${escapeXml(line)}
  </text>`
    )
    .join("\n  ")}

  ${icons.map((icon, i) => iconBadge(layout[i], icon)).join("\n  ")}

  <text x="80" y="560" font-family="JetBrains Mono, ui-monospace, monospace" font-size="24" font-weight="500" fill="#059669">
    ${escapeXml(footer)}
  </text>
</svg>`;
};

function generate(svgContent, outName) {
  const svgPath = path.join(publicDir, `${outName}.svg`);
  const jpgPath = path.join(publicDir, `${outName}.jpg`);
  fs.writeFileSync(svgPath, svgContent);
  execSync(`sips -s format jpeg -s formatOptions 85 "${svgPath}" --out "${jpgPath}"`);
  fs.unlinkSync(svgPath);
  console.log(`Generated public/${outName}.jpg`);
}

// 站点默认 OG 图
generate(
  template({
    kicker: "Ship · Earn · Comply",
    title: "ShipToCash",
    footer: "shiptocash.com — guides for vibe coders",
    icons: [CATEGORY_ICONS.deploy],
  }),
  "og-default"
);

// 每篇文章的 OG 图
const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
for (const file of files) {
  const slug = file.replace(/\.(md|mdx)$/, "");
  const fm = parseFrontmatter(path.join(blogDir, file));
  if (!fm) continue;
  generate(
    template({
      kicker: CATEGORY_LABELS[fm.category] ?? "Guide",
      title: fm.title,
      footer: "shiptocash.com",
      icons: fm.ogIcon === "none" ? [] : detectIcons(fm.title, fm.category),
    }),
    `og-${slug}`
  );
}

console.log("Done!");
