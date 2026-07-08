// Gera docs/assets/thumbnail.html (preview no browser) e docs/assets/thumbnail.png
// Uso: node docs/assets/render-thumbnail.js
// Requer: npm install playwright  (executar uma vez na raiz ou em qualquer pasta do projeto)

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const FONT = path.join(ROOT, 'frontend/node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2');
const SCREENSHOT = path.join(ROOT, 'docs/screenshots/feed.png');
const OUTPUT_HTML = path.join(ROOT, 'docs/assets/thumbnail.html');
const OUTPUT_PNG  = path.join(ROOT, 'docs/assets/thumbnail.png');

const fontB64       = fs.readFileSync(FONT).toString('base64');
const screenshotB64 = fs.readFileSync(SCREENSHOT).toString('base64');

// ─── Layout ──────────────────────────────────────────────────────────────────
// Canvas lógico: 1000×750 px  |  Output: 2000×1500 px (deviceScaleFactor: 2)
// Todos os valores abaixo são em pixels CSS (canvas lógico).

const BACKGROUND = 'radial-gradient(ellipse at 38% 25%, #8b5cf6 0%, #6d28d9 28%, #2e1065 58%, #0f172a 100%)';

const LOGO_TOP  = 35;   // px do topo
const LOGO_LEFT = 40;
const LOGO_ICON_SIZE  = 40;   // largura e altura do ícone SVG
const LOGO_TEXT_SIZE  = 26;   // font-size do wordmark "job4devs"
const LOGO_GAP        = 12;   // gap entre ícone e texto

const HEADLINE_TOP  = 128;
const HEADLINE_LEFT = 40;
const HEADLINE_SIZE = 46;   // font-size h1

const DOMAIN_TOP  = 195;
const DOMAIN_LEFT = 40;
const DOMAIN_SIZE = 12;

const CARD_TOP    = 230;
const CARD_LEFT   = 35;
const CARD_WIDTH  = 930;   // screenshot (1280px) escalado para 930px
// ─────────────────────────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>job4devs — thumbnail</title>
<style>
@font-face {
  font-family: 'SG';
  src: url('data:font/woff2;base64,${fontB64}') format('woff2');
  font-weight: 300 700;
  font-style: normal;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1000px; height: 750px; overflow: hidden;
  background: ${BACKGROUND};
  font-family: 'SG', sans-serif;
}
.wrap { position: relative; width: 1000px; height: 750px; }

.logo {
  position: absolute; top: ${LOGO_TOP}px; left: ${LOGO_LEFT}px;
  display: flex; align-items: center; gap: ${LOGO_GAP}px;
}
.logo-text { color: #fff; font-weight: 700; font-size: ${LOGO_TEXT_SIZE}px; letter-spacing: -0.01em; }

.headline { position: absolute; top: ${HEADLINE_TOP}px; left: ${HEADLINE_LEFT}px; }
.headline h1 {
  color: #fff; font-size: ${HEADLINE_SIZE}px; font-weight: 700;
  line-height: 1.05; letter-spacing: -0.025em; white-space: nowrap;
}

.domain { position: absolute; top: ${DOMAIN_TOP}px; left: ${DOMAIN_LEFT}px; }
.domain p {
  color: rgba(255,255,255,0.45); font-size: ${DOMAIN_SIZE}px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
}

.app-card {
  position: absolute; top: ${CARD_TOP}px; left: ${CARD_LEFT}px;
  width: ${CARD_WIDTH}px; height: ${750 - CARD_TOP}px;
  border-radius: 12px 12px 0 0; overflow: hidden;
  box-shadow: 0 8px 48px rgba(0,0,0,0.5);
}
.app-card img { display: block; width: ${CARD_WIDTH}px; height: auto; }

/* Cobre "Verificação E2E" no cabeçalho do feed */
.name-patch {
  position: absolute; top: 14px; left: 163px;
  width: 200px; height: 18px; background: #f6f5fc;
  font-size: 10.5px; font-weight: 400; color: #6b7280;
  font-family: 'SG', sans-serif; white-space: nowrap;
  display: flex; align-items: center;
}
</style>
</head>
<body>
<div class="wrap">

  <div class="logo">
    <svg width="${LOGO_ICON_SIZE}" height="${LOGO_ICON_SIZE}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#7c3aed"/>
          <stop offset="1" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lg)"/>
      <g transform="translate(4,4)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
      </g>
    </svg>
    <span class="logo-text">job4devs</span>
  </div>

  <div class="headline">
    <h1>Never miss a freelance gig.</h1>
  </div>

  <div class="domain">
    <p>job4devs.dev</p>
  </div>

  <div class="app-card">
    <img src="data:image/png;base64,${screenshotB64}" alt="app screenshot">
    <div class="name-patch">Olá, Ana Lima</div>
  </div>

</div>
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, html);
console.log('HTML →', OUTPUT_HTML);

(async () => {
  const browser = await chromium.launch({ args: ['--disable-web-security'] });
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1000, height: 750 });
  await page.goto(`file://${OUTPUT_HTML}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUTPUT_PNG, clip: { x: 0, y: 0, width: 1000, height: 750 } });
  await browser.close();
  console.log('PNG  →', OUTPUT_PNG);
})().catch(err => { console.error(err); process.exit(1); });
