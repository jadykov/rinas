/**
 * Клиент к PocketBase для серверного рендеринга (SSR).
 * Выполняется только на сервере, в браузер не попадает.
 */

// Внутри docker-сети PocketBase доступен по имени сервиса `pocketbase:8090`.
// Используется только для серверных (SSR) запросов — изнутри docker-сети.
const PB_URL = process.env.PUBLIC_PB_URL ?? 'http://pocketbase:8090';

// Публичный базовый URL для файлов (фото, 3D-моделей), который видит браузер.
// Отдельный от PB_URL: внутреннее имя `pocketbase` браузер разрешить не может,
// а `localhost` — это адрес сервера, не клиента.
// Без env берётся origin текущего запроса (Astro.url) — работает на любом домене:
// Caddy на проде проксирует /api/* на PocketBase.
// При необходимости задать вручную: PUBLIC_PB_PUBLIC_URL.
const PB_PUBLIC_URL =
  process.env.PUBLIC_PB_PUBLIC_URL ??
  (globalThis as { __pbOrigin?: string }).__pbOrigin ??
  '';

export interface Product {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  title: string;
  slug: string;
  description: string;
  price_from: number | null;
  pot_diameter_min: number | null;
  pot_diameter_max: number | null;
  height: number | null;
  width: number | null;
  material: string;
  type: string;
  photos: string[];
  model_3d: string;
  in_stock: boolean;
  lead_time_days: number | null;
  is_featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(
    `${PB_URL}/api/collections/products/records?sort=sort_order`,
    { headers: { Accept: 'application/json' } },
  );

  if (!res.ok) {
    throw new Error(`Ошибка PocketBase: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items ?? [];
}

/** Экранирует спецсимволы для строкового литерала в фильтре PocketBase. */
function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Возвращает товар по slug, или null, если такого товара нет (в т.ч. при некорректном slug). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const filter = `(slug="${escapeFilterValue(slug)}")`;
  const res = await fetch(
    `${PB_URL}/api/collections/products/records?filter=${encodeURIComponent(filter)}`,
    { headers: { Accept: 'application/json' } },
  );

  // Некорректный фильтр (например, недопустимые символы в slug) — считаем,
  // что товар не найден, а не падаем 500-й ошибкой.
  if (res.status === 400) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Ошибка PocketBase: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items?.[0] ?? null;
}

/** Полный URL файла (фото, 3D-модель) из коллекции PocketBase, доступный браузеру.
 * Базовый адрес: env PUBLIC_PB_PUBLIC_URL, либо origin текущего запроса (origin).
 * В SSR origin передаётся из Astro.url.origin на странице. */
export function fileUrl(collectionName: string, recordId: string, filename: string, origin = ''): string {
  const base = (PB_PUBLIC_URL || origin || PB_URL).replace(/\/+$/, '');
  return `${base}/api/files/${collectionName}/${recordId}/${encodeURIComponent(filename)}`;
}
