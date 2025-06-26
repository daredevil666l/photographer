(function() {
    'use strict';
    
    // Локальные переменные для этого модуля
    let adminSelectedFiles = [];
    let adminAllPhotos = [];
    let adminFilteredPhotos = [];
    let adminCategories = [];

    // DOM элементы
    let uploadZone, fileInput, filePreview, uploadForm, uploadBtn;
    let photosList, searchInput, categoryFilter, loadingStatus, notifications;
    let addCategoryBtn, newCategoryName, categoriesList;

    /* ========== ИНИЦИАЛИЗАЦИЯ ========================================= */
    document.addEventListener("DOMContentLoaded", function () {
        console.log('=== ИНИЦИАЛИЗАЦИЯ АДМИН ПАНЕЛИ ===');
        
        // Проверяем, что мы на правильной странице
        if (!document.getElementById('addCategoryBtn')) {
            console.log('Не страница администрирования портфолио, выход');
            return;
        }
        
        initializeElements();
        
        if (!window.adminData) {
            console.error('❌ adminData не найден!');
            showAdminNotification('Ошибка: данные не загружены', 'error');
            return;
        }
        
        adminCategories = window.adminData.categories || [];
        console.log('Загружено категорий:', adminCategories.length);
        
        initializeCategoryManagement();
        initializeUploadZone();
        initializeFilters();
        renderCategoriesList();
        loadExistingPhotos();
        
        console.log('=== ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ===');
    });

    function initializeElements() {
        uploadZone = document.getElementById("uploadZone");
        fileInput = document.getElementById("fileInput");
        filePreview = document.getElementById("filePreview");
        uploadForm = document.getElementById("uploadForm");
        uploadBtn = document.getElementById("uploadBtn");
        photosList = document.getElementById("photosList");
        searchInput = document.getElementById("searchInput");
        categoryFilter = document.getElementById("categoryFilter");
        loadingStatus = document.getElementById("loadingStatus");
        notifications = document.getElementById("notifications");
        addCategoryBtn = document.getElementById("addCategoryBtn");
        newCategoryName = document.getElementById("newCategoryName");
        categoriesList = document.getElementById("categoriesList");
    }

    /* ========== УПРАВЛЕНИЕ КАТЕГОРИЯМИ ================================ */
    function initializeCategoryManagement() {
        if (!addCategoryBtn || !newCategoryName) {
            console.error('❌ Элементы управления категориями не найдены');
            return;
        }
        
        addCategoryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addNewCategory();
        });
        
        newCategoryName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewCategory();
            }
        });
    }

    async function addNewCategory() {
        const name = newCategoryName.value.trim();
        
        if (!name) {
            showAdminNotification('Введите название категории', 'error');
            return;
        }
        
        if (name.length < 2 || name.length > 50) {
            showAdminNotification('Название должно быть от 2 до 50 символов', 'error');
            return;
        }
        
        addCategoryBtn.disabled = true;
        addCategoryBtn.innerHTML = '<span>Добавление...</span>';
        
        try {
            const formData = new URLSearchParams({
                action: 'add_portfolio_category',
                name: name,
                nonce: window.adminData.nonce
            });
            
            const response = await fetch(window.adminData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAdminNotification('Категория добавлена!', 'success');
                
                adminCategories.push({
                    id: result.category_id,
                    name: result.name,
                    slug: result.name.toLowerCase().replace(/\s+/g, '-')
                });
                
                newCategoryName.value = '';
                renderCategoriesList();
                updateCategoryFilter();
                
            } else {
                showAdminNotification(result.error || 'Ошибка добавления категории', 'error');
            }
            
        } catch (error) {
            showAdminNotification('Ошибка при добавлении категории: ' + error.message, 'error');
        } finally {
            addCategoryBtn.disabled = false;
            addCategoryBtn.innerHTML = '<span>Добавить категорию</span>';
        }
    }

    async function deleteCategory(categoryId, categoryName) {
        if (!confirm(`Вы уверены, что хотите удалить категорию "${categoryName}"?\n\nВнимание: если в категории есть фотографии, удаление будет невозможно.`)) {
            return;
        }
        
        try {
            const response = await fetch(window.adminData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'delete_portfolio_category',
                    category_id: categoryId,
                    nonce: window.adminData.nonce
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAdminNotification('Категория удалена!', 'success');
                
                // Удаляем из локального массива
                adminCategories = adminCategories.filter(cat => cat.id != categoryId);
                
                renderCategoriesList();
                updateCategoryFilter();
                loadExistingPhotos(); // Перезагружаем фотографии
                
            } else {
                showAdminNotification(result.error || 'Ошибка удаления категории', 'error');
            }
            
        } catch (error) {
            showAdminNotification('Ошибка при удалении категории: ' + error.message, 'error');
        }
    }

    function renderCategoriesList() {
        if (!categoriesList) return;
        
        if (adminCategories.length === 0) {
            categoriesList.innerHTML = '<p style="text-align: center; color: #666;">Категории не найдены</p>';
            return;
        }
        
        categoriesList.innerHTML = adminCategories.map(cat => `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-name">${cat.name}</span>
                    <span class="category-slug">${cat.slug}</span>
                </div>
                <button class="category-delete-btn" onclick="adminDeleteCategory(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')">
                    ×
                </button>
            </div>
        `).join('');
    }

    function updateCategoryFilter() {
        if (!categoryFilter) return;
        
        const currentValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">Все категории</option>';
        
        adminCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            if (cat.id == currentValue) {
                option.selected = true;
            }
            categoryFilter.appendChild(option);
        });
    }

    /* ========== ЗАГРУЗКА ФАЙЛОВ ======================================= */
    function initializeUploadZone() {
        if (!uploadZone || !fileInput) return;
        
        uploadZone.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", handleFileSelect);
        uploadZone.addEventListener("dragover", handleDragOver);
        uploadZone.addEventListener("dragleave", handleDragLeave);
        uploadZone.addEventListener("drop", handleDrop);
        
        if (uploadForm) {
            uploadForm.addEventListener("submit", handleFormSubmit);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadZone.classList.add("dragover");
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        processFiles(files);
    }

    function processFiles(files) {
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        adminSelectedFiles = [...adminSelectedFiles, ...imageFiles];
        updateFilePreview();
        updateUploadButton();
    }

    function updateFilePreview() {
        if (!filePreview) return;
        
        filePreview.innerHTML = "";

        adminSelectedFiles.forEach((file, index) => {
            const previewItem = document.createElement("div");
            previewItem.className = "preview-item";

            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);

            const info = document.createElement("div");
            info.className = "preview-info";
            info.innerHTML = `
                <input type="text" placeholder="Название фотографии" 
                       data-index="${index}" data-field="title" required>
                <select data-index="${index}" data-field="category_id" required>
                    <option value="">Выберите категорию</option>
                    ${adminCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                </select>
                <input type="number" placeholder="Год" min="2020" max="2030"
                       data-index="${index}" data-field="year" required>
                <input type="url" placeholder="Ссылка на фотосессию" 
                       data-index="${index}" data-field="link">
            `;

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-preview";
            removeBtn.innerHTML = "×";
            removeBtn.onclick = () => removeFile(index);

            previewItem.appendChild(img);
            previewItem.appendChild(info);
            previewItem.appendChild(removeBtn);
            filePreview.appendChild(previewItem);
        });
    }

    function removeFile(index) {
        adminSelectedFiles.splice(index, 1);
        updateFilePreview();
        updateUploadButton();
    }

    function updateUploadButton() {
        if (uploadBtn) {
            uploadBtn.disabled = adminSelectedFiles.length === 0;
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        if (adminSelectedFiles.length === 0) return;

        const formData = new FormData();
        const photosData = [];
        let hasErrors = false;

        adminSelectedFiles.forEach((file, index) => {
            const titleInput = document.querySelector(`input[data-index="${index}"][data-field="title"]`);
            const categorySelect = document.querySelector(`select[data-index="${index}"][data-field="category_id"]`);
            const yearInput = document.querySelector(`input[data-index="${index}"][data-field="year"]`);
            const linkInput = document.querySelector(`input[data-index="${index}"][data-field="link"]`);

            if (!titleInput.value || !categorySelect.value || !yearInput.value) {
                showAdminNotification("Заполните все обязательные поля для каждой фотографии", "error");
                hasErrors = true;
                return;
            }

            const yearValue = parseInt(yearInput.value);
            if (isNaN(yearValue) || yearValue < 2020 || yearValue > 2030) {
                showAdminNotification("Введите корректный год от 2020 до 2030", "error");
                hasErrors = true;
                return;
            }

            formData.append("files[]", file);
            photosData.push({
                title: titleInput.value,
                category_id: parseInt(categorySelect.value),
                year: yearValue,
                link: linkInput.value || "client-template.html",
            });
        });

        if (hasErrors) return;

        formData.append("photosData", JSON.stringify(photosData));
        formData.append("action", "upload_portfolio_photos");
        formData.append("nonce", window.adminData.nonce);
        
        uploadFiles(formData);
    }

    async function uploadFiles(formData) {
        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = "<span>Загружается...</span>";

            const response = await fetch(window.adminData.ajaxUrl, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                showAdminNotification(`Загружено фотографий: ${result.uploaded}`, "success");
                resetForm();
                loadExistingPhotos();
            } else {
                throw new Error(result.error || "Ошибка загрузки");
            }
        } catch (error) {
            showAdminNotification("Ошибка при загрузке файлов: " + error.message, "error");
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = "<span>Загрузить фотографии</span>";
        }
    }

    function resetForm() {
        adminSelectedFiles = [];
        if (filePreview) filePreview.innerHTML = "";
        if (fileInput) fileInput.value = "";
        updateUploadButton();
    }

    /* ========== УПРАВЛЕНИЕ ФОТОГРАФИЯМИ =============================== */
    function initializeFilters() {
        if (searchInput) {
            searchInput.addEventListener("input", applyFilters);
        }
        if (categoryFilter) {
            categoryFilter.addEventListener("change", applyFilters);
        }
    }

    function applyFilters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';

        adminFilteredPhotos = adminAllPhotos.filter((photo) => {
            const matchesSearch = !searchTerm || photo.title.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || photo.category_id == selectedCategory;
            return matchesSearch && matchesCategory;
        });

        renderPhotosList();
    }

    async function loadExistingPhotos() {
        if (!window.adminData) return;
        
        try {
            if (loadingStatus) loadingStatus.style.display = "block";

            const response = await fetch(window.adminData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'get_portfolio_photos',
                    nonce: window.adminData.nonce
                })
            });

            const result = await response.json();

            if (result.success) {
                adminAllPhotos = result.photos || [];
                adminFilteredPhotos = [...adminAllPhotos];
                renderPhotosList();
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error("❌ Ошибка загрузки фотографий:", error);
            showAdminNotification("Ошибка при загрузке списка фотографий", "error");
        } finally {
            if (loadingStatus) loadingStatus.style.display = "none";
        }
    }

    function renderPhotosList() {
        if (!photosList) return;
        
        photosList.innerHTML = "";

        if (adminFilteredPhotos.length === 0) {
            photosList.innerHTML = '<p style="text-align: center; color: #666;">Фотографии не найдены</p>';
            return;
        }

        adminFilteredPhotos.forEach((photo) => {
            const photoItem = document.createElement("div");
            photoItem.className = "photo-item";
            photoItem.innerHTML = `
                <img src="${photo.file_url}" alt="${photo.title}">
                <div class="photo-info">
                    <div class="photo-title">${photo.title}</div>
                    <div class="photo-category">${photo.category_name || 'Без категории'}</div>
                    <div class="photo-year">Год: ${photo.year}</div>
                    <div class="photo-link">
                        <a href="${photo.link}" target="_blank">Ссылка</a>
                    </div>
                    <div class="photo-actions">
                        <button class="btn-delete" onclick="adminDeletePhoto(${photo.id})">Удалить</button>
                    </div>
                </div>
            `;
            photosList.appendChild(photoItem);
        });
    }

    function showAdminNotification(message, type = "info") {
        if (!notifications) {
            alert(message);
            return;
        }
        
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notifications.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Глобальные функции
    window.adminDeleteCategory = deleteCategory;
    
    window.adminDeletePhoto = async function(photoId) {
        if (!confirm("Вы уверены, что хотите удалить эту фотографию?")) return;

        try {
            const response = await fetch(window.adminData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'delete_portfolio_photo',
                    photo_id: photoId,
                    nonce: window.adminData.nonce
                })
            });

            const result = await response.json();

            if (result.success) {
                showAdminNotification("Фотография удалена!", "success");
                loadExistingPhotos();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showAdminNotification("Ошибка при удалении: " + error.message, "error");
        }
    };

})();
