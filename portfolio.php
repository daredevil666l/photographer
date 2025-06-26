<?php
/**
* Template Name: portfolio
*/
get_header();

// Получаем данные для фильтров
global $wpdb;
$categories_table = $wpdb->prefix . 'portfolio_categories';
$photos_table = $wpdb->prefix . 'portfolio_photos';

$categories = $wpdb->get_results("SELECT * FROM $categories_table ORDER BY name ASC");
$years = $wpdb->get_col("SELECT DISTINCT year FROM $photos_table WHERE year > 0 ORDER BY year DESC");
?>

<!-- ====== БЛОК PORTFOLIO ============================================ -->
<main class="portfolio">
  <h1 class="portfolio-head">ПОРТФОЛИО</h1>

  <!-- блок фильтрации -->
  <div class="portfolio-filters">
    <div class="portfolio-filters__container">
      <!-- фильтр по категориям -->
      <div class="portfolio-filters__section">
        <h3 class="portfolio-filters__title">Фильтр по категории:</h3>
        <div class="portfolio-filters__buttons" id="categoryFilters">
          <button class="filter-btn active" data-category="">Все</button>
          <?php foreach ($categories as $category): ?>
            <button class="filter-btn" data-category="<?php echo $category->id; ?>">
              <?php echo esc_html($category->name); ?>
            </button>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- фильтр по годам -->
      <div class="portfolio-filters__section">
        <h3 class="portfolio-filters__title">Фильтр по году:</h3>
        <div class="portfolio-filters__buttons" id="yearFilters">
          <button class="filter-btn active" data-year="">Все</button>
          <?php foreach ($years as $year): ?>
            <button class="filter-btn" data-year="<?php echo $year; ?>">
              <?php echo $year; ?>
            </button>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </div>

  <!-- контейнер-«водопад» -->
  <div id="gallery" class="gallery"></div>

  <!-- индикатор подгрузки -->
  <div id="loader" class="loader" aria-hidden="true"></div>
</main>

<script>
// Передаем данные в JavaScript
window.portfolioData = {
    ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
    nonce: '<?php echo wp_create_nonce('portfolio_nonce'); ?>'
};
</script>

<?php wp_footer();?>
<?php get_footer();?>

<!-- бургер / overlay -->
<script src="<?php echo get_stylesheet_directory_uri();?>/js/portfolio.js" defer></script>
</body>
</html>
