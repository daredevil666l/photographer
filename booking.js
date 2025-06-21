/* ==========================================
   Календарь записи на фотосессию
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
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    await this.loadAvailableDates();
    this.renderCalendar();
  }
  
  async loadAvailableDates() {
    try {
      const response = await fetch('data/available-dates.json');
      this.availableDates = await response.json();
    } catch (error) {
      console.error('Ошибка загрузки доступных дат:', error);
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
    
    // Первый день месяца и количество дней
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
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
    
    // Определяем класс дня
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add('other-month');
    } else if (this.isDateAvailable(date)) {
      dayElement.classList.add('available');
      dayElement.addEventListener('click', () => this.selectDate(date));
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
  
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
      date: this.selectedDate.toISOString().split('T')[0],
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      session_type: formData.get('session_type'),
      message: formData.get('message')
    };
    
    try {
      // ЗДЕСЬ БУДЕТ ОТПРАВКА НА СЕРВЕР
      const response = await fetch('submit_booking.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
        this.hideBookingForm();
        e.target.reset();
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      alert('Ошибка при отправке заявки: ' + error.message);
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.booking-calendar')) {
    new BookingCalendar();
  }
});
