<?php


// AJAX обработчики для записи (используем существующую таблицу booking_dates)
add_action('wp_ajax_get_available_booking_dates', 'handle_get_available_booking_dates');
add_action('wp_ajax_nopriv_get_available_booking_dates', 'handle_get_available_booking_dates');

// Получение доступных дат для записи (из существующей таблицы)
function handle_get_available_booking_dates() {
    header('Content-Type: application/json; charset=utf-8');
    
    global $wpdb;
    $booking_dates_table = $wpdb->prefix . 'booking_dates';
    
    // Получаем доступные даты из будущего
    $today = date('Y-m-d');
    $available_dates = $wpdb->get_results($wpdb->prepare("
        SELECT date FROM $booking_dates_table 
        WHERE date >= %s 
        AND status = 'available'
        ORDER BY date ASC
    ", $today));
    
    // Преобразуем в простой массив дат
    $dates_array = array_map(function($item) {
        return $item->date;
    }, $available_dates);
    
    wp_die(json_encode([
        'success' => true, 
        'dates' => $dates_array
    ], JSON_UNESCAPED_UNICODE));
}



// Создание таблицы для доступных дат записи
function create_booking_dates_table() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'booking_dates';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        date date NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'available',
        time_slots text,
        max_bookings int(11) DEFAULT 1,
        current_bookings int(11) DEFAULT 0,
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY date (date),
        KEY status (status)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Вызываем при активации темы
add_action('after_switch_theme', 'create_booking_dates_table');

// AJAX обработчики для календаря
add_action('wp_ajax_get_booking_dates', 'handle_get_booking_dates');
add_action('wp_ajax_add_booking_dates', 'handle_add_booking_dates');
add_action('wp_ajax_delete_booking_date', 'handle_delete_booking_date');
add_action('wp_ajax_update_booking_date', 'handle_update_booking_date');

// Получение доступных дат
function handle_get_booking_dates() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'booking_dates';
    
    $dates = $wpdb->get_results("
        SELECT * FROM $table_name 
        ORDER BY date ASC
    ");
    
    wp_die(json_encode(['success' => true, 'dates' => $dates], JSON_UNESCAPED_UNICODE));
}

// Добавление новых дат
function handle_add_booking_dates() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    $dates = json_decode(stripslashes($_POST['dates']), true);
    
    if (empty($dates) || !is_array($dates)) {
        wp_die(json_encode(['error' => 'Даты не указаны'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'booking_dates';
    
    $added_count = 0;
    $skipped_count = 0;
    
    foreach ($dates as $date) {
        $date = sanitize_text_field($date);
        
        // Проверяем валидность даты
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            continue;
        }
        
        // Проверяем, что дата не в прошлом
        if ($date < date('Y-m-d')) {
            $skipped_count++;
            continue;
        }
        
        // Проверяем, что дата не существует
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE date = %s", 
            $date
        ));
        
        if ($existing) {
            $skipped_count++;
            continue;
        }
        
        // Добавляем дату
        $result = $wpdb->insert($table_name, [
            'date' => $date,
            'status' => 'available',
            'max_bookings' => 1,
            'current_bookings' => 0
        ]);
        
        if ($result) {
            $added_count++;
        }
    }
    
    wp_die(json_encode([
        'success' => true, 
        'added' => $added_count,
        'skipped' => $skipped_count,
        'message' => "Добавлено дат: $added_count, пропущено: $skipped_count"
    ], JSON_UNESCAPED_UNICODE));
}

// Удаление даты
function handle_delete_booking_date() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    $date = sanitize_text_field($_POST['date']);
    
    if (empty($date)) {
        wp_die(json_encode(['error' => 'Дата не указана'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'booking_dates';
    
    // Проверяем, есть ли записи на эту дату (если будет таблица записей)
    // $bookings_table = $wpdb->prefix . 'bookings';
    // $bookings_count = $wpdb->get_var($wpdb->prepare(
    //     "SELECT COUNT(*) FROM $bookings_table WHERE booking_date = %s", 
    //     $date
    // ));
    
    // if ($bookings_count > 0) {
    //     wp_die(json_encode(['error' => "На эту дату есть $bookings_count записей. Удаление невозможно."], JSON_UNESCAPED_UNICODE));
    // }
    
    $result = $wpdb->delete($table_name, ['date' => $date]);
    
    if ($result) {
        wp_die(json_encode(['success' => true, 'message' => 'Дата удалена'], JSON_UNESCAPED_UNICODE));
    } else {
        wp_die(json_encode(['error' => 'Ошибка удаления'], JSON_UNESCAPED_UNICODE));
    }
}




// #######################################
// #######################################
// #######################################


// Исправленная функция создания таблицы для клиентских страниц
function create_client_pages_table() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'client_pages';
    $charset_collate = $wpdb->get_charset_collate();
    
    // ВАЖНО: SQL должен быть точно отформатирован согласно требованиям dbDelta
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        client_name varchar(255) NOT NULL,
        session_title varchar(255) NOT NULL,
        session_category varchar(100),
        session_date date,
        session_description text,
        page_url varchar(255) NOT NULL,
        access_password varchar(255),
        enable_download tinyint(1) DEFAULT 1,
        photos_data longtext,
        status varchar(20) DEFAULT 'active',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        UNIQUE KEY page_url (page_url),
        KEY status (status)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Логируем результат создания таблицы
    error_log("Попытка создания таблицы $table_name");
    
    // Проверяем, создалась ли таблица
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
    if ($table_exists) {
        error_log("✅ Таблица $table_name успешно создана");
    } else {
        error_log("❌ Таблица $table_name НЕ создана");
    }
}

// Вызываем при активации темы
add_action('after_switch_theme', 'create_client_pages_table');

// AJAX обработчики для клиентских страниц
add_action('wp_ajax_create_client_page', 'handle_create_client_page');
add_action('wp_ajax_get_client_page_data', 'handle_get_client_page_data');

// Исправленная обработка создания клиентской страницы
function handle_create_client_page() {
    // Устанавливаем заголовки JSON в самом начале
    header('Content-Type: application/json; charset=utf-8');
    
    // Включаем буферизацию вывода для предотвращения случайного HTML
    ob_start();
    
    try {
        // Проверяем nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'client_page_nonce')) {
            throw new Exception('Ошибка безопасности');
        }
        
        // Проверяем права
        if (!current_user_can('administrator')) {
            throw new Exception('Недостаточно прав');
        }
        
        // Получаем данные формы
        $client_name = sanitize_text_field($_POST['client_name'] ?? '');
        $session_title = sanitize_text_field($_POST['session_title'] ?? '');
        $session_category = sanitize_text_field($_POST['session_category'] ?? '');
        $session_date = sanitize_text_field($_POST['session_date'] ?? '');
        $session_description = sanitize_textarea_field($_POST['session_description'] ?? '');
        $page_url = sanitize_title($_POST['page_url'] ?? '');
        $access_password = sanitize_text_field($_POST['access_password'] ?? '');
        
        // Валидация
        if (empty($client_name) || empty($session_title) || empty($page_url)) {
            throw new Exception('Заполните все обязательные поля');
        }
        
        // Проверяем уникальность URL
        global $wpdb;
        $table_name = $wpdb->prefix . 'client_pages';
        
        // Проверяем существование таблицы
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
        if (!$table_exists) {
            create_client_pages_table();
        }
        
        $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE page_url = %s", $page_url));
        
        if ($existing) {
            throw new Exception('URL уже используется');
        }
        
        // Обработка загруженных файлов
        $photos_data = [];
        if (isset($_FILES['photos']) && !empty($_FILES['photos']['name'][0])) {
            $upload_dir = wp_upload_dir();
            $client_dir = $upload_dir['basedir'] . '/client-photos/' . $page_url . '/';
            $client_url = $upload_dir['baseurl'] . '/client-photos/' . $page_url . '/';
            
            if (!file_exists($client_dir)) {
                wp_mkdir_p($client_dir);
            }
            
            $files = $_FILES['photos'];
            for ($i = 0; $i < count($files['name']); $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $file_extension = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
                    $filename = uniqid() . '_' . time() . '.' . $file_extension;
                    $file_path = $client_dir . $filename;
                    $file_url = $client_url . $filename;
                    
                    if (move_uploaded_file($files['tmp_name'][$i], $file_path)) {
                        $photos_data[] = [
                            'filename' => $filename,
                            'original_name' => $files['name'][$i],
                            'url' => $file_url,
                            'path' => $file_path
                        ];
                    }
                }
            }
        }
        
        // Хешируем пароль если указан
        $hashed_password = !empty($access_password) ? password_hash($access_password, PASSWORD_DEFAULT) : null;
        
        // Сохраняем в базу данных
        $result = $wpdb->insert($table_name, [
            'client_name' => $client_name,
            'session_title' => $session_title,
            'session_category' => $session_category,
            'session_date' => !empty($session_date) ? $session_date : null,
            'session_description' => $session_description,
            'page_url' => $page_url,
            'access_password' => $hashed_password,
            'photos_data' => json_encode($photos_data),
            'enable_download' => 1
        ]);
        
        if (!$result) {
            throw new Exception('Ошибка сохранения в базу данных: ' . $wpdb->last_error);
        }
        
        // Очищаем буфер вывода
        ob_clean();
        
        // В конце функции handle_create_client_page
        wp_die(json_encode([
            'success' => true,
            'page_url' => home_url('/client/' . $page_url),
            'admin_url' => admin_url('post.php?post=' . get_page_by_path('client-template')->ID . '&action=edit'),
            'message' => 'Страница клиента успешно создана!'
        ], JSON_UNESCAPED_UNICODE));


        
    } catch (Exception $e) {
        // Очищаем буфер вывода
        ob_clean();
        
        // Возвращаем ошибку
        wp_die(json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE));
    }
}


// Получение данных клиентской страницы
function handle_get_client_page_data() {
    header('Content-Type: application/json; charset=utf-8');
    
    $page_url = sanitize_text_field($_GET['page_url']);
    $password = sanitize_text_field($_POST['password'] ?? '');
    
    if (empty($page_url)) {
        wp_die(json_encode(['error' => 'URL не указан'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'client_pages';
    
    $page_data = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE page_url = %s AND status = 'active'", 
        $page_url
    ));
    
    if (!$page_data) {
        wp_die(json_encode(['error' => 'Страница не найдена'], JSON_UNESCAPED_UNICODE));
    }
    
    // Проверяем пароль если установлен
    if (!empty($page_data->access_password)) {
        if (empty($password) || !password_verify($password, $page_data->access_password)) {
            wp_die(json_encode(['error' => 'Требуется пароль', 'password_required' => true], JSON_UNESCAPED_UNICODE));
        }
    }
    
    // Декодируем фотографии
    $photos = json_decode($page_data->photos_data, true) ?: [];
    
    wp_die(json_encode([
        'success' => true,
        'data' => [
            'client_name' => $page_data->client_name,
            'session_title' => $page_data->session_title,
            'session_category' => $page_data->session_category,
            'session_date' => $page_data->session_date,
            'session_description' => $page_data->session_description,
            'enable_download' => $page_data->enable_download,
            'photos' => $photos
        ]
    ], JSON_UNESCAPED_UNICODE));
}





// #######################################
// #######################################
// #######################################


// Создание таблиц для портфолио при активации темы
function create_portfolio_tables() {
    global $wpdb;
    
    $charset_collate = $wpdb->get_charset_collate();
    
    // Таблица категорий
    $categories_table = $wpdb->prefix . 'portfolio_categories';
    $categories_sql = "CREATE TABLE $categories_table (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        slug varchar(100) NOT NULL,
        description text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY slug (slug)
    ) $charset_collate;";
    
    // Таблица фотографий
    $photos_table = $wpdb->prefix . 'portfolio_photos';
    $photos_sql = "CREATE TABLE $photos_table (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL,
        filename varchar(255) NOT NULL,
        file_path varchar(500) NOT NULL,
        file_url varchar(500) NOT NULL,
        category_id mediumint(9) NOT NULL,
        year int(4) NOT NULL,
        link varchar(500) DEFAULT 'client-template.html',
        sort_order int(11) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY category_id (category_id),
        KEY year (year)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($categories_sql);
    dbDelta($photos_sql);
    
    // // Проверяем, есть ли уже категории
    // $existing_categories = $wpdb->get_var("SELECT COUNT(*) FROM $categories_table");
    // if ($existing_categories == 0) {
    //     // Добавляем базовые категории только при первом создании
    //     $default_categories = [
    //         ['name' => 'Свадьба', 'slug' => 'wedding'],
    //         ['name' => 'Портрет', 'slug' => 'portrait'],
    //         ['name' => 'Семья', 'slug' => 'family'],
    //         ['name' => 'Street', 'slug' => 'street'],
    //         ['name' => 'Природа', 'slug' => 'nature'],
    //         ['name' => 'События', 'slug' => 'events']
    //     ];
        
    //     foreach ($default_categories as $category) {
    //         $wpdb->insert($categories_table, $category);
    //     }
    // }
}

// Принудительно пересоздаем таблицы при активации темы
add_action('after_switch_theme', 'create_portfolio_tables');

// Также добавляем хук для ручного запуска
add_action('wp_loaded', function() {
    if (isset($_GET['recreate_portfolio_tables']) && current_user_can('administrator')) {
        create_portfolio_tables();
        wp_redirect(admin_url('themes.php?portfolio_tables_created=1'));
        exit;
    }
});

// AJAX обработчики (добавьте все эти функции)
add_action('wp_ajax_upload_portfolio_photos', 'handle_portfolio_upload');
add_action('wp_ajax_get_portfolio_photos', 'get_portfolio_photos');
add_action('wp_ajax_get_portfolio_categories', 'get_portfolio_categories');
add_action('wp_ajax_delete_portfolio_photo', 'delete_portfolio_photo');
add_action('wp_ajax_add_portfolio_category', 'add_portfolio_category');

// Исправленная функция загрузки фотографий
function handle_portfolio_upload() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'portfolio_nonce')) {
        wp_die(json_encode(['error' => 'Ошибка безопасности'], JSON_UNESCAPED_UNICODE));
    }
    
    if (!is_user_logged_in() || !current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    if (!isset($_FILES['files']) || !isset($_POST['photosData'])) {
        wp_die(json_encode(['error' => 'Данные не получены'], JSON_UNESCAPED_UNICODE));
    }
    
    $photos_data = json_decode(stripslashes($_POST['photosData']), true);
    $uploaded_files = $_FILES['files'];
    
    global $wpdb;
    $photos_table = $wpdb->prefix . 'portfolio_photos';
    
    $upload_dir = wp_upload_dir();
    $portfolio_dir = $upload_dir['basedir'] . '/portfolio/';
    $portfolio_url = $upload_dir['baseurl'] . '/portfolio/';
    
    if (!file_exists($portfolio_dir)) {
        wp_mkdir_p($portfolio_dir);
    }
    
    $results = [];
    
    for ($i = 0; $i < count($uploaded_files['name']); $i++) {
        if ($uploaded_files['error'][$i] !== UPLOAD_ERR_OK) {
            continue;
        }
        
        $photo_data = $photos_data[$i];
        $category_id = intval($photo_data['category_id']);
        
        if ($category_id <= 0) {
            continue;
        }
        
        $file_extension = pathinfo($uploaded_files['name'][$i], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $file_extension;
        $file_path = $portfolio_dir . $filename;
        $file_url = $portfolio_url . $filename;
        
        if (move_uploaded_file($uploaded_files['tmp_name'][$i], $file_path)) {
            $result = $wpdb->insert($photos_table, [
                'title' => sanitize_text_field($photo_data['title']),
                'filename' => $filename,
                'file_path' => $file_path,
                'file_url' => $file_url,
                'category_id' => $category_id,
                'year' => intval($photo_data['year']),
                'link' => sanitize_url($photo_data['link'])
            ]);
            
            if ($result) {
                $results[] = ['success' => true, 'filename' => $filename];
            }
        }
    }
    
    wp_die(json_encode(['success' => true, 'uploaded' => count($results)], JSON_UNESCAPED_UNICODE));
}

// ИСПРАВЛЕННЫЕ AJAX обработчики для портфолио
add_action('wp_ajax_get_portfolio_photos', 'get_portfolio_photos');
add_action('wp_ajax_nopriv_get_portfolio_photos', 'get_portfolio_photos'); // ДОБАВЬТЕ ЭТУ СТРОКУ

// Функция получения фотографий (обновленная)
function get_portfolio_photos() {
    header('Content-Type: application/json; charset=utf-8');
    
    // УБИРАЕМ проверку nonce для публичного доступа
    // if (!wp_verify_nonce($_POST['nonce'], 'portfolio_nonce')) {
    //     wp_die(json_encode(['error' => 'Ошибка безопасности'], JSON_UNESCAPED_UNICODE));
    // }
    
    global $wpdb;
    $photos_table = $wpdb->prefix . 'portfolio_photos';
    $categories_table = $wpdb->prefix . 'portfolio_categories';
    
    $photos = $wpdb->get_results("
        SELECT p.*, c.name as category_name, c.slug as category_slug 
        FROM $photos_table p 
        LEFT JOIN $categories_table c ON p.category_id = c.id 
        ORDER BY p.created_at DESC
    ");
    
    wp_die(json_encode(['success' => true, 'photos' => $photos], JSON_UNESCAPED_UNICODE));
}

// Также добавьте для других обработчиков портфолио, если они используются публично
add_action('wp_ajax_get_portfolio_categories', 'get_portfolio_categories');
add_action('wp_ajax_nopriv_get_portfolio_categories', 'get_portfolio_categories');

function get_portfolio_categories() {
    header('Content-Type: application/json; charset=utf-8');
    
    global $wpdb;
    $categories_table = $wpdb->prefix . 'portfolio_categories';
    $categories = $wpdb->get_results("SELECT * FROM $categories_table ORDER BY name ASC");
    
    wp_die(json_encode(['success' => true, 'categories' => $categories], JSON_UNESCAPED_UNICODE));
}


// Исправленная функция добавления категории
function add_portfolio_category() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'portfolio_nonce')) {
        wp_die(json_encode(['error' => 'Ошибка безопасности'], JSON_UNESCAPED_UNICODE));
    }
    
    if (!is_user_logged_in() || !current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    $name = sanitize_text_field($_POST['name']);
    $slug = sanitize_title($name);
    
    if (empty($name)) {
        wp_die(json_encode(['error' => 'Название категории не может быть пустым'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $categories_table = $wpdb->prefix . 'portfolio_categories';
    
    $result = $wpdb->insert($categories_table, [
        'name' => $name,
        'slug' => $slug
    ]);
    
    if ($result) {
        $category_id = $wpdb->insert_id;
        wp_die(json_encode(['success' => true, 'category_id' => $category_id, 'name' => $name], JSON_UNESCAPED_UNICODE));
    } else {
        wp_die(json_encode(['error' => 'Ошибка добавления категории'], JSON_UNESCAPED_UNICODE));
    }
}

// Функция удаления категории
function delete_portfolio_category() {
    // Добавляем заголовки JSON в самом начале
    header('Content-Type: application/json; charset=utf-8');
    
    // Проверяем nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'portfolio_nonce')) {
        wp_die(json_encode(['error' => 'Ошибка безопасности'], JSON_UNESCAPED_UNICODE));
    }
    
    // Проверяем права
    if (!is_user_logged_in() || !current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    $category_id = intval($_POST['category_id']);
    
    if ($category_id <= 0) {
        wp_die(json_encode(['error' => 'Некорректный ID категории'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $categories_table = $wpdb->prefix . 'portfolio_categories';
    $photos_table = $wpdb->prefix . 'portfolio_photos';
    
    // Проверяем, есть ли фотографии в этой категории
    $photos_count = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $photos_table WHERE category_id = %d", 
        $category_id
    ));
    
    if ($photos_count > 0) {
        wp_die(json_encode(['error' => "Нельзя удалить категорию. В ней есть $photos_count фотографий. Сначала удалите или переместите фотографии."], JSON_UNESCAPED_UNICODE));
    }
    
    // Удаляем категорию
    $result = $wpdb->delete($categories_table, ['id' => $category_id]);
    
    if ($result) {
        wp_die(json_encode(['success' => true], JSON_UNESCAPED_UNICODE));
    } else {
        wp_die(json_encode(['error' => 'Ошибка удаления категории'], JSON_UNESCAPED_UNICODE));
    }
}


// Добавьте в functions.php новый AJAX обработчик
add_action('wp_ajax_delete_portfolio_category', 'delete_portfolio_category');

// Исправленная функция удаления фотографии
function delete_portfolio_photo() {
    // Добавляем заголовки JSON в самом начале
    header('Content-Type: application/json; charset=utf-8');
    
    // Проверяем nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'portfolio_nonce')) {
        wp_die(json_encode(['error' => 'Ошибка безопасности'], JSON_UNESCAPED_UNICODE));
    }
    
    // Проверяем права (изменено условие)
    if (!is_user_logged_in() || !current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    $photo_id = intval($_POST['photo_id']);
    
    if ($photo_id <= 0) {
        wp_die(json_encode(['error' => 'Некорректный ID фотографии'], JSON_UNESCAPED_UNICODE));
    }
    
    global $wpdb;
    $photos_table = $wpdb->prefix . 'portfolio_photos';
    
    // Получаем информацию о фотографии
    $photo = $wpdb->get_row($wpdb->prepare("SELECT * FROM $photos_table WHERE id = %d", $photo_id));
    
    if (!$photo) {
        wp_die(json_encode(['error' => 'Фотография не найдена'], JSON_UNESCAPED_UNICODE));
    }
    
    // Удаляем файл с сервера
    if (file_exists($photo->file_path)) {
        unlink($photo->file_path);
    }
    
    // Удаляем из базы данных
    $result = $wpdb->delete($photos_table, ['id' => $photo_id]);
    
    if ($result) {
        wp_die(json_encode(['success' => true], JSON_UNESCAPED_UNICODE));
    } else {
        wp_die(json_encode(['error' => 'Ошибка удаления из базы данных'], JSON_UNESCAPED_UNICODE));
    }
}
// #######################################
// #######################################
// #######################################


// Добавляем админское меню для управления отзывами
add_action('admin_menu', 'add_reviews_admin_menu');

function add_reviews_admin_menu() {
    add_menu_page(
        'Управление отзывами',           // Заголовок страницы
        'Отзывы',                        // Название в меню
        'manage_options',                // Права доступа
        'reviews-manager',               // Slug страницы
        'reviews_admin_page',            // Функция отображения
        'dashicons-star-filled',         // Иконка
        30                               // Позиция в меню
    );
}

// Функция отображения админской страницы
function reviews_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'reviews';
    
    // Обработка действий
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'add_review' && wp_verify_nonce($_POST['_wpnonce'], 'add_review')) {
            $author = sanitize_text_field($_POST['author']);
            $text = sanitize_textarea_field($_POST['text']);
            $display_order = intval($_POST['display_order']);
            
            if (!empty($author) && !empty($text)) {
                $wpdb->insert($table_name, [
                    'author' => $author,
                    'text' => $text,
                    'display_order' => $display_order,
                    'status' => 'active'
                ]);
                echo '<div class="notice notice-success"><p>Отзыв успешно добавлен!</p></div>';
            }
        }
        
        if ($_POST['action'] === 'delete_review' && wp_verify_nonce($_POST['_wpnonce'], 'delete_review')) {
            $review_id = intval($_POST['review_id']);
            $wpdb->delete($table_name, ['id' => $review_id]);
            echo '<div class="notice notice-success"><p>Отзыв удален!</p></div>';
        }
        
        if ($_POST['action'] === 'update_status' && wp_verify_nonce($_POST['_wpnonce'], 'update_status')) {
            $review_id = intval($_POST['review_id']);
            $status = sanitize_text_field($_POST['status']);
            $wpdb->update($table_name, ['status' => $status], ['id' => $review_id]);
            echo '<div class="notice notice-success"><p>Статус отзыва обновлен!</p></div>';
        }
    }
    
    // Получаем все отзывы
    $reviews = $wpdb->get_results("SELECT * FROM $table_name ORDER BY display_order ASC, created_at DESC");
    
    ?>
    <div class="wrap">
        <h1>Управление отзывами</h1>
        
        <!-- Форма добавления нового отзыва -->
        <div class="card" style="max-width: 800px; margin-bottom: 20px;">
            <h2>Добавить новый отзыв</h2>
            <form method="post" action="">
                <?php wp_nonce_field('add_review'); ?>
                <input type="hidden" name="action" value="add_review">
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="author">Автор отзыва *</label>
                        </th>
                        <td>
                            <input type="text" id="author" name="author" class="regular-text" required 
                                   placeholder="Например: МАРИЯ ИВАНОВА">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="text">Текст отзыва *</label>
                        </th>
                        <td>
                            <textarea id="text" name="text" rows="8" cols="50" class="large-text" required
                                      placeholder="Введите текст отзыва..."></textarea>
                            <p class="description">Можно использовать переносы строк для разделения абзацев</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="display_order">Порядок отображения</label>
                        </th>
                        <td>
                            <input type="number" id="display_order" name="display_order" value="0" min="0" max="999">
                            <p class="description">Меньшее число = выше в списке (0 = самый верх)</p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Добавить отзыв'); ?>
            </form>
        </div>
        
        <!-- Список существующих отзывов -->
        <div class="card">
            <h2>Существующие отзывы (<?php echo count($reviews); ?>)</h2>
            
            <?php if (empty($reviews)): ?>
                <p>Отзывы пока не добавлены.</p>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th style="width: 200px;">Автор</th>
                            <th>Текст отзыва</th>
                            <th style="width: 100px;">Порядок</th>
                            <th style="width: 100px;">Статус</th>
                            <th style="width: 120px;">Дата</th>
                            <th style="width: 150px;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($reviews as $review): ?>
                            <tr>
                                <td><?php echo $review->id; ?></td>
                                <td><strong><?php echo esc_html($review->author); ?></strong></td>
                                <td>
                                    <div style="max-height: 100px; overflow-y: auto; font-size: 13px;">
                                        <?php echo nl2br(esc_html(wp_trim_words($review->text, 20))); ?>
                                    </div>
                                </td>
                                <td><?php echo $review->display_order; ?></td>
                                <td>
                                    <form method="post" style="display: inline;">
                                        <?php wp_nonce_field('update_status'); ?>
                                        <input type="hidden" name="action" value="update_status">
                                        <input type="hidden" name="review_id" value="<?php echo $review->id; ?>">
                                        <select name="status" onchange="this.form.submit()">
                                            <option value="active" <?php selected($review->status, 'active'); ?>>Активен</option>
                                            <option value="inactive" <?php selected($review->status, 'inactive'); ?>>Скрыт</option>
                                        </select>
                                    </form>
                                </td>
                                <td><?php echo date('d.m.Y', strtotime($review->created_at)); ?></td>
                                <td>
                                    <button type="button" class="button button-small" 
                                            onclick="editReview(<?php echo $review->id; ?>, '<?php echo esc_js($review->author); ?>', '<?php echo esc_js($review->text); ?>', <?php echo $review->display_order; ?>)">
                                        Редактировать
                                    </button>
                                    <form method="post" style="display: inline;" 
                                          onsubmit="return confirm('Вы уверены, что хотите удалить этот отзыв?');">
                                        <?php wp_nonce_field('delete_review'); ?>
                                        <input type="hidden" name="action" value="delete_review">
                                        <input type="hidden" name="review_id" value="<?php echo $review->id; ?>">
                                        <button type="submit" class="button button-small button-link-delete">Удалить</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Модальное окно для редактирования -->
    <div id="editReviewModal" style="display: none;">
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100000;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; max-width: 600px; width: 90%;">
                <h3>Редактировать отзыв</h3>
                <form method="post" id="editReviewForm">
                    <?php wp_nonce_field('edit_review'); ?>
                    <input type="hidden" name="action" value="edit_review">
                    <input type="hidden" name="review_id" id="editReviewId">
                    
                    <table class="form-table">
                        <tr>
                            <th><label for="editAuthor">Автор:</label></th>
                            <td><input type="text" id="editAuthor" name="author" class="regular-text" required></td>
                        </tr>
                        <tr>
                            <th><label for="editText">Текст:</label></th>
                            <td><textarea id="editText" name="text" rows="6" class="large-text" required></textarea></td>
                        </tr>
                        <tr>
                            <th><label for="editOrder">Порядок:</label></th>
                            <td><input type="number" id="editOrder" name="display_order" min="0" max="999"></td>
                        </tr>
                    </table>
                    
                    <p>
                        <button type="submit" class="button button-primary">Сохранить изменения</button>
                        <button type="button" class="button" onclick="closeEditModal()">Отмена</button>
                    </p>
                </form>
            </div>
        </div>
    </div>
    
    <script>
    function editReview(id, author, text, order) {
        document.getElementById('editReviewId').value = id;
        document.getElementById('editAuthor').value = author;
        document.getElementById('editText').value = text;
        document.getElementById('editOrder').value = order;
        document.getElementById('editReviewModal').style.display = 'block';
    }
    
    function closeEditModal() {
        document.getElementById('editReviewModal').style.display = 'none';
    }
    </script>
    
    <style>
    .card {
        max-width: unset !important;
        background: #fff;
        border: 1px solid #c3c4c7;
        border-radius: 4px;
        padding: 20px;
        margin: 20px 0;
    }
    .form-table th {
        width: 150px;
    }
    </style>
    <?php
}

// Обработка редактирования отзыва
add_action('admin_init', 'handle_edit_review');

function handle_edit_review() {
    if (isset($_POST['action']) && $_POST['action'] === 'edit_review' && wp_verify_nonce($_POST['_wpnonce'], 'edit_review')) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'reviews';
        
        $review_id = intval($_POST['review_id']);
        $author = sanitize_text_field($_POST['author']);
        $text = sanitize_textarea_field($_POST['text']);
        $display_order = intval($_POST['display_order']);
        
        if (!empty($author) && !empty($text)) {
            $wpdb->update($table_name, [
                'author' => $author,
                'text' => $text,
                'display_order' => $display_order
            ], ['id' => $review_id]);
            
            wp_redirect(admin_url('admin.php?page=reviews-manager&updated=1'));
            exit;
        }
    }
}


// Показываем уведомления в админке
add_action('admin_notices', 'reviews_admin_notices');

function reviews_admin_notices() {
    if (isset($_GET['page']) && $_GET['page'] === 'reviews-manager') {
        if (isset($_GET['updated']) && $_GET['updated'] === '1') {
            echo '<div class="notice notice-success is-dismissible"><p>Отзыв успешно обновлен!</p></div>';
        }
    }
}


// Добавляем быстрые действия для массового управления
add_action('wp_ajax_bulk_reviews_action', 'handle_bulk_reviews_action');

function handle_bulk_reviews_action() {
    if (!current_user_can('manage_options')) {
        wp_die('Недостаточно прав');
    }
    
    $action = sanitize_text_field($_POST['bulk_action']);
    $review_ids = array_map('intval', $_POST['review_ids']);
    
    if (empty($review_ids)) {
        wp_die('Не выбраны отзывы');
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'reviews';
    
    switch ($action) {
        case 'activate':
            foreach ($review_ids as $id) {
                $wpdb->update($table_name, ['status' => 'active'], ['id' => $id]);
            }
            break;
            
        case 'deactivate':
            foreach ($review_ids as $id) {
                $wpdb->update($table_name, ['status' => 'inactive'], ['id' => $id]);
            }
            break;
            
        case 'delete':
            foreach ($review_ids as $id) {
                $wpdb->delete($table_name, ['id' => $id]);
            }
            break;
    }
    
    wp_redirect(admin_url('admin.php?page=reviews-manager&bulk_updated=1'));
    exit;
}




// Создание таблицы для отзывов
function create_reviews_table() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'reviews';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        author varchar(255) NOT NULL,
        text longtext NOT NULL,
        status varchar(20) DEFAULT 'active',
        display_order int(11) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status),
        KEY display_order (display_order)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
}

// Функция добавления тестовых отзывов
function insert_default_reviews() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'reviews';
    
    $default_reviews = [
        [
            'author' => 'ЦАГАН ЕГОРОВА И СЕМЬЯ',
            'text' => 'Наша история с Катей длится уже 11 лет, и если можно подобрать метафору, то это будет чудесный вышитый узор, когда за будними и особенными днями нашей семьи следуют полные любви и счастья фотографии, будто нитка за иголкой.

Память часто сглаживает остроту момента или важность какой-то мелочи, поэтому именно к Катиным фотографиям я возвращаюсь вновь и вновь, чтобы окунуться в счастливые воспоминания. Вот нас двое влюблённых, вот мы женимся, а вот ожидание первого ребёнка и рождение второго... То, как видит Катя — а она не только видит и чувствует людей, она видит в нас самое лучшее! — это дар.

И я счастлива, что могу наблюдать развитие её таланта вглубь и вширь так близко, вдохновляться и бесконечно восторгаться божественным в человеке ✨

Люблю ❤️',
            'display_order' => 1
        ],
        [
            'author' => 'МАРИЯ, @ASK_MARYSIA',
            'text' => 'Если вам хочется собрать эмоции детей, родных, себя в первую очередь и сохранить на долгую память, то вам нужна Катя ❤️ она умеет ловить то настоящее, что есть в нас. А это — дар! Большое счастье быть знакомой с таким фотографом с большой буквы Ф!',
            'display_order' => 2
        ]
    ];
    
    foreach ($default_reviews as $review) {
        $wpdb->insert($table_name, $review);
    }
}

