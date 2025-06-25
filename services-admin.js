/* ==========================================
   Управление услугами - Frontend
   ========================================== */

class ServicesAdmin {
  constructor() {
    this.servicesData = [];
    this.selectedImage = null;
    this.editingServiceId = null;
    
    // DOM элементы
    this.uploadZone = document.getElementById('serviceUploadZone');
    this.fileInput = document.getElementById('serviceFileInput');
    this.imagePreview = document.getElementById('serviceImagePreview');
    this.addForm = document.getElementById('addServiceForm');
    this.servicesList = document.getElementById('servicesList');
    this.loadingStatus = document.getElementById('loadingStatus');
    this.editModal = document.getElementById('editServiceModal');
    this.editForm = document.getElementById('editServiceForm');
    this.notifications = document.getElementById('notifications');
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadServices();
  }
  
  bindEvents() {
    // Загрузка изображения для новой услуги
    this.uploadZone.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleImageSelect(e));
    this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Отправка формы добавления
    this.addForm.addEventListener('submit', (e) => this.handleAddService(e));
    
    // Загрузка изображения для редактирования
    const editUploadZone = document.getElementById('editServiceUploadZone');
    const editFileInput = document.getElementById('editServiceFileInput');
    const editImagePreview = document.getElementById('editServiceImagePreview');
    
    editUploadZone.addEventListener('click', () => editFileInput.click());
    editFileInput.addEventListener('change', (e) => this.handleEditImageSelect(e));
    
