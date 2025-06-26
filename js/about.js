/* ==========================================
   Загрузка отзывов из базы данных (исправленная версия)
   ========================================== */

class AboutReviews {
  constructor() {
    this.reviewsGrid = document.getElementById('reviewsGrid');
    this.init();
  }
  
  async init() {
    if (!window.aboutData) {
      console.error('About data не загружены');
      return;
    }
    
    await this.loadReviews();
  }
  
  async loadReviews() {
    try {
      const response = await fetch(window.aboutData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get_reviews'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.renderReviews(result.reviews);
      } else {
        throw new Error(result.error || 'Ошибка загрузки отзывов');
      }
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
      this.showError();
    }
  }
  
  renderReviews(reviews) {
    if (!this.reviewsGrid) return;
    
    this.reviewsGrid.innerHTML = '';
    
    if (reviews.length === 0) {
      this.reviewsGrid.innerHTML = '<p class="no-reviews">Отзывы пока отсутствуют</p>';
      return;
    }
    
    reviews.forEach((review) => {
      const reviewItem = document.createElement('div');
      reviewItem.className = 'review-item';
      
      // Создаем элементы отдельно для лучшего контроля
      const authorDiv = document.createElement('div');
      authorDiv.className = 'review-item__author';
      authorDiv.textContent = review.author;
      
      const textDiv = document.createElement('div');
      textDiv.className = 'review-item__text';
      
      // ИСПРАВЛЕННАЯ обработка текста
      let cleanText = review.text;
      
      // Убираем все варианты экранированных переносов
      cleanText = cleanText.replace(/\\n/g, '\n');  // \\n -> \n
      cleanText = cleanText.replace(/\\\\/g, '');   // \\ -> пустота
      cleanText = cleanText.replace(/\\\n/g, '\n'); // \n -> \n
      
      // Разбиваем на параграфы
      const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
      
      paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        
        // Убираем оставшиеся одинарные слеши
        const cleanParagraph = paragraph.replace(/\\/g, '');
        
        // Заменяем одинарные переносы на <br>
        const lines = cleanParagraph.split('\n');
        
        lines.forEach((line, index) => {
          if (index > 0) {
            p.appendChild(document.createElement('br'));
          }
          
          // Разбиваем строку на части с эмодзи
          const parts = line.split(/(❤️|💕|✨|😊|👶|📸)/);
          
          parts.forEach(part => {
            if (/❤️|💕|✨|😊|👶|📸/.test(part)) {
              const span = document.createElement('span');
              span.className = 'emoji';
              span.textContent = part;
              p.appendChild(span);
            } else if (part.trim()) {
              p.appendChild(document.createTextNode(part));
            }
          });
        });
        
        textDiv.appendChild(p);
      });
      
      reviewItem.appendChild(authorDiv);
      reviewItem.appendChild(textDiv);
      this.reviewsGrid.appendChild(reviewItem);
    });
  }
  
  showError() {
    if (this.reviewsGrid) {
      this.reviewsGrid.innerHTML = '<p class="reviews-error">Ошибка загрузки отзывов</p>';
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.about-reviews')) {
    new AboutReviews();
  }
});
