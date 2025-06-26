<?php
/**
* Template Name: Client Template
*/

// Получаем URL клиента из параметра запроса
$client_page_url = get_query_var('client_page_url');

// Если URL не передан, показываем 404
if (empty($client_page_url)) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}

// Получаем данные страницы из базы данных
global $wpdb;
$table_name = $wpdb->prefix . 'client_pages';
$page_data = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM $table_name WHERE page_url = %s AND status = 'active'", 
    $client_page_url
));

// Если страница не найдена, показываем 404
if (!$page_data) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}

// Декодируем фотографии СРАЗУ
$photos = json_decode($page_data->photos_data, true) ?: [];

// УСТАНАВЛИВАЕМ ЗАГОЛОВКИ ДО get_header()
add_filter('document_title_parts', function($title) use ($page_data) {
    $title['title'] = $page_data->session_title;
    $title['page'] = $page_data->client_name;
    $title['site'] = get_bloginfo('name');
    return $title;
});

// Альтернативный фильтр для старых версий WordPress
add_filter('wp_title', function($title, $sep) use ($page_data) {
    return $page_data->session_title . ' - ' . $page_data->client_name . ' ' . $sep . ' ' . get_bloginfo('name');
}, 10, 2);

// Добавляем мета-теги
add_action('wp_head', function() use ($page_data, $photos) {
    echo '<meta name="description" content="Фотосессия ' . esc_attr($page_data->session_title) . ' для ' . esc_attr($page_data->client_name) . '. Просмотр и скачивание фотографий.">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($page_data->session_title) . ' - ' . esc_attr($page_data->client_name) . '">' . "\n";
    echo '<meta property="og:description" content="Фотосессия ' . esc_attr($page_data->session_title) . ' для ' . esc_attr($page_data->client_name) . '">' . "\n";
    if (!empty($photos)) {
        echo '<meta property="og:image" content="' . esc_url($photos[0]['url']) . '">' . "\n";
    }
}, 1); // Приоритет 1 - выполняется раньше

// Проверяем пароль
$password_required = !empty($page_data->access_password);
$password_correct = false;

if ($password_required && isset($_POST['client_password'])) {
    if (password_verify($_POST['client_password'], $page_data->access_password)) {
        $password_correct = true;
        setcookie('client_auth_' . $client_page_url, hash('sha256', $page_data->access_password), time() + 3600, '/');
    }
} elseif ($password_required && isset($_COOKIE['client_auth_' . $client_page_url])) {
    if ($_COOKIE['client_auth_' . $client_page_url] === hash('sha256', $page_data->access_password)) {
        $password_correct = true;
    }
}

