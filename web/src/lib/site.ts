/**
 * Константы сайта, доступные в SSR-рендере.
 */

/** Ссылка на Telegram-канал/аккаунт для кнопки «Написать в Telegram». Пусто — кнопка не показывается. */
export const TELEGRAM_USERNAME = process.env.TELEGRAM_USERNAME ?? '';

export const TELEGRAM_LINK = TELEGRAM_USERNAME
  ? `https://t.me/${TELEGRAM_USERNAME}`
  : '';

/**
 * ID счётчика Яндекс.Метрики. Пусто — счётчик и цели не подключаются.
 * Заполняется владельцем (номер счётчика из кабинета Метрики).
 */
export const YANDEX_METRIKA_ID = process.env.YANDEX_METRIKA_ID ?? '';