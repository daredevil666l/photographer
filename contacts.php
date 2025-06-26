    <?php
    /**
    * Template Name: contacts
    */
    get_header();
    ?>

    <!-- =================== КОНТЕНТ СТРАНИЦЫ =================== -->
    <main class="contacts-page">
      <div class="contacts-page__container">
        <h1 class="contacts-page__title">КОНТАКТЫ</h1>

        <!-- здесь будут добавляться блоки контента -->
        <!-- основной контактный блок -->
        <section class="contacts-main">
          <div class="contacts-main__grid">
            <!-- левая колонка с контактной информацией -->
            <div class="contacts-main__info">
              <p class="contacts-main__intro">
                Если у вас есть индивидуальный запрос или другой вопрос,
                оставьте информацию ниже или свяжитесь со мной любым удобным
                способом.
              </p>

              <div class="contacts-main__item">
                <span class="contacts-main__label">EMAIL</span>
                <a
                  href="mailto:hello@kavramenko.ru"
                  class="contacts-main__email"
                >
                  hello@kavramenko.ru
                </a>
              </div>

              <div class="contacts-main__item">
                <span class="contacts-main__label">СОЦИАЛЬНЫЕ СЕТИ</span>
                <div class="contacts-main__social">
                  <!-- Telegram -->
                  <a href="#" class="social-link" aria-label="Telegram">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M9.6 12.8l-.4 5.1c.6 0 .9-.2 1.3-.6l3.1-2.9 6.4 4.7c1.2.6 2 .3 2.3-1.1L23.9 3c.4-1.6-.6-2.3-2-1.9L1.8 9C.3 9.6.3 10.4 1.6 10.8l5.3 1.7 12.2-7.7c.6-.4 1.1-.1.7.3L9.6 12.8z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <!-- Instagram -->
                  <a href="#" class="social-link" aria-label="Instagram">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5A5.5 5.5 0 1 0 17.5 13 5.5 5.5 0 0 0 12 7.5zm6.2-.9a1.3 1.3 0 1 0-1.3-1.3 1.3 1.3 0 0 0 1.3 1.3zM12 9a4 4 0 1 1-4 4 4 4 0 0 1 4-4z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- правая колонка с формой -->
            <form class="contacts-main__form" id="contactForm" method="POST" action="<?php echo get_stylesheet_directory_uri();?>/send_email.php">
              <div class="form-field">
                <label>Имя *</label>
                <input type="text" name="name" required />
              </div>

              <div class="form-field">
                <label>E-mail *</label>
                <input type="email" name="email" required />
              </div>

              <div class="form-field form-field--textarea">
                <label>Сообщение</label>
                <textarea name="message" rows="6"></textarea>
              </div>

              <button type="submit" class="contacts-main__btn">
                <span>ОТПРАВИТЬ</span>
              </button>

              <p class="contacts-main__note">
                Пожалуйста, убедитесь, что после нажатия на кнопку «отправить»,
                на этой странице появилось сообщение, подтверждающее успешную
                отправку формы. Поля, отмеченные звёздочкой, обязательны для
                заполнения.
              </p>
            </form>
          </div>
        </section>

        <div class="contacts-page__content">
          <!-- контент будет добавлен позже -->
        </div>
      </div>
    </main>

    <?php wp_footer();?>
    <?php get_footer();?>
    
    <script>
    
    // Система уведомлений (Toast)
    class ToastNotification {
        constructor() {
            this.container = null;
            this.createContainer();
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }

        show(message, type = 'success', duration = 5000) {
            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            
            const icon = type === 'success' ? '✓' : '✕';
            
            toast.innerHTML = `
                <div class="toast__icon">${icon}</div>
                <div class="toast__message">${message}</div>
                <button class="toast__close" onclick="this.parentElement.remove()">×</button>
            `;

            this.container.appendChild(toast);

            // Анимация появления
            setTimeout(() => toast.classList.add('toast--show'), 100);

            // Автоматическое скрытие
            setTimeout(() => {
                toast.classList.remove('toast--show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    // Инициализация системы уведомлений
    const toast = new ToastNotification();

    // Обработка контактной формы
    document.addEventListener('DOMContentLoaded', function() {
        const contactForm = document.getElementById('contactForm');
        
        if (!contactForm) return;

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('span');
            const originalText = btnText.textContent;
            
            // Блокируем кнопку и показываем загрузку
            submitBtn.disabled = true;
            btnText.textContent = 'ОТПРАВКА...';
            submitBtn.classList.add('loading');

            // Собираем данные формы
            const formData = new FormData(contactForm);

            // Отправляем запрос
            fetch(contactForm.action || '<?php echo get_stylesheet_directory_uri();?>/send_email.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка сети');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Успешная отправка
                    toast.show(data.success, 'success');
                    contactForm.reset();
                } else if (data.error) {
                    // Ошибка валидации или отправки
                    toast.show(data.error, 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                toast.show('Произошла ошибка при отправке сообщения. Попробуйте позже.', 'error');
            })
            .finally(() => {
                // Разблокируем кнопку
                submitBtn.disabled = false;
                btnText.textContent = originalText;
                submitBtn.classList.remove('loading');
            });
        });
    });

    </script>

  </body>
</html>
