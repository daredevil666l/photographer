(function() {
    'use strict';
    
    let selectedFiles = [];
    
    // DOM элементы
    const createClientForm = document.getElementById('createClientForm');
    const clientUploadZone = document.getElementById('clientUploadZone');
    const clientFileInput = document.getElementById('clientFileInput');
    const clientFilePreview = document.getElementById('clientFilePreview');
    const notifications = document.getElementById('notifications');

    document.addEventListener('DOMContentLoaded', function() {
        if (!createClientForm) {
            return; // Не страница создания клиента
        }
        
        console.log('Инициализация создания клиентской страницы...');
        initializeUpload();
        initializeForm();
    });

    function initializeUpload() {
        if (!clientUploadZone || !clientFileInput) return;
        
        // Клик по зоне загрузки
        clientUploadZone.addEventListener('click', () => {
            clientFileInput.click();
        });
        
        // Выбор файлов
        clientFileInput.addEventListener('change', handleFileSelect);
        
        // Drag & Drop
        clientUploadZone.addEventListener('dragover', handleDragOver);
        clientUploadZone.addEventListener('dragleave', handleDragLeave);
        clientUploadZone.addEventListener('drop', handleDrop);
    }

    function handleDragOver(e) {
        e.preventDefault();
        clientUploadZone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        clientUploadZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        clientUploadZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        processFiles(files);
    }

    function processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        selectedFiles = [...selectedFiles, ...imageFiles];
        updateFilePreview();
        updateFileInput();
    }

    function updateFileInput() {
        // Создаем новый DataTransfer для обновления input
        const dt = new DataTransfer();
        selectedFiles.forEach(file => dt.items.add(file));
        clientFileInput.files = dt.files;
    }

    function updateFilePreview() {
        if (!clientFilePreview) return;
        
        clientFilePreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'client-preview-item';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            
            const info = document.createElement('div');
            info.className = 'client-preview-info';
            info.innerHTML = `
                <span class="filename">${file.name}</span>
                <span class="filesize">${formatFileSize(file.size)}</span>
            `;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'client-preview-remove';
            removeBtn.innerHTML = '×';
            removeBtn.type = 'button';
            removeBtn.onclick = () => removeFile(index);
            
            previewItem.appendChild(img);
            previewItem.appendChild(info);
            previewItem.appendChild(removeBtn);
            clientFilePreview.appendChild(previewItem);
        });
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFilePreview();
        updateFileInput();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function initializeForm() {
        createClientForm.addEventListener('submit', handleFormSubmit);
        
        // Автогенерация URL из названия
        const sessionTitleInput = createClientForm.querySelector('input[name="session_title"]');
        const pageUrlInput = createClientForm.querySelector('input[name="page_url"]');
        
        if (sessionTitleInput && pageUrlInput) {
            sessionTitleInput.addEventListener('input', function() {
                if (!pageUrlInput.value) {
                    const slug = generateSlug(this.value);
                    pageUrlInput.value = slug;
                }
            });
        }
    }

    function generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // убираем спецсимволы
            .replace(/[\s_-]+/g, '-') // заменяем пробелы на дефисы
            .replace(/^-+|-+$/g, ''); // убираем дефисы в начале и конце
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!window.clientAdminData) {
            showNotification('Ошибка: данные не загружены', 'error');
            return;
        }
        
        const submitBtn = createClientForm.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('span');
        const originalText = btnText.textContent;
        
        // Блокируем кнопку
        submitBtn.disabled = true;
        btnText.textContent = 'Создание...';
        
        try {
            const formData = new FormData(createClientForm);
            formData.append('action', 'create_client_page');
            formData.append('nonce', window.clientAdminData.nonce);
            
            console.log('Отправка формы создания клиентской страницы...');
            
            const response = await fetch(window.clientAdminData.ajaxUrl, {
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
            
            console.log('Parsed result:', result);
            
            if (result.success) {
                showNotification(result.message, 'success');
                
                // Показываем ссылку на созданную страницу
                setTimeout(() => {
                    showNotification(`Страница создана: <a href="${result.page_url}" target="_blank">Открыть страницу</a>`, 'success');
                }, 1000);
                
                // Очищаем форму
                createClientForm.reset();
                selectedFiles = [];
                updateFilePreview();
                
            } else {
                showNotification(result.error || 'Ошибка создания страницы', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка при создании страницы:', error);
            showNotification('Ошибка при создании страницы: ' + error.message, 'error');
        } finally {
            // Разблокируем кнопку
            submitBtn.disabled = false;
            btnText.textContent = originalText;
        }
    }

    function showNotification(message, type = 'info') {
        if (!notifications) {
            alert(message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;

        notifications.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

})();
