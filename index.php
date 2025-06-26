    <?php
    /**
    * Template Name: home
    */
    get_header();
    ?>
    <!-- HERO / СЛАЙД-ШОУ ------------------------------------------------------>
    <section class="hero">
      <ul class="slides">
        <li style="background-image: url(<?php echo get_stylesheet_directory_uri();?>/img/img1.jpg)"></li>
        <li style="background-image: url(<?php echo get_stylesheet_directory_uri();?>/img/img2.jpg)"></li>
        <li style="background-image: url(<?php echo get_stylesheet_directory_uri();?>/img/img3.jpg)"></li>
        <li style="background-image: url(<?php echo get_stylesheet_directory_uri();?>/img/img4.jpg)"></li>

        <!-- при желании добавляйте сколько угодно <li> -->
      </ul>

      <h2 class="hero-caption">ФОТОГРАФИЯ <span>как часть</span> ПУТИ</h2>
    </section>

        <!-- ABOUT ============================================================= -->
    <section class="about" id="about">
      <div class="about-grid">
        <!-- левая колонка (уменьшенная) -->
        <header class="about-head">
          <small class="about-label">ОБО МНЕ</small>
          <h2 class="about-title">ПРИВЕТ!<br />МЕНЯ<br />ЗОВУТ<br />КАТЯ.</h2>
        </header>

        <!-- центральная фотография (увеличенная) -->
        <div class="about-photo">
          <figure class="photo">
            <img src="<?php echo get_stylesheet_directory_uri();?>/img/woman.jpg" alt="Фотограф с камерой" data-parallax="cursor"/>
          </figure>
        </div>

        <!-- правая колонка (увеличенная) -->
        <div class="about-text">
          <p>
            Жизнь — это путь. Фотография — его важная часть, которой я посвящаю
            уже более 18 лет. Снимаю людей, семьи, город, уютные кафе — всё, что
            люблю.
          </p>
          <p>
            Во всех этих жанрах непридуманной фотографии я вижу простые "радости
            жизни" и звенящую хрупкость момента, который невозможно остановить,
            но который можно запомнить, если вовремя нажать на кнопку.
          </p>
          <button class="about-btn">УЗНАТЬ БОЛЬШЕ</button>
        </div>
      </div>
    </section>

    <!-- PORTFOLIO PREVIEW ================================================-->
