const burger = document.getElementById("burger");
const overlay = document.getElementById("overlay");

function toggleMenu() {
  document.body.classList.toggle("menu-open");
}

burger.addEventListener("click", toggleMenu);
overlay.addEventListener("click", toggleMenu);

document.addEventListener("keyup", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
    toggleMenu();
  }
});

/* === Новое: выделяем пункт текущей страницы === */
function highlightCurrent() {
  const links = document.querySelectorAll(".menu a");
  const current = location.hash
    ? location.hash // одностраничный вариант
    : location.pathname.split("/").pop() || "index.html"; // многостраничный

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current || href === "#" + current.replace("#", "")) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", highlightCurrent);

/* берём все фотографии блока About */
const photos = document.querySelectorAll(".about-photos .photo");

if (photos.length) {
  /* движение учитываем по всей странице */
  window.addEventListener("mousemove", (e) => {
    const xNorm = (e.clientX / window.innerWidth - 0.5) * 2; // −1 … 1
    const yNorm = (e.clientY / window.innerHeight - 0.5) * 2;

    photos.forEach((ph, i) => {
      /* базовый радиус смещения (px) — поправьте на своё усмотрение */
      const base = 15; // «силу» эффекта регулируем здесь
      const k = i === 0 ? 1.3 : 1; // чуть разная амплитуда для кадров

      const tx = xNorm * base * k; // горизонталь
      const ty = yNorm * base * 0.6 * k; // вертикаль (поменьше)

      ph.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });

  /* при уходе курсора за окно возвращаем всё на место */
  window.addEventListener("mouseout", () =>
    photos.forEach((ph) => (ph.style.transform = ""))
  );
}

const slider = new Swiper(".sale__slider", {
  loop: true,
  speed: 600,
  navigation: {
    nextEl: ".sale-nav.next",
    prevEl: ".sale-nav.prev",
  },
  slidesPerView: 1,
  effect: "slide",
  grabCursor: true,
});

function setMasonryHeights() {
  // Применяем только к элементам с классом .portfolio-item, НЕ к .portfolio-preview__item
  const items = document.querySelectorAll(".portfolio-item:not(.portfolio-preview__item)");

  items.forEach((item) => {
    const img = item.querySelector("img");
    if (img && img.complete) {
      const ratio = img.naturalHeight / img.naturalWidth;
      const rowSpan = Math.ceil(ratio * 12);
      item.style.setProperty("--row-span", rowSpan);
    } else if (img) {
      img.addEventListener("load", () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        const rowSpan = Math.ceil(ratio * 12);
        item.style.setProperty("--row-span", rowSpan);
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", setMasonryHeights);

/* принудительное обновление masonry при ресайзе */
window.addEventListener("resize", () => {
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  portfolioItems.forEach((item) => {
    const img = item.querySelector("img");
    if (img) {
      // пересчитываем высоту для нового размера экрана
      const ratio = img.naturalHeight / img.naturalWidth;
      const isMobile = window.innerWidth <= 600;
      const coefficient = isMobile ? 8 : 12;
      const rowSpan = Math.ceil(ratio * coefficient);
      item.style.setProperty("--row-span", rowSpan);
    }
  });
});

/* ========== ЛАЙТБОКС ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ==================== */
class PortfolioPreviewLightbox {
  constructor() {
    this.photos = window.portfolioPreviewData || [];
    this.currentIndex = 0;
    this.lightbox = document.getElementById('portfolioLightbox');
    this.lightboxImage = document.getElementById('lightboxImage');
    this.lightboxClose = document.getElementById('lightboxClose');
    this.lightboxPrev = document.getElementById('lightboxPrev');
    this.lightboxNext = document.getElementById('lightboxNext');
    
    this.init();
  }
  
  init() {
    if (!this.lightbox || this.photos.length === 0) return;
    
    this.bindEvents();
  }
  
  bindEvents() {
    // Клики по фотографиям
    document.querySelectorAll('.portfolio-preview__item').forEach((item, index) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.openLightbox(index);
      });
    });
    
    // Кнопки лайтбокса
    if (this.lightboxClose) {
      this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    }
    
    if (this.lightboxPrev) {
      this.lightboxPrev.addEventListener('click', () => this.prevPhoto());
    }
    
    if (this.lightboxNext) {
      this.lightboxNext.addEventListener('click', () => this.nextPhoto());
    }
    
    // Клик по overlay
    const overlay = this.lightbox.querySelector('.portfolio-lightbox__overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeLightbox());
    }
    
    // Клавиатурное управление
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.classList.contains('active')) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowRight') this.nextPhoto();
        if (e.key === 'ArrowLeft') this.prevPhoto();
      }
    });
  }
  
  openLightbox(index) {
    this.currentIndex = index;
    const photo = this.photos[index];
    
    if (photo) {
      this.lightboxImage.src = photo.file_url;
      this.lightboxImage.alt = photo.title;
      this.lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  nextPhoto() {
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.openLightbox(this.currentIndex);
  }
  
  prevPhoto() {
    this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this.openLightbox(this.currentIndex);
  }
}

// Инициализация лайтбокса для главной страницы
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.portfolio-preview') && window.portfolioPreviewData) {
    new PortfolioPreviewLightbox();
  }
});


// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    // Существующая инициализация...
    
    // Инициализация портфолио превью
    if (document.getElementById("previewGrid")) {
        new PortfolioPreview();
    }
});

/* ========== ЗАГРУЗКА ОТЗЫВОВ (только для главной страницы) ======== */
async function loadReviews() {
  // Эта функция работает только на главной странице, НЕ на странице "Обо мне"
  if (document.querySelector('.about-reviews')) {
    return; // Выходим, если это страница "Обо мне"
  }
  
  const reviewsGrid = document.getElementById("reviewsGrid");
  if (!reviewsGrid) return;
  
  try {
    const response = await fetch("data/reviews.json");
    if (!response.ok) throw new Error("Не удалось загрузить отзывы");

    const reviews = await response.json();
    renderReviews(reviews);
  } catch (error) {
    console.error("Ошибка загрузки отзывов:", error);
  }
}

function renderReviews(reviews) {
  const reviewsGrid = document.getElementById("reviewsGrid");
  if (!reviewsGrid || document.querySelector('.about-reviews')) return;

  reviewsGrid.innerHTML = "";

  reviews.forEach((review) => {
    const reviewItem = document.createElement("div");
    reviewItem.className = "review-item";

    reviewItem.innerHTML = `
      <div class="review-item__author">${review.author}</div>
      <div class="review-item__text">${formatReviewText(review.text)}</div>
    `;

    reviewsGrid.appendChild(reviewItem);
  });
}

function formatReviewText(text) {
  const paragraphs = text.split("\n\n").filter((p) => p.trim());

  return paragraphs
    .map((paragraph) => {
      const formatted = paragraph
        .replace(/❤️|💕|✨|😊|👶|📸/g, '<span class="emoji">$&</span>')
        .trim();

      return `<p>${formatted}</p>`;
    })
    .join("");
}

/* запускаем загрузку при загрузке страницы */
document.addEventListener("DOMContentLoaded", () => {
  loadReviews();
});



// Обновление masonry при изменении размера окна
window.addEventListener("resize", () => {
  const previewGrid = document.getElementById("previewGrid");
  if (previewGrid) {
    const items = previewGrid.querySelectorAll(".portfolio-item");
    items.forEach((item) => {
      const img = item.querySelector("img");
      if (img && img.complete) {
        const ratio = img.naturalHeight / img.naturalWidth;
        const isMobile = window.innerWidth <= 600;
        const coefficient = isMobile ? 8 : 12;
        const rowSpan = Math.ceil(ratio * coefficient);
        item.style.setProperty("--row-span", rowSpan);
      }
    });
  }
});


