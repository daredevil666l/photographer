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
  const items = document.querySelectorAll(".portfolio-item");

  items.forEach((item) => {
    const img = item.querySelector("img");
    if (img && img.complete) {
      const ratio = img.naturalHeight / img.naturalWidth;
      const rowSpan = Math.ceil(ratio * 12); /* было 15 - уменьшили */
      item.style.setProperty("--row-span", rowSpan);
    } else if (img) {
      img.addEventListener("load", () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        const rowSpan = Math.ceil(ratio * 12); /* было 15 */
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

/* ========== ЗАГРУЗКА ОТЗЫВОВ ======================================= */
async function loadReviews() {
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
  if (!reviewsGrid) return;

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
  // заменяем переносы строк на параграфы
  const paragraphs = text.split("\n\n").filter((p) => p.trim());

  return paragraphs
    .map((paragraph) => {
      // заменяем эмодзи на spans для стилизации
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

/* ==========================================
   Портфолио превью с лайтбоксом
   ========================================== */

class PortfolioPreview {
  constructor() {
    this.PATH = "img/portfolio/";
    this.LIST = "list.json";
    this.previewGrid = document.getElementById("previewGrid");
    this.lightbox = document.getElementById("portfolioLightbox");
    this.lightboxImage = document.getElementById("lightboxImage");
    this.photos = [];
    this.currentIndex = 0;

    this.init();
  }

  async init() {
    await this.loadPhotos();
    this.renderPreview();
    this.bindLightboxEvents();
  }

  async loadPhotos() {
    try {
      const response = await fetch(`${this.PATH}${this.LIST}`);
      const data = await response.json();
      this.photos = data.slice(0, 7); // берём только первые 7 фото
    } catch (error) {
      console.error("Ошибка загрузки портфолио:", error);
    }
  }

  renderPreview() {
    if (!this.previewGrid || this.photos.length === 0) return;

    this.previewGrid.innerHTML = "";

    this.photos.forEach((photo, index) => {
      const item = this.createPhotoItem(photo, index);
      this.previewGrid.appendChild(item);
    });

    // Устанавливаем высоты для masonry после загрузки всех изображений
    this.setMasonryHeights();
  }

  createPhotoItem(photo, index) {
    const item = document.createElement("div");
    item.className = "portfolio-item";
    item.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = `${this.PATH}${photo.file}`;
    img.alt = photo.title;
    img.onload = () => this.setItemHeight(item, img);

    const overlay = document.createElement("div");
    overlay.className = "portfolio-item__overlay";
    overlay.innerHTML = `
      <h3 class="portfolio-item__title">${photo.title}</h3>
      <span class="portfolio-item__category">${photo.category}</span>
    `;

    item.appendChild(img);
    item.appendChild(overlay);

    // Обработчик клика для открытия лайтбокса
    item.addEventListener("click", () => this.openLightbox(index));

    return item;
  }

  setItemHeight(item, img) {
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalHeight / img.naturalWidth;
      const isMobile = window.innerWidth <= 600;
      const coefficient = isMobile ? 8 : 12;
      const rowSpan = Math.ceil(ratio * coefficient);
      item.style.setProperty("--row-span", rowSpan);
    }
  }

  setMasonryHeights() {
    const items = this.previewGrid.querySelectorAll(".portfolio-item");
    items.forEach((item) => {
      const img = item.querySelector("img");
      if (img) {
        this.setItemHeight(item, img);
      }
    });
  }

  bindLightboxEvents() {
    const closeBtn = document.getElementById("lightboxClose");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    const overlay = this.lightbox.querySelector(".portfolio-lightbox__overlay");

    closeBtn.addEventListener("click", () => this.closeLightbox());
    prevBtn.addEventListener("click", () => this.prevPhoto());
    nextBtn.addEventListener("click", () => this.nextPhoto());
    overlay.addEventListener("click", () => this.closeLightbox());

    // Клавиатурная навигация
    document.addEventListener("keydown", (e) => {
      if (this.lightbox.classList.contains("active")) {
        switch (e.key) {
          case "Escape":
            this.closeLightbox();
            break;
          case "ArrowLeft":
            this.prevPhoto();
            break;
          case "ArrowRight":
            this.nextPhoto();
            break;
        }
      }
    });
  }

  openLightbox(index) {
    this.currentIndex = index;
    this.updateLightboxImage();
    this.lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeLightbox() {
    this.lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  prevPhoto() {
    this.currentIndex =
      (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this.updateLightboxImage();
  }

  nextPhoto() {
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.updateLightboxImage();
  }

  updateLightboxImage() {
    const photo = this.photos[this.currentIndex];
    this.lightboxImage.src = `${this.PATH}${photo.file}`;
    this.lightboxImage.alt = photo.title;
  }
}

/* ========== ИНИЦИАЛИЗАЦИЯ ======================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Инициализируем превью портфолио только на главной странице
  if (document.getElementById("previewGrid")) {
    new PortfolioPreview();
  }
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
