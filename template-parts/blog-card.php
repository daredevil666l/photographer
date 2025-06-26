<article class="blog-card">
  <a href="<?php the_permalink(); ?>" class="blog-card__link">
    <?php if (has_post_thumbnail()) : ?>
      <div class="blog-card__image">
        <?php the_post_thumbnail('medium_large'); ?>
      </div>
    <?php endif; ?>
    
    <div class="blog-card__content">
      <div class="blog-card__meta">
        <time datetime="<?php echo get_the_date('c'); ?>" class="blog-card__date">
          <?php echo get_the_date('d.m.Y'); ?>
        </time>
        
        <?php
        $categories = get_the_category();
        if (!empty($categories)) :
        ?>
          <span class="blog-card__category">
            <?php echo esc_html($categories[0]->name); ?>
          </span>
        <?php endif; ?>
      </div>
      
      <h2 class="blog-card__title"><?php the_title(); ?></h2>
      
      <div class="blog-card__excerpt">
        <?php echo wp_trim_words(get_the_excerpt(), 20, '...'); ?>
      </div>
      
      <div class="blog-card__footer">
        <span class="blog-card__read-more">Читать далее</span>
        <span class="blog-card__reading-time">
          <?php echo reading_time(); ?> мин
        </span>
      </div>
    </div>
  </a>
</article>
