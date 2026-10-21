// Builds the profile avatars in assets/img/avatars/ (run once; the files are committed, the site never calls DiceBear).
//   l01-l12  "Lorelei" by Lisa Wischofsky, CC0 1.0      (dicebear.com/licenses, checked 2026-10-21)
//   n01-n12  "Notionists" by Zoish, CC0 1.0
//   i01-i08  our own line icons on colored backgrounds
// The ids must match AVATARS in functions/api/account/[[path]].js and tools/local_accounts.py.
// Usage: node tools/make_avatars.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "img", "avatars");
const API = "https://api.dicebear.com/9.x";
// Seeds picked from a preview of 24 per style, for variety (hair, glasses, beard, veil)
const LORELEI = ["tvz1", "tvz3", "tvz4", "tvz7", "tvz9", "tvz11", "tvz13", "tvz16", "tvz18", "tvz20", "tvz22", "tvz23"];
const NOTIONISTS = ["tvz1", "tvz3", "tvz5", "tvz6", "tvz9", "tvz11", "tvz14", "tvz15", "tvz16", "tvz17", "tvz20", "tvz21"];
const PASTELS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "f9e79f", "b8e0d2", "fbc4ab", "cdeac0", "e2c2ff", "a0d2eb", "ffc8a2"];

// 24 x 24 line drawings (white stroke) on a strong color
const ICONS = [
  ["2563eb", '<rect x="2" y="7" width="20" height="14" rx="2"/><polyline points="17 2 12 7 7 2"/>'],
  ["7c3aed", '<rect x="2" y="2" width="20" height="20" rx="2.2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/>'],
  ["db2777", '<path d="M5 9l1.6 12h10.8L19 9"/><path d="M9.5 9l.5 12M14.5 9l-.5 12"/><path d="M5 9a2.5 2.5 0 0 1 1-4.6A3 3 0 0 1 12 3a3 3 0 0 1 6 1.4A2.5 2.5 0 0 1 19 9"/>'],
  ["ca8a04", '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'],
  ["ea580c", '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"/><path d="M14 5v2M14 11v2M14 17v2"/>'],
  ["16a34a", '<path d="M6 11h4M8 9v4"/><path d="M15 12h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-3.96 3.43l-.9 6.3A2.5 2.5 0 0 0 4.3 17.6c.9 0 1.7-.5 2.2-1.2L8 14h8l1.5 2.4c.5.7 1.3 1.2 2.2 1.2a2.5 2.5 0 0 0 2.47-2.86l-.9-6.3A4 4 0 0 0 17.3 5z"/>'],
  ["0891b2", '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'],
  ["475569", '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'],
];

// What the site may show: plain drawing, nothing that runs or loads anything
function assertPlainSvg(id, svg) {
  if (!svg.startsWith("<svg")) throw new Error(`${id}: not an SVG`);
  if (/<script|<foreignObject|<image|<iframe|\son\w+\s*=|href\s*=|url\(\s*['"]?(?!#)/i.test(svg)) throw new Error(`${id}: unexpected content`);
}

const id = (prefix, i) => `${prefix}${String(i + 1).padStart(2, "0")}`;
mkdirSync(OUT, { recursive: true });

for (const [style, prefix, seeds, shift] of [["lorelei", "l", LORELEI, 0], ["notionists", "n", NOTIONISTS, 6]]) {
  for (const [i, seed] of seeds.entries()) {
    const color = PASTELS[(i + shift) % PASTELS.length];
    const res = await fetch(`${API}/${style}/svg?seed=${seed}&backgroundColor=${color}`);
    if (!res.ok) throw new Error(`${style} ${seed}: HTTP ${res.status}`);
    const svg = (await res.text()).trim();
    assertPlainSvg(id(prefix, i), svg);
    writeFileSync(join(OUT, `${id(prefix, i)}.svg`), svg + "\n");
  }
}

for (const [i, [color, drawing]] of ICONS.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#${color}"/>` +
    `<g transform="translate(24 24) scale(2)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
  assertPlainSvg(id("i", i), svg);
  writeFileSync(join(OUT, `${id("i", i)}.svg`), svg + "\n");
}

console.log(`avatars written to ${OUT}`);
