# Статус разработки сайта кашпо

Последнее обновление: Фаза 6 завершена.

## Правила работы

- Стек, правила и структура — в `AGENTS.md` (корень).
- Полное ТЗ — в `docs/PLAN.md`. Читать перед началом каждой новой фазы.
- Обновлять этот файл после завершения каждой фазы.
- Коммит и push после каждой завершённой фазы.

## Прогресс по фазам

- [x] **Фаза 1 — Инфраструктура и деплой**
  - `docker-compose.yml` (сервисы: pocketbase, web, caddy), `Dockerfile.pocketbase`, `Caddyfile` (плейсхолдер `домен.ru`), заглушка web «Скоро открытие».
  - PocketBase **0.40.1** (последняя; 0.22.21 из ТЗ не существует — исправлено).
  - Проверено: PocketBase `/api/health` → 200, заглушка web отдаётся.
  - Ограничение: HTTPS-сертификат для плейсхолдера недоступен (DNS NXDOMAIN) — заработает на VPS с реальным доменом.
  - Коммит: `d9827de`.
- [x] **Фаза 2 — Данные**
  - Коллекции созданы через API: `products`, `leads`, `reviews`, `pages` (схема из ТЗ, права доступа по ТЗ).
  - Аккаунт суперпользователя: `admin@local.test` / `admin12345678` (только для локальной разработки, не выносить на прод).
  - 3 тестовых изделия (без фото — фото от фотографа):
    - `kashpo-napolnoe-dub-30` — Напольное кашпо из массива дуба, от 8500 ₽
    - `kashpo-nastolnoe-yasen-18` — Настольное кашпо из ясеня, от 3900 ₽
    - `kashpo-podvesnoe-oreh-20` — Подвесное кашпо из ореха, от 5200 ₽
  - Проверено: `GET /api/collections/products/records` → 200 без авторизации.
  - Данные в томе Docker `rinas_pb_data` (в git не коммитятся).
- [x] **Фаза 3 — Каталог без дизайна**
  - Инициализирован Astro 7.2.7 (SSR), адаптер `@astrojs/node` 11.1.4 (standalone).
  - Клиент PocketBase `web/src/lib/pb.ts` (серверный, дефолт `http://pocketbase:8090`).
  - `/catalog` — простой список товаров из базы (голый HTML).
  - Проверено: `GET /catalog` внутри сети compose → 3 изделия из базы видны в SSR-ответе.
  - Артефакт SSR: `web/dist/server/entry.mjs`, контейнер `web` запускает его.
  - Сборка идёт внутри Docker (на хосте DNS не работает), см. `AGENTS.md`.
- [x] **Фаза 4 — Карточка товара** `/catalog/[slug]`
  - Динамический роут `web/src/pages/catalog/[slug].astro`.
  - Клиент: `getProductBySlug`, `fileUrl` для файлов/фото.
  - Карточка: цена «от N ₽», характеристики (тип, материал, диаметр горшка, размер, наличие, срок), SEO-`title`/`description`, `og:image`, кнопка «Заказать похожее» → `/custom`.
  - Честный 404: несуществующий slug → кастомная страница `404.astro` (статус 404).
  - Проверено: 3 товара → 200, несуществующий slug и XSS-попытка → 404.
- [x] **Фаза 5 — Дизайн и адаптив**
  - CSS-переменные (`web/src/styles/global.css`): тёплый светлый фон, тёмный текст, один акцентный цвет (дерево), шрифт с характером в заголовках.
  - Layout `web/src/layouts/Base.astro`: шапка с навигацией, подвал.
  - Дизайн `/catalog` (сетка карточек, mobile-first: 1 → 2 → 3 колонки), карточки товара (медиа + характеристики), 404, главная `/` (hero-оффер, избранные работы, «как заказать»).
  - Mobile first: базовые стили под 360px, брейкпоинты 640 / 768 / 960px.
  - Проверено: `/`, `/catalog`, `/catalog/[slug]` → 200 с дизайном, 404 → статус 404.
- [x] **Фаза 6 — Формы и заявки**
  - Компонент формы `web/src/components/LeadForm.astro` (несколько форм на странице, авто-ID).
  - SSR-эндпоинт `web/src/pages/api/lead.ts` (POST): валидация, honeypot, чекбокс ПДн, запись в `leads` через PB API (multipart, attachments), уведомление в Telegram одним `fetch`.
  - Формы подключены: главная `/`, `/custom`, `/about`, карточка товара `/catalog/[slug]` (с relation `product` и `source`).
  - Загрузка файлов на `/custom` и в карточке (до 5, до 20 МБ, jpeg/png/webp/pdf).
  - Honeypot-поле `company` (тихий успех, заявка не создаётся). Чекбокс согласия на ПДн обязательно, со ссылкой на `/privacy`.
  - Состояние после отправки: «Заявка отправлена, свяжемся в течение дня».
  - Кнопка «Написать в Telegram» (в подвале и на `/custom`) — показывается при заполненном `TELEGRAM_USERNAME`.
  - Созданы страницы `/custom`, `/info`, `/about`, `/privacy`.
  - Telegram и константы: `web/src/lib/site.ts`, env-переменные `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_USERNAME` проброшены в `docker-compose.yml` (из `.env`, gitignored).
  - Проверено: POST → 200 и запись в `leads` (в т.ч. с файлом и relation product), honeypot не создаёт заявку, без согласия → 400. Тестовые заявки удалены.
  - Ограничение: Astro блокирует POST без `Origin` (CSRF) — в браузере ок, тесты слать с `Origin`.
