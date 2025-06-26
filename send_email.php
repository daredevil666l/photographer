<?php
// Подключаем WordPress
require_once('../../../wp-load.php');

// Включаем отладку
if (!defined('WP_DEBUG')) {
    define('WP_DEBUG', true);
}
if (!defined('WP_DEBUG_LOG')) {
    define('WP_DEBUG_LOG', true);
}

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("ОШИБКА: Неверный метод запроса");
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешен'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Логируем полученные POST данные
error_log("Полученные POST данные:");
error_log("POST keys: " . implode(', ', array_keys($_POST)));

// Получаем данные из формы
$name = htmlspecialchars($_POST['name'] ?? '');
$email = htmlspecialchars($_POST['email'] ?? '');
$message = htmlspecialchars($_POST['message'] ?? '');

// ДОБАВЛЯЕМ ДЕТАЛЬНУЮ ОТЛАДКУ ВХОДЯЩИХ ДАННЫХ
error_log("Name: " . $name);
error_log("Name length: " . strlen($name));
error_log("Email: " . $email);
error_log("Email length: " . strlen($email));
error_log("Message: " . $message);
error_log("Message type: " . gettype($message));
error_log("Message length: " . strlen($message));

// Инициализируем массив результата
$result = array();

// Проверка обязательных полей
if (!$name || !$email) {
    error_log("ОШИБКА: Не заполнены обязательные поля");
    error_log("Name empty: " . (empty($name) ? 'YES' : 'NO'));
    error_log("Email empty: " . (empty($email) ? 'YES' : 'NO'));
    $result['error'] = "Заполните все обязательные поля";
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}

// Проверка email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_log("ОШИБКА: Некорректный email: " . $email);
    $result['error'] = "Введите корректный email адрес";
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}

// Получаем настройки WordPress
error_log("Получение настроек WordPress...");
$admin_email = get_option('admin_email');
$site_name = get_bloginfo('name');
$site_url = get_bloginfo('url');

error_log("Admin email: " . $admin_email);
error_log("Site name: " . $site_name);
error_log("Site URL: " . $site_url);

// Формируем HTML письмо
$to = $admin_email;
$subject = 'Новое сообщение с сайта - ' . $site_name;

error_log("Формирование HTML письма...");

$html_message = '
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Новое сообщение</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: "Arial", sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
        }
        .email-title {
            font-size: 18px;
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .email-body {
            padding: 30px;
        }
        .info-section {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid #2c3e50;
        }
        .info-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0 0 15px 0;
        }
        .info-row {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            display: inline-block;
            min-width: 80px;
        }
        .info-value {
            color: #333;
        }
        .message-section {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin-top: 20px;
        }
        .message-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0 0 15px 0;
        }
        .message-text {
            color: #333;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .timestamp {
            background: #e9ecef;
            border-radius: 4px;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
        }
        .email-footer {
            background: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1 class="company-name">' . htmlspecialchars($site_name) . '</h1>
            <p class="email-title">Новое сообщение с контактной формы</p>
        </div>
        
        <div class="email-body">
            <div class="info-section">
                <h3 class="info-title">Информация об отправителе</h3>
                <div class="info-row">
                    <span class="info-label">Имя:</span>
                    <span class="info-value">' . $name . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">' . $email . '</span>
                </div>
            </div>';

if (!empty($message)) {
    $html_message .= '
            <div class="message-section">
                <h3 class="message-title">Сообщение</h3>
                <div class="message-text">' . nl2br($message) . '</div>
            </div>';
    error_log("Добавлено сообщение в письмо");
} else {
    error_log("Сообщение пустое, не добавляем секцию");
}

$html_message .= '
            <div class="timestamp">
                <strong>Время отправки:</strong> ' . date('d.m.Y в H:i:s') . '
            </div>
        </div>
        
        <div class="email-footer">
            <p>Это автоматическое уведомление с сайта ' . htmlspecialchars($site_url) . '</p>
        </div>
    </div>
</body>
</html>';

error_log("HTML письмо сформировано, длина: " . strlen($html_message));

// Заголовки для HTML письма
$headers = array(
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . $site_name . ' <noreply@' . $_SERVER['HTTP_HOST'] . '>',
    'Reply-To: ' . $name . ' <' . $email . '>'
);

error_log("Заголовки письма:");
foreach ($headers as $i => $header) {
    error_log("Header[$i]: " . $header);
}

// Проверяем доступность функций
error_log("Проверка функций:");
error_log("function_exists('mail'): " . (function_exists('mail') ? 'YES' : 'NO'));
error_log("function_exists('wp_mail'): " . (function_exists('wp_mail') ? 'YES' : 'NO'));

// Добавляем детальную отладку перед отправкой
error_log("Попытка отправки письма на: " . $to);
error_log("Тема: " . $subject);

// Отправляем письмо
$mail_sent = wp_mail($to, $subject, $html_message, $headers);

error_log("Результат wp_mail: " . ($mail_sent ? 'SUCCESS' : 'FAILED'));

// Проверяем ошибки PHPMailer
global $phpmailer;
if (isset($phpmailer) && !empty($phpmailer->ErrorInfo)) {
    error_log("PHPMailer Error: " . $phpmailer->ErrorInfo);
}

// Проверяем последние ошибки PHP
$last_error = error_get_last();
if ($last_error && !empty($last_error['message'])) {
    error_log("Last PHP Error: " . $last_error['message'] . " in " . $last_error['file'] . " on line " . $last_error['line']);
}

if ($mail_sent) {
    error_log("Письмо успешно отправлено через wp_mail()");
    $result['success'] = "Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.";
} else {
    error_log("Ошибка отправки письма через wp_mail()");
    $result['error'] = "Произошла ошибка при отправке сообщения. Попробуйте позже.";
}

error_log("Формирование JSON ответа...");
$json_response = json_encode($result, JSON_UNESCAPED_UNICODE);
error_log("JSON ответ: " . $json_response);

echo $json_response;

error_log("=== КОНЕЦ ОБРАБОТКИ КОНТАКТНОЙ ФОРМЫ ===");
?>
