/* ==========================================
   Управление портфолио с поддержкой года
   ========================================== */

// Глобальные переменные
let selectedFiles = [];
let allPhotos = [];
let filteredPhotos = [];

// DOM элементы
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const uploadForm = document.getElementById("uploadForm");
const uploadBtn = document.getElementById("uploadBtn");
const photosList = document.getElementById("photosList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const loadingStatus = document.getElementById("loadingStatus");
const notifications = document.getElementById("notifications");

/* ========== ИНИЦИАЛИЗАЦИЯ ========================================= */
document.addEventListener("DOMContentLoaded", function () {
  initializeUploadZone();
  loadExistingPhotos();
  initializeFilters();
});

/* ========== DRAG & DROP + ВЫБОР ФАЙЛОВ ============================ */
function initializeUploadZone() {
  uploadZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);
  uploadZone.addEventListener("dragover", handleDragOver);
  uploadZone.addEventListener("dragleave", handleDragLeave);
  uploadZone.addEventListener("drop", handleDrop);
  uploadForm.addEventListener("submit", handleFormSubmit);
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
  selectedFiles = [...selectedFiles, ...imageFiles];
  updateFilePreview();
  updateUploadButton();
}

/* ========== ПРЕВЬЮ ФАЙЛОВ С ПОЛЕМ ГОДА ============================ */
/* ========== ПРЕВЬЮ ФАЙЛОВ С ДИНАМИЧЕСКОЙ КАТЕГОРИЕЙ =============== */
function updateFilePreview() {
  filePreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    const info = document.createElement("div");
    info.className = "preview-info";
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
        <option value="other">Другое (введите)</option>
      </select>
      <input type="text" placeholder="Введите новую категорию" 
             data-index="${index}" data-field="newCategory" 
             class="new-category-input" />
      <input type="number" placeholder="Год" min="2020" max="2030"
             data-index="${index}" data-field="year" required>
      <input type="url" placeholder="Ссылка на фотосессию" 
             data-index="${index}" data-field="link" 
             pattern="https?://.+" title="Введите корректный URL (например: https://example.com)">
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

  // Добавляем обработчики изменения селекта категорий
  filePreview
    .querySelectorAll('select[data-field="category"]')
    .forEach((select) => {
      select.addEventListener("change", (e) => {
        const idx = e.target.getAttribute("data-index");
        const newCatInput = filePreview.querySelector(
          `input[data-index="${idx}"][data-field="newCategory"]`
        );

        if (e.target.value === "other") {
          newCatInput.classList.add("show");
          newCatInput.required = true;
        } else {
          newCatInput.classList.remove("show");
          newCatInput.required = false;
          newCatInput.value = "";
        }
      });
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

/* ========== ОТПРАВКА С УЧЕТОМ НОВЫХ КАТЕГОРИЙ ===================== */
function handleFormSubmit(e) {
  e.preventDefault();

  if (selectedFiles.length === 0) return;

  const formData = new FormData();
  const photosData = [];

  let hasErrors = false;

  selectedFiles.forEach((file, index) => {
    const titleInput = document.querySelector(
      `input[data-index="${index}"][data-field="title"]`
    );
    const categorySelect = document.querySelector(
      `select[data-index="${index}"][data-field="category"]`
    );
    const newCategoryInput = document.querySelector(
      `input[data-index="${index}"][data-field="newCategory"]`
    );
    const yearInput = document.querySelector(
      `input[data-index="${index}"][data-field="year"]`
    );
    const linkInput = document.querySelector(
      `input[data-index="${index}"][data-field="link"]`
    );

    // Определяем финальную категорию
    let categoryValue = categorySelect.value;
    if (categoryValue === "other") {
      if (!newCategoryInput.value.trim()) {
        showNotification("Введите новую категорию для фотографии", "error");
        hasErrors = true;
        return;
      }
      categoryValue = newCategoryInput.value.trim();

      // Валидация новой категории
      if (categoryValue.length < 2 || categoryValue.length > 50) {
        showNotification(
          "Название категории должно быть от 2 до 50 символов",
          "error"
        );
        hasErrors = true;
        return;
      }
    }

    if (!titleInput.value || !categoryValue || !yearInput.value) {
      showNotification(
        "Заполните название, категорию и год для каждой фотографии",
        "error"
      );
      hasErrors = true;
      return;
    }

    // Валидация года
    const yearValue = parseInt(yearInput.value);
    if (isNaN(yearValue) || yearValue < 2020 || yearValue > 2030) {
      showNotification("Введите корректный год от 2020 до 2030", "error");
      hasErrors = true;
      return;
    }

    // Валидация ссылки
    const linkValue = linkInput.value.trim();
    if (linkValue && !isValidUrl(linkValue)) {
      showNotification(
        "Укажите корректную ссылку (начинающуюся с http:// или https://)",
        "error"
      );
      hasErrors = true;
      return;
    }

    formData.append("files[]", file);
    photosData.push({
      title: titleInput.value,
      category: categoryValue, // может быть как существующая, так и новая категория
      year: yearValue,
      link: linkValue || "client-template.html",
    });
  });

  if (hasErrors) return;

  formData.append("photosData", JSON.stringify(photosData));
  uploadFiles(formData);
}
function isValidUrl(string) {
  try {
    new URL(string);
    return string.startsWith("http://") || string.startsWith("https://");
  } catch (_) {
    return false;
  }
}

async function uploadFiles(formData) {
  try {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = "<span>Загружается...</span>";

    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch("upload_photos.php", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Фотографии успешно загружены!", "success");
      resetForm();
      loadExistingPhotos();
    } else {
      throw new Error(result.message || "Ошибка загрузки");
    }
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка при загрузке файлов: " + error.message, "error");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = "<span>Загрузить фотографии</span>";
  }
}

function resetForm() {
  selectedFiles = [];
  filePreview.innerHTML = "";
  fileInput.value = "";
  updateUploadButton();
}

/* ========== ЗАГРУЗКА СУЩЕСТВУЮЩИХ ФОТО ============================= */
async function loadExistingPhotos() {
  try {
    loadingStatus.style.display = "block";

    const response = await fetch("img/portfolio/list.json");
    const photos = await response.json();

    allPhotos = photos;
    filteredPhotos = [...allPhotos];
    renderPhotosList();
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    showNotification("Ошибка при загрузке списка фотографий", "error");
  } finally {
    loadingStatus.style.display = "none";
  }
}

/* ========== ОТОБРАЖЕНИЕ СПИСКА С ПОЛЕМ ГОДА ======================= */
function renderPhotosList() {
  photosList.innerHTML = "";

  if (filteredPhotos.length === 0) {
    photosList.innerHTML =
      '<p style="text-align: center; color: #666;">Фотографии не найдены</p>';
    return;
  }

  filteredPhotos.forEach((photo, index) => {
    const photoItem = document.createElement("div");
    photoItem.className = "photo-item";
    photoItem.innerHTML = `
      <img src="img/portfolio/${photo.file}" alt="${photo.title}">
      <div class="photo-info">
        <div class="photo-title">${photo.title}</div>
        <div class="photo-category">${photo.category}</div>
        <div class="photo-year">
          Год: <input type="number" value="${
            photo.year || ""
          }" min="2020" max="2030" 
          data-file="${
            photo.file
          }" class="photo-year-input" onchange="updatePhotoYear('${
      photo.file
    }', this.value)">
        </div>
        <div class="photo-link">
          Ссылка: 
          <input type="url" value="${photo.link || ""}" 
                 data-file="${photo.file}" 
                 class="photo-link-input" 
                 pattern="https?://.+" 
                 title="Введите корректный URL"
                 onchange="updatePhotoLink('${photo.file}', this.value)">
        </div>
        <div class="photo-actions">
          <button class="btn-edit" onclick="editPhoto(${index})">Редактировать</button>
          <button class="btn-delete" onclick="deletePhoto(${index}, '${
      photo.file
    }')">Удалить</button>
        </div>
      </div>
    `;
    photosList.appendChild(photoItem);
  });
}

/* ========== ОБНОВЛЕНИЕ ГОДА НА МЕСТЕ ============================== */
async function updatePhotoYear(filename, newYear) {
  // Валидация года
  const yearNum = parseInt(newYear);
  if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
    showNotification("Введите корректный год от 2020 до 2030", "error");
    loadExistingPhotos(); // сброс поля к исходному значению
    return;
  }

  try {
    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch("update_photo_year.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: filename,
        year: yearNum,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Год обновлён!", "success");
      // Обновляем локальные данные
      const photoIndex = allPhotos.findIndex((p) => p.file === filename);
      if (photoIndex !== -1) {
        allPhotos[photoIndex].year = yearNum;
        filteredPhotos = [...allPhotos];
        applyFilters(); // переприменяем фильтры
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showNotification("Ошибка при обновлении года: " + error.message, "error");
    loadExistingPhotos(); // сброс к исходному состоянию
  }
}

/* ========== ОБНОВЛЕНИЕ ССЫЛКИ НА МЕСТЕ ============================= */
async function updatePhotoLink(filename, newLink) {
  // Валидация ссылки
  if (newLink && !isValidUrl(newLink)) {
    showNotification(
      "Укажите корректную ссылку (начинающуюся с http:// или https://)",
      "error"
    );
    loadExistingPhotos(); // сброс поля к исходному значению
    return;
  }

  try {
    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch("update_photo_link.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: filename,
        link: newLink || "client-template.html",
      }),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Ссылка обновлена!", "success");
      // Обновляем локальные данные
      const photoIndex = allPhotos.findIndex((p) => p.file === filename);
      if (photoIndex !== -1) {
        allPhotos[photoIndex].link = newLink || "client-template.html";
        filteredPhotos = [...allPhotos];
        applyFilters(); // переприменяем фильтры
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showNotification("Ошибка при обновлении ссылки: " + error.message, "error");
    loadExistingPhotos(); // сброс к исходному состоянию
  }
}

/* ========== ФИЛЬТРАЦИЯ И ПОИСК ===================================== */
function initializeFilters() {
  searchInput.addEventListener("input", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
}

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  filteredPhotos = allPhotos.filter((photo) => {
    const matchesSearch = photo.title.toLowerCase().includes(searchTerm);
    const matchesCategory =
      !selectedCategory || photo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  renderPhotosList();
}

/* ========== РЕДАКТИРОВАНИЕ С ИСПРАВЛЕННЫМ МОДАЛЬНЫМ ОКНОМ ========== */
async function editPhoto(index) {
  const photo = filteredPhotos[index];

  // Создаем диалог редактирования
  const modal = document.createElement("div");
  modal.className = "edit-modal";
  modal.innerHTML = `
    <div class="edit-modal__overlay"></div>
    <div class="edit-modal__content">
      <h3>Редактировать фотографию</h3>
      
      <div class="edit-field">
        <label>Название:</label>
        <input type="text" id="editTitle" value="${photo.title}" required>
      </div>
      
      <div class="edit-field">
        <label>Категория:</label>
        <select id="editCategory" required>
          <option value="">Выберите категорию</option>
          <option value="Свадьба" ${
            photo.category === "Свадьба" ? "selected" : ""
          }>Свадьба</option>
          <option value="Портрет" ${
            photo.category === "Портрет" ? "selected" : ""
          }>Портрет</option>
          <option value="Семья" ${
            photo.category === "Семья" ? "selected" : ""
          }>Семья</option>
          <option value="Street" ${
            photo.category === "Street" ? "selected" : ""
          }>Street</option>
          <option value="Природа" ${
            photo.category === "Природа" ? "selected" : ""
          }>Природа</option>
          <option value="События" ${
            photo.category === "События" ? "selected" : ""
          }>События</option>
          <option value="other">Другое (введите)</option>
        </select>
        <input type="text" id="editNewCategory" placeholder="Введите новую категорию" 
               class="new-category-input">
      </div>
      
      <div class="edit-field">
        <label>Год:</label>
        <input type="number" id="editYear" value="${
          photo.year || ""
        }" min="2020" max="2030" required>
      </div>
      
      <div class="edit-field">
        <label>Ссылка:</label>
        <input type="url" id="editLink" value="${photo.link || ""}" 
               pattern="https?://.+" title="Введите корректный URL">
      </div>
      
      <div class="edit-actions">
        <button type="button" class="btn-cancel">Отмена</button>
        <button type="button" class="btn-save">Сохранить</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Получаем элементы модального окна
  const modalContent = modal.querySelector(".edit-modal__content");
  const modalOverlay = modal.querySelector(".edit-modal__overlay");
  const categorySelect = modal.querySelector("#editCategory");
  const newCategoryInput = modal.querySelector("#editNewCategory");

  // Предотвращаем закрытие при клике на контент модального окна
  modalContent.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Если текущая категория не в списке, показываем поле "Другое"
  const standardCategories = [
    "Свадьба",
    "Портрет",
    "Семья",
    "Street",
    "Природа",
    "События",
  ];
  const isCustomCategory = !standardCategories.includes(photo.category);

  if (isCustomCategory) {
    categorySelect.value = "other";
    newCategoryInput.classList.add("show");
    newCategoryInput.value = photo.category;
    newCategoryInput.required = true;
  }

  // Обработчик селекта категорий
  categorySelect.addEventListener("change", (e) => {
    if (e.target.value === "other") {
      newCategoryInput.classList.add("show");
      newCategoryInput.required = true;
      newCategoryInput.focus(); // фокус на поле ввода
    } else {
      newCategoryInput.classList.remove("show");
      newCategoryInput.required = false;
      newCategoryInput.value = "";
    }
  });

  // Функция закрытия модального окна
  function closeModal() {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  }

  // Обработчики закрытия модального окна
  modal.querySelector(".btn-cancel").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  // Закрытие по клавише Escape
  function handleEscape(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  }
  document.addEventListener("keydown", handleEscape);

  // Обработчик сохранения
  modal.querySelector(".btn-save").addEventListener("click", async () => {
    const newTitle = modal.querySelector("#editTitle").value.trim();
    const newCategorySelect = modal.querySelector("#editCategory").value;
    const newCategoryCustom = modal
      .querySelector("#editNewCategory")
      .value.trim();
    const newYear = modal.querySelector("#editYear").value;
    const newLink = modal.querySelector("#editLink").value.trim();

    // Определяем финальную категорию
    let finalCategory = newCategorySelect;
    if (newCategorySelect === "other") {
      if (!newCategoryCustom) {
        showNotification("Введите новую категорию", "error");
        newCategoryInput.focus();
        return;
      }
      finalCategory = newCategoryCustom;

      // Валидация новой категории
      if (finalCategory.length < 2 || finalCategory.length > 50) {
        showNotification(
          "Название категории должно быть от 2 до 50 символов",
          "error"
        );
        newCategoryInput.focus();
        return;
      }
    }

    if (!newTitle || !finalCategory || !newYear) {
      showNotification("Заполните все обязательные поля", "error");
      return;
    }

    // Валидация года
    const yearNum = parseInt(newYear);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      showNotification("Введите корректный год от 2020 до 2030", "error");
      modal.querySelector("#editYear").focus();
      return;
    }

    // Валидация ссылки
    if (newLink && !isValidUrl(newLink)) {
      showNotification(
        "Укажите корректную ссылку (начинающуюся с http:// или https://)",
        "error"
      );
      modal.querySelector("#editLink").focus();
      return;
    }

    // Блокируем кнопку во время сохранения
    const saveBtn = modal.querySelector(".btn-save");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Сохраняется...";
    saveBtn.disabled = true;

    try {
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch("update_photo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: photo.file,
          title: newTitle,
          category: finalCategory,
          year: yearNum,
          link: newLink || "client-template.html",
        }),
      });

      const result = await response.json();

      if (result.success) {
        showNotification("Фотография обновлена!", "success");
        closeModal();
        document.removeEventListener("keydown", handleEscape);
        loadExistingPhotos();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification("Ошибка при обновлении: " + error.message, "error");
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  });

  // Устанавливаем фокус на первое поле
  setTimeout(() => {
    modal.querySelector("#editTitle").focus();
  }, 100);
}

async function deletePhoto(index, filename) {
  if (!confirm("Вы уверены, что хотите удалить эту фотографию?")) return;

  try {
    // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
    const response = await fetch("delete_photo.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: filename }),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Фотография удалена!", "success");
      loadExistingPhotos();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showNotification("Ошибка при удалении: " + error.message, "error");
  }
}

/* ========== УВЕДОМЛЕНИЯ ========================================== */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  notifications.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}
