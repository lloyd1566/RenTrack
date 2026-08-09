// Download curated Unsplash images for Features + How It Works sections
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images", "landing");

const images = [
  // ── Feature section images ──
  { file: "feature-property.jpg", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80" },
  { file: "feature-tenant.jpg", url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80" },
  { file: "feature-payment.jpg", url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80" },
  { file: "feature-dashboard.jpg", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80" },
  { file: "feature-notifications.jpg", url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80" },
  { file: "feature-security.jpg", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80" },

  // ── How It Works section images ──
  { file: "step-browse.jpg", url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80" },
  { file: "step-movein.jpg", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { file: "step-pay.jpg", url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80" },
  { file: "step-track.jpg", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" },
];

await mkdir(outDir, { recursive: true });

let ok = 0;
const failed = [];

for (const { file, url } of images) {
  const dest = join(outDir, file);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`✓ ${file} (${(buf.byteLength / 1024).toFixed(1)} KB)`);
    ok++;
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    failed.push(file);
  }
}

console.log(`\nDone: ${ok}/${images.length} downloaded → ${outDir}`);
if (failed.length) {
  console.log("Failed:", failed.join(", "));
  process.exit(1);
}

