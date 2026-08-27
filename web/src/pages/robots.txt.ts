/**
 * Правила для поисковых роботов: GET /robots.txt
 * Origin берём из запроса, чтобы на проде автоматически подставлялся домен.
 */
import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/site';

export const GET: APIRoute = async ({ url }) => {
  const origin = SITE_URL || url.origin;
  const body = `User-agent: *
Allow: /
Disallow: /_/

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};