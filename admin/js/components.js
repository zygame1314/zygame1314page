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
                            placeholder: field.placeholder || '',
                            value: field.value || ''
                        });
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
            const preview = Utils.domUtils.createElement('img', {
                src: field.value || 'https://bucket.zygame1314.site/static/images/default-project.jpg',
                alt: '图片预览',
                className: 'image-preview'
            });
            const fileInput = Utils.domUtils.createElement('input', { type: 'file', accept: 'image/*', style: 'display: none;' });
            const uploadButton = Utils.domUtils.createElement('button', { type: 'button', textContent: '选择图片', className: 'btn btn-secondary' });
            const hiddenInput = Utils.domUtils.createElement('input', { type: 'hidden', name: field.name, value: field.value || '' });

            uploadButton.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                uploadButton.textContent = '正在上传...';
                uploadButton.disabled = true;

                try {
                    const compressedFile = await Utils.imageUtils.compressAndConvertToWebP(file);
                    const formData = new FormData();
                    formData.append('file', compressedFile);
                    if (field.uploadContext) {
                        formData.append('context', field.uploadContext);
                    }

                    const response = await fetch('/functions/upload-image', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        preview.src = result.url;
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
            });

            container.append(preview, uploadButton, fileInput, hiddenInput);
            return container;
        },

        getFormData(form) {
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
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
`;
document.head.appendChild(style);

window.Components = Components;
