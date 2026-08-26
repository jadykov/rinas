/**
 * Клиент к PocketBase для серверного рендеринга (SSR).
 * Выполняется только на сервере, в браузер не попадает.
 */

// Внутри docker-сети PocketBase доступен по имени сервиса `pocketbase:8090`.
const PB_URL = process.env.PUBLIC_PB_URL ?? 'http://pocketbase:8090';

export interface Product {
  id: string;
  collectionId: string;
  collectionName: string;
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
