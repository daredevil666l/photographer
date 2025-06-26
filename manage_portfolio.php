<?php
/**
* Template Name: edit-portfolio
*/

// Проверяем права доступа
if (!current_user_can('administrator')) {
    wp_redirect(home_url());
    exit;
}

get_header();

// Получаем категории для селекта
global $wpdb;
$categories_table = $wpdb->prefix . 'portfolio_categories';

// Проверяем, существует ли таблица
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$categories_table'") == $categories_table;

if (!$table_exists) {
    echo '<div style="padding: 50px; text-align: center;">';
    echo '<h2>Таблицы портфолио не найдены</h2>';
    echo '<p>Нажмите кнопку ниже для создания таблиц:</p>';
    echo '<a href="' . admin_url('themes.php?recreate_portfolio_tables=1') . '" class="button button-primary">Создать таблицы</a>';
    echo '</div>';
    get_footer();
    exit;
}

$categories = $wpdb->get_results("SELECT * FROM $categories_table ORDER BY name ASC");
?>

<!-- =================== УПРАВЛЕНИЕ ПОРТФОЛИО =================== -->
<main class="admin">
  <div class="admin__container">
    <h1 class="admin__title">Управление портфолио</h1>

    <!-- блок управления категориями -->
    <section class="admin__categories">
      <h2 class="admin__section-title">Управление категориями</h2>
      
      <div class="category-management">
        <div class="category-form">
          <div class="category-form__input-group">
            <input type="text" id="newCategoryName" placeholder="Название новой категории" class="category-form__input">
            <button id="addCategoryBtn" class="category-form__btn">
              <span>Добавить категорию</span>
            </button>
          </div>
        </div>
        
        <div class="categories-display">
          <h3 class="categories-display__title">Существующие категории:</h3>
          <div id="categoriesList" class="categories-list">
            <!-- будет заполнен через JavaScript -->
          </div>
        </div>
      </div>
    </section>

    <!-- блок загрузки новых фото -->
    <section class="admin__upload">
      <h2 class="admin__section-title">Загрузить новые фотографии</h2>

      <form id="uploadForm" class="upload-form" enctype="multipart/form-data">
        <!-- выбор файлов -->
        <div class="upload-zone" id="uploadZone">
          <input type="file" id="fileInput" multiple accept="image/*" hidden />
          <div class="upload-content">
            <svg class="upload-icon" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2" />
              <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
              <polyline points="10,9 9,9 8,9" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
            <p>Нажмите или перетащите файлы сюда</p>
            <span>Поддерживаются: JPG, PNG, WebP</span>
          </div>
        </div>

        <!-- обновленный блок превью выбранных файлов -->
        <div id="filePreview" class="file-preview"></div>

        <!-- кнопка загрузки -->
        <button type="submit" class="admin__btn" id="uploadBtn" disabled>
          <span>Загрузить фотографии</span>
        </button>
      </form>
    </section>

    <!-- блок управления существующими фото -->
    <section class="admin__manage">
      <h2 class="admin__section-title">Управление фотографиями</h2>

      <!-- поиск и фильтры -->
      <div class="admin__filters">
        <input type="text" id="searchInput" placeholder="Поиск по названию..." class="admin__search" />
        <select id="categoryFilter" class="admin__select">
          <option value="">Все категории</option>
          <?php foreach ($categories as $category): ?>
            <option value="<?php echo $category->id; ?>">
              <?php echo esc_html($category->name); ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <!-- список фотографий -->
      <div id="photosList" class="photos-list">
        <!-- будет заполнен через JavaScript -->
      </div>

      <!-- статус загрузки -->
      <div id="loadingStatus" class="loading-status">Загружается...</div>
    </section>
  </div>
</main>

<script>
// Передаем данные в JavaScript
window.adminData = {
    ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
    nonce: '<?php echo wp_create_nonce('portfolio_nonce'); ?>',
    categories: <?php echo json_encode($categories); ?>
};
</script>

<?php wp_footer();?>
<?php get_footer();?>

<!-- уведомления -->
<div id="notifications" class="notifications"></div>

<script src="<?php echo get_stylesheet_directory_uri();?>/js/admin.js"></script>
</body>
</html>