    // Модальное окно редактирования
    this.editForm.addEventListener('submit', (e) => this.handleEditService(e));
    this.editModal.querySelector('.btn-cancel').addEventListener('click', () => this.closeEditModal());
    this.editModal.querySelector('.edit-service-modal__overlay').addEventListener('click', () => this.closeEditModal());
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.editModal.classList.contains('active')) {
        this.closeEditModal();
      }
    });
  }
  
  /* ========== DRAG & DROP ========================================== */
  handleDragOver(e) {
    e.preventDefault();
    this.uploadZone.classList.add('dragover');
  }
  
  handleDragLeave(e) {
    e.preventDefault();
    this.uploadZone.classList.remove('dragover');
  }
  
  handleDrop(e) {
    e.preventDefault();
    this.uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processImage(files[0]);
    }
  }
  
  handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processImage(file);
    }
  }
  
  handleEditImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processEditImage(file);
    }
  }
  
  processImage(file) {
    if (!file.type.startsWith('image/')) {
      this.showNotification('Выберите файл изображения', 'error');
      return;
    }
    
    this.selectedImage = file;
    this.showImagePreview(file, this.imagePreview);
  }
  
  processEditImage(file) {
    if (!file.type.startsWith('image/')) {
      this.showNotification('Выберите файл изображения', 'error');
      return;
    }
    
    this.selectedEditImage = file;
    const editImagePreview = document.getElementById('editServiceImagePreview');
    this.showImagePreview(file, editImagePreview);
  }
  
  showImagePreview(file, previewContainer) {
    previewContainer.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => {
      previewContainer.classList.remove('show');
      previewContainer.innerHTML = '';
      if (previewContainer === this.imagePreview) {
        this.selectedImage = null;
        this.fileInput.value = '';
      } else {
        this.selectedEditImage = null;
        document.getElementById('editServiceFileInput').value = '';
      }
    };
    
    previewContainer.appendChild(img);
    previewContainer.appendChild(removeBtn);
    previewContainer.classList.add('show');
  }
  
  /* ========== ЗАГРУЗКА УСЛУГ ======================================= */
  async loadServices() {
    try {
      this.loadingStatus.style.display = 'block';
      
      const response = await fetch('data/services.json');
      this.servicesData = await response.json();
      this.renderServicesList();
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      this.showNotification('Ошибка при загрузке списка услуг', 'error');
    } finally {
      this.loadingStatus.style.display = 'none';
    }
  }
  
  renderServicesList() {
    this.servicesList.innerHTML = '';
    
    if (this.servicesData.length === 0) {
      this.servicesList.innerHTML = '<p style="text-align: center; color: #666;">Услуги не найдены</p>';
      return;
    }
    
    this.servicesData.forEach(service => {
      const serviceItem = this.createServiceItem(service);
      this.servicesList.appendChild(serviceItem);
    });
  }
  
  createServiceItem(service) {
    const item = document.createElement('div');
    item.className = 'service-item';
    item.innerHTML = `
      <img src="${service.image}" alt="${service.title}" class="service-item__image">
      <div class="service-item__content">
        <div class="service-item__title">${service.title}</div>
        <div class="service-item__price">${service.price}</div>
        <div class="service-item__description">${service.shortDescription}</div>
        <div class="service-item__actions">
          <button class="btn-edit-service" onclick="servicesAdmin.editService(${service.id})">Редактировать</button>
          <button class="btn-delete-service" onclick="servicesAdmin.deleteService(${service.id})">Удалить</button>
        </div>
      </div>
    `;
    return item;
  }
  
  /* ========== ДОБАВЛЕНИЕ УСЛУГИ ==================================== */
  async handleAddService(e) {
    e.preventDefault();
    
    if (!this.selectedImage) {
      this.showNotification('Выберите изображение для услуги', 'error');
      return;
    }
    
    const formData = new FormData(e.target);
    const serviceData = {
      title: formData.get('title'),
      price: formData.get('price'),
      shortDescription: formData.get('shortDescription'),
      fullDescription: formData.get('fullDescription'),
      features: formData.get('features').split('\n').filter(f => f.trim())
    };
    
    try {
      const submitBtn = e.target.querySelector('.services-admin__btn');
      submitBtn.innerHTML = '<span>Добавляется...</span>';
      submitBtn.disabled = true;
      
      // Создаем FormData для отправки
      const uploadData = new FormData();
      uploadData.append('serviceImage', this.selectedImage);
      uploadData.append('serviceData', JSON.stringify(serviceData));
      
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch('add_service.php', {
        method: 'POST',
        body: uploadData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Услуга успешно добавлена!', 'success');
        this.resetAddForm();
        this.loadServices();
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      this.showNotification('Ошибка при добавлении услуги: ' + error.message, 'error');
    } finally {
      const submitBtn = e.target.querySelector('.services-admin__btn');
      submitBtn.innerHTML = '<span>Добавить услугу</span>';
      submitBtn.disabled = false;
    }
  }
  
  resetAddForm() {
    this.addForm.reset();
    this.selectedImage = null;
    this.imagePreview.classList.remove('show');
    this.imagePreview.innerHTML = '';
  }
  
  /* ========== РЕДАКТИРОВАНИЕ УСЛУГИ ================================ */
  editService(serviceId) {
    const service = this.servicesData.find(s => s.id === serviceId);
    if (!service) return;
    
    this.editingServiceId = serviceId;
    
    // Заполняем форму редактирования
    document.getElementById('editTitle').value = service.title;
    document.getElementById('editPrice').value = service.price;
    document.getElementById('editShortDescription').value = service.shortDescription;
    document.getElementById('editFullDescription').value = service.fullDescription;
    document.getElementById('editFeatures').value = service.features.join('\n');
    document.getElementById('currentServiceImage').src = service.image;
    
    // Очищаем превью нового изображения
    document.getElementById('editServiceImagePreview').classList.remove('show');
    document.getElementById('editServiceImagePreview').innerHTML = '';
    this.selectedEditImage = null;
    
    this.editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  async handleEditService(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const serviceData = {
      id: this.editingServiceId,
      title: document.getElementById('editTitle').value,
      price: document.getElementById('editPrice').value,
      shortDescription: document.getElementById('editShortDescription').value,
      fullDescription: document.getElementById('editFullDescription').value,
      features: document.getElementById('editFeatures').value.split('\n').filter(f => f.trim())
    };
    
    try {
      const submitBtn = e.target.querySelector('.btn-save');
      submitBtn.innerHTML = 'Сохраняется...';
      submitBtn.disabled = true;
      
      // Создаем FormData для отправки
      const uploadData = new FormData();
      if (this.selectedEditImage) {
        uploadData.append('serviceImage', this.selectedEditImage);
      }
      uploadData.append('serviceData', JSON.stringify(serviceData));
      
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch('update_service.php', {
        method: 'POST',
        body: uploadData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Услуга обновлена!', 'success');
        this.closeEditModal();
        this.loadServices();
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      this.showNotification('Ошибка при обновлении: ' + error.message, 'error');
    } finally {
      const submitBtn = e.target.querySelector('.btn-save');
      submitBtn.innerHTML = 'Сохранить';
      submitBtn.disabled = false;
    }
  }
  
  closeEditModal() {
    this.editModal.classList.remove('active');
    document.body.style.overflow = '';
    this.editingServiceId = null;
  }
  
  /* ========== УДАЛЕНИЕ УСЛУГИ ====================================== */
  async deleteService(serviceId) {
    const service = this.servicesData.find(s => s.id === serviceId);
    if (!service) return;
    
    if (!confirm(`Вы уверены, что хотите удалить услугу "${service.title}"?`)) return;
    
    try {
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch('delete_service.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Услуга удалена!', 'success');
        this.loadServices();
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      this.showNotification('Ошибка при удалении: ' + error.message, 'error');
    }
  }
  
  /* ========== УВЕДОМЛЕНИЯ ========================================== */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    this.notifications.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Глобальная переменная для доступа из HTML
let servicesAdmin;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  servicesAdmin = new ServicesAdmin();
});
