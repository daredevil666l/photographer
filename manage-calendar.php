<?php
/**
* Template Name: manage-calendar
*/

// Проверяем права доступа
if (!current_user_can('administrator')) {
    wp_redirect(home_url());
    exit;
}

get_header();
?>

<!-- =================== УПРАВЛЕНИЕ КАЛЕНДАРЁМ =================== -->
<main class="calendar-admin">
  <div class="calendar-admin__container">
    
    <h1 class="calendar-admin__title">Управление календарём записи</h1>
    
    <!-- блок добавления новых дат -->
    <section class="calendar-admin__add">
      <h2 class="calendar-admin__section-title">Добавить доступные даты</h2>
      
      <div class="add-dates-form">
        
        <!-- календарь для выбора дат -->
        <div class="date-picker-section">
          <label class="date-picker-label">Выберите даты для записи:</label>
          
          <div class="date-picker-widget">
            <div class="date-picker-header">
              <button id="datePrevMonth" class="date-nav">←</button>
              <h3 id="dateCurrentMonth" class="date-title"></h3>
              <button id="dateNextMonth" class="date-nav">→</button>
            </div>
            
            <div class="date-picker-weekdays">
              <div>Пн</div><div>Вт</div><div>Ср</div>
              <div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
            </div>
            
            <div id="datePickerDays" class="date-picker-days">
              <!-- дни будут генерироваться JS -->
            </div>
          </div>
          
          <div class="selected-dates">
            <h4>Выбранные даты:</h4>
            <div id="selectedDatesList" class="selected-dates-list">
              <span style="color: #999;">Даты не выбраны</span>
            </div>
          </div>
          
          <div class="date-actions">
            <button id="clearSelection" class="calendar-admin__btn-secondary">
              Очистить выбор
            </button>
            <button id="addSelectedDates" class="calendar-admin__btn" disabled>
              <span>Добавить выбранные даты</span>
            </button>
          </div>
        </div>
        
      </div>
    </section>

    <!-- блок управления существующими датами -->
    <section class="calendar-admin__manage">
      <h2 class="calendar-admin__section-title">Управление доступными датами</h2>
      
      <!-- фильтры и поиск -->
      <div class="calendar-admin__filters">
        <select id="monthFilter" class="calendar-admin__select">
          <option value="">Все месяцы</option>
        </select>
        <select id="statusFilter" class="calendar-admin__select">
          <option value="">Все даты</option>
          <option value="future">Будущие даты</option>
          <option value="past">Прошедшие даты</option>
        </select>
      </div>
      
      <!-- список доступных дат -->
      <div id="availableDatesList" class="available-dates-list">
        <!-- будет заполнен через JavaScript -->
      </div>
      
      <!-- статус загрузки -->
      <div id="loadingStatus" class="loading-status" style="display: none;">Загружается...</div>
      
    </section>

  </div>
</main>

<!-- уведомления -->
<div id="notifications" class="notifications"></div>

<script>
// Передаем данные в JavaScript
window.calendarAdminData = {
    ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
    nonce: '<?php echo wp_create_nonce('calendar_admin_nonce'); ?>'
};
</script>

<?php wp_footer();?>
<?php get_footer();?>

<script src="<?php echo get_stylesheet_directory_uri();?>/js/calendar-admin.js"></script>
</body>
</html>
