<?php
// Обробник форми заявок Tagwise
// POST /api/lead.php — JSON body — повертає JSON {ok:true} або {ok:false,error:"..."}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Дозволяємо тільки POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false, 'error' => 'Method not allowed']));
}

// Завантажуємо конфіг
$config_file = __DIR__ . '/config.php';
if (!file_exists($config_file)) {
    http_response_code(500);
    exit(json_encode(['ok' => false, 'error' => 'Server configuration missing']));
}
require $config_file;

// Парсимо JSON body
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    exit(json_encode(['ok' => false, 'error' => 'Invalid JSON']));
}

// Honeypot: боти заповнюють приховане поле
$hp = isset($data['hp']) ? trim($data['hp']) : '';
if ($hp !== '') {
    // Мовчки повертаємо успіх, щоб не підказувати боту
    exit(json_encode(['ok' => true]));
}

// Отримуємо поля
$name    = isset($data['name'])    ? trim($data['name'])    : '';
$what    = isset($data['what'])    ? trim($data['what'])    : '';
$contact = isset($data['contact']) ? trim($data['contact']) : '';
$agree   = isset($data['agree'])   ? (bool)$data['agree']   : false;

// Валідація
$errors = [];
if (mb_strlen($name) < 2)    $errors[] = 'Введіть назву бізнесу (мінімум 2 символи).';
if (mb_strlen($what) < 2)    $errors[] = 'Вкажіть, що продаєте.';
if (mb_strlen($contact) < 3) $errors[] = 'Вкажіть Telegram або телефон.';
if (!$agree)                  $errors[] = 'Підтвердіть згоду з умовами.';

if ($errors) {
    http_response_code(422);
    exit(json_encode(['ok' => false, 'error' => implode(' ', $errors)]));
}

// Ліміт за IP
$ip      = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip_safe = preg_replace('/[^a-f0-9:\.]/', '', $ip);
$rl_file = sys_get_temp_dir() . '/tagwise_rl_' . md5($ip_safe) . '.json';

$rate_data = ['count' => 0, 'since' => time()];
if (file_exists($rl_file)) {
    $saved = json_decode(file_get_contents($rl_file), true);
    if (is_array($saved) && (time() - $saved['since']) < RATE_LIMIT_WINDOW) {
        $rate_data = $saved;
    }
}

if ($rate_data['count'] >= RATE_LIMIT_COUNT) {
    http_response_code(429);
    exit(json_encode(['ok' => false, 'error' => 'Занадто багато заявок. Спробуйте пізніше або напишіть нам безпосередньо.']));
}

$rate_data['count']++;
file_put_contents($rl_file, json_encode($rate_data), LOCK_EX);

// Формуємо текст повідомлення
$text  = "🏷 Нова заявка з tagwise.com.ua\n\n";
$text .= "🏪 *Назва бізнесу:* " . escape_tg($name)    . "\n";
$text .= "📦 *Що продає:* "     . escape_tg($what)    . "\n";
$text .= "📱 *Контакт:* "       . escape_tg($contact) . "\n";
$text .= "\n🌐 IP: " . escape_tg($ip_safe);

// Відправка в Telegram
$tg_ok = send_telegram($text);

// Дублювання на email
$subject = 'Нова заявка Tagwise: ' . $name;
$body    = "Нова заявка з сайту tagwise.com.ua\n\n"
         . "Назва бізнесу: $name\n"
         . "Що продає: $what\n"
         . "Контакт: $contact\n"
         . "IP: $ip_safe\n";

$headers = "From: noreply@tagwise.com.ua\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

@mail(LEAD_EMAIL, $subject, $body, $headers);

if ($tg_ok) {
    exit(json_encode(['ok' => true]));
} else {
    // Telegram не пройшов, але email міг вийти — все одно повертаємо успіх
    // щоб не кидати людину з помилкою.
    exit(json_encode(['ok' => true]));
}

// --- Допоміжні функції ---

function send_telegram(string $text): bool {
    $url     = 'https://api.telegram.org/bot' . TG_BOT_TOKEN . '/sendMessage';
    $payload = json_encode([
        'chat_id'    => TG_CHAT_ID,
        'text'       => $text,
        'parse_mode' => 'Markdown',
    ]);

    $ctx = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 8,
        ],
        'ssl' => ['verify_peer' => true],
    ]);

    $result = @file_get_contents($url, false, $ctx);
    if ($result === false) return false;

    $json = json_decode($result, true);
    return isset($json['ok']) && $json['ok'] === true;
}

function escape_tg(string $s): string {
    // Екрануємо символи Markdown v1
    return preg_replace('/([_*\[\]`])/', '\\\\$1', $s);
}
