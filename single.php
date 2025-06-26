<?php get_header(); ?>

<main class="blog-post">
  <div class="blog-post__container">
    <?php while (have_posts()) : the_post(); ?>
      
      <!-- хлебные крошки -->
      <nav class="blog-breadcrumbs">
        <a href="<?php echo home_url(); ?>">Главная</a>
        <span>/</span>
        <a href="<?php echo get_permalink(get_page_by_path('blog')); ?>">Блог</a>
        <span>/</span>
        <span><?php the_title(); ?></span>
      </nav>

      <article class="blog-post__article">
        <!-- заголовок и мета -->
        <header class="blog-post__header">
          <?php if (has_post_thumbnail()) : ?>
            <div class="blog-post__featured-image">
              <?php the_post_thumbnail('full'); ?>
            </div>
          <?php endif; ?>
          
          <div class="blog-post__meta">
            <time datetime="<?php echo get_the_date('c'); ?>" class="blog-post__date">
              <?php echo get_the_date('d F Y'); ?>
            </time>
            
            <?php
            $categories = get_the_category();
            if (!empty($categories)) :
            ?>
              <div class="blog-post__categories">
                <?php foreach ($categories as $category) : ?>
                  <a href="<?php echo get_category_link($category->term_id); ?>" class="blog-post__category">
                    <?php echo esc_html($category->name); ?>
                  </a>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
            
            <span class="blog-post__reading-time">
              Время чтения: <?php echo reading_time(); ?> мин
            </span>
          </div>
          
          <h1 class="blog-post__title"><?php the_title(); ?></h1>
        </header>

        <!-- содержимое поста -->
        <div class="blog-post__content">
          <?php the_content(); ?>
        </div>

        <!-- теги -->
        <?php
        $tags = get_the_tags();
        if ($tags) :
        ?>
          <footer class="blog-post__tags">
            <h3>Теги:</h3>
            <div class="blog-post__tags-list">
              <?php foreach ($tags as $tag) : ?>
                <a href="<?php echo get_tag_link($tag->term_id); ?>" class="blog-post__tag">
                  #<?php echo esc_html($tag->name); ?>
                </a>
              <?php endforeach; ?>
            </div>
          </footer>
        <?php endif; ?>
      </article>

      <!-- навигация между постами -->
      <nav class="blog-post__navigation">
        <div class="blog-post__nav-prev">
          <?php
          $prev_post = get_previous_post();
          if ($prev_post) :
          ?>
            <a href="<?php echo get_permalink($prev_post); ?>">
              <span class="nav-label">← Предыдущая статья</span>
              <span class="nav-title"><?php echo get_the_title($prev_post); ?></span>
            </a>
          <?php endif; ?>
        </div>
        
        <div class="blog-post__nav-next">
          <?php
          $next_post = get_next_post();
          if ($next_post) :
          ?>
            <a href="<?php echo get_permalink($next_post); ?>">
              <span class="nav-label">Следующая статья →</span>
              <span class="nav-title"><?php echo get_the_title($next_post); ?></span>
            </a>
          <?php endif; ?>
        </div>
      </nav>

    <?php endwhile; ?>
  </div>
</main>

<?php wp_footer(); ?>
<?php get_footer(); ?>
</body>
</html>
