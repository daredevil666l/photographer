/* ==========================================
   Управление портфолио с поддержкой ссылок
   ========================================== */

// Глобальные переменные
let selectedFiles = [];
let allPhotos = [];
let filteredPhotos = [];

// DOM элементы
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const photosList = document.getElementById('photosList');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const loadingStatus = document.getElementById('loadingStatus');
const notifications = document.getElementById('notifications');

/* ========== ИНИЦИАЛИЗАЦИЯ ========================================= */
document.addEventListener('DOMContentLoaded', function() {
  initializeUploadZone();
  loadExistingPhotos();
  initializeFilters();
});

/* ========== DRAG & DROP + ВЫБОР ФАЙЛОВ ============================ */
function initializeUploadZone() {
  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('dragleave', handleDragLeave);
  uploadZone.addEventListener('drop', handleDrop);
  uploadForm.addEventListener('submit', handleFormSubmit);
}

function handleDragOver(e) {
  e.preventDefault();
  uploadZone.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files);
  processFiles(files);
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  processFiles(files);
}

function processFiles(files) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  selectedFiles = [...selectedFiles, ...imageFiles];
  updateFilePreview();
  updateUploadButton();
}

function updateFilePreview() {
  filePreview.innerHTML = '';
  
  selectedFiles.forEach((file, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    
    const info = document.createElement('div');
    info.className = 'preview-info';
    info.innerHTML = `
      <input type="text" placeholder="Название фотографии" 
             data-index="${index}" data-field="title" required>
      <select data-index="${index}" data-field="category" required>
        <option value="">Выберите категорию</option>
        <option value="Свадьба">Свадьба</option>
        <option value="Портрет">Портрет</option>
        <option value="Семья">Семья</option>
        <option value="Street">Street</option>
        <option value="Природа">Природа</option>
        <option value="События">События</option>
      </select>
      <input type="url" placeholder="Ссылка на фотосессию" 
             data-index="${index}" data-field="link" 
             pattern="https?://.+" title="Введите корректный URL (например: https://example.com)">
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => removeFile(index);
    
    previewItem.appendChild(img);
    previewItem.appendChild(info);
    previewItem.appendChild(removeBtn);
    filePreview.appendChild(previewItem);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilePreview();
  updateUploadButton();
}

function updateUploadButton() {
  uploadBtn.disabled = selectedFiles.length === 0;
}

/* ========== ОТПРАВКА ФАЙЛОВ ======================================== */
function handleFormSubmit(e) {
  e.preventDefault();
  
  if (selectedFiles.length === 0) return;
  
  // Собираем данные из формы
  const formData = new FormData();
  const photosData = [];
  
  let hasErrors = false;
  
  selectedFiles.forEach((file, index) => {
    const titleInput = document.querySelector(`input[data-index="${index}"][data-field="title"]`);
    const categorySelect = document.querySelector(`select[data-index="${index}"][data-field="category"]`);
    const linkInput = document.querySelector(`input[data-index="${index}"][data-field="link"]`);
    
    if (!titleInput.value || !categorySelect.value) {
      showNotification('Заполните название и категорию для каждой фотографии', 'error');
      hasErrors = true;
      return;
    }
    
    // Проверяем корректность URL, если указан
    const linkValue = linkInput.value.trim();
    if (linkValue && !isValidUrl(linkValue)) {
      showNotification('Укажите корректную ссылку (начинающуюся с http:// или https://)', 'error');
      hasErrors = true;
      return;
    }
    
    formData.append('files[]', file);
    photosData.push({
      title: titleInput.value,
      category: categorySelect.value,
      link: linkValue || 'client-template.html' // значение по умолчанию
    });
  });
  
  if (hasErrors) return;
  
  formData.append('photosData', JSON.stringify(photosData));
  uploadFiles(formData);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return string.startsWith('http://') || string.startsWith('https://');
  } catch (_) {
    return false;
  }
}

async function uploadFiles(formData) {
  try {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span>Загружается...</span>';
    
    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch('upload_photos.php', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Фотографии успешно загружены!', 'success');
      resetForm();
      loadExistingPhotos();
    } else {
      throw new Error(result.message || 'Ошибка загрузки');
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
    showNotification('Ошибка при загрузке файлов: ' + error.message, 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<span>Загрузить фотографии</span>';
  }
}

function resetForm() {
  selectedFiles = [];
  filePreview.innerHTML = '';
  fileInput.value = '';
  updateUploadButton();
}

/* ========== ЗАГРУЗКА СУЩЕСТВУЮЩИХ ФОТО ============================= */
async function loadExistingPhotos() {
  try {
    loadingStatus.style.display = 'block';
    
    const response = await fetch('img/portfolio/list.json');
    const photos = await response.json();
    
    allPhotos = photos;
    filteredPhotos = [...allPhotos];
    renderPhotosList();
    
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    showNotification('Ошибка при загрузке списка фотографий', 'error');
  } finally {
    loadingStatus.style.display = 'none';
  }
}

function renderPhotosList() {
  photosList.innerHTML = '';
  
  if (filteredPhotos.length === 0) {
    photosList.innerHTML = '<p style="text-align: center; color: #666;">Фотографии не найдены</p>';
    return;
  }
  
  filteredPhotos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
      <img src="img/portfolio/${photo.file}" alt="${photo.title}">
      <div class="photo-info">
        <div class="photo-title">${photo.title}</div>
        <div class="photo-category">${photo.category}</div>
        <div class="photo-link">
          Ссылка: 
          <input type="url" value="${photo.link || ''}" 
                 data-file="${photo.file}" 
                 class="photo-link-input" 
                 pattern="https?://.+" 
                 title="Введите корректный URL"
                 onchange="updatePhotoLink('${photo.file}', this.value)">
        </div>
        <div class="photo-actions">
          <button class="btn-edit" onclick="editPhoto(${index})">Редактировать</button>
          <button class="btn-delete" onclick="deletePhoto(${index}, '${photo.file}')">Удалить</button>
        </div>
      </div>
    `;
    photosList.appendChild(photoItem);
  });
}

