<?php
// Подключаем WordPress
require_once('../../../wp-load.php');

// Устанавливаем заголовки JSON
header('Content-Type: application/json; charset=utf-8');

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешен'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Получаем и валидируем данные
    $booking_date = sanitize_text_field($_POST['date'] ?? '');
    $client_name = sanitize_text_field($_POST['name'] ?? '');
    $client_phone = sanitize_text_field($_POST['phone'] ?? '');
    $client_email = sanitize_email($_POST['email'] ?? '');
    $session_type = sanitize_text_field($_POST['session_type'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');
    
    // Валидация
    if (empty($booking_date) || empty($client_name) || empty($client_phone) || empty($client_email)) {
        throw new Exception('Заполните все обязательные поля');
    }
    
    if (!is_email($client_email)) {
        throw new Exception('Введите корректный email');
    }
    
    // Проверяем, что дата доступна
    global $wpdb;
    $booking_dates_table = $wpdb->prefix . 'booking_dates';
    
    $date_exists = $wpdb->get_var($wpdb->prepare("
        SELECT id FROM $booking_dates_table 
        WHERE date = %s AND status = 'available'
    ", $booking_date));
    
    if (!$date_exists) {
        throw new Exception('Выбранная дата недоступна для записи');
    }
    
    // Отправляем email администратору
    $email_sent = send_booking_notification($booking_date, $client_name, $client_email, $client_phone, $session_type, $message);
    
    if (!$email_sent) {
        throw new Exception('Ошибка отправки уведомления. Попробуйте позже.');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

// Функция отправки email администратору
function send_booking_notification($date, $name, $email, $phone, $session_type, $message) {
    $admin_email = get_option('admin_email');
    $site_name = get_bloginfo('name');
    
    $formatted_date = date('d.m.Y', strtotime($date));
    
    // Получаем название типа съёмки
    $session_types = [
        'portrait' => 'Портретная съёмка',
        'family' => 'Семейная съёмка',
        'wedding' => 'Свадебная съёмка',
        'event' => 'Событийная съёмка',
        'other' => 'Другое'
    ];
    $session_type_name = $session_types[$session_type] ?? ($session_type ?: 'Не указан');
    
    // Простое текстовое письмо
    $subject = 'Новая запись на фотосессию - ' . $formatted_date;
    $message_text = "
Новая запись на фотосессию:

Дата: $formatted_date
Имя: $name
Телефон: $phone
Email: $email
Тип съёмки: $session_type_name

Комментарий:
$message

Время записи: " . current_time('d.m.Y H:i:s');
    
    // Отправляем письмо
    $mail_sent = wp_mail($admin_email, $subject, $message_text);
    
    return $mail_sent;
}
?>
