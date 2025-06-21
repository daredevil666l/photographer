/* ==========================================
   Создание страницы клиента - Frontend
   ========================================== */

class ClientAdmin {
  constructor() {
    this.selectedFiles = [];
    this.uploadZone = document.getElementById('clientUploadZone');
    this.fileInput = document.getElementById('clientFileInput');
    this.filePreview = document.getElementById('clientFilePreview');
    this.form = document.getElementById('createClientForm');
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.generateURL();
  }
  
  bindEvents() {
    // Drag & Drop
    this.uploadZone.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Автогенерация URL
    const clientNameInput = document.querySelector('input[name="client_name"]');
    const sessionTitleInput = document.querySelector('input[name="session_title"]');
    
    clientNameInput.addEventListener('input', () => this.generateURL());
    sessionTitleInput.addEventListener('input', () => this.generateURL());
    
    // Отправка формы
    this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }
  
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
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }
  
  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
  }
  
  processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    this.selectedFiles = [...this.selectedFiles, ...imageFiles];
    this.updateFilePreview();
  }
  
  updateFilePreview() {
    this.filePreview.innerHTML = '';
    
    this.selectedFiles.forEach((file, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'client-preview-item';
      
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      
      const info = document.createElement('div');
      info.className = 'client-preview-info';
      info.innerHTML = `
        <strong>${file.name}</strong><br>
        ${(file.size / 1024 / 1024).toFixed(2)} MB
      `;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'client-remove-preview';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = () => this.removeFile(index);
      
      previewItem.appendChild(img);
      previewItem.appendChild(info);
      previewItem.appendChild(removeBtn);
      this.filePreview.appendChild(previewItem);
    });
  }
  
  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.updateFilePreview();
  }
  
  generateURL() {
    const clientName = document.querySelector('input[name="client_name"]').value;
    const sessionTitle = document.querySelector('input[name="session_title"]').value;
    const urlInput = document.querySelector('input[name="page_url"]');
    
    if (clientName || sessionTitle) {
      const url = (clientName + '-' + sessionTitle + '-2025')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      urlInput.value = url;
    }
  }
  
  async handleFormSubmit(e) {
    e.preventDefault();
    
    if (this.selectedFiles.length === 0) {
      this.showNotification('Необходимо загрузить хотя бы одну фотографию', 'error');
      return;
    }
    
    const formData = new FormData(e.target);
    
    // Добавляем файлы
    this.selectedFiles.forEach((file, index) => {
      formData.append(`photos[]`, file);
    });
    
    try {
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА PHP
      const response = await fetch('create_client_page.php', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Страница клиента успешно создана!', 'success');
        
        // Переход на созданную страницу
        setTimeout(() => {
          window.open(result.page_url, '_blank');
        }, 2000);
        
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      this.showNotification('Ошибка при создании страницы: ' + error.message, 'error');
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notifications');
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  new ClientAdmin();
});
