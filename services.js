/* ==========================================
   Услуги с модальными окнами
   ========================================== */

class ServicesManager {
  constructor() {
    this.servicesData = [];
    this.servicesGrid = document.getElementById('servicesGrid');
    this.serviceModal = document.getElementById('serviceModal');
    
    this.init();
  }
  
  async init() {
    await this.loadServices();
    this.renderServices();
    this.bindModalEvents();
  }
  
  async loadServices() {
    try {
      const response = await fetch('data/services.json');
      this.servicesData = await response.json();
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  }
  
  renderServices() {
    if (!this.servicesGrid || this.servicesData.length === 0) return;
    
    this.servicesGrid.innerHTML = '';
    
    this.servicesData.forEach(service => {
      const serviceCard = this.createServiceCard(service);
      this.servicesGrid.appendChild(serviceCard);
    });
  }
  
  createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.serviceId = service.id;
    
    card.innerHTML = `
      <div class="service-card__image">
        <img src="${service.image}" alt="${service.title}" loading="lazy">
      </div>
      <div class="service-card__content">
        <h3 class="service-card__title">${service.title}</h3>
        <div class="service-card__price">${service.price}</div>
        <p class="service-card__description">${service.shortDescription}</p>
      </div>
    `;
    
    card.addEventListener('click', () => this.openModal(service));
    
    return card;
  }
  
  bindModalEvents() {
    const closeBtn = this.serviceModal.querySelector('.service-modal__close');
    const overlay = this.serviceModal.querySelector('.service-modal__overlay');
    
    closeBtn.addEventListener('click', () => this.closeModal());
    overlay.addEventListener('click', () => this.closeModal());
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.serviceModal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }
  
  openModal(service) {
    // Заполняем модальное окно данными
    this.serviceModal.querySelector('.service-modal__image').src = service.image;
    this.serviceModal.querySelector('.service-modal__title').textContent = service.title;
    this.serviceModal.querySelector('.service-modal__price').textContent = service.price;
    this.serviceModal.querySelector('.service-modal__description').textContent = service.fullDescription;
    
    // Заполняем список особенностей
    const featuresList = this.serviceModal.querySelector('.service-modal__features');
    featuresList.innerHTML = '';
    service.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    
    // Показываем модальное окно
    this.serviceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeModal() {
    this.serviceModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ========== ИНИЦИАЛИЗАЦИЯ ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('servicesGrid')) {
    new ServicesManager();
  }
});
