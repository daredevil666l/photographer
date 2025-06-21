const burger  = document.getElementById('burger');
const overlay = document.getElementById('overlay');

function toggleMenu(){
  document.body.classList.toggle('menu-open');
}

burger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

document.addEventListener('keyup', e=>{
  if(e.key==='Escape' && document.body.classList.contains('menu-open')){
    toggleMenu();
  }
});

/* === Новое: выделяем пункт текущей страницы === */
function highlightCurrent(){
  const links = document.querySelectorAll('.menu a');
  const current =
        location.hash ? location.hash :              // одностраничный вариант
        location.pathname.split('/').pop() || 'index.html'; // многостраничный

  links.forEach(link=>{
    const href = link.getAttribute('href');
    if(href === current || href === '#'+current.replace('#','')){
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', highlightCurrent);


/* берём все фотографии блока About */
const photos = document.querySelectorAll('.about-photos .photo');

if (photos.length) {
  /* движение учитываем по всей странице */
  window.addEventListener('mousemove', e => {
    const xNorm = (e.clientX / window.innerWidth  - 0.5) * 2;   // −1 … 1
    const yNorm = (e.clientY / window.innerHeight - 0.5) * 2;

    photos.forEach((ph, i) => {
      /* базовый радиус смещения (px) — поправьте на своё усмотрение */
      const base = 15;                    // «силу» эффекта регулируем здесь
      const k    = i === 0 ? 1.3 : 1;     // чуть разная амплитуда для кадров

      const tx = xNorm * base * k;        // горизонталь
      const ty = yNorm * base * 0.6 * k;  // вертикаль (поменьше)

      ph.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });

  /* при уходе курсора за окно возвращаем всё на место */
  window.addEventListener('mouseout', () =>
    photos.forEach(ph => ph.style.transform = '')
  );
}


const slider = new Swiper('.sale__slider', {
  loop: true,
  speed: 600,
  navigation: {
    nextEl: '.sale-nav.next',
    prevEl: '.sale-nav.prev'
  },
  slidesPerView: 1,
  effect: 'slide',
  grabCursor: true
});



function setMasonryHeights() {
  const items = document.querySelectorAll('.portfolio-item');
  
  items.forEach(item => {
    const img = item.querySelector('img');
    if (img && img.complete) {
      const ratio = img.naturalHeight / img.naturalWidth;
      const rowSpan = Math.ceil(ratio * 12); /* было 15 - уменьшили */
      item.style.setProperty('--row-span', rowSpan);
    } else if (img) {
      img.addEventListener('load', () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        const rowSpan = Math.ceil(ratio * 12); /* было 15 */
        item.style.setProperty('--row-span', rowSpan);
      });
    }
  });
}
document.addEventListener('DOMContentLoaded', setMasonryHeights);

/* принудительное обновление masonry при ресайзе */
window.addEventListener('resize', () => {
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  portfolioItems.forEach(item => {
    const img = item.querySelector('img');
    if (img) {
      // пересчитываем высоту для нового размера экрана
      const ratio = img.naturalHeight / img.naturalWidth;
      const isMobile = window.innerWidth <= 600;
      const coefficient = isMobile ? 8 : 12;
      const rowSpan = Math.ceil(ratio * coefficient);
      item.style.setProperty('--row-span', rowSpan);
    }
  });
});


/* ========== ЗАГРУЗКА ОТЗЫВОВ ======================================= */
async function loadReviews() {
  try {
    const response = await fetch('data/reviews.json');
    if (!response.ok) throw new Error('Не удалось загрузить отзывы');
    
    const reviews = await response.json();
    renderReviews(reviews);
    
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error);
  }
}

function renderReviews(reviews) {
  const reviewsGrid = document.getElementById('reviewsGrid');
  if (!reviewsGrid) return;
  
  reviewsGrid.innerHTML = '';
  
  reviews.forEach(review => {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    
    reviewItem.innerHTML = `
      <div class="review-item__author">${review.author}</div>
      <div class="review-item__text">${formatReviewText(review.text)}</div>
    `;
    
    reviewsGrid.appendChild(reviewItem);
  });
}

function formatReviewText(text) {
  // заменяем переносы строк на параграфы
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map(paragraph => {
    // заменяем эмодзи на spans для стилизации
    const formatted = paragraph
      .replace(/❤️|💕|✨|😊|👶|📸/g, '<span class="emoji">$&</span>')
      .trim();
    
    return `<p>${formatted}</p>`;
  }).join('');
}

/* запускаем загрузку при загрузке страницы */
document.addEventListener('DOMContentLoaded', () => {
  loadReviews();
});