// Вызываем при активации темы
add_action('after_switch_theme', 'create_reviews_table');

// AJAX обработчик для получения отзывов
add_action('wp_ajax_get_reviews', 'handle_get_reviews');
add_action('wp_ajax_nopriv_get_reviews', 'handle_get_reviews');

function handle_get_reviews() {
    header('Content-Type: application/json; charset=utf-8');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'reviews';
    
    $reviews = $wpdb->get_results("
        SELECT * FROM $table_name 
        WHERE status = 'active' 
        ORDER BY display_order ASC, created_at DESC
    ");
    
    wp_die(json_encode([
        'success' => true, 
        'reviews' => $reviews
    ], JSON_UNESCAPED_UNICODE));
}





// #######################################
// #######################################
// #######################################

add_action('phpmailer_init', 'configure_smtp');

function configure_smtp($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host = 'smtp.yandex.ru';
    $phpmailer->SMTPAuth = true;
    $phpmailer->Username = '';
    $phpmailer->Password = '';
    $phpmailer->SMTPSecure = 'ssl';
    $phpmailer->Port = 465;
    $phpmailer->CharSet = 'UTF-8';
    $phpmailer->setFrom('', 'ФОТОГРАФИЯ как часть ПУТИ');
    
    $phpmailer->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
    
    // Отладка (отключите после настройки)
    $phpmailer->SMTPDebug = 2;
    $phpmailer->Debugoutput = 'error_log';
}

function photographer_theme_scripts_styles() {
    wp_enqueue_style('custom', get_stylesheet_directory_uri() . '/css/style.css');
    wp_enqueue_style('blog', get_stylesheet_directory_uri() . '/css/blog.css');
    wp_enqueue_style('editor-style', get_stylesheet_directory_uri() . '/css/editor-style.css');
    
    // Swiper подключаем первым с зависимостями
    wp_enqueue_style('swiper', 'https://unpkg.com/swiper@8/swiper-bundle.min.css', array(), '8.0.0');
    wp_enqueue_script('swiper', 'https://unpkg.com/swiper@8/swiper-bundle.min.js', array(), '8.0.0', true);
    

    // Основной скрипт только на главной странице с зависимостью от Swiper
    if (is_front_page()) {
        wp_enqueue_script('main', get_template_directory_uri() . '/js/main.js', array('swiper'), '1.0.0', true);
    }
    
    // Портфолио скрипт с лайтбоксом
    if (is_page_template('page-portfolio.php')) {
        // Подключаем простой лайтбокс
        wp_enqueue_style('lightbox', 'https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.4/css/lightbox.min.css', array(), '2.11.4');
        wp_enqueue_script('lightbox', 'https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.4/js/lightbox.min.js', array('jquery'), '2.11.4', true);
        
        wp_enqueue_script('portfolio', get_template_directory_uri() . '/js/portfolio.js', array('lightbox'), '1.0.0', true);
    }
    
    // Остальные скрипты без изменений
    if (is_page_template('page-edit-portfolio.php')) {
        wp_enqueue_script('admin', get_template_directory_uri() . '/js/admin.js', array(), '1.0.0', true);
    }
    
    if (is_page_template('client-template.php')) {
        wp_enqueue_script('client-page', get_template_directory_uri() . '/js/client-page.js', array(), '1.0.0', true);
    }
    
    if (is_page_template('client-admin.php')) {
        wp_enqueue_script('client-admin', get_template_directory_uri() . '/js/client-admin.js', array(), '1.0.0', true);
    }
    
    if (is_page_template('calendar-admin.php')) {
        wp_enqueue_script('calendar-admin', get_template_directory_uri() . '/js/calendar-admin.js', array(), '1.0.0', true);
    }
    
    if (is_page_template('booking.php')) {
        wp_enqueue_script('booking', get_template_directory_uri() . '/js/booking.js', array(), '1.0.0', true);
    }
    
    if (is_page_template('services.php')) {
        wp_enqueue_script('services', get_template_directory_uri() . '/js/services.js', array(), '1.0.0', true);
    }
    
    if (is_page_template('services-admin.php')) {
        wp_enqueue_script('services-admin', get_template_directory_uri() . '/js/services-admin.js', array(), '1.0.0', true);
    }
    
    if (is_page(7)) {
        wp_enqueue_script('contact-form', get_template_directory_uri() . '/js/contact-form.js', array(), '1.0.0', true);
    }
}
add_action('wp_enqueue_scripts', 'photographer_theme_scripts_styles');


// Настройка URL для клиентских страниц
function add_client_page_rewrite_rules() {
    // Правило для клиентских страниц
    add_rewrite_rule(
        '^client/([^/]+)/?$', 
        'index.php?pagename=client-template&client_page_url=$matches[1]', 
        'top'
    );
}
add_action('init', 'add_client_page_rewrite_rules');

// Добавляем переменную запроса
function add_client_page_query_vars($vars) {
    $vars[] = 'client_page_url';
    return $vars;
}
add_filter('query_vars', 'add_client_page_query_vars');

// Обновляем rewrite rules при активации темы
function flush_client_page_rewrite_rules() {
    add_client_page_rewrite_rules();
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'flush_client_page_rewrite_rules');

// Принудительное обновление правил (для отладки)
add_action('init', function() {
    if (isset($_GET['flush_rules']) && current_user_can('administrator')) {
        flush_rewrite_rules();
        wp_redirect(admin_url('?rules_flushed=1'));
        exit;
    }
});



// Функция для создания ZIP-архива с фотографиями клиента
add_action('wp_ajax_download_client_photos_zip', 'handle_download_client_photos_zip');
add_action('wp_ajax_nopriv_download_client_photos_zip', 'handle_download_client_photos_zip');

function handle_download_client_photos_zip() {
    $page_url = sanitize_text_field($_GET['page_url'] ?? '');
    $password = sanitize_text_field($_POST['password'] ?? '');
    
    if (empty($page_url)) {
        wp_die('URL не указан');
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'client_pages';
    
    $page_data = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE page_url = %s AND status = 'active'", 
        $page_url
    ));
    
    if (!$page_data) {
        wp_die('Страница не найдена');
    }
    
    // Проверяем пароль если установлен
    if (!empty($page_data->access_password)) {
        $password_correct = false;
        
        if (!empty($password) && password_verify($password, $page_data->access_password)) {
            $password_correct = true;
        } elseif (isset($_COOKIE['client_auth_' . $page_url])) {
            if ($_COOKIE['client_auth_' . $page_url] === hash('sha256', $page_data->access_password)) {
                $password_correct = true;
            }
        }
        
        if (!$password_correct) {
            wp_die('Доступ запрещен');
        }
    }
    
    // Декодируем фотографии
    $photos = json_decode($page_data->photos_data, true) ?: [];
    
    if (empty($photos)) {
        wp_die('Нет фотографий для скачивания');
    }
    
    // Проверяем поддержку ZipArchive
    if (!class_exists('ZipArchive')) {
        wp_die('ZIP архивы не поддерживаются на этом сервере');
    }
    
    // Создаем временный файл
    $temp_file = tempnam(sys_get_temp_dir(), 'client_photos_');
    
    $zip = new ZipArchive();
    if ($zip->open($temp_file, ZipArchive::CREATE) !== TRUE) {
        wp_die('Не удалось создать ZIP архив');
    }
    
    // Добавляем фотографии в архив
    foreach ($photos as $index => $photo) {
        if (file_exists($photo['path'])) {
            $file_extension = pathinfo($photo['original_name'], PATHINFO_EXTENSION);
            $safe_filename = sprintf('%03d_%s.%s', 
                $index + 1, 
                sanitize_file_name(pathinfo($photo['original_name'], PATHINFO_FILENAME)),
                $file_extension
            );
            
            $zip->addFile($photo['path'], $safe_filename);
        }
    }
    
    $zip->close();
    
    // Отправляем файл пользователю
    $zip_filename = sanitize_file_name($page_data->session_title) . '_' . date('Y-m-d') . '.zip';
    
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zip_filename . '"');
    header('Content-Length: ' . filesize($temp_file));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    // Очищаем буфер вывода
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($temp_file);
    unlink($temp_file);
    exit;
}


