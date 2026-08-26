# Rinas — сайт-витрина мастерской кашпо

Сайт-визитка и портфолио мастерской, которая вручную делает кашпо (подставки и корпуса под цветочные горшки) из массива дерева. Позиционирование — кастом: любой размер и сложность на заказ.

Единственное целевое действие на сайте — **оставить заявку**. Заявки уходят в Telegram-бот мастеру и сохраняются в CMS.

## Стек

| Слой | Технология |
|---|---|
| Фронтенд | **Astro 7** (SSR, адаптер `@astrojs/node`, standalone) |
| Бэкенд + админка | **PocketBase** (Go-бинарник, SQLite) |
| Прокси + HTTPS | **Caddy 2** |
| Оркестрация | **docker-compose** |
| Стили | чистый CSS с переменными, без фреймворков |
| 3D | `@google/model-viewer` |

## Структура

```
rinas/
├── web/                  # Astro SSR-приложение
│   └── src/pages/        # страницы: каталог, изделие, о нас, заявка, privacy…
├── docs/                 # ТЗ (PLAN.md) и статус проекта
├── scripts/              # backup-pb.sh — бэкап pb_data по cron
├── Caddyfile             # маршрутизация: /api/* и /_* → PocketBase, остальное → Astro
├── Dockerfile.web        # сборка фронта внутри образа (npm ci + astro build)
├── Dockerfile.pocketbase # PocketBase из Go-бинарника
└── docker-compose.yml    # pocketbase + web + caddy
```

## Запуск

```bash
cp .env.example .env   # или создайте .env руками (см. ниже)
docker compose up -d --build
```

После запуска (локально):

- сайт — `http://localhost:4321`
- админка PocketBase — `http://localhost:8090/_/`

На проде порты `pocketbase` и `web` наружу не публикуются — весь трафик идёт только через Caddy (80/443).

## Переменные окружения

`.env` не коммитится:

```
PUBLIC_PB_PUBLIC_URL=   # публичный адрес PocketBase для браузера
TELEGRAM_BOT_TOKEN=     # бот, принимающий заявки
TELEGRAM_CHAT_ID=       # чат мастера
TELEGRAM_USERNAME=
MAX_LINK=             # полная ссылка на профиль/канал в MAX (кнопка «Написать в MAX»)
YANDEX_METRIKA_ID=      # счётчик Метрики (form_send / telegram_click)
```

## Возможности

- Каталог изделий с фото из PocketBase, страницы изделий, 3D-просмотр моделей
- Форма заявки → уведомление в Telegram
- Серверный рендеринг (SSR), адаптивная mobile-first вёрстка
- Sitemap.xml, robots.txt, страница 404
- Яндекс.Метрика с целями (`form_send`, `telegram_click`)
- Бэкап базы `pb_data` по cron (`scripts/backup-pb.sh`)
