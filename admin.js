/* ==========================================
   Управление портфолио - Frontend
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
  // Клик по зоне загрузки
  uploadZone.addEventListener('click', () => fileInput.click());
  
  // Выбор файлов
  fileInput.addEventListener('change', handleFileSelect);
  
  // Drag & Drop
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('dragleave', handleDragLeave);
  uploadZone.addEventListener('drop', handleDrop);
  
  // Отправка формы
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
  
  selectedFiles.forEach((file, index) => {
    const titleInput = document.querySelector(`input[data-index="${index}"][data-field="title"]`);
    const categorySelect = document.querySelector(`select[data-index="${index}"][data-field="category"]`);
    
    if (!titleInput.value || !categorySelect.value) {
      showNotification('Заполните все поля для каждой фотографии', 'error');
      return;
    }
    
    formData.append('files[]', file);
    photosData.push({
      title: titleInput.value,
      category: categorySelect.value
    });
  });
  
  formData.append('photosData', JSON.stringify(photosData));
  
  // Отправляем на сервер (PHP обработчик)
  uploadFiles(formData);
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
      loadExistingPhotos(); // Обновляем список
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
    
    // ЗДЕСЬ БУДЕТ ЗАПРОС К PHP ИЛИ ПРЯМО К JSON
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
        <div class="photo-actions">
          <button class="btn-edit" onclick="editPhoto(${index})">Редактировать</button>
          <button class="btn-delete" onclick="deletePhoto(${index}, '${photo.file}')">Удалить</button>
        </div>
      </div>
    `;
    photosList.appendChild(photoItem);
  });
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
  
  if (newTitle && newCategory) {
    try {
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch('update_photo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: photo.file,
          title: newTitle,
          category: newCategory
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
