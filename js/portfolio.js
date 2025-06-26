(function() {
    'use strict';
    
    // Локальные переменные
    let portfolioAllPhotos = [];
    let portfolioFilteredPhotos = [];
    let portfolioCurrentCategory = '';
    let portfolioCurrentYear = '';
    let currentLightboxIndex = 0;

    // DOM элементы
    let gallery, loader, categoryFilters, yearFilters, lightbox;

    document.addEventListener('DOMContentLoaded', function() {
        // Проверяем, что мы на странице портфолио
        gallery = document.getElementById('gallery');
        if (!gallery) {
            return; // Не страница портфолио
        }
        
        loader = document.getElementById('loader');
        categoryFilters = document.getElementById('categoryFilters');
        yearFilters = document.getElementById('yearFilters');
        
        console.log('Инициализация портфолио...');
        createLightbox();
        initializeFilters();
        loadPortfolioPhotos();
    });

    function createLightbox() {
        const lightboxHTML = `
            <div id="customLightbox" class="custom-lightbox">
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <img class="lightbox-image" src="" alt="">
                    <div class="lightbox-info">
                        <h3 class="lightbox-title"></h3>
                        <p class="lightbox-details"></p>
                    </div>
                    <button class="lightbox-close">&times;</button>
                    <button class="lightbox-prev">&#8249;</button>
                    <button class="lightbox-next">&#8250;</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        
        lightbox = document.getElementById('customLightbox');
        const lightboxImage = lightbox.querySelector('.lightbox-image');
        const lightboxTitle = lightbox.querySelector('.lightbox-title');
        const lightboxDetails = lightbox.querySelector('.lightbox-details');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        
        // События
        closeBtn.addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
        nextBtn.addEventListener('click', nextImage);
        prevBtn.addEventListener('click', prevImage);
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowRight') nextImage();
                if (e.key === 'ArrowLeft') prevImage();
            }
        });
        
        function openLightbox(index) {
            currentLightboxIndex = index;
            const photo = portfolioFilteredPhotos[index];
            
            lightboxImage.src = photo.file_url;
            lightboxTitle.textContent = photo.title;
            lightboxDetails.textContent = `${photo.category_name} (${photo.year})`;
            
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        function nextImage() {
            currentLightboxIndex = (currentLightboxIndex + 1) % portfolioFilteredPhotos.length;
            openLightbox(currentLightboxIndex);
        }
        
        function prevImage() {
            currentLightboxIndex = (currentLightboxIndex - 1 + portfolioFilteredPhotos.length) % portfolioFilteredPhotos.length;
            openLightbox(currentLightboxIndex);
        }
        
        // Делаем функцию доступной глобально
        window.openPortfolioLightbox = openLightbox;
    }

    function initializeFilters() {
        if (categoryFilters) {
            categoryFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    e.target.classList.add('active');
                    portfolioCurrentCategory = e.target.getAttribute('data-category');
                    applyFilters();
                }
            });
        }
        
        if (yearFilters) {
            yearFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    yearFilters.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    e.target.classList.add('active');
                    portfolioCurrentYear = e.target.getAttribute('data-year');
                    applyFilters();
                }
            });
        }
    }

    async function loadPortfolioPhotos() {
        if (!window.portfolioData) {
            console.error('portfolioData не найден');
            showEmptyMessage('Ошибка загрузки данных');
            return;
        }
        
        try {
            showLoader(true);
            console.log('Загрузка фотографий портфолио...');
            
            const response = await fetch(window.portfolioData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'get_portfolio_photos',
                    nonce: window.portfolioData.nonce
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Сервер вернул некорректный JSON');
            }
            
            if (result.success) {
                portfolioAllPhotos = result.photos || [];
                portfolioFilteredPhotos = [...portfolioAllPhotos];
                console.log(`Загружено ${portfolioAllPhotos.length} фотографий`);
                renderGallery();
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('Ошибка загрузки портфолио:', error);
            showEmptyMessage('Ошибка загрузки портфолио: ' + error.message);
        } finally {
            showLoader(false);
        }
    }

    function applyFilters() {
        portfolioFilteredPhotos = portfolioAllPhotos.filter(photo => {
            const matchesCategory = !portfolioCurrentCategory || photo.category_id == portfolioCurrentCategory;
            const matchesYear = !portfolioCurrentYear || photo.year == portfolioCurrentYear;
            return matchesCategory && matchesYear;
        });
        
        console.log(`Отфильтровано: ${portfolioFilteredPhotos.length} из ${portfolioAllPhotos.length}`);
        renderGallery();
    }

    function renderGallery() {
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        if (portfolioFilteredPhotos.length === 0) {
            showEmptyMessage();
            return;
        }
        
        portfolioFilteredPhotos.forEach((photo, index) => {
            const photoElement = document.createElement('div');
            photoElement.className = 'gallery-item';
            photoElement.innerHTML = `
                <div class="gallery-item__image">
                    <img src="${photo.file_url}" alt="${photo.title}" loading="lazy">
                    <div class="gallery-item__overlay">
                        <div class="gallery-item__zoom">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M10.5 7.5V13.5M7.5 10.5H13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="gallery-item__info">
                            <h3 class="gallery-item__title">${photo.title}</h3>
                            <p class="gallery-item__category">${photo.category_name || 'Без категории'}</p>
                            <p class="gallery-item__year">${photo.year}</p>
                            <a href="${photo.link}" class="gallery-item__link" target="_blank" onclick="event.stopPropagation();">
                                Смотреть фотосессию
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            // Добавляем обработчик клика для открытия лайтбокса
            photoElement.addEventListener('click', () => {
                window.openPortfolioLightbox(index);
            });
            
            gallery.appendChild(photoElement);
        });
        
        console.log(`Отрисовано ${portfolioFilteredPhotos.length} фотографий`);
    }

    function showEmptyMessage(customMessage = null) {
        if (!gallery) return;
        
        const message = customMessage || getEmptyMessage();
        
        gallery.innerHTML = `
            <div class="no-photos">
                <h3>Фотографии не найдены</h3>
                <p>${message}</p>
            </div>
        `;
    }

    function getEmptyMessage() {
        if (portfolioAllPhotos.length === 0) {
            return 'Портфолио пока пусто. Скоро здесь появятся новые работы!';
        }
        
        if (portfolioCurrentCategory && portfolioCurrentYear) {
            return `Нет фотографий в выбранной категории за ${portfolioCurrentYear} год. Попробуйте изменить фильтры.`;
        } else if (portfolioCurrentCategory) {
            return 'Нет фотографий в выбранной категории. Попробуйте выбрать другую категорию.';
        } else if (portfolioCurrentYear) {
            return `Нет фотографий за ${portfolioCurrentYear} год. Попробуйте выбрать другой год.`;
        }
        
        return 'Фотографии не найдены. Попробуйте изменить фильтры.';
    }

    function showLoader(show) {
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
            loader.setAttribute('aria-hidden', !show);
        }
    }

})();
