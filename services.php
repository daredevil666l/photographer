    <?php
    /**
    * Template Name: services
    */
    get_header();
    ?>

    <!-- =================== КОНТЕНТ СТРАНИЦЫ =================== -->
    <main class="services-page">
      <div class="services-page__container">
        <h1 class="services-page__title">УСЛУГИ</h1>

        <!-- здесь будут добавляться блоки контента -->
        <!-- контент страницы услуг -->
        <div class="services-page__content">
          <!-- сетка карточек услуг -->
          <div class="services-grid" id="servicesGrid">
            <!-- карточки будут загружены через JavaScript -->
          </div>
        </div>

        <!-- модальное окно для детальной информации об услуге -->
        <div id="serviceModal" class="service-modal">
          <div class="service-modal__overlay"></div>
          <div class="service-modal__content">
            <button class="service-modal__close">&times;</button>

            <div class="service-modal__header">
              <img class="service-modal__image" src="" alt="" />
              <div class="service-modal__info">
                <h2 class="service-modal__title"></h2>
                <div class="service-modal__price"></div>
              </div>
            </div>

            <div class="service-modal__body">
              <p class="service-modal__description"></p>
              <ul class="service-modal__features"></ul>
            </div>

            <div class="service-modal__footer">
              <a href="<?php echo get_page_link(15);?>" class="service-modal__book-btn">
                <span>Записаться на съёмку</span>
              </a>
            </div>
          </div>
        </div>

        <div class="services-page__content">
          <!-- контент будет добавлен позже -->
        </div>
      </div>
    </main>

    <!-- подключение скриптов -->
    <?php wp_footer();?>
    <?php get_footer();?>

    <script src="<?php echo get_stylesheet_directory_uri();?>/js/services.js"></script>
    <!-- новый скрипт -->

    <script>
    // Передаем данные в JavaScript
    window.servicesData = {
        ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
        nonce: '<?php echo wp_create_nonce('services_nonce'); ?>'
    };
    </script>

  </body>
</html>
