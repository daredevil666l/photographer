<?php
/**
* Template Name: about
*/
get_header();
?>

<!-- =================== КОНТЕНТ СТРАНИЦЫ =================== -->
<main class="about-page">
  <div class="about-page__container">
    <div class="portfolio">
      <h1 class="portfolio-head">ОБО МНЕ</h1>

      <section class="about-hero">
        <div class="about-hero__grid">
          <!-- левая колонка с текстом -->
          <div class="about-hero__text">
            <div class="about-hero__header">
              <small class="about-hero__label">ОБО МНЕ</small>
              <div class="about-hero__divider"></div>
              <h2 class="about-hero__name">ЕКАТЕРИНА АВРАМЕНКО</h2>
              <span class="about-hero__role">ФОТОГРАФ</span>
            </div>

            <div class="about-hero__description">
              <p>
                Привет, я Катя. Жизнь — это путь. Фотография — это часть
                моего пути, по которому я иду уже более 14 лет. Я снимаю то,
                что сама очень люблю и из чего состоит моя жизнь: семья,
                дети, любовь, еда и кафе, прогулки, город. Во всех этих
                жанрах не придуманной фотографии, я вижу простые "радости
                жизни" и звенящую хрупкость момента, который невозможно
                остановить, но который можно запомнить, если вовремя нажать
                на кнопку. Чувство, скорость, предчувствие наступления
                события и способность его угадать — помогают мне в этом.
              </p>
            </div>
          </div>

          <!-- правая колонка с фотографией -->
          <div class="about-hero__photo">
            <img src="<?php echo get_stylesheet_directory_uri();?>/img/woman.jpg" alt="Екатерина Авраменко" />
          </div>
        </div>
      </section>

      <section class="about-stats about-stats--full">
        <div class="about-stats__container">
          <div class="about-stats__title">НЕМНОГО ЦИФР:</div>
          <ul class="about-stats__list">
            <li>
              <b>14 лет фотография</b> — это моё основное занятие и
              профессия, но интерес к ней появился в глубоком детстве.
              Журнальные съёмки, портреты, свадьбы, семьи.
            </li>
            <li>
              Более <b>30 публикаций</b> в профильных изданиях, интервью и
              лекций.
            </li>
            <li>Более <b>1000 проведённых съёмок</b>.</li>
            <li>
              <b>Больше половины</b> моих клиентов ежегодно возвращаются ко
              мне.
            </li>
            <li>
              А для некоторых семей, я провела уже <b>более 15 съёмок</b>,
              каждый год пополняя их семейный фотоархив.
            </li>
          </ul>
        </div>
      </section>

      <!-- блок отзывов клиентов -->
      <section class="about-reviews">
        <div class="about-reviews__container">
          <h2 class="about-reviews__title">КЛИЕНТЫ ОБО МНЕ</h2>

          <div class="about-reviews__grid" id="reviewsGrid">
            <!-- отзывы будут загружены через JavaScript -->
            <div class="reviews-loader">Загрузка отзывов...</div>
          </div>
        </div>
      </section>

      <!-- философский блок-заключение -->
      <section class="about-philosophy">
        <div class="about-philosophy__container">
          <div class="about-philosophy__grid">
            <!-- левая колонка с фотографией -->
            <div class="about-philosophy__image">
              <img src="<?php echo get_stylesheet_directory_uri();?>/img/img1.jpg" alt="Философия фотографии" />
            </div>

            <!-- правая колонка с текстом -->
            <div class="about-philosophy__content">
              <blockquote class="about-philosophy__quote">
                В ежедневно ускоряющемся жизненном потоке, возвращение к
                простым радостям — это единственный способ прожить счастливо
                день, год и всю жизнь.
              </blockquote>

              <p class="about-philosophy__text">
                Буду рада разделить их вместе с вами и отразить вас в
                состоянии счастья, на долгую память для вас и ваших детей.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="about-page__content">
      <!-- дополнительный контент -->
    </div>
  </div>
</main>

<script>
// Передаем данные в JavaScript
window.aboutData = {
    ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
    nonce: '<?php echo wp_create_nonce('about_nonce'); ?>'
};
</script>

<?php wp_footer();?>
<?php get_footer();?>

<script src="<?php echo get_stylesheet_directory_uri();?>/js/about.js"></script>
</body>
</html>
