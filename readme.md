<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Документация проекта: Сайт фотографа с админ-панелью

## Общая архитектура

Проект представляет собой **веб-сайт фотографа** с полноценной **административной панелью** для управления контентом. Фронтенд полностью готов, бэкенд нужно реализовать на PHP.

### Основные компоненты:

1. **Публичный сайт** - портфолио фотографа для клиентов
2. **Админ-панель** - управление контентом сайта
3. **Система клиентских страниц** - индивидуальные галереи для клиентов
4. **Система онлайн-записи** - календарь с доступными датами

---

## Структура файлов проекта

```
project/
├── index.html                    # Главная страница
├── portfolio.html                # Страница портфолио  
├── about.html                    # Страница "Обо мне"
├── booking.html                  # Страница онлайн-записи
├── contacts.html                 # Страница контактов
├── style.css                     # Основные стили сайта
├── main.js                       # Основной JavaScript
│
│                     # Админ-панель
├── manage_portfolio.html                # Управление портфолио
├── manage-calendar.html      # Управление календарём
├── create-client-page.html   # Создание страниц клиентов
├── admin.js                  # JS админ-панели
├── calendar-admin.js         # JS управления календарём  
├── client-admin.js           # JS создания клиентских страниц
│
├── data/                         # JSON файлы с данными
│   ├── reviews.json              # Отзывы клиентов
│   └── available-dates.json      # Доступные даты записи
│
├── img/                          # Изображения
│   ├── portfolio/                # Фото портфолио
│   │   ├── list.json            # Список фото портфолио
│   │   ├── photo1.jpg
│   │   └── ...
│   └── uploads/                  # Загружаемые изображения
│
│                     # Клиентские страницы
├── client-template.html      # Шаблон клиентской страницы
├── client-page.js           # JS клиентских страниц
├── [generated-pages]/       # Генерируемые PHP страницы
│
└── api/                         # PHP API (нужно создать)
    ├── upload_photos.php        # Загрузка фото в портфолио
    ├── update_photo.php         # Редактирование фото
    ├── delete_photo.php         # Удаление фото
    ├── add_available_dates.php  # Добавление дат записи
    ├── delete_available_date.php # Удаление дат записи
    ├── submit_booking.php       # Обработка заявок на запись
    ├── send_contact.php         # Обработка контактной формы
    ├── create_client_page.php   # Создание страницы клиента
    └── download_all_photos.php  # Скачивание архива фото
```


---

## Система данных

### 1. Портфолио (`img/portfolio/list.json`)

```json
[
  {
    "file": "wedding-01.jpg",
    "title": "Свадебная церемония", 
    "category": "Свадьба",
    "link": "client/ivan-petrov-wedding-2025.html"
  }
]
```

**Управляется через:** `manage_portfolio.html` → `upload_photos.php`, `update_photo.php`, `delete_photo.php`

### 2. Отзывы (`data/reviews.json`)

```json
[
  {
    "id": 1,
    "author": "ИВАН ПЕТРОВ",
    "text": "Текст отзыва..."
  }
]
```

**Управляется через:** Прямое редактирование JSON (пока)

### 3. Доступные даты (`data/available-dates.json`)

```json
[
  "2025-01-15",
  "2025-01-18", 
  "2025-01-22"
]
```

**Управляется через:** `manage-calendar.html` → `add_available_dates.php`, `delete_available_date.php`

### 4. Клиентские страницы (генерируются PHP)

**Шаблон:** `client-template.html`
**Плейсхолдеры для замены:**

- `{{CLIENT_NAME}}` - имя клиента
- `{{SESSION_TITLE}}` - название фотосессии
- `{{SESSION_DATE}}` - дата съёмки
- `{{SESSION_CATEGORY}}` - категория
- `{{SESSION_DESCRIPTION}}` - описание
- `{{PHOTOS}}` - массив фотографий
- `{{ENABLE_DOWNLOAD}}` - разрешение скачивания

---

## API endpoints для реализации

### Управление портфолио

#### `POST /api/upload_photos.php`

**Вход:** FormData с файлами + JSON метаданными

```json
{
  "photosData": "[{\"title\":\"...\", \"category\":\"...\", \"link\":\"...\"}]"
}
```

**Задачи:**

1. Сохранить файлы в `img/portfolio/`
2. Обновить `img/portfolio/list.json`
3. Вернуть `{"success": true/false, "message": "..."}`

#### `POST /api/update_photo.php`

**Вход:**

```json
{
  "file": "wedding-01.jpg",
  "title": "Новое название",
  "category": "Новая категория", 
  "link": "new-link.html"
}
```

**Задачи:**

1. Найти фото в `list.json`
2. Обновить метаданные
3. Сохранить изменения

#### `POST /api/delete_photo.php`

**Вход:**

```json
{
  "file": "wedding-01.jpg"
}
```

**Задачи:**

1. Удалить файл из `img/portfolio/`
2. Удалить запись из `list.json`

### Управление календарём

#### `POST /api/add_available_dates.php`

**Вход:**

```json
{
  "dates": ["2025-01-15", "2025-01-18"]
}
```

**Задачи:**

1. Добавить даты в `available-dates.json`
2. Проверить на дубликаты

#### `POST /api/delete_available_date.php`

