# Статус разработки сайта кашпо

Последнее обновление: Фаза 9 завершена (что не зависит от владельца) + баг-фиксы 2026-08-26 (см. раздел ниже).

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
- [x] **Фаза 7 — SEO**
  - `sitemap.xml` (SSR, `web/src/pages/sitemap.xml.ts`): статичные страницы + карточки товаров из базы, absolute URL из origin запроса.
  - `robots.txt` (SSR, `web/src/pages/robots.txt.ts`): Allow /, Disallow /_/, ссылка на sitemap.
  - Canonical + полный Open Graph в `Base.astro` (og:site_name/type/title/description/url/image).
  - JSON-LD `Product` в карточке товара (`[slug].astro`) с `offers.priceCurrency=RUB` и availability InStock/MadeToOrder.
  - H1 в карточке дополняется диаметром: «Напольное кашпо из массива дуба под горшок 25–35 см».
  - SEO-тексты `/custom`: title и lead под запросы «кашпо на заказ», «по своим размерам», «нестандартного размера».
  - Проверено: sitemap.xml и robots.txt → 200, canonical/og в HTML, JSON-LD в карточке.
- [x] **Фаза 8 — 3D**
  - Добавлен `@google/model-viewer` 4.3.1 (точная версия, только production-зависимость).
  - В карточке товара (`[slug].astro`) вьюер рендерится только если заполнено поле `model_3d` (`.glb`).
  - **Модель грузится только по клику на «Смотреть в 3D»** (динамический `import`), до клика — превью-заглушка (подсказка + кнопка). Не грузится при открытии страницы.
  - URL модели передаётся через `data-src` на элементе (Astro не интерполирует `{var}` в `<script>`, см. ниже).
  - Исправлен баг Фазы 6: `{submitText}` в inline-скрипте формы оставался литералом (Astro не подставляет props в `<script>`). Теперь кнопка возвращает исходный текст через захват `originalText`, без подстановки в JS.
  - Проверено на тестовом `.glb` (куб): вьюер появляется, `data-src` = реальный URL модели, у товара без модели вьюера нет. Тестовая модель из базы удалена (реальные — чеклист владельца).
- [x] **Фаза 9 — Финал** (агентская часть; остальное — владелец/деплой)
  - Яндекс.Метрика: компонент `web/src/components/Metrics.astro` (счётчик + цели). Подключается только если задан `YANDEX_METRIKA_ID` (env). Цели: `form_send` (успешная отправка формы — событие `lead-sent` из LeadForm), `telegram_click` (клик по ссылке с `data-metric="telegram_click"` в подвале и на `/custom`).
  - Проверено: при пустом `YANDEX_METRIKA_ID` код Метрики на страницах отсутствует; при заданном ID — счётчик, `init` и обе цели подключаются. Реальный номер счётчика — от владельца.
  - Скрипт бэкапа `pb_data`: `scripts/backup-pb.sh` (потоковый tar из контейнера на хост, каталог `backups/`, gitignored, хранение последних N=14). Проверено: архив создаётся корректно. Cron-строка — в шапке скрипта.
  - Lighthouse (мобильный, Performance): `/` 100, `/catalog` 100, `/catalog/[slug]` 100, `/custom` 100 (цель ≥ 90 достигнута; прогон без реальных фото — на проде LCP перепроверить).
  - Осталось у владельца/на деплое (из PLAN.md): номер Метрики → `.env`; Яндекс.Вебмастер + отправка sitemap (на VPS с реальным доменом); реальные фото и 3D-модели.

---

## Баг-фиксы после Фазы 9 (2026-08-26)

Найдены беглой инспекцией всего проекта, исправлены и проверены вживую. Коммит `427d5de`.

- **500 вместо честной 404 в карточке товара.** `getProductBySlug` (`web/src/lib/pb.ts`) подставлял `slug` из URL в фильтр PocketBase без экранирования кавычек — slug с символом `"` (например, попытка инъекции в фильтр) валил SSR-запрос 400-й ошибкой от PocketBase, и страница отдавала 500 вместо ожидаемой 404. Хотя это было отмечено как проверенное ещё в Фазе 4 — регрессия закралась незаметно.
  - Фикс: добавлено экранирование спецсимволов (`escapeFilterValue`) перед подстановкой в фильтр; `400 Bad Request` от PocketBase теперь трактуется как «товар не найден» (`null`), а не пробрасывается исключением.
  - Проверено: `GET /catalog/x%22%20%7C%7C%20id!%3D%22` → 404 (раньше 500), обычные slug по-прежнему → 200.
- **Двухколоночная сетка карточки товара работала на мобильных.** В `web/src/pages/catalog/[slug].astro` медиа-запрос `@media (min-width: 768px)` закрывался раньше времени (сразу после `.card-lead`), а правило `.card { grid-template-columns: 1fr 1fr }` оставалось вне медиа-запроса — применялось на всех экранах, включая 360–430px, нарушая mobile-first. Плюс лишняя закрывающая `}` в конце блока стилей.
  - Фикс: `.card`, `.card__media`, `.card__img`, `.card__content` перенесены обратно внутрь `@media (min-width: 768px)`, лишняя скобка убрана.
  - Проверено: в собранном SSR-HTML `.card{grid-template-columns:1fr 1fr}` теперь внутри `@media (width>=768px)`.
