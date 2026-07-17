// Entry point for pages/api.astro's client-side mount. Bundled by Astro/Vite
// like any other module script — see api.astro for why the page needs a
// script at all (full-page Scalar reference, mounted outside Starlight).
import { createApiReference } from '@scalar/api-reference';
// import { h } from 'vue';
// import { ALPHA_BANNER_TEXT } from '../site-meta';

// const AlphaBannerView = (props: { text: string }) => h('div', { class: 'odal-banner' }, props.text);

// const alphaBannerPlugin = () => ({
//   name: 'odal-alpha-banner',
//   extensions: [],
//   views: {
//     'content.start': [
//       {
//         component: AlphaBannerView,
//         props: {
//           text: ALPHA_BANNER_TEXT,
//         },
//       },
//     ],
//   },
// }) as any;

createApiReference('#scalar-api-reference', {
  url: '/openapi.yaml',
  title: 'Odal Node API',
  theme: 'none',
  favicon: '/favicon.svg',
  // No AI features in the production reference: no "Ask AI" chat panel, no
  // VS Code/Cursor MCP quick-connect prompts.
  agent: { disabled: true },
  mcp: { disabled: true },
  // The page has no theme toggle of its own: Starlight's setting (written by
  // the docs shell's ThemeSelect) is the single source of truth, applied
  // before first paint by the inline script in api.astro and kept live below.
  hideDarkModeToggle: true,
  // plugins: [alphaBannerPlugin],
});

// Keep the resolved theme live after first paint, mirroring exactly what
// Starlight's ThemeProvider does on the docs pages:
// - OS scheme changes apply while the stored preference is "auto" (empty).
// - A theme picked in another docs tab (the 'starlight-theme' storage event)
//   applies here too, so the site never shows two themes at once.
// Scalar reads 'colorMode' from localStorage on mount, so the resolved value
// is mirrored into it as well — one write, no second toggle, no races.
const STARLIGHT_THEME_KEY = 'starlight-theme';
const SCALAR_COLOR_MODE_KEY = 'colorMode';

function applyResolvedTheme(): void {
  const stored = localStorage.getItem(STARLIGHT_THEME_KEY);
  const resolved =
    stored === 'dark' || stored === 'light'
      ? stored
      : window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(`${resolved}-mode`);
  localStorage.setItem(SCALAR_COLOR_MODE_KEY, resolved);
}

window
  .matchMedia('(prefers-color-scheme: light)')
  .addEventListener('change', applyResolvedTheme);
window.addEventListener('storage', (e) => {
  if (e.key === STARLIGHT_THEME_KEY) applyResolvedTheme();
});
