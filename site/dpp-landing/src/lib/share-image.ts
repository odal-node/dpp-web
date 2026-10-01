// share-image.ts — draws a share card (lib/share-cards.ts) as a 1200×630 PNG.
//
// The text is drawn as glyph outlines from Inter (OFL, @fontsource/inter), not
// as SVG text, so the image comes out the same on any machine that builds it
// and does not depend on which fonts that machine has installed. sharp turns
// the SVG into a PNG. Colours are the brand's: the logo's navy field and its
// ice-blue strokes, as on the site-wide public/og-image.png.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { create, type Font } from "fontkitten";
import sharp from "sharp";
import type { Card } from "./share-cards";

const W = 1200;
const H = 630;
const PAD = 80;
const NAVY = "#080c2c";
const ICE = "#5e8fc7";
const PALE = "#c9def3";

// Resolved from the package's own directory, which is the working directory
// of every build, so the path survives Vite bundling this module.
const require = createRequire(join(process.cwd(), "package.json"));
const load = (weight: 400 | 700) =>
  create(readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`))) as Font;
const regular = load(400);
const bold = load(700);

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function width(font: Font, size: number, text: string, tracking = 0) {
  let w = 0;
  for (const ch of text) w += font.glyphForCodePoint(ch.codePointAt(0)!).advanceWidth * (size / font.unitsPerEm) + tracking;
  return w;
}

/** Greedy word wrap; the last allowed line ends in an ellipsis if text is left over. */
function wrap(font: Font, size: number, text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let line = "";
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (width(font, size, next) <= max) {
      line = next;
      continue;
    }
    if (out.length === lines - 1) {
      let cut = line;
      while (cut && width(font, size, `${cut}…`) > max) cut = cut.slice(0, -1).trimEnd();
      out.push(`${cut}…`);
      return out;
    }
    if (line) out.push(line);
    line = words[i];
  }
  if (line) out.push(line);
  return out;
}

/** One line of text as glyph outlines, baseline at y. */
function draw(font: Font, size: number, text: string, x: number, y: number, fill: string, tracking = 0) {
  const s = size / font.unitsPerEm;
  let pen = x;
  const paths: string[] = [];
  for (const ch of text) {
    const glyph = font.glyphForCodePoint(ch.codePointAt(0)!);
    const d = glyph.path.toSVG();
    if (d) paths.push(`<path transform="translate(${pen.toFixed(2)} ${y}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" d="${d}"/>`);
    pen += glyph.advanceWidth * s + tracking;
  }
  return `<g fill="${fill}" aria-label="${escape(text)}">${paths.join("")}</g>`;
}

export async function renderCard(card: Card): Promise<Uint8Array<ArrayBuffer>> {
  const max = W - PAD * 2;
  // The largest title size that fits in three lines; past the smallest, the
  // third line ends in an ellipsis.
  let size = 46;
  let title = wrap(bold, size, card.title, max, 3);
  for (const s of [64, 58, 52]) {
    const t = wrap(bold, s, card.title, max, 3);
    if (!t.at(-1)!.endsWith("…")) {
      size = s;
      title = t;
      break;
    }
  }
  const lead = size * 1.15;
  const line = wrap(regular, 28, card.line, max, 2);

  const eyebrowY = 150;
  const titleY = eyebrowY + 40 + size;
  const lineY = titleY + (title.length - 1) * lead + 64;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${NAVY}"/>
<rect width="${W}" height="3" fill="${ICE}"/>
<rect y="${H - 3}" width="${W}" height="3" fill="${ICE}"/>
${draw(regular, 20, card.eyebrow.toUpperCase(), PAD, eyebrowY, ICE, 1.5)}
${title.map((t, i) => draw(bold, size, t, PAD, titleY + i * lead, "#ffffff")).join("\n")}
${line.map((t, i) => draw(regular, 28, t, PAD, lineY + i * 38, PALE)).join("\n")}
${draw(bold, 26, "Odal Node", PAD, H - 72, "#ffffff")}
${draw(regular, 26, "odal-node.io", W - PAD - width(regular, 26, "odal-node.io"), H - 72, ICE)}
</svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}
