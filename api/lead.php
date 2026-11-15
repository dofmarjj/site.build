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

// Отримуємо загальні поля
$source  = isset($data['source'])  ? trim($data['source'])  : '';
$name    = isset($data['name'])    ? trim($data['name'])    : '';
$what    = isset($data['what'])    ? trim($data['what'])    : '';
$contact = isset($data['contact']) ? trim($data['contact']) : '';
$agree   = isset($data['agree'])   ? (bool)$data['agree']   : false;

// Поля no-site
$where_nosite = isset($data['where']) ? trim($data['where']) : '';

// Поля old-site
$where_oldsite = isset($data['where']) ? trim($data['where']) : '';
$pain          = isset($data['pain'])  ? trim($data['pain'])  : '';
$has1c         = isset($data['has1c']) ? trim($data['has1c']) : '';

// UTM
$utm_source   = isset($data['utm_source'])   ? trim($data['utm_source'])   : '';
$utm_medium   = isset($data['utm_medium'])   ? trim($data['utm_medium'])   : '';
$utm_campaign = isset($data['utm_campaign']) ? trim($data['utm_campaign']) : '';

// Валідація
$errors = [];
if (mb_strlen($contact) < 3) $errors[] = 'Вкажіть Telegram або телефон.';
if (!$agree)                  $errors[] = 'Підтвердіть згоду з умовами.';

// Поля специфічні для джерела
if ($source === '' || $source === 'site') {
    if (mb_strlen($name) < 2) $errors[] = 'Введіть назву бізнесу (мінімум 2 символи).';
    if (mb_strlen($what) < 2) $errors[] = 'Вкажіть, що продаєте.';
}
if ($source === 'no-site') {
    if (mb_strlen($what) < 2) $errors[] = 'Вкажіть, що продаєте.';
}

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

// Мітка і повідомлення залежно від джерела
if ($source === 'quiz') {
    $branch   = isset($data['branch']) ? trim($data['branch']) : '';
    $answers  = isset($data['answers'])  && is_array($data['answers'])  ? $data['answers']  : [];
    $services = isset($data['services']) && is_array($data['services']) ? $data['services'] : [];

    $label = $branch === 'nosite' ? '[Без сайту]' : '[Діючий магазин]';
    $text  = "🏷 *{$label} · квіз* Нова заявка\n\n";
    $text .= "📱 *Контакт:* " . escape_tg($contact) . "\n";

    $q_map = [
        'root'        => 'Що у вас зараз?',
        'ns_what'     => 'Що продаєте?',
        'ns_where'    => 'Де зараз продаєте?',
        'ns_count'    => 'Скільки товарів?',
        'hs_need'     => 'Що потрібно?',
        'hs_where'    => 'Де продаєте?',
        'hs_time'     => 'Що забирає найбільше часу?',
        'hs_platform' => 'На чому ваш сайт?',
        'hs_fix'      => 'Що доробити?',
    ];
    foreach ($q_map as $key => $q_label) {
        if (!isset($answers[$key])) continue;
        $val = $answers[$key];
        if (is_array($val)) $val = implode(', ', array_map('trim', $val));
        if (trim($val) === '') continue;
        $text .= "*{$q_label}:* " . escape_tg(trim($val)) . "\n";
    }
    if (!empty($services)) {
        $text .= "\n🛠 *Підібрані послуги:*\n";
        foreach ($services as $svc) {
            $text .= "— " . escape_tg(trim($svc)) . "\n";
        }
    }
} elseif ($source === 'no-site') {
    $label = '[Без сайту]';
    $text  = "🏷 *{$label}* Нова заявка\n\n";
    $text .= "📦 *Що продає:* "       . escape_tg($what)         . "\n";
    $text .= "🛒 *Де зараз продає:* " . escape_tg($where_nosite) . "\n";
    $text .= "📱 *Контакт:* "         . escape_tg($contact)      . "\n";
} elseif ($source === 'old-site') {
    $label = '[Діючий магазин]';
    $text  = "🏷 *{$label}* Нова заявка\n\n";
    $text .= "🏪 *Де продає:* "            . escape_tg($where_oldsite) . "\n";
    $text .= "⚡ *Що забирає час:* "        . escape_tg($pain)          . "\n";
    $text .= "🗂 *Є 1С / BAS:* "           . ($has1c === 'yes' ? 'Так' : 'Ні') . "\n";
    $text .= "📱 *Контакт:* "              . escape_tg($contact)        . "\n";
} else {
    $label = '[Сайт]';
    $text  = "🏷 *{$label}* Нова заявка\n\n";
    $text .= "🏪 *Назва бізнесу:* " . escape_tg($name)    . "\n";
    $text .= "📦 *Що продає:* "     . escape_tg($what)    . "\n";
    $text .= "📱 *Контакт:* "       . escape_tg($contact) . "\n";
}

// UTM якщо є
if ($utm_source)   $text .= "\n📊 utm\\_source: "   . escape_tg($utm_source);
if ($utm_medium)   $text .= "\nutm\\_medium: "       . escape_tg($utm_medium);
if ($utm_campaign) $text .= "\nutm\\_campaign: "     . escape_tg($utm_campaign);

$text .= "\n\n🌐 IP: " . escape_tg($ip_safe);

// Відправка в Telegram
$tg_ok = send_telegram($text);

// Дублювання на email
$subject = 'Нова заявка Tagwise ' . $label . ': ' . ($name ?: $contact);
$body    = "Нова заявка з сайту tagwise.com.ua\n\n"
         . "Джерело: {$label}\n"
         . ($name    ? "Назва бізнесу: $name\n"           : '')
         . ($what    ? "Що продає: $what\n"               : '')
         . ($where_nosite && $source === 'no-site'  ? "Де зараз продає: $where_nosite\n" : '')
         . ($where_oldsite && $source === 'old-site' ? "Де продає: $where_oldsite\n"     : '')
         . ($pain    ? "Що забирає час: $pain\n"          : '')
         . ($has1c   ? "Є 1С / BAS: $has1c\n"            : '')
         . "Контакт: $contact\n"
         . ($utm_source   ? "utm_source: $utm_source\n"   : '')
         . ($utm_medium   ? "utm_medium: $utm_medium\n"   : '')
         . ($utm_campaign ? "utm_campaign: $utm_campaign\n" : '')
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
