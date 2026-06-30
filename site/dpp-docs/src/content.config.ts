import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Site-wide "alpha / in development" banner.
// Starlight has no global `banner` config option (only per-page frontmatter),
// so we set the default here via the schema `extend`. Any page can still
// override it in its own frontmatter. Kept short and factual
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        banner: z
          .object({ content: z.string() })
          .default({
            content:
              'Alpha — Odal Node is in active development. APIs, schemas, and docs may and will change before 1.0.',
          }),
      }),
    }),
  }),
};