- [ ] **Фаза 7 — SEO** ← СЛЕДУЮЩАЯ
- [ ] **Фаза 8 — 3D**
- [ ] **Фаза 9 — Финал**

---

## Памятка для продолжения после очистки контекста

Стек, правила и структура — в `AGENTS.md`. Полное ТЗ — в `docs/PLAN.md` (читать перед каждой фазой). Правила: не менять стек, одна задача = один файл, не обновлять зависимости (точные версии), не выдумывать данные, коммит+push после каждой фазы, интерфейс на русском, mobile-first.

### Где что лежит

- `docker-compose.yml` — сервисы `pocketbase` (порт 8090, только 127.0.0.1), `web` (4321, только 127.0.0.1, `HOST=0.0.0.0`), `caddy` (80/443). Для локальной проверки: фронт `http://localhost:4321/`, админка PB `http://localhost:8090/_/`.
- Frontend — Astro SSR в `web/`. Артефакт `web/dist/server/entry.mjs`, контейнер `web` запускает `node dist/server/entry.mjs`.
- **Сборку и npm нельзя гонять на хосте — там не работает DNS.** Только внутри Docker:
  - установка: `docker run --rm -v "$PWD/web:/app" -w /app node:24-alpine sh -c "npm install"`
  - сборка: `docker run --rm -v "$PWD/web:/app" -w /app node:24-alpine sh -c "npm run build"`
  - после сборки перезапустить контейнер: `docker compose restart web`
- `web/src/pages/` — страницы Astro: `index.astro` (главная), `catalog.astro`, `catalog/[slug].astro`, `custom.astro`, `info.astro`, `about.astro`, `privacy.astro`, `404.astro`, `api/lead.ts` (POST-приём заявок). `web/src/components/LeadForm.astro` — форма заявки. `web/src/layouts/Base.astro` — шапка+подвал. `web/src/styles/global.css` — CSS-переменные. `web/src/lib/pb.ts` — клиент PocketBase. `web/src/lib/site.ts` — константы сайта (Telegram-ссылка).

### Текущее состояние (что уже работает)

- PocketBase: коллекции `products`, `leads`, `reviews`, `pages`; суперпользователь `admin@local.test` / `admin12345678`; 3 товара (slug: `kashpo-napolnoe-dub-30`, `kashpo-nastolnoe-yasen-18`, `kashpo-podvesnoe-oreh-20`). Данные в томе `rinas_pb_data`.
- `/` — лендинг (hero, избранные работы, как заказать, форма заявки). `/catalog` — сетка карточек. `/catalog/[slug]` — карточка товара с характеристиками и формой. `/custom`, `/info`, `/about`, `/privacy` — созданы. 404 — кастомная страница.
- Дизайн: mobile-first, CSS-переменные, акцентный цвет `#9a6b3f`.
- Формы: компонент `web/src/components/LeadForm.astro` (на `/`, `/custom`, `/about`, в карточке), эндпоинт `web/src/pages/api/lead.ts` (валидация + honeypot + запись в `leads` + Telegram). Проверено POST-ом вручную.
- Telegram: токен/чат через env (`TELEGRAM_*` из `.env`, gitignored, проброшены в docker-compose). `.env` сейчас пустой — заполнить бот у `@BotFather` (чеклист владельца).

### Следующая фаза 7 — SEO (из docs/PLAN.md)

- `sitemap.xml`, `robots.txt`, `canonical` на всех страницах
- `<title>` и `<meta description>` из полей товара
- Open Graph и `og:image` (первое фото товара)
- **JSON-LD разметка `Product`** в карточке — даёт расширенный сниппет в Яндексе и Google
- H1 человеческим языком: «Напольное кашпо из массива дуба под горшок 30 см»
- Заголовок и текст `/custom` под запросы: «кашпо на заказ», «кашпо по своим размерам», «кашпо нестандартного размера»

### Чего НЕТ (не делать): корзина/оплата, личный кабинет, Telegram-бот-каталог, ИИ-чат, реклама, мультиязычность, тёмная тема, Next/React/Vue/Tailwind.

### Порядок на Фазу 7

1. Прочитать `docs/PLAN.md` (раздел 4, Фаза 7).
2. Проверить, что инфраструктура поднята: `docker compose up -d`.
3. `sitemap.xml` (динамические URL из `products`), `robots.txt`, canonical в `Base.astro`.
4. SEO-поля товара (`seo_title`, `seo_description`, `og:image`) — частично уже в `[slug].astro`.
5. JSON-LD `Product` в карточке товара.
6. Собрать внутри Docker, перезапустить `web`, проверить глазами, затем `docs/STATUS.md` + коммит + push.

## Как продолжить работу

1. Поднять инфраструктуру: `docker compose up -d` (в корне `/rinas`).
2. Если не было перезапуска Docker-томов — данные PocketBase на месте.
3. Продолжить с текущей незавершённой фазы.

## Версии и окружение (из AGENTS.md, заполняется по ходу)

```
Node: 24
Astro: 7.2.7
@astrojs/node: 11.1.4 (адаптер, standalone)
PocketBase: 0.40.1
Caddy: 2
Домен: плейсхолдер `домен.ru`
Сервер: локальная среда разработки (Docker), VPS в РФ ещё не задействован
```

`.env` (в git не коммитить):
```
PUBLIC_PB_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_USERNAME=
```