**Вход:**

```json
{
  "date": "2025-01-15"
}
```


### Система записи

#### `POST /api/submit_booking.php`

**Вход:**

```json
{
  "date": "2025-01-15",
  "name": "Иван Петров",
  "phone": "+7-XXX-XXX-XXXX",
  "email": "ivan@example.com",
  "session_type": "wedding",
  "message": "Комментарий..."
}
```

**Задачи:**

1. Сохранить заявку в БД
2. Отправить уведомление админу (email)
3. Отправить подтверждение клиенту

### Контактная форма

#### `POST /api/send_contact.php`

**Вход:**

```json
{
  "name": "Имя",
  "email": "email@example.com", 
  "message": "Сообщение"
}
```


### Система клиентских страниц

#### `POST /api/create_client_page.php`

**Вход:** FormData с фотографиями + метаданными

```json
{
  "client_name": "Иван Петров",
  "session_title": "Свадебная фотосессия",
  "session_category": "wedding",
  "session_date": "2025-01-15",
  "session_description": "Описание...",
  "page_url": "ivan-petrov-wedding-2025",
  "access_password": "password123",
  "enable_download": true
}
```

**Задачи:**

1. Создать папку клиента в `client/`
2. Сохранить фотографии
3. Сгенерировать HTML из шаблона
4. Заменить плейсхолдеры на данные
5. Вернуть ссылку на созданную страницу

#### `POST /api/download_all_photos.php`

**Вход:**

```json
{
  "session_id": "ivan-petrov-wedding-2025"
}
```

**Задачи:**

1. Найти папку клиента
2. Создать ZIP архив
3. Вернуть файл для скачивания

---

## Логика работы фронтенда

### Публичные страницы

1. **index.html** - загружает портфолио из `list.json` (первые 7 фото)
2. **portfolio.html** - загружает весь `list.json` с фильтрацией и пагинацией
3. **about.html** - загружает отзывы из `reviews.json`
4. **booking.html** - загружает доступные даты из `available-dates.json`
5. **contacts.html** - обрабатывает контактную форму

### Админ-панель

1. **admin.html** - CRUD для портфолио через API
2. **manage-calendar.html** - управление датами записи
3. **create-client-page.html** - создание клиентских страниц

### Клиентские страницы

1. Генерируются из `client-template.html`
2. Содержат галерею с лайтбоксом
3. Поддерживают скачивание фото

---

## Технические особенности

### Загрузка изображений

- **Drag \& Drop** интерфейс
- **Превью** перед загрузкой
- **Валидация** типов файлов
- **Автоматический resize** для веб-оптимизации


### Безопасность

- **Валидация** всех входящих данных
- **Ограничение** типов загружаемых файлов
- **Защита** от SQL-инъекций
- **Пароли** для клиентских страниц


### Производительность

- **Ленивая загрузка** изображений
- **Пагинация** портфолио (по 10 фото)
- **Оптимизация** изображений
- **Кэширование** JSON данных


### Адаптивность

- **Mobile-first** подход
- **Breakpoints:** 320px, 480px, 600px, 768px, 899px, 1024px, 1200px
- **Гибкие сетки** и **флексбокс**
- **Масштабируемая типографика**

---

## Рекомендации для бэкенда

### База данных

Рекомендуется использовать **MySQL** с таблицами:

- `bookings` - заявки на запись
- `contacts` - обращения через форму
- `client_sessions` - данные клиентских страниц
- `available_dates` - доступные даты (дублирует JSON)


### Структура ответов API

Все эндпоинты должны возвращать JSON:

```json
{
  "success": true/false,
  "message": "Описание результата",
  "data": {...}  // опционально
}
```


### Обработка ошибок

- **400** - некорректные данные
- **401** - требуется авторизация
- **403** - доступ запрещён
- **404** - ресурс не найден
- **500** - внутренняя ошибка сервера


### Уведомления

- **Email** уведомления админу о новых заявках
- **Подтверждения** клиентам об успешной записи
- **Логирование** всех операций

Фронтенд готов к интеграции и ожидает только реализации API на PHP. Все функции UI/UX полностью работают с заглушками и автоматически переключатся на реальные данные после подключения бэкенда.

<div style="text-align: center">⁂</div>

[^1]: https://www.reddit.com/r/webdev/comments/10psajz/how_does_your_frontend_and_backend_teams_work/

[^2]: https://github.com/pratik-app/DynamicPortfolio

[^3]: https://github.com/kishor1445/portfolio_backend

[^4]: https://softwareengineering.stackexchange.com/questions/370474/frontend-and-backend-developer-working-on-a-project-who-starts-the-tasks-first

[^5]: https://aguayo.co/en/blog-aguayo-user-experience/frontend-vs-backend-ux-influence/

[^6]: https://strapi.io/blog/how-frontend-and-backend-components-interact-in-a-full-stack-app

[^7]: https://www.computerscience.org/bootcamps/resources/frontend-vs-backend/

[^8]: https://www.bluepixel.mx/post/front-end-back-end-meaning-uses

[^9]: https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends

[^10]: https://www.upwork.com/freelance-jobs/apply/Responsive-Portfolio-Website-with-Admin-Panel-Private-Password-Protected-Projects_~021912422523359997900/

