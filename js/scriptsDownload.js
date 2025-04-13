document.addEventListener('DOMContentLoaded', function () {
    const scriptsListContainer = document.querySelector('.scripts-list');
    const refreshButton = document.getElementById('refreshScripts');
    const searchInput = document.getElementById('scripts-search');

    let allScripts = [];

    if (!scriptsListContainer || !refreshButton) return;

    loadScripts();

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            filterScripts(this.value);
        });
    }

    refreshButton.addEventListener('click', function () {
        this.classList.add('fa-spin');
        loadScripts().finally(() => {
            setTimeout(() => {
                this.classList.remove('fa-spin');
            }, 500);
        });
    });

    async function loadScripts() {
        scriptsListContainer.innerHTML = '<div class="scripts-loading">加载中...</div>';

        try {
            const response = await fetch(`${API_BASE}/check/scripts`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const scriptsData = await response.json();

            if (!scriptsData || scriptsData.length === 0) {
                scriptsListContainer.innerHTML = '<div class="no-scripts-message">没有可用的脚本</div>';
                return;
            }

            allScripts = scriptsData;
            displayScripts(allScripts);

        } catch (error) {
            console.error('Error loading scripts:', error);
            scriptsListContainer.innerHTML = `<div class="scripts-loading">加载失败: ${error.message}</div>`;
        }

        return Promise.resolve();
    }

    function filterScripts(query) {
        if (!query) {
            displayScripts(allScripts);
            return;
        }

        const filtered = allScripts.filter(script => {
            return script.name.toLowerCase().includes(query.toLowerCase());
        });

        displayScripts(filtered);
    }

    function displayScripts(scripts) {
        scriptsListContainer.innerHTML = '';

        if (scripts.length === 0) {
            scriptsListContainer.innerHTML = '<div class="no-scripts-message">没有找到匹配的脚本</div>';
            return;
        }

        scripts.forEach(script => {
            const scriptElement = createScriptElement(script);
            scriptsListContainer.appendChild(scriptElement);
        });
    }

    function createScriptElement(script) {
        const scriptItem = document.createElement('div');
        scriptItem.className = 'script-item';

        const formattedSize = formatFileSize(script.size);
        const formattedDate = formatDate(script.uploaded);

        scriptItem.innerHTML = `
            <div class="script-header">
                <div>
                    <span class="script-name">${script.name}</span>
                    <span class="script-version">v${script.version}</span>
                </div>
                <div class="script-size">${formattedSize}</div>
            </div>
            <div class="script-date">更新: ${formattedDate}</div>
            <a href="${script.downloadUrl}" class="script-download" download="${script.key}">
                <i class="fas fa-download download-icon"></i>
                <span>下载脚本</span>
            </a>
        `;

        return scriptItem;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
});