import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

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

function parseFrontmatter(file) {
  const content = fs.readFileSync(file, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = match[1];
  const title = fm.match(/^title:\s*"(.+?)"/m)?.[1];
  const category = fm.match(/^category:\s*(\w+)/m)?.[1];
  return title ? { title, category } : null;
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 标题按宽度断行，最多两行，超出截断
function wrapTitle(title, maxChars = 22) {
  const words = title.split(" ");
  const lines = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if ((current + " " + word).trim().length > maxChars && current) {
      if (lines.length === 2) break;
      lines.push(word);
    } else {
      lines[lines.length - 1] = (current + " " + word).trim();
    }
  }
  return lines.filter(Boolean);
}

const template = ({ kicker, titleLines, footer }) => `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
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

  <circle cx="1000" cy="120" r="180" fill="#a7f3d0" opacity="0.5"/>
  <circle cx="150" cy="520" r="140" fill="#6ee7b7" opacity="0.35"/>
  <rect x="850" y="350" width="200" height="200" rx="24" fill="#34d399" opacity="0.2" transform="rotate(12 950 450)"/>

  <g transform="translate(80, 72)">
    <rect width="56" height="56" rx="14" fill="url(#accent)"/>
    <path d="M14 34L28 12L42 34H32V44H24V34H14Z" fill="white"/>
  </g>

  <text x="80" y="200" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="26" font-weight="700" fill="#059669" letter-spacing="0.08em" text-transform="uppercase">
    ${escapeXml(kicker)}
  </text>

  ${titleLines
    .map(
      (line, i) => `<text x="80" y="${310 + i * 78}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="64" font-weight="800" fill="#0f172a" letter-spacing="-0.02em">
    ${escapeXml(line)}
  </text>`
    )
    .join("\n  ")}

  <text x="80" y="560" font-family="JetBrains Mono, ui-monospace, monospace" font-size="24" font-weight="500" fill="#059669">
    ${escapeXml(footer)}
  </text>
</svg>`;

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
    titleLines: ["ShipToCash"],
    footer: "shiptocash.com — guides for vibe coders",
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
      titleLines: wrapTitle(fm.title),
      footer: "shiptocash.com",
    }),
    `og-${slug}`
  );
}

console.log("Done!");
