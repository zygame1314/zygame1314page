class Components {
    static notification = {
        container: null,

        init() {
            this.container = document.getElementById('notifications');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'notifications';
                this.container.className = 'notifications';
                document.body.appendChild(this.container);
            }
        },

        show(message, type = 'info', duration = 5000, title = null) {
            if (!this.container) this.init();

            const notification = Utils.domUtils.createElement('div', {
                className: `notification ${type}`
            });

            const iconClass = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            }[type] || 'fas fa-info-circle';

            notification.innerHTML = `
                <i class="notification-icon ${iconClass}"></i>
                <div class="notification-content">
                    ${title ? `<div class="notification-title">${title}</div>` : ''}
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            `;

            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                this.hide(notification);
            });

            this.container.appendChild(notification);

            if (duration > 0) {
                setTimeout(() => {
                    this.hide(notification);
                }, duration);
            }

            return notification;
        },

        hide(notification) {
            if (notification && notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        },

        success(message, title = '成功') {
            return this.show(message, 'success', 5000, title);
        },

        error(message, title = '错误') {
            return this.show(message, 'error', 7000, title);
        },

        warning(message, title = '警告') {
            return this.show(message, 'warning', 6000, title);
        },

        info(message, title = '提示') {
            return this.show(message, 'info', 5000, title);
        }
    };

    static modal = {
        current: null,

        show(title, content, options = {}) {
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            const modalSave = document.getElementById('modalSave');
            const modalCancel = document.getElementById('modalCancel');

            modalTitle.textContent = title;
            modalBody.innerHTML = content;

            modalSave.textContent = options.saveText || '保存';
            modalCancel.textContent = options.cancelText || '取消';

            if (options.saveClass) {
                modalSave.className = `btn ${options.saveClass}`;
            } else {
                modalSave.className = 'btn btn-primary';
            }

            const newSave = modalSave.cloneNode(true);
            const newCancel = modalCancel.cloneNode(true);
            modalSave.parentNode.replaceChild(newSave, modalSave);
            modalCancel.parentNode.replaceChild(newCancel, modalCancel);

            if (options.onSave) {
                newSave.addEventListener('click', options.onSave);
            }

            if (options.onCancel) {
                newCancel.addEventListener('click', options.onCancel);
            } else {
                newCancel.addEventListener('click', () => this.hide());
            }

            const newModalBody = modalBody.cloneNode(true);
            modalBody.parentNode.replaceChild(newModalBody, modalBody);
            
            newModalBody.addEventListener('click', (e) => {
                if (e.target && (e.target.matches('.image-uploader .btn') || e.target.matches('.audio-uploader .btn'))) {
                    const uploader = e.target.closest('.image-uploader, .audio-uploader');
                    if (uploader) {
                        const fileInput = uploader.querySelector('input[type="file"]');
                        if (fileInput) {
                            fileInput.click();
                        }
                    }
                }

                if (e.target && e.target.matches('.remove-key-value-item, .remove-key-value-item *')) {
                    const item = e.target.closest('.key-value-item');
                    if (item) {
                        item.remove();
                    }
                }

                if (e.target && e.target.matches('.add-key-value-item')) {
                    const editor = e.target.closest('.key-value-editor');
                    if (editor) {
                        const itemsContainer = editor.querySelector('.key-value-items');
                        const newItem = Components.formBuilder.createItem();
                        itemsContainer.appendChild(newItem);
                    }
                }
            });

            newModalBody.addEventListener('change', async (e) => {
                if (e.target && e.target.matches('.image-uploader input[type="file"]')) {
                    const uploader = e.target.closest('.image-uploader');
                    const file = e.target.files[0];
                    if (!file || !uploader) return;

                    const uploadButton = uploader.querySelector('.btn');
                    const preview = uploader.querySelector('.image-preview');
                    const hiddenInput = uploader.querySelector('input[type="hidden"]');

                    uploadButton.textContent = '正在上传...';
                    uploadButton.disabled = true;

                    try {
                        const compressedFile = await Utils.imageUtils.compressAndConvertToWebP(file);
                        const formData = new FormData();
                        formData.append('file', compressedFile);
                        
                        const uploadContext = uploader.dataset.context;
                        if (uploadContext) {
                            formData.append('context', uploadContext);
                        }

                        const response = await fetch('https://api.zygame1314.site/admin/upload-image', {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            }
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                            preview.src = result.url;
                            preview.classList.remove('no-image');
                            preview.style.display = '';
                            hiddenInput.value = result.url;
                            Components.notification.success('图片上传成功');
                        } else {
                            throw new Error(result.error || '上传失败');
                        }
                    } catch (error) {
                        Components.notification.error(`上传失败: ${error.message}`);
                    } finally {
                        uploadButton.textContent = '选择图片';
                        uploadButton.disabled = false;
                    }
                }

                if (e.target && e.target.matches('.audio-uploader input[type="file"]')) {
                    const uploader = e.target.closest('.audio-uploader');
                    const file = e.target.files[0];
                    if (!file || !uploader) return;

                    const statusDiv = uploader.querySelector('.upload-status');
                    const hiddenInput = uploader.querySelector('input[type="hidden"]');
                    const uploadButton = uploader.querySelector('.btn');

                    if (file.type !== 'audio/webm' && !file.name.toLowerCase().endsWith('.webm')) {
                        Components.notification.error('文件格式无效', '请上传 WebM (.webm) 格式的音频文件。');
                        e.target.value = '';
                        return;
                    }

                    statusDiv.textContent = '正在上传...';
                    uploadButton.disabled = true;
                    uploadButton.textContent = '上传中...';

                    try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('https://api.zygame1314.site/admin/upload-audio', {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            }
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                            hiddenInput.value = result.path;
                            statusDiv.textContent = `上传成功: ${result.path}`;
                            Components.notification.success('音频上传成功');
                        } else {
                            throw new Error(result.error || '上传失败');
                        }
                    } catch (error) {
                        statusDiv.textContent = `上传失败: ${error.message}`;
                        Components.notification.error(`上传失败: ${error.message}`);
                    } finally {
                        uploadButton.disabled = false;
                        uploadButton.textContent = '选择文件';
                    }
                }
            });

            modal.classList.add('show');
            this.current = modal;

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hide();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            return modal;
        },

        hide() {
            if (this.current) {
                this.current.classList.remove('show');
                this.current = null;
            }
        },

        confirm(title, message, onConfirm, onCancel = null) {
            const confirmModal = document.getElementById('confirmModal');
            const confirmTitle = document.getElementById('confirmTitle');
            const confirmMessage = document.getElementById('confirmMessage');
            const confirmOk = document.getElementById('confirmOk');
            const confirmCancel = document.getElementById('confirmCancel');

            confirmTitle.textContent = title;
            confirmMessage.textContent = message;

            const newOk = confirmOk.cloneNode(true);
            const newCancel = confirmCancel.cloneNode(true);
            confirmOk.parentNode.replaceChild(newOk, confirmOk);
            confirmCancel.parentNode.replaceChild(newCancel, confirmCancel);

            newOk.addEventListener('click', () => {
                confirmModal.classList.remove('show');
                if (onConfirm) onConfirm();
            });

            newCancel.addEventListener('click', () => {
                confirmModal.classList.remove('show');
                if (onCancel) onCancel();
            });

            confirmModal.classList.add('show');
        }
    };

    static table = {
        create(containerId, columns, data, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const table = Utils.domUtils.createElement('table', {
                className: 'data-table'
            });

            const thead = Utils.domUtils.createElement('thead');
            const headerRow = Utils.domUtils.createElement('tr');

            columns.forEach(column => {
                const th = Utils.domUtils.createElement('th', {
                    textContent: column.title
                });
                if (column.width) {
                    th.style.width = column.width;
                }
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = Utils.domUtils.createElement('tbody');
            
            if (data.length === 0) {
                const emptyRow = Utils.domUtils.createElement('tr');
                const emptyCell = Utils.domUtils.createElement('td', {
                    textContent: options.emptyText || '暂无数据',
                    colspan: columns.length.toString()
                });
                emptyCell.style.textAlign = 'center';
                emptyCell.style.padding = '2rem';
                emptyCell.style.color = 'var(--text-muted)';
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
            } else {
                data.forEach(row => {
                    const tr = Utils.domUtils.createElement('tr');
                    
                    columns.forEach(column => {
                        const td = Utils.domUtils.createElement('td');
                        
                        if (column.render) {
                            td.innerHTML = column.render(row[column.key], row);
                        } else {
                            td.textContent = row[column.key] || '';
                        }
                        
                        tr.appendChild(td);
                    });
                    
                    tbody.appendChild(tr);
                });
            }

            table.appendChild(tbody);
            container.innerHTML = '';
            container.appendChild(table);

            return table;
        }
    };

    static pagination = {
        create(containerId, currentPage, totalPages, onPageChange) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            container.innerHTML = '';

            if (totalPages <= 1) return;

            const pagination = Utils.domUtils.createElement('div', {
                className: 'pagination'
            });

            const prevBtn = Utils.domUtils.createElement('button', {
                className: 'pagination-btn',
                textContent: '上一页'
            });
            prevBtn.disabled = currentPage <= 1;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    onPageChange(currentPage - 1);
                }
            });
            pagination.appendChild(prevBtn);

            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                const firstBtn = Utils.domUtils.createElement('button', {
                    className: 'pagination-btn',
                    textContent: '1'
                });
                firstBtn.addEventListener('click', () => onPageChange(1));
                pagination.appendChild(firstBtn);

                if (startPage > 2) {
                    const dots = Utils.domUtils.createElement('span', {
                        textContent: '...',
                        className: 'pagination-dots'
                    });
                    pagination.appendChild(dots);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = Utils.domUtils.createElement('button', {
                    className: `pagination-btn ${i === currentPage ? 'active' : ''}`,
                    textContent: i.toString()
                });
                pageBtn.addEventListener('click', () => onPageChange(i));
                pagination.appendChild(pageBtn);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const dots = Utils.domUtils.createElement('span', {
                        textContent: '...',
                        className: 'pagination-dots'
                    });
                    pagination.appendChild(dots);
                }

                const lastBtn = Utils.domUtils.createElement('button', {
                    className: 'pagination-btn',
                    textContent: totalPages.toString()
                });
                lastBtn.addEventListener('click', () => onPageChange(totalPages));
                pagination.appendChild(lastBtn);
            }

            const nextBtn = Utils.domUtils.createElement('button', {
                className: 'pagination-btn',
                textContent: '下一页'
            });
            nextBtn.disabled = currentPage >= totalPages;
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    onPageChange(currentPage + 1);
                }
            });
            pagination.appendChild(nextBtn);

            container.appendChild(pagination);
            return pagination;
        }
    };

    static loading = {
        show(containerId, message = '加载中...') {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const loading = Utils.domUtils.createElement('div', {
                className: 'loading',
                textContent: message
            });

            container.innerHTML = '';
            container.appendChild(loading);
            return loading;
        },

        hide(containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                const loading = container.querySelector('.loading');
                if (loading) {
                    loading.remove();
                }
            }
        }
    };

    static emptyState = {
        show(containerId, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const emptyState = Utils.domUtils.createElement('div', {
                className: 'empty-state'
            });

            emptyState.innerHTML = `
                <i class="${options.icon || 'fas fa-inbox'}"></i>
                <h3>${options.title || '暂无数据'}</h3>
                <p>${options.message || '还没有任何内容'}</p>
                ${options.action ? `<button class="btn btn-primary">${options.action.text}</button>` : ''}
            `;

            if (options.action && options.action.onClick) {
                const actionBtn = emptyState.querySelector('button');
                actionBtn.addEventListener('click', options.action.onClick);
            }

            container.innerHTML = '';
            container.appendChild(emptyState);
            return emptyState;
        }
    };

    static formBuilder = {
        create(fields) {
            const form = Utils.domUtils.createElement('form');

            fields.forEach(field => {
               if (field.type === 'divider') {
                   const divider = Utils.domUtils.createElement('div', {
                       className: 'form-divider'
                   });
                   divider.textContent = field.label || '';
                   divider.style.marginTop = '2rem';
                   divider.style.marginBottom = '1rem';
                   divider.style.fontWeight = 'bold';
                   divider.style.borderBottom = '1px solid var(--border-color)';
                   divider.style.paddingBottom = '0.5rem';
                   form.appendChild(divider);
                   return;
               }

               const formGroup = Utils.domUtils.createElement('div', {
                   className: `form-group ${field.className || ''}`.trim()
               });

                if (field.label) {
                    const label = Utils.domUtils.createElement('label', {
                        textContent: field.label,
                        for: field.name
                    });
                    if (field.required) {
                        label.innerHTML += ' <span style="color: var(--danger-color);">*</span>';
                    }
                    formGroup.appendChild(label);
                }

                let input;
                switch (field.type) {
                    case 'textarea':
                        input = Utils.domUtils.createElement('textarea', {
                            name: field.name,
                            id: field.name,
                            placeholder: field.placeholder || ''
                        });
                        input.textContent = field.value || '';
                        if (field.rows) input.rows = field.rows;
                        break;
                    case 'select':
                        input = Utils.domUtils.createElement('select', {
                            name: field.name,
                            id: field.name
                        });
                        field.options.forEach(option => {
                            const optionEl = Utils.domUtils.createElement('option', {
                                value: option.value,
                                textContent: option.label
                            });
                            if (option.value === field.value) {
                                optionEl.selected = true;
                            }
                            input.appendChild(optionEl);
                        });
                        break;
                    case 'image-upload':
                        const uploaderContainer = this.createImageUploader(field);
                        formGroup.appendChild(uploaderContainer);
                        break;
                    case 'key-value-editor':
                        const editorContainer = this.createKeyValueEditor(field);
                        formGroup.appendChild(editorContainer);
                       break;
                   case 'audio-upload':
                       const audioUploaderContainer = this.createAudioUploader(field);
                       formGroup.appendChild(audioUploaderContainer);
                       break;
                   case 'file':
                       input = Utils.domUtils.createElement('input', {
                           type: 'file',
                            name: field.name,
                            id: field.name
                        });
                        if (field.accept) input.accept = field.accept;
                        if (field.multiple) input.multiple = true;
                        break;
                    case 'checkbox':
                        input = Utils.domUtils.createElement('input', {
                            type: 'checkbox',
                            name: field.name,
                            id: field.name,
                        });
                        input.checked = field.checked || false;
                        break;
                    default:
                        input = Utils.domUtils.createElement('input', {
                            type: field.type || 'text',
                            name: field.name,
                            id: field.name,
                            placeholder: field.placeholder || '',
                            value: field.value || ''
                        });
                        break;
                }

                if (input) {
                    if (field.required) {
                        input.required = true;
                    }
                    formGroup.appendChild(input);
                }

                if (field.help) {
                    const help = Utils.domUtils.createElement('small', {
                        textContent: field.help,
                        className: 'form-help'
                    });
                    help.style.color = 'var(--text-muted)';
                    help.style.fontSize = '0.75rem';
                    help.style.marginTop = '0.25rem';
                    help.style.display = 'block';
                    formGroup.appendChild(help);
                }

                form.appendChild(formGroup);
            });

            return form;
        },

        createImageUploader(field) {
            const container = Utils.domUtils.createElement('div', { className: 'image-uploader' });
            const hasImage = !!field.value;

            const preview = Utils.domUtils.createElement('img', {
                src: field.value || '',
                alt: '图片预览',
                className: `image-preview ${!hasImage ? 'no-image' : ''}`
            });
             if (!hasImage) {
                preview.style.display = 'none';
            }

            const fileInput = Utils.domUtils.createElement('input', { type: 'file', accept: 'image/*', style: 'display: none;' });
            const uploadButton = Utils.domUtils.createElement('button', { type: 'button', textContent: '选择图片', className: 'btn btn-secondary' });
            const hiddenInput = Utils.domUtils.createElement('input', { type: 'hidden', name: field.name, value: field.value || '' });

            if (field.uploadContext) {
                container.dataset.context = field.uploadContext;
            }

            container.appendChild(preview);
            container.appendChild(uploadButton);
            container.appendChild(fileInput);
            container.appendChild(hiddenInput);
            return container;
        },

        createKeyValueEditor(field) {
            const container = Utils.domUtils.createElement('div', { className: 'key-value-editor', 'data-name': field.name });
            const itemsContainer = Utils.domUtils.createElement('div', { className: 'key-value-items' });
            const addButton = Utils.domUtils.createElement('button', { type: 'button', textContent: '添加操作', className: 'btn btn-secondary btn-sm add-key-value-item' });

            const createItem = (item = {}) => {
                const itemElement = Utils.domUtils.createElement('div', { className: 'key-value-item' });
                itemElement.innerHTML = `
                    <div class="key-value-inputs">
                        <input type="text" class="form-control" data-key="text" placeholder="按钮文字" value="${item.text || ''}">
                        <input type="text" class="form-control" data-key="url" placeholder="URL" value="${item.url || ''}">
                        <select class="form-control" data-key="type">
                            <option value="primary" ${item.type === 'primary' ? 'selected' : ''}>主按钮</option>
                            <option value="secondary" ${item.type === 'secondary' ? 'selected' : ''}>次按钮</option>
                            <option value="external" ${item.type === 'external' ? 'selected' : ''}>外部链接</option>
                        </select>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm remove-key-value-item">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                return itemElement;
            };

            const initialValue = field.value ? (typeof field.value === 'string' ? JSON.parse(field.value) : field.value) : [];
            if (Array.isArray(initialValue) && initialValue.length > 0) {
                initialValue.forEach(item => itemsContainer.appendChild(createItem(item)));
            } else {
                itemsContainer.appendChild(createItem());
            }

            container.appendChild(itemsContainer);
            container.appendChild(addButton);

            return container;
        },

        createItem(item = {}) {
            const itemElement = Utils.domUtils.createElement('div', { className: 'key-value-item' });
            itemElement.innerHTML = `
                <div class="key-value-inputs">
                    <input type="text" class="form-control" data-key="text" placeholder="按钮文字" value="${item.text || ''}">
                    <input type="text" class="form-control" data-key="url" placeholder="URL" value="${item.url || ''}">
                    <select class="form-control" data-key="type">
                        <option value="primary" ${item.type === 'primary' ? 'selected' : ''}>主按钮</option>
                        <option value="secondary" ${item.type === 'secondary' ? 'selected' : ''}>次按钮</option>
                        <option value="external" ${item.type === 'external' ? 'selected' : ''}>外部链接</option>
                    </select>
                </div>
                <button type="button" class="btn btn-danger btn-sm remove-key-value-item">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            return itemElement;
        },

        createAudioUploader(field) {
            const container = Utils.domUtils.createElement('div', { className: 'audio-uploader' });
            const fileInput = Utils.domUtils.createElement('input', { type: 'file', accept: 'audio/webm', style: 'display: none;' });
            const uploadButton = Utils.domUtils.createElement('button', { type: 'button', textContent: '选择文件', className: 'btn btn-secondary' });
            
            const statusDiv = Utils.domUtils.createElement('div', { className: 'upload-status' });
            statusDiv.textContent = field.value ? `当前文件: ${field.value}` : '未选择文件';
            statusDiv.style.marginTop = '0.5rem';
            statusDiv.style.fontSize = '0.8rem';
            statusDiv.style.color = 'var(--text-muted)';
            
            const hiddenInput = Utils.domUtils.createElement('input', { type: 'hidden', name: field.name, value: field.value || '' });

            container.appendChild(uploadButton);
            container.appendChild(fileInput);
            container.appendChild(statusDiv);
            container.appendChild(hiddenInput);
            return container;
        },

        getFormData(form) {
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }

            form.querySelectorAll('.image-uploader, .audio-uploader').forEach(uploader => {
                const hiddenInput = uploader.querySelector('input[type="hidden"]');
                if (hiddenInput) {
                    data[hiddenInput.name] = hiddenInput.value;
                }
            });

            form.querySelectorAll('.key-value-editor').forEach(editor => {
                const name = editor.dataset.name;
                const items = [];
                editor.querySelectorAll('.key-value-item').forEach(item => {
                    const text = item.querySelector('[data-key="text"]').value;
                    const url = item.querySelector('[data-key="url"]').value;
                    const type = item.querySelector('[data-key="type"]').value;
                    if (text && url) {
                        items.push({ text, url, type });
                    }
                });
                data[name] = JSON.stringify(items);
            });
            
            return data;
        },

        setFormData(form, data) {
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = data[key];
                    } else {
                        field.value = data[key] || '';
                    }
                }
            });
        },

        validate(form, rules) {
            const data = this.getFormData(form);
            const errors = {};
            let isValid = true;

            Object.keys(rules).forEach(fieldName => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                const value = data[fieldName];
                const fieldRules = rules[fieldName];

                const result = Utils.validation.validateField(value, fieldRules);
                
                if (!result.isValid) {
                    errors[fieldName] = result.errors;
                    isValid = false;
                    
                    field.style.borderColor = 'var(--danger-color)';
                    
                    const existingError = field.parentNode.querySelector('.field-error');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    const errorMsg = Utils.domUtils.createElement('div', {
                        className: 'field-error',
                        textContent: result.errors[0]
                    });
                    errorMsg.style.color = 'var(--danger-color)';
                    errorMsg.style.fontSize = '0.75rem';
                    errorMsg.style.marginTop = '0.25rem';
                    field.parentNode.appendChild(errorMsg);
                } else {
                    field.style.borderColor = '';
                    const existingError = field.parentNode.querySelector('.field-error');
                    if (existingError) {
                        existingError.remove();
                    }
                }
            });

            return { isValid, errors, data };
        }
    };

    static card = {
        create(options = {}) {
            const card = Utils.domUtils.createElement('div', {
                className: `card ${options.className || ''}`
            });

            if (options.header) {
                const header = Utils.domUtils.createElement('div', {
                    className: 'card-header'
                });
                if (typeof options.header === 'string') {
                    header.innerHTML = options.header;
                } else {
                    header.appendChild(options.header);
                }
                card.appendChild(header);
            }

            if (options.body) {
                const body = Utils.domUtils.createElement('div', {
                    className: 'card-body'
                });
                if (typeof options.body === 'string') {
                    body.innerHTML = options.body;
                } else {
                    body.appendChild(options.body);
                }
                card.appendChild(body);
            }

            if (options.footer) {
                const footer = Utils.domUtils.createElement('div', {
                    className: 'card-footer'
                });
                if (typeof options.footer === 'string') {
                    footer.innerHTML = options.footer;
                } else {
                    footer.appendChild(options.footer);
                }
                card.appendChild(footer);
            }

            return card;
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    Components.notification.init();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .pagination-dots {
        padding: 0.5rem 0.75rem;
        color: var(--text-muted);
    }
    
    .field-error {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .key-value-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        gap: 0.5rem;
    }

    .key-value-inputs {
        display: flex;
        flex-grow: 1;
        gap: 0.5rem;
    }

    .key-value-inputs .form-control {
        flex: 1;
    }
    .image-preview.no-image {
        display: none;
    }
`;
document.head.appendChild(style);

window.Components = Components;