/* ========== ОБНОВЛЕНИЕ ССЫЛКИ НА МЕСТЕ ============================= */
async function updatePhotoLink(filename, newLink) {
  // Валидация ссылки
  if (newLink && !isValidUrl(newLink)) {
    showNotification('Укажите корректную ссылку (начинающуюся с http:// или https://)', 'error');
    loadExistingPhotos(); // сброс поля к исходному значению
    return;
  }
  
  try {
    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch('update_photo_link.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: filename,
        link: newLink || 'client-template.html'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Ссылка обновлена!', 'success');
      // Обновляем локальные данные
      const photoIndex = allPhotos.findIndex(p => p.file === filename);
      if (photoIndex !== -1) {
        allPhotos[photoIndex].link = newLink || 'client-template.html';
        filteredPhotos = [...allPhotos];
        applyFilters(); // переприменяем фильтры
      }
    } else {
      throw new Error(result.message);
    }
    
  } catch (error) {
    showNotification('Ошибка при обновлении ссылки: ' + error.message, 'error');
    loadExistingPhotos(); // сброс к исходному состоянию
  }
}

/* ========== ФИЛЬТРАЦИЯ И ПОИСК ===================================== */
function initializeFilters() {
  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  
  filteredPhotos = allPhotos.filter(photo => {
    const matchesSearch = photo.title.toLowerCase().includes(searchTerm);
    const matchesCategory = !selectedCategory || photo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  renderPhotosList();
}

/* ========== РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ ============================ */
async function editPhoto(index) {
  const photo = filteredPhotos[index];
  const newTitle = prompt('Новое название:', photo.title);
  const newCategory = prompt('Новая категория:', photo.category);
  const newLink = prompt('Новая ссылка:', photo.link || '');
  
  if (newTitle && newCategory) {
    // Валидация ссылки
    if (newLink && !isValidUrl(newLink)) {
      showNotification('Укажите корректную ссылку (начинающуюся с http:// или https://)', 'error');
      return;
    }
    
    try {
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch('update_photo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: photo.file,
          title: newTitle,
          category: newCategory,
          link: newLink || 'client-template.html'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Фотография обновлена!', 'success');
        loadExistingPhotos();
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      showNotification('Ошибка при обновлении: ' + error.message, 'error');
    }
  }
}

async function deletePhoto(index, filename) {
  if (!confirm('Вы уверены, что хотите удалить эту фотографию?')) return;
  
  try {
    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch('delete_photo.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filename })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Фотография удалена!', 'success');
      loadExistingPhotos();
    } else {
      throw new Error(result.message);
    }
    
  } catch (error) {
    showNotification('Ошибка при удалении: ' + error.message, 'error');
  }
}

/* ========== УВЕДОМЛЕНИЯ ========================================== */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notifications.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
