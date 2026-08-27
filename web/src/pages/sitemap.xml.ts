/**
 * Карта сайта: GET /sitemap.xml
 * Динамические URL: статичные страницы + карточки товаров из PocketBase.
 */
import type { APIRoute } from 'astro';
import { getProducts } from '../lib/pb';
import { SITE_URL } from '../lib/site';

const staticPaths = ['/', '/catalog', '/custom', '/info', '/about', '/privacy'];

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ url }) => {
  const origin = SITE_URL || url.origin;

  const pages = staticPaths.map(
    (p) => `  <url><loc>${esc(origin + p)}</loc></url>`,
  );

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts();
  } catch {
    // База недоступна — отдаём карту со статичными страницами.
  }

  const productUrls = products.map((p) => {
    const lastmod = p.updated ? new Date(p.updated).toISOString() : '';
    const m =
      `  <url><loc>${esc(origin)}/catalog/${esc(p.slug)}</loc>` +
      (lastmod ? `<lastmod>${lastmod}</lastmod>` : '') +
      `</url>`;
    return m;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.join('\n')}${productUrls.length ? `\n${productUrls.join('\n')}` : ''}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};