// middleware.ts — points links to the landing site at this build's landing.
//
// Runs for every page, in the dev server and when a page is prerendered, so it
// reaches links in MDX content and in the site config alike. A production build
// changes nothing. See lib/origins.ts for why.
import { defineMiddleware } from 'astro:middleware';
import { LANDING_ORIGIN, PRODUCTION_LANDING } from './lib/origins';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (LANDING_ORIGIN === PRODUCTION_LANDING) return response;
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  const html = await response.text();
  return new Response(html.replaceAll(`href="${PRODUCTION_LANDING}`, `href="${LANDING_ORIGIN}`), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});
