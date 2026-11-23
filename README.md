# Tagwise — сайт

Статичний HTML/CSS/JS сайт. Без систем збірки, без залежностей.

## Структура файлів

```
index.html              головна сторінка
how-it-works.html       сторінка «Як це працює»
offer.html              публічна оферта (вставити текст)
privacy.html            політика конфіденційності (вставити текст)
assets/css/style.css    всі стилі (кольори і шрифти у :root вгорі файлу)
assets/js/main.js       мобільне меню, FAQ, форма
assets/img/             SVG-логотип і favicon
api/lead.php            обробник форми → Telegram + email
api/config.php          токен бота і email (НЕ в git)
api/config.example.php  шаблон для config.php
```

## Як змінити тексти і ціни

Відкрийте `index.html` або `how-it-works.html` у будь-якому текстовому редакторі.
Знайдіть потрібний рядок і відредагуйте. Ціни — шукайте `$0`, `$10`, `$20` тощо.

Щоб змінити кольори або шрифти — відредагуйте змінні у початку `assets/css/style.css`
(блок `:root { ... }`).

## Анімація «Шаблони» в hero-блоці

На головній у мок-браузері по колу показуються шаблони: курсор обирає картку,
шаблон розкривається на весь «екран», прокручується вниз і повертається до списку.
Код — `assets/js/templates-show.js`, стилі — блок `.tpl-show` в `assets/css/style.css`.

Щоб додати новий шаблон:

1. Зробіть скриншот (потрібні Node 22+ і Google Chrome, сайт має бути запущений локально):
   ```
   python3 -m http.server 8765
   node tools/template-shots.mjs <slug>     # знімає demos/<slug>/index.html
   ```
   З'явиться `assets/img/templates/<slug>.jpg`.
2. Додайте в `index.html` ще один `<li class="tpl-show__card">` (скопіюйте сусідній
   і змініть `data-url`, шлях до картинки, назву ніші та бренд).

Лічильник «N шаблонів» і порядок показу оновлюються самі.

## Налаштування бота Telegram

1. Скопіюйте `api/config.example.php` → `api/config.php`
2. Заповніть:
   - `TG_BOT_TOKEN` — токен від [@BotFather](https://t.me/BotFather)
   - `TG_CHAT_ID` — ID чату або каналу, куди слати заявки
   - `LEAD_EMAIL` — email для дублювання

```php
define('TG_BOT_TOKEN', '123456:ABC-DEF...');
define('TG_CHAT_ID',   '-1001234567890');
define('LEAD_EMAIL',   'hello@tagwise.com.ua');
```

**Як отримати chat_id:** додайте бота до чату, відправте будь-яке повідомлення,
потім зайдіть на `https://api.telegram.org/bot<TOKEN>/getUpdates` і знайдіть `"chat":{"id":...}`.

## Розгортання на adm.tools

1. Завантажте всі файли в папку `public_html/` (або `www/`) через FTP або файловий менеджер.
2. Переконайтеся, що `api/config.php` є на сервері (він не в git!).
3. Перевірте, що PHP доступний (`phpinfo()` у тестовому файлі).
4. Встановіть домен `tagwise.com.ua` → вказати на сервер.
5. Cloudflare: додайте A-запис, увімкніть проксі (оранжева хмарка).

## Майбутні мовні версії

Щоб додати англійську або турецьку версію:

```
/en/index.html
/en/how-it-works.html
/tr/index.html
/tr/how-it-works.html
```

Скопіюйте відповідні HTML-файли в папку `/en/` або `/tr/` і перекладіть текст.
Шлях до CSS/JS змінюється: `../assets/css/style.css` (на рівень вище).