// Функция для скачивания отдельной фотографии
add_action('wp_ajax_download_single_photo', 'handle_download_single_photo');
add_action('wp_ajax_nopriv_download_single_photo', 'handle_download_single_photo');

function handle_download_single_photo() {
    $photo_url = sanitize_url($_GET['photo_url'] ?? '');
    $page_url = sanitize_text_field($_GET['page_url'] ?? '');
    
    if (empty($photo_url) || empty($page_url)) {
        wp_die('Параметры не указаны');
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'client_pages';
    
    // Получаем данные страницы для проверки прав доступа
    $page_data = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE page_url = %s AND status = 'active'", 
        $page_url
    ));
    
    if (!$page_data) {
        wp_die('Страница не найдена');
    }
    
    // Проверяем пароль если установлен
    if (!empty($page_data->access_password)) {
        $password_correct = false;
        
        if (isset($_COOKIE['client_auth_' . $page_url])) {
            if ($_COOKIE['client_auth_' . $page_url] === hash('sha256', $page_data->access_password)) {
                $password_correct = true;
            }
        }
        
        if (!$password_correct) {
            wp_die('Доступ запрещен');
        }
    }
    
    // Декодируем фотографии и ищем нужную
    $photos = json_decode($page_data->photos_data, true) ?: [];
    $target_photo = null;
    
    foreach ($photos as $photo) {
        if ($photo['url'] === $photo_url) {
            $target_photo = $photo;
            break;
        }
    }
    
    if (!$target_photo || !file_exists($target_photo['path'])) {
        wp_die('Фотография не найдена');
    }
    
    // Отправляем файл
    $filename = $target_photo['original_name'];
    $file_path = $target_photo['path'];
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($file_path));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    // Очищаем буфер вывода
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($file_path);
    exit;
}


