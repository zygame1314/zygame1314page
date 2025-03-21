document.addEventListener('DOMContentLoaded', function () {
    window.loadingComplete.then(() => {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            setTimeout(showImportantNotice, 3000);
        }
    });

    function showImportantNotice() {
        const lastShownDate = localStorage.getItem('lastImportantNoticeDate');
        const currentDate = new Date().toDateString();

        if (lastShownDate === currentDate) {
            return;
        }

        fetch('/data/important-notice.json')
            .then(response => response.json())
            .then(data => {
                const today = new Date();
                const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

                if (expiryDate && today > expiryDate) {
                    return;
                }

                if (!data.active) return;

                const noticeId = data.id;
                const doNotShowThisNotice = localStorage.getItem(`doNotShow_${noticeId}`);

                if (doNotShowThisNotice === 'true') {
                    return;
                }

                createNoticeModal(data);
            })
            .catch(error => {
                console.error('获取重要通知失败:', error);
            });
    }

    function createNoticeModal(data) {
        const modal = document.createElement('div');
        modal.className = 'important-notice-modal';

        let contentHtml = '';
        const hasImage = data.image && data.image.url;
        const imagePosition = hasImage ? (data.image.position || 'top') : null;

        const imageHtml = hasImage ?
            `<div class="important-notice-image">
                <img data-src="${data.image.url}" 
                     alt="${data.image.alt || '通知图片'}" 
                     class="lazy-placeholder"
                     ${data.image.width ? `data-width="${data.image.width}"` : ''}
                     ${data.image.height ? `data-height="${data.image.height}"` : ''}>
            </div>` : '';

        if (hasImage) {
            if (imagePosition === 'top') {
                contentHtml = `
                    ${imageHtml}
                    <div class="important-notice-body">
                        ${data.content}
                    </div>
                `;
            } else if (imagePosition === 'bottom') {
                contentHtml = `
                    <div class="important-notice-body">
                        ${data.content}
                    </div>
                    ${imageHtml}
                `;
            } else if (imagePosition === 'left') {
                contentHtml = `
                    <div class="notice-with-image-left">
                        ${imageHtml}
                        <div class="important-notice-body">
                            ${data.content}
                        </div>
                    </div>
                `;
            } else if (imagePosition === 'right') {
                contentHtml = `
                    <div class="notice-with-image-right">
                        <div class="important-notice-body">
                            ${data.content}
                        </div>
                        ${imageHtml}
                    </div>
                `;
            }
        } else {
            contentHtml = `
                <div class="important-notice-body">
                    ${data.content}
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="important-notice-content">
                <div class="important-notice-title">
                    <h2><i class="fas fa-exclamation-circle notice-icon"></i> ${data.title}</h2>
                    <button class="important-close-button"></button>
                </div>
                ${contentHtml}
                <div class="important-notice-footer">
                    <label class="do-not-show-again">
                        <input type="checkbox" id="doNotShowAgain">
                        <div class="checkmark"></div>
                        <span>不再显示此通知</span>
                    </label>
                    <div class="notice-actions">
                        <button class="notice-btn secondary" id="noticeClose">关闭</button>
                        <button class="notice-btn" id="noticeAcknowledge">今日已阅</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (window.reinitializeLazyLoad) {
            window.reinitializeLazyLoad();
        }

        setTimeout(() => {
            modal.classList.add('show');
        }, 100);

        const closeBtn = modal.querySelector('.important-close-button');
        const noticeCloseBtn = modal.querySelector('#noticeClose');
        const noticeAcknowledgeBtn = modal.querySelector('#noticeAcknowledge');
        const doNotShowAgainCheck = modal.querySelector('#doNotShowAgain');

        function closeModal() {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }, 500);
        }

        closeBtn.addEventListener('click', closeModal);
        noticeCloseBtn.addEventListener('click', closeModal);

        noticeAcknowledgeBtn.addEventListener('click', function () {
            localStorage.setItem('lastImportantNoticeDate', new Date().toDateString());
            closeModal();
        });

        doNotShowAgainCheck.addEventListener('change', function () {
            if (this.checked) {
                localStorage.setItem(`doNotShow_${data.id}`, 'true');
            } else {
                localStorage.setItem(`doNotShow_${data.id}`, 'false');
            }
        });

        if (hasImage) {
            const img = modal.querySelector('.important-notice-image img');
            window.saveLazyLoadErrorHandler(img, function () {
                const imageContainer = this.parentElement;
                imageContainer.style.display = 'none';
            });
        }
    }
});