// Если нужен пароль и он не введен
if ($password_required && !$password_correct) {
    get_header();
    ?>
    <main class="client-password">
        <div class="client-password__container">
            <h1>Доступ к фотографиям</h1>
            <p>Для просмотра фотографий "<?php echo esc_html($page_data->session_title); ?>" введите пароль</p>
            
            <form method="post" class="client-password__form">
                <input type="password" name="client_password" placeholder="Введите пароль" required>
                <button type="submit">Войти</button>
            </form>
            
            <?php if (isset($_POST['client_password'])): ?>
                <p class="error">Неверный пароль</p>
            <?php endif; ?>
        </div>
    </main>
    
    <style>
    .client-password {
        margin-left: var(--sidebar-w);
        padding: 8vw 5vw;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .client-password__container {
        max-width: 400px;
        text-align: center;
        background: #fff;
        padding: 3rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .client-password__form {
        margin-top: 2rem;
    }
    
    .client-password__form input {
        width: 100%;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 1rem;
    }
    
    .client-password__form button {
        width: 100%;
        padding: 1rem;
        background: #000;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
    }
    
    .error {
        color: #ff4444;
        margin-top: 1rem;
    }
    
    @media (max-width: 899px) {
        .client-password {
            margin-left: 0;
            padding-top: calc(var(--topbar-h) + 4vw);
        }
    }
    </style>
    <?php
    get_footer();
    exit;
}

get_header();
?>

<!-- =================== КОНТЕНТ СТРАНИЦЫ КЛИЕНТА =================== -->
<main class="client-page">
  
  <!-- информация о фотосессии -->
  <section class="client-info">
    <div class="client-info__container">
      
      <div class="client-info__content">
        <h1 class="client-info__title"><?php echo esc_html($page_data->session_title); ?></h1>
        
        <div class="client-info__meta">
          <div class="client-info__item">
            <span class="client-info__label">Клиент</span>
            <span class="client-info__value"><?php echo esc_html($page_data->client_name); ?></span>
          </div>
          
          <?php if ($page_data->session_date): ?>
          <div class="client-info__item">
            <span class="client-info__label">Дата съёмки</span>
            <span class="client-info__value"><?php echo date('d.m.Y', strtotime($page_data->session_date)); ?></span>
          </div>
          <?php endif; ?>
          
          <?php if ($page_data->session_category): ?>
          <div class="client-info__item">
            <span class="client-info__label">Категория</span>
            <span class="client-info__value"><?php echo esc_html($page_data->session_category); ?></span>
          </div>
          <?php endif; ?>
        </div>
        
        <?php if ($page_data->session_description): ?>
        <p class="client-info__description"><?php echo esc_html($page_data->session_description); ?></p>
        <?php endif; ?>
        
        <?php if ($page_data->enable_download && !empty($photos)): ?>
        <div class="client-info__actions">
          <button id="downloadAll" class="client-download-btn">
            <span>Скачать все фотографии</span>
          </button>
        </div>
        <?php endif; ?>
      </div>
      
    </div>
  </section>

  <!-- галерея фотографий -->
  <section class="client-gallery">
    <div class="client-gallery__container">
      
      <?php if (!empty($photos)): ?>
      <div class="client-gallery__grid" id="clientPhotosGrid">
        <?php foreach ($photos as $index => $photo): ?>
        <div class="client-photo-item" data-index="<?php echo $index; ?>">
          <img src="<?php echo esc_url($photo['url']); ?>" 
               alt="<?php echo esc_attr($photo['original_name']); ?>" 
               loading="lazy">
          
          <?php if ($page_data->enable_download): ?>
          <div class="client-photo-overlay">
            <button class="client-photo-download" data-url="<?php echo esc_url($photo['url']); ?>">
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
          </div>
          <?php endif; ?>
        </div>
        <?php endforeach; ?>
      </div>
      <?php else: ?>
      <div class="client-gallery__empty">
        <p>Фотографии пока не загружены</p>
      </div>
      <?php endif; ?>
      
    </div>
  </section>

  <!-- лайтбокс для просмотра -->
  <div id="lightbox" class="lightbox" style="display: none;">
    <div class="lightbox__overlay"></div>
    <div class="lightbox__content">
      <img id="lightboxImage" src="" alt="">
      <button id="lightboxClose" class="lightbox__close">×</button>
      <button id="lightboxPrev" class="lightbox__nav lightbox__nav--prev">‹</button>
      <button id="lightboxNext" class="lightbox__nav lightbox__nav--next">›</button>
    </div>
  </div>

</main>

<style>
/* ==================== CLIENT PAGE STYLES ========================= */
.client-page {
  margin-left: var(--sidebar-w);
  background: #fff;
}

.client-info {
  padding: 6vw 5vw 4vw;
  background: #f8f8f8;
}

.client-info__container {
  max-width: 1200px;
  margin: 0 auto;
}

.client-info__title {
  font: clamp(28px, 4vw, 48px) / 1.2 "Geometria", sans-serif;
  letter-spacing: 2px;
  margin-bottom: 2rem;
  color: #000;
}

.client-info__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.client-info__item {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.client-info__label {
  display: block;
  font: 12px/1 "Geometria", sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.5rem;
}

.client-info__value {
  font: 16px/1.2 "Geometria", sans-serif;
  color: #000;
  font-weight: 500;
}

.client-info__description {
  font: 16px/1.6 "Geometria", sans-serif;
  color: #666;
  margin-bottom: 2rem;
  max-width: 600px;
}

.client-download-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #000, #333);
  color: #fff;
  border: none;
  border-radius: 8px;
  font: 12px/1 "Geometria", sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.client-download-btn:hover {
  background: linear-gradient(135deg, #333, #555);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.client-download-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.client-download-btn:disabled:hover {
  background: #ccc;
  transform: none;
  box-shadow: none;
}

/* Анимация загрузки */
.client-download-btn:disabled::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid transparent;
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.client-gallery {
  padding: 4vw 5vw 6vw;
}

.client-gallery__container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ==================== ИСПРАВЛЕННАЯ СЕТКА ========================= */
.client-gallery__grid {
  columns: 3;
  column-gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.client-photo-item {
  display: inline-block;
  width: 100%;
  margin-bottom: 20px;
  break-inside: avoid;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.client-photo-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.client-photo-item img {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.3s ease;
}

.client-photo-item:hover img {
  transform: scale(1.02);
}

/* ИСПРАВЛЕННЫЙ OVERLAY */
.client-photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.client-photo-item:hover .client-photo-overlay {
  opacity: 1;
}

.client-photo-download {
  width: 56px;
  height: 56px;
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.client-photo-download:hover {
  background: #000;
  color: #fff;
  transform: scale(1.1);
}

.client-photo-download svg {
  width: 24px;
  height: 24px;
}

.client-gallery__empty {
  column-span: all;
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  font-size: 1.2em;
}

/* ==================== ИСПРАВЛЕННЫЙ ЛАЙТБОКС ====================== */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 60px;
}

.lightbox.active {
  display: flex;
}

.lightbox__overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
}

.lightbox__content {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.lightbox__content img {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.lightbox__close,
.lightbox__nav {
  position: fixed;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10001;
}

.lightbox__close {
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 24px;
}

.lightbox__nav {
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 28px;
}

.lightbox__nav--prev {
  left: 32px;
}

.lightbox__nav--next {
  right: 32px;
}

.lightbox__close:hover,
.lightbox__nav:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-50%) scale(1.1);
}

.lightbox__close:hover {
  transform: scale(1.1);
}

.client-footer {
  background: #f8f8f8;
  padding: 2rem 5vw;
  text-align: center;
  color: #666;
  font-size: 0.9em;
  line-height: 1.6;
}

/* ==================== АДАПТИВНОСТЬ КАК В ПОРТФОЛИО =============== */
@media (max-width: 1200px) {
  .client-gallery__grid {
    columns: 2;
    column-gap: 16px;
  }
}

@media (max-width: 899px) {
  .client-page {
    margin-left: 0;
  }
  
  .client-info {
    padding-top: calc(var(--topbar-h) + 4vw);
  }
  
  .client-gallery__grid {
    columns: 2;
    column-gap: 12px;
  }
  
  .lightbox {
    padding: 40px 20px;
  }
  
  .lightbox__content img {
    max-width: 85vw;
    max-height: 75vh;
  }
  
  .lightbox__close {
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .lightbox__nav {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
  
  .lightbox__nav--prev {
    left: 20px;
  }
  
  .lightbox__nav--next {
    right: 20px;
  }
}

@media (max-width: 600px) {
  .client-gallery__grid {
    columns: 1;
    column-gap: 0;
  }
  
  .client-info__meta {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .lightbox {
    padding: 20px 10px;
  }
  
  .lightbox__content img {
    max-width: 90vw;
    max-height: 70vh;
  }
  
  .lightbox__close {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .lightbox__nav {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .lightbox__nav--prev {
    left: 10px;
  }
  
  .lightbox__nav--next {
    right: 10px;
  }
}

@media (max-width: 480px) {
  .client-photo-download {
    width: 48px;
    height: 48px;
  }
  
  .client-photo-download svg {
    width: 20px;
    height: 20px;
  }
}
</style>


<script>
// Передаем данные фотографий в JavaScript
window.clientPhotos = <?php echo json_encode($photos); ?>;
window.clientPageUrl = '<?php echo esc_js($client_page_url); ?>';
window.ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';

document.addEventListener('DOMContentLoaded', function() {
    const photos = window.clientPhotos || [];
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const photoItems = document.querySelectorAll('.client-photo-item');
    let currentIndex = 0;
    
    // Открытие лайтбокса
    photoItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.client-photo-download')) {
                openLightbox(index);
            }
        });
    });
    
    function openLightbox(index) {
        currentIndex = index;
        if (photos[index]) {
            lightboxImage.src = photos[index].url;
            lightbox.classList.add('active');
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    function nextPhoto() {
        currentIndex = (currentIndex + 1) % photos.length;
        openLightbox(currentIndex);
    }
    
    function prevPhoto() {
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        openLightbox(currentIndex);
    }
    
    // События лайтбокса
    if (document.getElementById('lightboxClose')) {
        document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    }
    if (document.getElementById('lightboxNext')) {
        document.getElementById('lightboxNext').addEventListener('click', nextPhoto);
    }
    if (document.getElementById('lightboxPrev')) {
        document.getElementById('lightboxPrev').addEventListener('click', prevPhoto);
    }
    
    const overlay = lightbox.querySelector('.lightbox__overlay');
    if (overlay) {
        overlay.addEventListener('click', closeLightbox);
    }
    
    // Клавиатурное управление
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        }
    });
    
    // ИСПРАВЛЕННАЯ функция скачивания отдельных фотографий
    document.querySelectorAll('.client-photo-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const photoIndex = parseInt(btn.closest('.client-photo-item').getAttribute('data-index'));
            const photo = photos[photoIndex];
            
            if (photo) {
                downloadSinglePhoto(photo.url);
            }
        });
    });
    
    // Функция скачивания одной фотографии через сервер
    function downloadSinglePhoto(photoUrl) {
        const downloadUrl = window.ajaxUrl + 
            '?action=download_single_photo' +
            '&photo_url=' + encodeURIComponent(photoUrl) +
            '&page_url=' + encodeURIComponent(window.clientPageUrl);
        
        // Создаем скрытый iframe для скачивания
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);
        
        // Удаляем iframe через 5 секунд
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 5000);
        
        showDownloadNotification('Скачивание началось!');
    }
    
    // Скачивание всех фотографий как ZIP
    const downloadAllBtn = document.getElementById('downloadAll');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadAllPhotosAsZip);
    }
    
    function downloadAllPhotosAsZip() {
        if (photos.length === 0) {
            showDownloadNotification('Нет фотографий для скачивания', 'error');
            return;
        }
        
        downloadAllBtn.disabled = true;
        downloadAllBtn.innerHTML = '<span>Создание архива...</span>';
        
        const downloadUrl = window.ajaxUrl + 
            '?action=download_client_photos_zip' +
            '&page_url=' + encodeURIComponent(window.clientPageUrl);
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            document.body.removeChild(iframe);
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = '<span>Скачать все фотографии</span>';
        }, 5000);
        
        showDownloadNotification('Архив создается, скачивание начнется автоматически...');
    }
    
    // Функция показа уведомлений
    function showDownloadNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `download-notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-family: "Geometria", sans-serif;
            font-size: 14px;
            z-index: 10002;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
});
</script>




<?php get_footer(); ?>

</body>
</html>