<section class="portfolio-preview">
  <div class="portfolio-preview__container">
    <h2 class="portfolio-preview__title">ПОРТФОЛИО</h2>

    <!-- обёртка для fade-эффекта -->
    <div class="portfolio-preview__wrapper">
      <!-- masonry-сетка -->
      <div class="portfolio-preview__grid" id="previewGrid">
        <?php
        // Получаем последние 7 фотографий из портфолио
        global $wpdb;
        $photos_table = $wpdb->prefix . 'portfolio_photos';
        $categories_table = $wpdb->prefix . 'portfolio_categories';
        
        $latest_photos = $wpdb->get_results("
          SELECT p.*, c.name as category_name 
          FROM $photos_table p 
          LEFT JOIN $categories_table c ON p.category_id = c.id 
          ORDER BY p.created_at DESC 
          LIMIT 9
        ");
        
        if ($latest_photos): 
          foreach ($latest_photos as $index => $photo): ?>
            <div class="portfolio-preview__item" data-index="<?php echo $index; ?>">
              <img src="<?php echo esc_url($photo->file_url); ?>" 
                   alt="<?php echo esc_attr($photo->title); ?>" 
                   loading="lazy">
              <div class="portfolio-preview__overlay">
                <h3><?php echo esc_html($photo->title); ?></h3>
                <p><?php echo esc_html($photo->category_name); ?></p>
              </div>
            </div>
          <?php endforeach;
        else: ?>
          <div class="portfolio-preview__empty">
            <p>Портфолио скоро появится</p>
          </div>
        <?php endif; ?>
      </div>

      <!-- градиент-маска для fade-эффекта -->
      <div class="portfolio-preview__fade"></div>
    </div>

    <!-- кнопка перехода -->
    <a href="<?php echo get_page_link(13);?>" class="portfolio-preview__button">
      <span>Смотреть все фотографии</span>
    </a>
  </div>
</section>

<!-- лайтбокс для полноэкранного просмотра -->
<div id="portfolioLightbox" class="portfolio-lightbox">
  <div class="portfolio-lightbox__overlay"></div>
  <div class="portfolio-lightbox__content">
    <img id="lightboxImage" class="portfolio-lightbox__image" src="" alt="" />
    <div class="portfolio-lightbox__info">
      <h3 id="lightboxTitle"></h3>
      <p id="lightboxCategory"></p>
    </div>
    <button id="lightboxClose" class="portfolio-lightbox__close">×</button>
    <button id="lightboxPrev" class="portfolio-lightbox__nav portfolio-lightbox__nav--prev">‹</button>
    <button id="lightboxNext" class="portfolio-lightbox__nav portfolio-lightbox__nav--next">›</button>
  </div>
</div>

<script>
// Передаем данные фотографий в JavaScript
window.portfolioPreviewData = <?php echo json_encode($latest_photos); ?>;
</script>


    <!-- лайтбокс для полноэкранного просмотра -->
    <div id="portfolioLightbox" class="portfolio-lightbox">
      <div class="portfolio-lightbox__overlay"></div>
      <div class="portfolio-lightbox__content">
        <img
          id="lightboxImage"
          class="portfolio-lightbox__image"
          src=""
          alt=""
        />
        <button id="lightboxClose" class="portfolio-lightbox__close">×</button>
        <button
          id="lightboxPrev"
          class="portfolio-lightbox__nav portfolio-lightbox__nav--prev"
        >
          ‹
        </button>
        <button
          id="lightboxNext"
          class="portfolio-lightbox__nav portfolio-lightbox__nav--next"
        >
          ›
        </button>
      </div>
    </div>

    <!-- SALE / PRINTS ===================================================== -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.css"
    />

    <section class="sale" id="prints">
      <h2 class="sale__head">ПРОДАЖА РАБОТ</h2>

      <div class="sale__grid">
        <!-- левая текстовая колонка -->
        <div class="sale__text">
          <p>
            Ам Ням
          </p>
          <p>
            Прошло много лет, и сейчас это уже не просто привычка. Это моя
            философия и фундамент …
          </p>
          <p>
            Напечатанные работы похожи на портал в тот момент, когда они были
            сделаны.
          </p>
          <p>
            Я хочу, чтобы эти фотографии украшали ваши дома и любимые
            пространства …
          </p>

          <button class="sale__btn"><span>ПОСМОТРЕТЬ РАБОТЫ</span></button>
        </div>

        <!-- правая колонка: слайдер -->
        <div class="sale__slider swiper">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <img src="<?php echo get_stylesheet_directory_uri();?>/img/img1.jpg" alt="Фотография 1" />
            </div>

            <div class="swiper-slide">
              <img src="<?php echo get_stylesheet_directory_uri();?>/img/img2.jpg" alt="Фотография 2" />
            </div>

            <!-- добавляйте ещё слайды по той же схеме -->
          </div>

          <!-- стрелки -->
          <button class="sale-nav prev" aria-label="Предыдущий">
            <svg viewBox="0 0 24 24">
              <path
                d="M15 4l-8 8 8 8"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <button class="sale-nav next" aria-label="Следующий">
            <svg viewBox="0 0 24 24">
              <path
                d="M9 4l8 8-8 8"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- CONTACTS ========================================================== -->
    <section class="contacts" id="contacts">
      <h2 class="contacts__head">КОНТАКТЫ</h2>

      <div class="contacts__grid">
        <!-- левая колонка --------------------------------------------------->
        <div class="contacts__info">
          <p>
            Если у вас есть индивидуальный запрос или другой вопрос, оставьте
            информацию ниже или свяжитесь со мной любым удобным способом.
          </p>

          <div class="contacts__item">
            <span class="contacts__label">E-MAIL</span>
            <a href="mailto:hello@kavramenko.ru" class="contacts__mail">
              hello@kavramenko.ru
            </a>
          </div>

          <div class="contacts__item">
            <span class="contacts__label">СОЦИАЛЬНЫЕ СЕТИ</span>
            <div class="contacts__social">
              <!-- Telegram -->
              <a href="#" class="social-link" aria-label="Telegram">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M9.6 12.8l-.4 5.1c.6 0 .9-.2 1.3-.6l3.1-2.9 6.4 4.7c1.2.6 2 .3 2.3-1.1L23.9 3c.4-1.6-.6-2.3-2-1.9L1.8 9C.3 9.6.3 10.4 1.6 10.8l5.3 1.7 12.2-7.7c.6-.4 1.1-.1.7.3L9.6 12.8z"
                    fill=""
                  />
                </svg>
              </a>
              <!-- Instagram -->
              <a href="#" class="social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5A5.5 5.5 0 1 0 17.5 13 5.5 5.5 0 0 0 12 7.5zm6.2-.9a1.3 1.3 0 1 0-1.3-1.3 1.3 1.3 0 0 0 1.3 1.3zM12 9a4 4 0 1 1-4 4 4 4 0 0 1 4-4z"
                    fill=""
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- правая колонка -------------------------------------------------->
        <form class="contacts__form" autocomplete="off">
          <div class="field">
            <label>Имя *</label>
            <input type="text" required />
          </div>

          <div class="field">
            <label>E-mail *</label>
            <input type="email" required />
          </div>

          <div class="field field--area">
            <label>Сообщение</label>
            <textarea rows="6"></textarea>
          </div>

          <button type="submit" class="contacts__btn">
            <span>ОТПРАВИТЬ</span>
          </button>

          <p class="contacts__note">
            Пожалуйста, убедитесь, что после нажатия на кнопку «отправить», на
            этой странице появилось сообщение, подтверждающее успешную отправку
            формы. Поля, отмеченные звёздочкой, обязательны для заполнения.
          </p>
        </form>
      </div>
    </section>

    <?php wp_footer();?>
    <?php get_footer();?>

  </body>
</html>
