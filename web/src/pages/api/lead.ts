/**
 * SSR-эндпоинт приёма заявки: POST /api/lead.
 * Валидация → запись в коллекцию `leads` (PocketBase) → уведомление в Telegram.
 * Выполняется только на сервере, токен бота наружу не попадает.
 */
import type { APIRoute } from 'astro';

const PB_URL = process.env.PUBLIC_PB_URL ?? 'http://pocketbase:8090';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? '';

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/** Отправка уведомления в Telegram одним запросом. */
async function sendTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
  } catch {
    // Уведомление в Telegram не критично для сохранения заявки — молча пропускаем.
  }
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Некорректный запрос' }, 400);
  }

  // Honeypot: если бот заполнил скрытое поле — тихо «успех», заявку не создаём.
  if (form.get('company')) {
    return json({ ok: true }, 200);
  }

  // Обязательное согласие на обработку ПДн.
  if (form.get('consent') !== 'on') {
    return json({ ok: false, error: 'Нужно согласие на обработку персональных данных' }, 400);
  }

  const name = (form.get('name')?.toString() ?? '').trim();
  const contact = (form.get('contact')?.toString() ?? '').trim();
  const message = (form.get('message')?.toString() ?? '').trim();
  const product = (form.get('product')?.toString() ?? '').trim();
  const source = (form.get('source')?.toString() ?? '').trim();

  if (!name || !contact) {
    return json({ ok: false, error: 'Заполните имя и контакт' }, 400);
  }

  // Собираем чистый FormData — только известные поля коллекции leads.
  const lead = new FormData();
  lead.append('name', name);
  lead.append('contact', contact);
  if (message) lead.append('message', message);
  if (product) lead.append('product', product);
  lead.append('source', source || 'сайт');
  lead.append('status', 'новая');

  for (const file of form.getAll('attachments')) {
    if (file instanceof File) lead.append('attachments', file);
  }

  let createdId = '';
  try {
    const res = await fetch(`${PB_URL}/api/collections/leads/records`, {
      method: 'POST',
      body: lead,
    });
    if (!res.ok) {
      return json({ ok: false, error: 'Не удалось сохранить заявку, попробуйте позже' }, 502);
    }
    const data = await res.json();
    createdId = data?.id ?? '';
  } catch {
    return json({ ok: false, error: 'Сервис временно недоступен, попробуйте позже' }, 502);
  }

  const fileNames = (form.getAll('attachments') as File[])
    .filter((f) => f instanceof File)
    .map((f) => f.name)
    .join(', ');

  await sendTelegram(
    [
      'Новая заявка на сайте',
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      message ? `Сообщение: ${message}` : '',
      product ? `Товар: ${product}` : '',
      fileNames ? `Файлы: ${fileNames}` : '',
      source ? `Источник: ${source}` : '',
      createdId ? `id: ${createdId}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  return json({ ok: true }, 200);
};