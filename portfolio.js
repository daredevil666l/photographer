/* ==========================================
   Динамическая подгрузка фотографий портфолио
   ========================================== */

// Настройки
const BATCH = 10;                 // размер одной порции
const PATH = 'img/portfolio/';    // папка с изображениями
const LIST = 'list.json';         // файл-список объектов

const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');

let portfolioData = [];           // полный массив объектов {file, title, category}
let pointer = 0;                  // сколько уже выведено
let busy = false;

/* ---- функция для автоматического расчёта высоты ---- */
function setMasonryHeight(item, img) {
  if (img && img.complete && img.naturalWidth && img.naturalHeight) {
    const ratio = img.naturalHeight / img.naturalWidth;
    const rowSpan = Math.ceil(ratio * 12); // коэффициент плотности
    item.style.setProperty('--row-span', rowSpan);
  }
}

/* ---- создание одной карточки ---- */
function createPortfolioItem({ file, title, category }) {
  return new Promise(resolve => {
    const item = document.createElement('div');
    item.className = 'portfolio-item';

    const img = new Image();
    img.src = `${PATH}${file}`;
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
      // если фото не загрузилось, возвращаем пустой фрагмент
      resolve(document.createDocumentFragment());
    };
  });
}

/* ---- вывод очередной порции ---- */
function renderBatch() {
  if (busy || pointer >= portfolioData.length) return;
  
  busy = true;
  loader.classList.add('active');

  const slice = portfolioData.slice(pointer, pointer + BATCH);
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

    // если все фото показали, убираем обработчик скролла
    if (pointer >= portfolioData.length) {
      window.removeEventListener('scroll', onScroll);
    }
  });
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
    
    // подключаем бесконечный скролл
    window.addEventListener('scroll', onScroll);
    
    // загружаем первую порцию
    renderBatch();
  })
  .catch(error => {
    console.error('Ошибка загрузки портфолио:', error);
    loader.style.display = 'none';
  });
/* ---- функция для автоматического расчёта высоты ---- */
function setMasonryHeight(item, img) {
  if (img && img.complete && img.naturalWidth && img.naturalHeight) {
    const ratio = img.naturalHeight / img.naturalWidth;
    
    // уменьшаем коэффициент для мобильных
    const isMobile = window.innerWidth <= 600;
    const coefficient = isMobile ? 8 : 12; // меньше строк на мобильных
    
    const rowSpan = Math.ceil(ratio * coefficient);
    item.style.setProperty('--row-span', rowSpan);
  }
}
