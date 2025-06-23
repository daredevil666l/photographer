/* ==========================================
   Портфолио с фильтрацией по категориям и годам
   ========================================== */

const BATCH = 10;
const PATH = 'img/portfolio/';
const LIST = 'list.json';

const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
const categoryFilters = document.getElementById('categoryFilters');
const yearFilters = document.getElementById('yearFilters');

let portfolioData = [];
let filteredData = [];
let allCategories = [];
let allYears = [];
let currentCategory = '';
let currentYear = '';
let pointer = 0;
let busy = false;

/* ---- функция для автоматического расчёта высоты ---- */
function setMasonryHeight(item, img) {
  if (img && img.complete && img.naturalWidth && img.naturalHeight) {
    const ratio = img.naturalHeight / img.naturalWidth;
    const isMobile = window.innerWidth <= 600;
    const coefficient = isMobile ? 8 : 12;
    const rowSpan = Math.ceil(ratio * coefficient);
    item.style.setProperty('--row-span', rowSpan);
  }
}

/* ---- создание одной карточки как ссылки ---- */
function createPortfolioItem({ file, title, category, link }) {
  return new Promise(resolve => {
    const item = document.createElement('a');
    item.className = 'portfolio-item';
    item.href = link || 'client-template.html';
    item.target = '_blank';

    const img = new Image();
    const imgPath = `${PATH}${file}`.replace(/\/+/g, '/');
    img.src = imgPath;
    img.alt = title;

    const overlay = document.createElement('div');
    overlay.className = 'portfolio-item__overlay';
    overlay.innerHTML = `
      <h3 class="portfolio-item__title">${title}</h3>
      <span class="portfolio-item__category">${category}</span>
    `;

    img.onload = () => {
      setMasonryHeight(item, img);
      item.appendChild(img);
      item.appendChild(overlay);
      resolve(item);
    };

    img.onerror = () => {
      resolve(document.createDocumentFragment());
    };
  });
}

/* ---- вывод очередной порции ---- */
function renderBatch() {
  if (busy || pointer >= filteredData.length) return;
  
  busy = true;
  loader.classList.add('active');

  const slice = filteredData.slice(pointer, pointer + BATCH);
  const promises = slice.map(createPortfolioItem);

  Promise.all(promises).then(items => {
    items.forEach(item => {
      if (item.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        gallery.appendChild(item);
      }
    });

    pointer += slice.length;
    busy = false;
    loader.classList.remove('active');

    if (pointer >= filteredData.length) {
      window.removeEventListener('scroll', onScroll);
    }
  });
}

/* ---- создание кнопок фильтрации по категориям ---- */
function createCategoryFilters() {
  allCategories = [...new Set(portfolioData.map(item => item.category))].sort();
  
  // Очищаем контейнер, оставляя кнопку "Все"
  const allButton = categoryFilters.querySelector('.filter-btn[data-category=""]');
  categoryFilters.innerHTML = '';
  categoryFilters.appendChild(allButton);
  
  // Добавляем кнопки категорий
  allCategories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.dataset.category = category;
    button.textContent = category;
    button.addEventListener('click', () => filterByCategory(category));
    categoryFilters.appendChild(button);
  });
}

/* ---- создание кнопок фильтрации по годам ---- */
function createYearFilters() {
  allYears = [...new Set(portfolioData.map(item => item.year))].sort((a, b) => b - a); // от новых к старым
  
  // Очищаем контейнер, оставляя кнопку "Все"
  const allButton = yearFilters.querySelector('.filter-btn[data-year=""]');
  yearFilters.innerHTML = '';
  yearFilters.appendChild(allButton);
  
  // Добавляем кнопки годов
  allYears.forEach(year => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.dataset.year = year;
    button.textContent = year;
    button.addEventListener('click', () => filterByYear(year));
    yearFilters.appendChild(button);
  });
}

/* ---- фильтрация по категориям ---- */
function filterByCategory(category) {
  currentCategory = category;
  
  // Обновляем активную кнопку категории
  categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  categoryFilters.querySelector(`[data-category="${category}"]`).classList.add('active');
  
  // Применяем фильтры
  applyFilters();
}

/* ---- фильтрация по годам ---- */
function filterByYear(year) {
  currentYear = year;
  
  // Обновляем активную кнопку года
  yearFilters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  yearFilters.querySelector(`[data-year="${year}"]`).classList.add('active');
  
  // Применяем фильтры
  applyFilters();
}

/* ---- применение всех фильтров ---- */
function applyFilters() {
  filteredData = portfolioData.filter(item => {
    const categoryMatch = currentCategory === '' || item.category === currentCategory;
    const yearMatch = currentYear === '' || item.year == currentYear;
    return categoryMatch && yearMatch;
  });
  
  // Сбрасываем галерею и загружаем отфильтрованные данные
  resetGallery();
  renderBatch();
}

/* ---- сброс галереи ---- */
function resetGallery() {
  gallery.innerHTML = '';
  pointer = 0;
  busy = false;
  
  // Заново подключаем скролл
  window.removeEventListener('scroll', onScroll);
  window.addEventListener('scroll', onScroll);
}

/* ---- обработчик бесконечного скролла ---- */
function onScroll() {
  if (window.innerHeight + window.scrollY >= 
      document.body.offsetHeight - 200) {
    renderBatch();
  }
}

/* ---- загрузка данных и старт ---- */
fetch(`${PATH}${LIST}`)
  .then(response => response.json())
  .then(data => {
    portfolioData = data;
    filteredData = [...data];
    
    // Создаем фильтры
    createCategoryFilters();
    createYearFilters();
    
    // Подключаем обработчики кнопок "Все"
    categoryFilters.querySelector('.filter-btn[data-category=""]').addEventListener('click', () => {
      filterByCategory('');
    });
    
    yearFilters.querySelector('.filter-btn[data-year=""]').addEventListener('click', () => {
      filterByYear('');
    });
    
    // Подключаем бесконечный скролл
    window.addEventListener('scroll', onScroll);
    
    // Загружаем первую порцию
    renderBatch();
  })
  .catch(error => {
    console.error('Ошибка загрузки портфолио:', error);
    loader.style.display = 'none';
  });

/* принудительное обновление masonry при ресайзе */
window.addEventListener('resize', () => {
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  portfolioItems.forEach(item => {
    const img = item.querySelector('img');
    if (img && img.complete) {
      const ratio = img.naturalHeight / img.naturalWidth;
      const isMobile = window.innerWidth <= 600;
      const coefficient = isMobile ? 8 : 12;
      const rowSpan = Math.ceil(ratio * coefficient);
      item.style.setProperty('--row-span', rowSpan);
    }
  });
});
