document.addEventListener('DOMContentLoaded', function () {
    window.loadingComplete.then(() => {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            setTimeout(showImportantNotice, 3000);
        }
    });

    function showImportantNotice() {
        const doNotShowAgain = localStorage.getItem('doNotShowImportantNotice');
        const lastShownDate = localStorage.getItem('lastImportantNoticeDate');
        const currentDate = new Date().toDateString();

        if (doNotShowAgain === 'true') {
            return;
        }

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
                const lastSeenNoticeId = localStorage.getItem('lastSeenNoticeId');

                if (noticeId === lastSeenNoticeId && doNotShowAgain === 'true') {
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

        modal.innerHTML = `
            <div class="important-notice-content">
                <div class="important-notice-title">
                    <h2><i class="fas fa-exclamation-circle notice-icon"></i> ${data.title}</h2>
                    <button class="important-close-button"></button>
                </div>
                <div class="important-notice-body">
                    ${data.content}
                </div>
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

        setTimeout(() => {
            modal.classList.add('show');
        }, 100);

        localStorage.setItem('lastSeenNoticeId', data.id);

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
                localStorage.setItem('doNotShowImportantNotice', 'true');
            } else {
                localStorage.setItem('doNotShowImportantNotice', 'false');
            }
        });
    }
});