- **Мёртвый `lastmod` в `sitemap.xml`.** Код (`web/src/pages/sitemap.xml.ts`) читал `p.updated`, которого не было ни в типе `Product`, ни в реальных записях PocketBase — в коллекции `products` не завели autodate-поля `created`/`updated` при создании через API. `<lastmod>` никогда не добавлялся.
  - Фикс: в коллекцию `products` добавлены autodate-поля `created` (onCreate) и `updated` (onCreate + onUpdate) через админ API, существующие тестовые записи «тронуты» (пустым PATCH) для проставления `updated`; тип `Product` в `web/src/lib/pb.ts` дополнен полями `created`/`updated`.
  - Проверено: `GET /sitemap.xml` теперь отдаёт `<lastmod>` для всех трёх товаров.
  - **Важно для владельца:** если коллекция `products` пересоздаётся заново на проде (а не мигрирует локальный `pb_data`), поля `created`/`updated` нужно завести в схеме сразу — иначе `lastmod` снова пропадёт молча.

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
- `web/src/pages/` — страницы Astro: `index.astro` (главная), `catalog.astro`, `catalog/[slug].astro` (+ 3D-вьюер), `custom.astro`, `info.astro`, `about.astro`, `privacy.astro`, `404.astro`, `api/lead.ts` (POST-приём заявок), `sitemap.xml.ts`, `robots.txt.ts` (SSR). `web/src/components/LeadForm.astro` — форма заявки, `web/src/components/Metrics.astro` — Яндекс.Метрика + цели. `web/src/layouts/Base.astro` — шапка+подвал + canonical/OG. `web/src/styles/global.css` — CSS-переменные. `web/src/lib/pb.ts` — клиент PocketBase. `web/src/lib/site.ts` — константы сайта (Telegram-ссылка, Метрика). `scripts/backup-pb.sh` — бэкап `pb_data` по cron.

### Текущее состояние (что уже работает)

- PocketBase: коллекции `products`, `leads`, `reviews`, `pages`; суперпользователь `admin@local.test` / `admin12345678`; 3 товара (slug: `kashpo-napolnoe-dub-30`, `kashpo-nastolnoe-yasen-18`, `kashpo-podvesnoe-oreh-20`). Данные в томе `rinas_pb_data`.
- `/` — лендинг (hero, избранные работы, как заказать, форма заявки). `/catalog` — сетка карточек. `/catalog/[slug]` — карточка товара с характеристиками и формой. `/custom`, `/info`, `/about`, `/privacy` — созданы. 404 — кастомная страница.
- Дизайн: mobile-first, CSS-переменные, акцентный цвет `#9a6b3f`.
- Формы: компонент `web/src/components/LeadForm.astro` (на `/`, `/custom`, `/about`, в карточке), эндпоинт `web/src/pages/api/lead.ts` (валидация + honeypot + запись в `leads` + Telegram). Проверено POST-ом вручную.
- Telegram: токен/чат через env (`TELEGRAM_*` из `.env`, gitignored, проброшены в docker-compose). `.env` сейчас пустой — заполнить бот у `@BotFather` (чеклист владельца).
- Метрика: `web/src/components/Metrics.astro` — счётчик + цели (отправка формы, клик по Telegram), подключается при заполненном `YANDEX_METRIKA_ID`.
- SEO: `sitemap.xml`, `robots.txt` (SSR-эндпоинты), canonical + Open Graph в `Base.astro`, JSON-LD `Product` в карточке, H1 с диаметром горшка, SEO-тексты `/custom`.
- 3D: `@google/model-viewer` 4.3.1 в карточке, грузится по клику «Смотреть в 3D» (динамический import), до клика — превью. Вьюер только при наличии `model_3d`.
- Бэкап: `scripts/backup-pb.sh` (tar из контейнера в `backups/`, cron в шапке скрипта).

### Фаза 9 — Финал: что осталось у владельца / на деплое

- Заполнить номер Яндекс.Метрики в `.env` (`YANDEX_METRIKA_ID`) — код счётчика и цели уже готовы и подключаются автоматически.
- Яндекс.Вебмастер: подтвердить сайт и отправить sitemap (на VPS с реальным доменом).
- Перепроверить Lighthouse после загрузки реальных фото/3D-моделей (без них сейчас 100).

### Важно про `<script>` в Astro

Astro **не подставляет** `{переменная}` / props из frontmatter внутрь тега `<script>`. Чтобы передать значение — через атрибут DOM (`data-*`) или захват текста элемента, НЕ через интерполяцию в JS-строке. (Были баги: `{modelUrl}` и `{submitText}` оставались литералами.)

### Чего НЕТ (не делать): корзина/оплата, личный кабинет, Telegram-бот-каталог, ИИ-чат, реклама, мультиязычность, тёмная тема, Next/React/Vue/Tailwind.

### Настроить бэкап по cron

Добавить строку в crontab хоста (пути поправить под деплой):
```
5 3 * * * cd /rinas && /rinas/scripts/backup-pb.sh >> /rinas/backups/backup.log 2>&1
```

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
YANDEX_METRIKA_ID=
```