// ###################################################
// ###################################################
// ###################################################

// Создание таблицы для услуг
function create_services_table() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'services';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL,
        price varchar(100) NOT NULL,
        short_description text NOT NULL,
        full_description longtext NOT NULL,
        image_url varchar(500),
        image_path varchar(500),
        features longtext,
        status varchar(20) DEFAULT 'active',
        display_order int(11) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status),
        KEY display_order (display_order)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Вызываем при активации темы
add_action('after_switch_theme', 'create_services_table');

// AJAX обработчики для услуг
add_action('wp_ajax_get_services', 'handle_get_services');
add_action('wp_ajax_nopriv_get_services', 'handle_get_services');
add_action('wp_ajax_add_service', 'handle_add_service');
add_action('wp_ajax_update_service', 'handle_update_service');
add_action('wp_ajax_delete_service', 'handle_delete_service');

// Получение всех услуг
function handle_get_services() {
    header('Content-Type: application/json; charset=utf-8');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'services';
    
    $services = $wpdb->get_results("
        SELECT * FROM $table_name 
        WHERE status = 'active' 
        ORDER BY display_order ASC, created_at DESC
    ");
    
    // Декодируем features для каждой услуги
    foreach ($services as $service) {
        $service->features = json_decode($service->features, true) ?: [];
    }
    
    wp_die(json_encode([
        'success' => true, 
        'services' => $services
    ], JSON_UNESCAPED_UNICODE));
}

// Добавление новой услуги
function handle_add_service() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    try {
        // Получаем данные формы
        $title = sanitize_text_field($_POST['title'] ?? '');
        $price = sanitize_text_field($_POST['price'] ?? '');
        $short_description = sanitize_textarea_field($_POST['short_description'] ?? '');
        $full_description = sanitize_textarea_field($_POST['full_description'] ?? '');
        $features_text = sanitize_textarea_field($_POST['features'] ?? '');
        
        // Валидация
        if (empty($title) || empty($price) || empty($short_description) || empty($full_description)) {
            throw new Exception('Заполните все обязательные поля');
        }
        
        // Обработка features
        $features = [];
        if (!empty($features_text)) {
            $features = array_filter(array_map('trim', explode("\n", $features_text)));
        }
        
        // Обработка загруженного изображения
        $image_url = '';
        $image_path = '';
        
        if (isset($_FILES['service_image']) && $_FILES['service_image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = wp_upload_dir();
            $services_dir = $upload_dir['basedir'] . '/services/';
            $services_url = $upload_dir['baseurl'] . '/services/';
            
            if (!file_exists($services_dir)) {
                wp_mkdir_p($services_dir);
            }
            
            $file_extension = pathinfo($_FILES['service_image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '_' . time() . '.' . $file_extension;
            $file_path = $services_dir . $filename;
            $file_url = $services_url . $filename;
            
            if (move_uploaded_file($_FILES['service_image']['tmp_name'], $file_path)) {
                $image_url = $file_url;
                $image_path = $file_path;
            }
        }
        
        // Сохраняем в базу данных
        global $wpdb;
        $table_name = $wpdb->prefix . 'services';
        
        $result = $wpdb->insert($table_name, [
            'title' => $title,
            'price' => $price,
            'short_description' => $short_description,
            'full_description' => $full_description,
            'image_url' => $image_url,
            'image_path' => $image_path,
            'features' => json_encode($features),
            'status' => 'active',
            'display_order' => 0
        ]);
        
        if (!$result) {
            throw new Exception('Ошибка сохранения в базу данных');
        }
        
        wp_die(json_encode([
            'success' => true,
            'message' => 'Услуга успешно добавлена!'
        ], JSON_UNESCAPED_UNICODE));
        
    } catch (Exception $e) {
        wp_die(json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE));
    }
}

// Обновление услуги
function handle_update_service() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    try {
        $service_id = intval($_POST['service_id'] ?? 0);
        $title = sanitize_text_field($_POST['title'] ?? '');
        $price = sanitize_text_field($_POST['price'] ?? '');
        $short_description = sanitize_textarea_field($_POST['short_description'] ?? '');
        $full_description = sanitize_textarea_field($_POST['full_description'] ?? '');
        $features_text = sanitize_textarea_field($_POST['features'] ?? '');
        
        if ($service_id <= 0 || empty($title) || empty($price)) {
            throw new Exception('Некорректные данные');
        }
        
        // Обработка features
        $features = [];
        if (!empty($features_text)) {
            $features = array_filter(array_map('trim', explode("\n", $features_text)));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'services';
        
        // Данные для обновления
        $update_data = [
            'title' => $title,
            'price' => $price,
            'short_description' => $short_description,
            'full_description' => $full_description,
            'features' => json_encode($features)
        ];
        
        // Обработка нового изображения
        if (isset($_FILES['service_image']) && $_FILES['service_image']['error'] === UPLOAD_ERR_OK) {
            // Получаем старое изображение для удаления
            $old_service = $wpdb->get_row($wpdb->prepare("SELECT image_path FROM $table_name WHERE id = %d", $service_id));
            
            $upload_dir = wp_upload_dir();
            $services_dir = $upload_dir['basedir'] . '/services/';
            $services_url = $upload_dir['baseurl'] . '/services/';
            
            if (!file_exists($services_dir)) {
                wp_mkdir_p($services_dir);
            }
            
            $file_extension = pathinfo($_FILES['service_image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '_' . time() . '.' . $file_extension;
            $file_path = $services_dir . $filename;
            $file_url = $services_url . $filename;
            
            if (move_uploaded_file($_FILES['service_image']['tmp_name'], $file_path)) {
                $update_data['image_url'] = $file_url;
                $update_data['image_path'] = $file_path;
                
                // Удаляем старое изображение
                if ($old_service && !empty($old_service->image_path) && file_exists($old_service->image_path)) {
                    unlink($old_service->image_path);
                }
            }
        }
        
        $result = $wpdb->update($table_name, $update_data, ['id' => $service_id]);
        
        if ($result === false) {
            throw new Exception('Ошибка обновления');
        }
        
        wp_die(json_encode([
            'success' => true,
            'message' => 'Услуга успешно обновлена!'
        ], JSON_UNESCAPED_UNICODE));
        
    } catch (Exception $e) {
        wp_die(json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE));
    }
}

// Удаление услуги
function handle_delete_service() {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!current_user_can('administrator')) {
        wp_die(json_encode(['error' => 'Недостаточно прав'], JSON_UNESCAPED_UNICODE));
    }
    
    try {
        $service_id = intval($_POST['service_id'] ?? 0);
        
        if ($service_id <= 0) {
            throw new Exception('Некорректный ID услуги');
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'services';
        
        // Получаем информацию об услуге для удаления изображения
        $service = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $service_id));
        
        if (!$service) {
            throw new Exception('Услуга не найдена');
        }
        
        // Удаляем изображение с сервера
        if (!empty($service->image_path) && file_exists($service->image_path)) {
            unlink($service->image_path);
        }
        
        // Удаляем из базы данных
        $result = $wpdb->delete($table_name, ['id' => $service_id]);
        
        if (!$result) {
            throw new Exception('Ошибка удаления');
        }
        
        wp_die(json_encode([
            'success' => true,
            'message' => 'Услуга успешно удалена!'
        ], JSON_UNESCAPED_UNICODE));
        
    } catch (Exception $e) {
        wp_die(json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE));
    }
}

