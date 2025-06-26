/* ==========================================
   Услуги с модальными окнами - WordPress Database
   ========================================== */

class ServicesManager {
  constructor() {
    this.servicesData = [];
    this.servicesGrid = document.getElementById('servicesGrid');
    this.serviceModal = document.getElementById('serviceModal');
    
    this.init();
  }
  
  async init() {
    if (!window.servicesData) {
      console.error('Services data не загружены');
      return;
    }
    
    await this.loadServices();
    this.renderServices();
    this.bindModalEvents();
  }
  
  async loadServices() {
    try {
      const response = await fetch(window.servicesData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get_services'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.servicesData = result.services;
      } else {
        throw new Error(result.error || 'Ошибка загрузки услуг');
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      this.showError();
    }
  }
  
  renderServices() {
    if (!this.servicesGrid) return;
    
    this.servicesGrid.innerHTML = '';
    
    if (this.servicesData.length === 0) {
      this.servicesGrid.innerHTML = '<p class="no-services">Услуги пока не добавлены</p>';
      return;
    }
    
    this.servicesData.forEach(service => {
      const serviceCard = this.createServiceCard(service);
      this.servicesGrid.appendChild(serviceCard);
    });
  }
  
  createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.serviceId = service.id;
    
    const imageUrl = service.image_url || 'https://via.placeholder.com/400x300?text=No+Image';
    
    card.innerHTML = `
      <div class="service-card__image">
        <img src="${imageUrl}" alt="${service.title}" loading="lazy">
      </div>
      <div class="service-card__content">
        <h3 class="service-card__title">${service.title}</h3>
        <div class="service-card__price">${service.price}</div>
        <p class="service-card__description">${service.short_description}</p>
      </div>
    `;
    
    card.addEventListener('click', () => this.openModal(service));
    
    return card;
  }
  
  bindModalEvents() {
    if (!this.serviceModal) return;
    
    const closeBtn = this.serviceModal.querySelector('.service-modal__close');
    const overlay = this.serviceModal.querySelector('.service-modal__overlay');
    
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (overlay) overlay.addEventListener('click', () => this.closeModal());
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.serviceModal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }
  
  openModal(service) {
    if (!this.serviceModal) return;
    
    // Заполняем модальное окно данными
    const imageElement = this.serviceModal.querySelector('.service-modal__image');
    const titleElement = this.serviceModal.querySelector('.service-modal__title');
    const priceElement = this.serviceModal.querySelector('.service-modal__price');
    const descriptionElement = this.serviceModal.querySelector('.service-modal__description');
    const featuresList = this.serviceModal.querySelector('.service-modal__features');
    
    if (imageElement) imageElement.src = service.image_url || 'https://via.placeholder.com/400x300?text=No+Image';
    if (titleElement) titleElement.textContent = service.title;
    if (priceElement) priceElement.textContent = service.price;
    if (descriptionElement) descriptionElement.textContent = service.full_description;
    
    // Заполняем список особенностей
    if (featuresList) {
      featuresList.innerHTML = '';
      if (service.features && service.features.length > 0) {
        service.features.forEach(feature => {
          const li = document.createElement('li');
          li.textContent = feature;
          featuresList.appendChild(li);
        });
      }
    }
    
    // Показываем модальное окно
    this.serviceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeModal() {
    if (this.serviceModal) {
      this.serviceModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  
  showError() {
    if (this.servicesGrid) {
      this.servicesGrid.innerHTML = '<p class="services-error">Ошибка загрузки услуг</p>';
    }
  }
}

/* ========== ИНИЦИАЛИЗАЦИЯ ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('servicesGrid')) {
    new ServicesManager();
  }
});
