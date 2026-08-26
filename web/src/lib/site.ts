/**
 * Константы сайта, доступные в SSR-рендере.
 */

/**
 * Ссылка на Telegram-канал/аккаунт для кнопки «Написать в Telegram». Пусто — кнопка не показывается.
 * Обычный способ — задать TELEGRAM_USERNAME, ссылка соберётся как t.me/<username>.
 * Если нужно указать сразу полную ссылку (например, временно на telegram.org, пока
 * профиля ещё нет) — задать TELEGRAM_LINK напрямую, он имеет приоритет над username.
 */
export const TELEGRAM_USERNAME = process.env.TELEGRAM_USERNAME ?? '';

export const TELEGRAM_LINK =
  process.env.TELEGRAM_LINK || (TELEGRAM_USERNAME ? `https://t.me/${TELEGRAM_USERNAME}` : '');

/**
 * Ссылка на профиль/канал в MAX для кнопки «Написать в MAX». Пусто — кнопка не показывается.
 * В отличие от Telegram здесь ожидается сразу полная ссылка (MAX_LINK), а не username:
 * формат ссылок на профиль в MAX на момент написания кода не был точно известен —
 * чтобы не гадать и не зашивать в код неверный шаблон, ссылку владелец вставляет целиком.
 */
export const MAX_LINK = process.env.MAX_LINK ?? '';

/**
 * ID счётчика Яндекс.Метрики. Пусто — счётчик и цели не подключаются.
 * Заполняется владельцем (номер счётчика из кабинета Метрики).
 */
export const YANDEX_METRIKA_ID = process.env.YANDEX_METRIKA_ID ?? '';