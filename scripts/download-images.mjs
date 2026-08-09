// Download curated Unsplash images into public/images/landing/
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images", "landing");

const images = [
  // ── Hero slideshow (wide, high-res) ──
  { file: "hero-1.jpg", url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=80" },
  { file: "hero-2.jpg", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80" },
  { file: "hero-3.jpg", url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=80" },
  { file: "hero-4.jpg", url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=80" },

  // ── Featured property cards ──
  { file: "prop-1.jpg", url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80" },
  { file: "prop-2.jpg", url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80" },
  { file: "prop-3.jpg", url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=80" },
  { file: "prop-4.jpg", url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80" },
  { file: "prop-5.jpg", url: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=900&q=80" },
  { file: "prop-6.jpg", url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80" },

  // ── Tenant benefits / lifestyle ──
  { file: "neighborhood.jpg", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80" },
  { file: "keys.jpg", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80" },

  // ── Testimonial avatars ──
  { file: "avatar-1.jpg", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80" },
  { file: "avatar-2.jpg", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
  { file: "avatar-3.jpg", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80" },
  { file: "avatar-4.jpg", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80" },
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
    const kb = (buf.byteLength / 1024).toFixed(1);
    console.log(`✓ ${file} (${kb} KB)`);
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

