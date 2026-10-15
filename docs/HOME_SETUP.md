# Домашний запуск

Нужны Docker Desktop (Windows/macOS) или Docker Engine с Compose v2 (Linux). Docker должен быть запущен. Первая сборка скачает образы и npm-зависимости. Выполняйте команды из папки проекта, содержащей `compose.home.yaml`.

```bash
docker compose -f compose.home.yaml up -d --build --wait
```

Откройте **http://localhost:8080**. Если порт занят, задайте `KALDER_PORT` или поменяйте стандартное значение 8080 в `compose.home.yaml`. Сайт доступен только на этом компьютере. Backend отдельно наружу не публикуется. Это домашний тест, не публичное размещение.

## Что проверить

1. На главной введите домен своего сайта, перейдите к контактным данным и укажите email.
2. Интерфейс должен сообщить, что тестовый отчёт создан и сохранён локально. В почтовый ящик он пока не отправляется.
3. Посмотрите список файлов писем:

```bash
docker compose -f compose.home.yaml exec api node --input-type=module -e "import {readdirSync} from 'node:fs'; console.log(readdirSync('.runtime/backend/outbox'))"
```

Чтобы забрать письма на компьютер:

```bash
docker compose -f compose.home.yaml cp api:/app/.runtime/backend/outbox ./kalder-outbox
```

Каждый JSON содержит адрес получателя и поля `html`/`text` с отчётом. Не публикуйте эту папку. Домашний запуск должен отдельно подтвердить реальный исходящий DNS/HTTPS; в облачной среде прямое разрешение внешних доменов было недоступно.

## Диагностика и остановка

```bash
docker compose -f compose.home.yaml ps
docker compose -f compose.home.yaml logs --tail=80 api web
docker compose -f compose.home.yaml down
```

Остановка сохраняет базу и письма в Docker volume. Не используйте `down -v`, если данные нужны. При изменениях повторите команду запуска с `--build`.

Если сайт не анализируется, проверка DNS/HTTPS из backend:

```bash
docker compose -f compose.home.yaml exec api node --input-type=module -e "import {fetchSite} from './backend/fetch-site.mjs'; const r = await fetchSite('https://example.com'); console.log(r.statusCode, r.contentType)"
```

Загрузчик обращается напрямую к публичным сайтам, без cloud proxy. В обычной домашней сети это нужно проверить фактически; успешный запуск контейнеров сам по себе не подтверждает анализ. По одному IP nginx посетители делят лимит 5 принятых заявок в час — для домашнего теста это ожидаемо.

## Реальная почта — отдельно

После локальной проверки настройте Resend и подтвердите домен отправителя. В приватном файле `.env.home` задайте `KALDER_MAIL_MODE=resend`, `KALDER_MAIL_API_KEY` и `KALDER_MAIL_FROM`; затем запускайте Compose с `--env-file .env.home`. Не добавляйте ключ в Git и не присылайте его в чат. `accepted` означает принятие письма провайдером, не гарантию доставки во входящие.