// ###################################################
// ###################################################
// ###################################################


// ==================== BLOG FUNCTIONALITY ========================

// Включаем поддержку миниатюр для постов
add_theme_support('post-thumbnails');

// Добавляем размеры изображений для блога
add_image_size('blog-card', 400, 250, true);
add_image_size('blog-hero', 1200, 600, true);

// Функция подсчета времени чтения
function reading_time() {
    $content = get_post_field('post_content', get_the_ID());
    $word_count = str_word_count(strip_tags($content));
    $reading_time = ceil($word_count / 200); // 200 слов в минуту
    return $reading_time;
}

// Кастомные размеры excerpt
function custom_excerpt_length($length) {
    return 25;
}
add_filter('excerpt_length', 'custom_excerpt_length');

function custom_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'custom_excerpt_more');

// Добавляем поддержку категорий и тегов
function enable_blog_features() {
    // Включаем категории и теги для постов (по умолчанию включены)
    register_taxonomy_for_object_type('category', 'post');
    register_taxonomy_for_object_type('post_tag', 'post');
}
add_action('init', 'enable_blog_features');

// Настройка Gutenberg для блога
function configure_gutenberg_for_blog() {
    // Включаем полную поддержку Gutenberg
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_theme_support('editor-styles');
    
    // Добавляем стили редактора
    add_editor_style('css/editor-style.css');
    
    // Настраиваем цветовую палитру
    add_theme_support('editor-color-palette', [
        [
            'name' => 'Черный',
            'slug' => 'black',
            'color' => '#000000',
        ],
        [
            'name' => 'Белый',
            'slug' => 'white',
            'color' => '#ffffff',
        ],
        [
            'name' => 'Серый',
            'slug' => 'gray',
            'color' => '#666666',
        ],
        [
            'name' => 'Акцент',
            'slug' => 'accent',
            'color' => '#d49f00',
        ],
    ]);
    
    // Настраиваем размеры шрифтов
    add_theme_support('editor-font-sizes', [
        [
            'name' => 'Маленький',
            'size' => 14,
            'slug' => 'small'
        ],
        [
            'name' => 'Обычный',
            'size' => 16,
            'slug' => 'normal'
        ],
        [
            'name' => 'Большой',
            'size' => 20,
            'slug' => 'large'
        ],
        [
            'name' => 'Огромный',
            'size' => 28,
            'slug' => 'huge'
        ]
    ]);
}
add_action('after_setup_theme', 'configure_gutenberg_for_blog');

