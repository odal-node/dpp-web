// /og/<page>.png — each page's share image, drawn at build time from
// lib/share-cards.ts by lib/share-image.ts. Base.astro points og:image here.
import type { APIRoute, GetStaticPaths } from "astro";
import { cards, type Card } from "../../lib/share-cards";
import { renderCard } from "../../lib/share-image";

export const getStaticPaths = (() =>
  cards.map((card) => ({ params: { slug: card.path.slice(1) }, props: { card } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderCard((props as { card: Card }).card), { headers: { "Content-Type": "image/png" } });
