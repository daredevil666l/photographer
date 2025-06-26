/* ==========================================
   Функциональность клиентской страницы
   ========================================== */

class ClientPage {
  constructor() {
    this.currentPhotoIndex = 0;
    this.photos = [];
    
    this.lightbox = document.getElementById('lightbox');
    this.lightboxImage = document.getElementById('lightboxImage');
    
    this.init();
  }
  
  init() {
    this.collectPhotos();
    this.bindEvents();
  }
  
  collectPhotos() {
    const photoItems = document.querySelectorAll('.client-photo-item');
    this.photos = Array.from(photoItems).map(item => ({
      element: item,
      src: item.querySelector('img').src,
      alt: item.querySelector('img').alt
    }));
  }
  
  bindEvents() {
    // Клик по фотографии - открыть лайтбокс
    this.photos.forEach((photo, index) => {
      photo.element.addEventListener('click', (e) => {
        if (!e.target.closest('.client-photo-download')) {
          this.openLightbox(index);
        }
      });
    });
    
    // Навигация лайтбокса
    document.getElementById('lightboxClose').addEventListener('click', () => {
      this.closeLightbox();
    });
    
    document.getElementById('lightboxPrev').addEventListener('click', () => {
      this.prevPhoto();
    });
    
    document.getElementById('lightboxNext').addEventListener('click', () => {
      this.nextPhoto();
    });
    
    // Закрытие по клику на overlay
    document.querySelector('.lightbox__overlay').addEventListener('click', () => {
      this.closeLightbox();
    });
    
    // Клавиатурная навигация
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.style.display === 'flex') {
        switch(e.key) {
          case 'Escape':
            this.closeLightbox();
            break;
          case 'ArrowLeft':
            this.prevPhoto();
            break;
          case 'ArrowRight':
            this.nextPhoto();
            break;
        }
      }
    });
    
    // Скачивание отдельных фото
    document.querySelectorAll('.client-photo-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const downloadUrl = btn.dataset.url;
        this.downloadPhoto(downloadUrl);
      });
    });
    
    // Скачивание всех фото
    const downloadAllBtn = document.getElementById('downloadAll');
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        this.downloadAllPhotos();
      });
    }
  }
  
  openLightbox(index) {
    this.currentPhotoIndex = index;
    this.lightboxImage.src = this.photos[index].src;
    this.lightboxImage.alt = this.photos[index].alt;
    this.lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  closeLightbox() {
    this.lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  prevPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photos.length) % this.photos.length;
    this.lightboxImage.src = this.photos[this.currentPhotoIndex].src;
    this.lightboxImage.alt = this.photos[this.currentPhotoIndex].alt;
  }
  
  nextPhoto() {
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
    this.lightboxImage.src = this.photos[this.currentPhotoIndex].src;
    this.lightboxImage.alt = this.photos[this.currentPhotoIndex].alt;
  }
  
  downloadPhoto(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.click();
  }
  
  async downloadAllPhotos() {
    try {
      // ЗДЕСЬ БУДЕТ ЗАПРОС К PHP ДЛЯ СОЗДАНИЯ ZIP-АРХИВА
      const response = await fetch('download_all_photos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: window.SESSION_ID })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'photos.zip';
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Ошибка создания архива');
      }
      
    } catch (error) {
      alert('Ошибка при скачивании: ' + error.message);
    }
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  new ClientPage();
});