// AJAX для фильтрации постов
add_action('wp_ajax_filter_blog_posts', 'handle_filter_blog_posts');
add_action('wp_ajax_nopriv_filter_blog_posts', 'handle_filter_blog_posts');

function handle_filter_blog_posts() {
    $category = sanitize_text_field($_POST['category'] ?? '');
    $search = sanitize_text_field($_POST['search'] ?? '');
    $paged = intval($_POST['paged'] ?? 1);
    
    $args = [
        'post_type' => 'post',
        'posts_per_page' => 9,
        'paged' => $paged,
        'post_status' => 'publish'
    ];
    
    if (!empty($category)) {
        $args['category_name'] = $category;
    }
    
    if (!empty($search)) {
        $args['s'] = $search;
    }
    
    $query = new WP_Query($args);
    
    ob_start();
    if ($query->have_posts()) :
        while ($query->have_posts()) : $query->the_post();
            get_template_part('template-parts/blog-card');
        endwhile;
    endif;
    wp_reset_postdata();
    
    $html = ob_get_clean();
    
    wp_die(json_encode([
        'success' => true,
        'html' => $html,
        'max_pages' => $query->max_num_pages
    ], JSON_UNESCAPED_UNICODE));
}

// Добавляем блог в главное меню
function add_blog_to_menu($items, $args) {
    if ($args->theme_location == 'primary') {
        $blog_page = get_page_by_path('blog');
        if ($blog_page) {
            $blog_url = get_permalink($blog_page);
            $current_url = $_SERVER['REQUEST_URI'];
            $active_class = (strpos($current_url, '/blog') !== false) ? ' class="active"' : '';
            
            $blog_item = '<li><a href="' . $blog_url . '"' . $active_class . '>Блог</a></li>';
            $items .= $blog_item;
        }
    }
    return $items;
}
add_filter('wp_nav_menu_items', 'add_blog_to_menu', 10, 2);



?>