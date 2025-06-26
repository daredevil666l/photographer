/* ==========================================
   Управление календарём записи - WordPress
   ========================================== */

class CalendarAdmin {
  constructor() {
    this.currentDate = new Date();
    this.selectedDates = new Set();
    this.availableDates = [];
    this.allDates = [];

    this.datePickerDays = document.getElementById("datePickerDays");
    this.dateCurrentMonth = document.getElementById("dateCurrentMonth");
    this.selectedDatesList = document.getElementById("selectedDatesList");
    this.availableDatesList = document.getElementById("availableDatesList");
    this.loadingStatus = document.getElementById("loadingStatus");
    this.notifications = document.getElementById("notifications");

    this.init();
  }

  async init() {
    if (!window.calendarAdminData) {
      this.showNotification('Ошибка: данные не загружены', 'error');
      return;
    }
    
    this.bindEvents();
    await this.loadAvailableDates();
    this.renderDatePicker();
    this.renderAvailableDates();
    this.populateMonthFilter();
  }

  bindEvents() {
    // Навигация по календарю
    document.getElementById("datePrevMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderDatePicker();
    });

    document.getElementById("dateNextMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderDatePicker();
    });

    // Действия с выбранными датами
    document.getElementById("clearSelection").addEventListener("click", () => {
      this.clearSelection();
    });

    document.getElementById("addSelectedDates").addEventListener("click", () => {
      this.addSelectedDates();
    });

    // Фильтры
    document.getElementById("monthFilter").addEventListener("change", () => {
      this.applyFilters();
    });

    document.getElementById("statusFilter").addEventListener("change", () => {
      this.applyFilters();
    });
  }

  async loadAvailableDates() {
    try {
      this.loadingStatus.style.display = "block";

      const response = await fetch(window.calendarAdminData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get_booking_dates',
          nonce: window.calendarAdminData.nonce
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.availableDates = result.dates.map(item => item.date);
        this.allDates = [...result.dates];
      } else {
        throw new Error(result.error || 'Ошибка загрузки');
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      this.showNotification("Ошибка при загрузке доступных дат", "error");
    } finally {
      this.loadingStatus.style.display = "none";
    }
  }

  renderDatePicker() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Заголовок месяца
    this.dateCurrentMonth.textContent = this.currentDate
      .toLocaleDateString("ru", {
        month: "long",
        year: "numeric",
      })
      .toUpperCase();

    // Очищаем календарь
    this.datePickerDays.innerHTML = "";

    // Генерируем дни месяца
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(firstDay.getDate() - dayOfWeek);

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);

      const dayElement = this.createDatePickerDay(cellDate, month);
      this.datePickerDays.appendChild(dayElement);
    }
  }

  createDatePickerDay(date, currentMonth) {
    const dayElement = document.createElement("div");
    dayElement.className = "date-picker-day";
    dayElement.textContent = date.getDate();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Определяем состояние дня
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add("other-month");
    } else if (dateString < todayString) {
      dayElement.classList.add("past");
    } else {
      dayElement.classList.add("available");

      if (this.availableDates.includes(dateString)) {
        dayElement.classList.add("already-available");
      }

      if (this.selectedDates.has(dateString)) {
        dayElement.classList.add("selected");
      }

      dayElement.addEventListener("click", () =>
        this.toggleDateSelection(dateString)
      );
    }

    return dayElement;
  }

  toggleDateSelection(dateString) {
    if (this.selectedDates.has(dateString)) {
      this.selectedDates.delete(dateString);
    } else {
      this.selectedDates.add(dateString);
    }

    this.renderDatePicker();
    this.updateSelectedDatesList();
    this.updateAddButton();
  }

  updateSelectedDatesList() {
    this.selectedDatesList.innerHTML = "";

    if (this.selectedDates.size === 0) {
      this.selectedDatesList.innerHTML =
        '<span style="color: #999;">Даты не выбраны</span>';
      return;
    }

    Array.from(this.selectedDates)
      .sort()
      .forEach((dateString) => {
        const tag = document.createElement("div");
        tag.className = "selected-date-tag";

        const formattedDate = new Date(dateString).toLocaleDateString("ru", {
          day: "numeric",
          month: "short",
        });

        tag.innerHTML = `
        ${formattedDate}
        <button class="remove-date" onclick="calendarAdmin.removeSelectedDate('${dateString}')">×</button>
      `;

        this.selectedDatesList.appendChild(tag);
      });
  }

  removeSelectedDate(dateString) {
    this.selectedDates.delete(dateString);
    this.renderDatePicker();
    this.updateSelectedDatesList();
    this.updateAddButton();
  }

  updateAddButton() {
    const addButton = document.getElementById("addSelectedDates");
    addButton.disabled = this.selectedDates.size === 0;
  }

  clearSelection() {
    this.selectedDates.clear();
    this.renderDatePicker();
    this.updateSelectedDatesList();
    this.updateAddButton();
  }

  async addSelectedDates() {
    if (this.selectedDates.size === 0) return;

    const newDates = Array.from(this.selectedDates);
    const addButton = document.getElementById("addSelectedDates");
    
    addButton.disabled = true;
    addButton.innerHTML = '<span>Добавление...</span>';

    try {
      const response = await fetch(window.calendarAdminData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'add_booking_dates',
          dates: JSON.stringify(newDates),
          nonce: window.calendarAdminData.nonce
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(result.message, "success");
        this.clearSelection();
        await this.loadAvailableDates();
        this.renderAvailableDates();
        this.renderDatePicker();
        this.populateMonthFilter();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showNotification(
        "Ошибка при добавлении дат: " + error.message,
        "error"
      );
    } finally {
      addButton.disabled = false;
      addButton.innerHTML = '<span>Добавить выбранные даты</span>';
    }
  }

  renderAvailableDates() {
    this.availableDatesList.innerHTML = "";

    const datesToShow = this.availableDates.length > 0 ? 
      this.allDates.filter(item => this.availableDates.includes(item.date)) : 
      this.allDates;

    if (datesToShow.length === 0) {
      this.availableDatesList.innerHTML =
        '<p style="text-align: center; color: #666;">Доступные даты не найдены</p>';
      return;
    }

    datesToShow.forEach((dateItem) => {
      const dateElement = this.createDateItem(dateItem);
      this.availableDatesList.appendChild(dateElement);
    });
  }

  createDateItem(dateItem) {
    const date = new Date(dateItem.date);
    const today = new Date();
    const isPast = date < today;

    const dateItemElement = document.createElement("div");
    dateItemElement.className = `date-item ${isPast ? "past" : ""}`;

    const formattedDate = date.toLocaleDateString("ru", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    dateItemElement.innerHTML = `
      <div class="date-info">
        <div class="date-display">${formattedDate}</div>
        <div class="date-status ${isPast ? "past" : "future"}">
          ${isPast ? "Прошедшая дата" : "Доступна для записи"}
        </div>
        <div class="date-bookings">
          Записей: ${dateItem.current_bookings || 0} из ${dateItem.max_bookings || 1}
        </div>
      </div>
      <div class="date-actions">
        <button class="btn-delete-date" onclick="calendarAdmin.deleteDate('${dateItem.date}')">
          Удалить
        </button>
      </div>
    `;

    return dateItemElement;
  }

  async deleteDate(dateString) {
    if (!confirm("Вы уверены, что хотите удалить эту дату?")) return;

    try {
      const response = await fetch(window.calendarAdminData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'delete_booking_date',
          date: dateString,
          nonce: window.calendarAdminData.nonce
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification("Дата удалена!", "success");
        await this.loadAvailableDates();
        this.renderAvailableDates();
        this.renderDatePicker();
        this.populateMonthFilter();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showNotification("Ошибка при удалении: " + error.message, "error");
    }
  }

  populateMonthFilter() {
    const monthFilter = document.getElementById("monthFilter");
    const currentOptions = Array.from(monthFilter.options).map(opt => opt.value);
    
    // Очищаем только динамические опции
    monthFilter.innerHTML = '<option value="">Все месяцы</option>';
    
    const months = {};

    this.allDates.forEach((dateItem) => {
      const date = new Date(dateItem.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString("ru", {
        month: "long",
        year: "numeric",
      });
      months[monthKey] = monthName;
    });

    Object.entries(months).forEach(([key, name]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = name;
      monthFilter.appendChild(option);
    });
  }

  applyFilters() {
    const monthFilter = document.getElementById("monthFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;
    const today = new Date().toISOString().split("T")[0];

    const filteredDates = this.allDates.filter((dateItem) => {
      const date = new Date(dateItem.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      const matchesMonth = !monthFilter || monthKey === monthFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "future" && dateItem.date >= today) ||
        (statusFilter === "past" && dateItem.date < today);

      return matchesMonth && matchesStatus;
    });

    // Временно сохраняем отфильтрованные даты
    const originalAllDates = this.allDates;
    this.allDates = filteredDates;
    this.availableDates = filteredDates.map(item => item.date);
    
    this.renderAvailableDates();
    
    // Восстанавливаем оригинальные данные
    this.allDates = originalAllDates;
    this.availableDates = originalAllDates.map(item => item.date);
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
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

// Глобальная переменная для доступа из HTML
let calendarAdmin;

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  calendarAdmin = new CalendarAdmin();
});
