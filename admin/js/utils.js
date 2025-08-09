class Utils {
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');

        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYY-MM-DD HH:mm':
                return `${year}-${month}-${day} ${hour}:${minute}`;
            case 'YYYY-MM-DD HH:mm:ss':
                return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            case 'MM-DD':
                return `${month}-${day}`;
            case 'HH:mm':
                return `${hour}:${minute}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }

    static formatMoney(amount) {
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        return amount.toFixed(2);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setUrlParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    }

    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    static isMobile() {
        return window.innerWidth <= 768;
    }

    static scrollToElement(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    };

    static sessionStorage = {
        set(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Session storage set error:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const value = sessionStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (e) {
                console.error('Session storage get error:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Session storage remove error:', e);
                return false;
            }
        },

        clear() {
            try {
                sessionStorage.clear();
                return true;
            } catch (e) {
                console.error('Session storage clear error:', e);
                return false;
            }
        }
    };

    static formatRelativeTime(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffMs = now - targetDate;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSeconds < 60) {
            return '刚刚';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays < 30) {
            return `${diffDays}天前`;
        } else if (diffMonths < 12) {
            return `${diffMonths}个月前`;
        } else {
            return `${diffYears}年前`;
        }
    }

    static colorUtils = {
        random() {
            return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        },

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        rgbToHex(r, g, b) {
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        },

        getContrastColor(hex) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) return '#000000';
            
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }
    };

    static arrayUtils = {
        unique(arr) {
            return [...new Set(arr)];
        },

        groupBy(arr, key) {
            return arr.reduce((groups, item) => {
                const group = item[key];
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(item);
                return groups;
            }, {});
        },

        sortBy(arr, key, order = 'asc') {
            return arr.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                
                if (order === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        },

        paginate(arr, page, size) {
            const startIndex = (page - 1) * size;
            const endIndex = startIndex + size;
            return arr.slice(startIndex, endIndex);
        },

        search(arr, query, keys) {
            const lowercaseQuery = query.toLowerCase();
            return arr.filter(item => {
                return keys.some(key => {
                    const value = item[key];
                    return value && value.toString().toLowerCase().includes(lowercaseQuery);
                });
            });
        }
    };

    static domUtils = {
        createElement(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else if (key === 'textContent') {
                    element.textContent = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });

            return element;
        },

        addEventListeners(element, events) {
            Object.keys(events).forEach(event => {
                element.addEventListener(event, events[event]);
            });
        },

        clearChildren(element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        },

        toggleClass(element, className) {
            element.classList.toggle(className);
        },

        getElementPosition(element) {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            };
        }
    };

    static validation = {
        rules: {
            required: (value) => value && value.trim() !== '',
            email: (value) => Utils.validateEmail(value),
            url: (value) => Utils.validateUrl(value),
            minLength: (min) => (value) => value && value.length >= min,
            maxLength: (max) => (value) => value && value.length <= max,
            number: (value) => !isNaN(value),
            positiveNumber: (value) => !isNaN(value) && Number(value) > 0
        },

        validateField(value, rules) {
            const errors = [];
            
            rules.forEach(rule => {
                if (typeof rule === 'function') {
                    if (!rule(value)) {
                        errors.push('验证失败');
                    }
                } else if (typeof rule === 'object') {
                    if (!rule.validator(value)) {
                        errors.push(rule.message || '验证失败');
                    }
                }
            });

            return {
                isValid: errors.length === 0,
                errors
            };
        },

        validateForm(formData, schema) {
            const errors = {};
            let isValid = true;

            Object.keys(schema).forEach(field => {
                const rules = schema[field];
                const value = formData[field];
                const result = this.validateField(value, rules);
                
                if (!result.isValid) {
                    errors[field] = result.errors;
                    isValid = false;
                }
            });

            return {
                isValid,
                errors
            };
        }
    };
}

window.Utils = Utils;
