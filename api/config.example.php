<?php
// Скопіюйте цей файл у config.php і заповніть реальними значеннями.
// config.php НЕ додавати до git!

// Telegram Bot API
define('TG_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE');   // токен від @BotFather
define('TG_CHAT_ID',   'YOUR_CHAT_ID_HERE');      // ID чату або каналу

// Email для дублювання заявок
define('LEAD_EMAIL', 'hello@tagwise.com.ua');

// Ліміт заявок з одного IP (кількість за вікно часу)
define('RATE_LIMIT_COUNT',  5);    // не більше 5 заявок
define('RATE_LIMIT_WINDOW', 3600); // за 1 годину (секунди)
