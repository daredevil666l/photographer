/* ==========================================
   Календарь записи на фотосессию - отправка на отдельный PHP файл
   ========================================== */

class BookingCalendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.availableDates = [];
    
    this.calendarDays = document.getElementById('calendarDays');
    this.currentMonth = document.getElementById('currentMonth');
    this.bookingForm = document.getElementById('bookingForm');
    this.selectedDateSpan = document.getElementById('selectedDate');
    this.calendarLoader = document.getElementById('calendarLoader');
    this.notifications = document.getElementById('notifications');
    
    this.init();
  }
  
  async init() {
    if (!window.bookingData) {
      this.showNotification('Ошибка: данные не загружены', 'error');
      return;
    }
    
    this.bindEvents();
    await this.loadAvailableDates();
    this.renderCalendar();
  }
  
  async loadAvailableDates() {
    try {
      this.calendarLoader.style.display = 'block';
      
      const response = await fetch(window.bookingData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get_available_booking_dates'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.availableDates = result.dates;
        console.log('Загружено доступных дат:', this.availableDates.length);
      } else {
        throw new Error(result.error || 'Ошибка загрузки');
      }
    } catch (error) {
      console.error('Ошибка загрузки доступных дат:', error);
      this.showNotification('Ошибка загрузки доступных дат', 'error');
    } finally {
      this.calendarLoader.style.display = 'none';
    }
  }
  
  bindEvents() {
    document.getElementById('prevMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
    
    document.getElementById('cancelBooking').addEventListener('click', () => {
      this.hideBookingForm();
    });
    
    document.getElementById('submitBooking').addEventListener('submit', (e) => {
      this.handleFormSubmit(e);
    });
  }
  
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Заголовок месяца
    this.currentMonth.textContent = this.currentDate.toLocaleDateString('ru', {
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    
    // Начинаем с понедельника
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Преобразуем в понедельник = 0
    startDate.setDate(firstDay.getDate() - dayOfWeek);
    
    // Очищаем календарь
    this.calendarDays.innerHTML = '';
    
    // Генерируем 42 дня (6 недель)
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createDayElement(cellDate, month);
      this.calendarDays.appendChild(dayElement);
    }
  }
  
  createDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = date.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Определяем класс дня
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add('other-month');
    } else if (date < today) {
      dayElement.classList.add('past');
    } else if (this.isDateAvailable(date)) {
      dayElement.classList.add('available');
      dayElement.addEventListener('click', () => this.selectDate(date));
    } else {
      dayElement.classList.add('unavailable');
    }
    
    return dayElement;
  }
  
  isDateAvailable(date) {
    const dateString = date.toISOString().split('T')[0];
    return this.availableDates.includes(dateString);
  }
  
  selectDate(date) {
    this.selectedDate = date;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Показываем форму
    this.showBookingForm(date);
  }
  
  showBookingForm(date) {
    const dateString = date.toLocaleDateString('ru', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    this.selectedDateSpan.textContent = dateString;
    this.bookingForm.style.display = 'block';
    this.bookingForm.scrollIntoView({ behavior: 'smooth' });
  }
  
  hideBookingForm() {
    this.bookingForm.style.display = 'none';
    this.selectedDate = null;
    
    // Убираем выделение
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.classList.remove('selected');
    });
  }
  
  // ЕДИНСТВЕННАЯ функция handleFormSubmit - отправка на отдельный PHP файл
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const originalText = btnText.textContent;
    
    // Блокируем кнопку
    submitBtn.disabled = true;
    btnText.textContent = 'Отправка...';
    
    try {
      const formData = new FormData(e.target);
      // Добавляем выбранную дату
      formData.append('date', this.selectedDate.toISOString().split('T')[0]);
      
      console.log('Отправка на:', window.bookingData.submitUrl);
      
      // Отправляем на отдельный PHP файл
      const response = await fetch(window.bookingData.submitUrl, {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Сервер вернул некорректный JSON');
      }
      
      if (result.success) {
        this.showNotification(result.message, 'success');
        this.hideBookingForm();
        e.target.reset();
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Ошибка отправки:', error);
      this.showNotification('Ошибка при отправке заявки: ' + error.message, 'error');
    } finally {
      // Разблокируем кнопку
      submitBtn.disabled = false;
      btnText.textContent = originalText;
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    this.notifications.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.booking-calendar')) {
    new BookingCalendar();
  }
});
