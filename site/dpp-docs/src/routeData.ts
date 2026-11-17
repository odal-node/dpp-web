// routeData.ts — dates each docs page in its <head>: when it was first published
// and when it last changed, from the git history of its content file
// (sitemap-sources.mjs), the same dates the sitemap's <lastmod> carries. Never
// the build time. A page git cannot date gets neither tag rather than a guess.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { datesFor } from '../sitemap-sources.mjs';

export const onRequest = defineRouteMiddleware((context) => {
  const { head } = context.locals.starlightRoute;
  const { published, modified } = datesFor(context.url.pathname);
  if (published) {
    head.push({ tag: 'meta', attrs: { property: 'article:published_time', content: published } });
    // LinkedIn's Post Inspector names its own form of the publish date.
    head.push({ tag: 'meta', attrs: { name: 'publish_date', property: 'og:publish_date', content: published } });
  }
  if (modified) head.push({ tag: 'meta', attrs: { property: 'article:modified_time', content: modified } });
});
