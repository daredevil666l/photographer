<?php
/**
 * Template Name: blog
 */
get_header();
?>

<!-- =================== КОНТЕНТ СТРАНИЦЫ =================== -->
<main class="blog-page">
  <div class="blog-page__container">
    <h1 class="blog-page__title">БЛОГ</h1>

    <!-- фильтры и поиск -->
    <section class="blog-filters">
      <div class="blog-filters__container">
        <div class="blog-filters__search">
          <form role="search" method="get" action="<?php echo home_url('/'); ?>">
            <input type="search" name="s" placeholder="Поиск по блогу..." value="<?php echo get_search_query(); ?>">
            <input type="hidden" name="post_type" value="post">
            <button type="submit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>
        </div>
        
        <div class="blog-filters__categories">
          <select id="categoryFilter" onchange="filterByCategory(this.value)">
            <option value="">Все категории</option>
            <?php
            $categories = get_categories();
            foreach ($categories as $category) {
              echo '<option value="' . $category->slug . '">' . $category->name . '</option>';
            }
            ?>
          </select>
        </div>
      </div>
    </section>

    <!-- сетка постов -->
    <section class="blog-posts">
      <div class="blog-posts__grid" id="blogGrid">
        <?php
        $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
        $blog_query = new WP_Query([
          'post_type' => 'post',
          'posts_per_page' => 9,
          'paged' => $paged,
          'post_status' => 'publish'
        ]);

        if ($blog_query->have_posts()) :
          while ($blog_query->have_posts()) : $blog_query->the_post();
            get_template_part('template-parts/blog-card');
          endwhile;
        else :
          echo '<div class="no-posts">Записи не найдены</div>';
        endif;
        wp_reset_postdata();
        ?>
      </div>

      <!-- пагинация -->
      <div class="blog-pagination">
        <?php
        echo paginate_links([
          'total' => $blog_query->max_num_pages,
          'current' => $paged,
          'prev_text' => '←',
          'next_text' => '→',
          'type' => 'list'
        ]);
        ?>
      </div>
    </section>
  </div>
</main>

<script>
// Фильтрация по категориям
function filterByCategory(categorySlug) {
  if (categorySlug) {
    window.location.href = '<?php echo home_url('/category/'); ?>' + categorySlug + '/';
  } else {
    window.location.href = '<?php echo get_permalink(); ?>';
  }
}
</script>

<?php wp_footer(); ?>
<?php get_footer(); ?>
</body>
</html>
