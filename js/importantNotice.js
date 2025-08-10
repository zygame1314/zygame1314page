import { API_BASE } from './config.js';
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
        fetch(`${API_BASE}/getdata/important-notice`)
            .then(response => response.json())
            .then(data => {
                if (!data.active || !data.notices || data.notices.length === 0) {
                    return;
                }
                const visibleNotices = data.notices.filter(notice => {
                    const doNotShowThisNotice = localStorage.getItem(`doNotShow_${notice.id}`);
                    return doNotShowThisNotice !== 'true';
                });
                if (visibleNotices.length === 0) {
                    return;
                }
                createMultiNoticeModal(visibleNotices);
            })
            .catch(error => {
                console.error('获取重要通知失败:', error);
            });
    }
    function createMultiNoticeModal(notices) {
        const modal = document.createElement('div');
        modal.className = 'important-notice-modal';
        let noticesHtml = '';
        let currentIndex = 0;
        notices.forEach((notice, index) => {
            const isActive = index === 0 ? 'active' : '';
            noticesHtml += `
                <div class="notice-item ${isActive}" data-index="${index}" data-notice-id="${notice.id}">
                    ${generateNoticeContent(notice)}
                </div>
            `;
        });
        const navigationHtml = notices.length > 1 ? `
            <div class="notice-navigation">
                <button class="nav-btn prev-btn" ${notices.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="notice-counter">1 / ${notices.length}</span>
                <button class="nav-btn next-btn" ${notices.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        ` : '';
        modal.innerHTML = `
            <div class="important-notice-content">
                <div class="notices-container">
                    ${noticesHtml}
                </div>
                ${navigationHtml}
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
        const images = modal.querySelectorAll('.important-notice-image img');
        images.forEach(img => {
            if (window.saveLazyLoadErrorHandler) {
                window.saveLazyLoadErrorHandler(img, function () {
                    const imageContainer = this.parentElement;
                    imageContainer.style.display = 'none';
                });
            }
        });
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        if (notices.length > 1) {
            initNoticeNavigation(modal, notices);
        }
        initModalEvents(modal, notices[currentIndex]);
        if (notices[currentIndex].poll && notices[currentIndex].poll.active) {
            initPollFunctionality(notices[currentIndex].id, notices[currentIndex].poll);
        }
    }
    function generateNoticeContent(data) {
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
        const pollHtml = data.poll && data.poll.active ? generatePollHTML(data.poll) : '';
        if (hasImage) {
            if (imagePosition === 'top') {
                contentHtml = `
                    ${imageHtml}
                    <div class="important-notice-body">
                        ${data.content}
                    </div>
                    ${pollHtml}
                `;
            } else if (imagePosition === 'bottom') {
                contentHtml = `
                    <div class="important-notice-body">
                        ${data.content}
                    </div>
                    ${pollHtml}
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
                    ${pollHtml}
                `;
            } else if (imagePosition === 'right') {
                contentHtml = `
                    <div class="notice-with-image-right">
                        <div class="important-notice-body">
                            ${data.content}
                        </div>
                        ${imageHtml}
                    </div>
                    ${pollHtml}
                `;
            }
        } else {
            contentHtml = `
                <div class="important-notice-body">
                    ${data.content}
                </div>
                ${pollHtml}
            `;
        }
        return `
            <div class="important-notice-title">
                <h2><i class="fas fa-exclamation-circle notice-icon"></i> ${data.title}</h2>
                <button class="important-close-button"></button>
            </div>
            ${contentHtml}
        `;
    }
    function initNoticeNavigation(modal, notices) {
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        const counter = modal.querySelector('.notice-counter');
        const noticeItems = modal.querySelectorAll('.notice-item');
        let currentIndex = 0;
        function updateNavigation() {
            noticeItems.forEach(item => item.classList.remove('active'));
            noticeItems[currentIndex].classList.add('active');
            const doNotShowAgainCheck = modal.querySelector('#doNotShowAgain');
            if (doNotShowAgainCheck) {
                const currentNoticeId = notices[currentIndex].id;
                const isDoNotShow = localStorage.getItem(`doNotShow_${currentNoticeId}`) === 'true';
                doNotShowAgainCheck.checked = isDoNotShow;
            }
            counter.textContent = `${currentIndex + 1} / ${notices.length}`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === notices.length - 1;
            const currentNotice = notices[currentIndex];
            if (currentNotice.poll && currentNotice.poll.active) {
                const oldPollContainer = modal.querySelector('#poll-container');
                if (oldPollContainer) {
                    oldPollContainer.remove();
                }
                setTimeout(() => {
                    initPollFunctionality(currentNotice.id, currentNotice.poll);
                }, 100);
            }
            if (window.reinitializeLazyLoad) {
                window.reinitializeLazyLoad();
            }
            const currentCloseBtn = noticeItems[currentIndex].querySelector('.important-close-button');
            if (currentCloseBtn) {
                currentCloseBtn.onclick = () => {
                    modal.classList.add('closing');
                    setTimeout(() => {
                        modal.classList.remove('show');
                        setTimeout(() => {
                            modal.remove();
                        }, 300);
                    }, 500);
                };
            }
        }
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateNavigation();
            }
        });
        nextBtn.addEventListener('click', () => {
            if (currentIndex < notices.length - 1) {
                currentIndex++;
                updateNavigation();
            }
        });
    }
    function initModalEvents(modal, currentNotice) {
        const noticeCloseBtn = modal.querySelector('#noticeClose');
        const noticeAcknowledgeBtn = modal.querySelector('#noticeAcknowledge');
        const doNotShowAgainCheck = modal.querySelector('#doNotShowAgain');
        function closeModal(modalElement = modal) {
            modalElement.classList.add('closing');
            setTimeout(() => {
                modalElement.classList.remove('show');
                setTimeout(() => {
                    modalElement.remove();
                }, 300);
            }, 500);
        }
        const closeButtons = modal.querySelectorAll('.important-close-button');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => closeModal());
        });
        noticeCloseBtn.addEventListener('click', () => closeModal());
        noticeAcknowledgeBtn.addEventListener('click', function () {
            localStorage.setItem('lastImportantNoticeDate', new Date().toDateString());
            closeModal();
        });
        doNotShowAgainCheck.addEventListener('change', function () {
            const activeNotice = modal.querySelector('.notice-item.active');
            const noticeId = activeNotice ? activeNotice.dataset.noticeId : currentNotice.id;
            if (this.checked) {
                localStorage.setItem(`doNotShow_${noticeId}`, 'true');
            } else {
                localStorage.setItem(`doNotShow_${noticeId}`, 'false');
            }
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
        const pollHtml = data.poll && data.poll.active ? generatePollHTML(data.poll) : '';
        if (hasImage) {
            if (imagePosition === 'top') {
                contentHtml = `
                    ${imageHtml}
                    <div class="important-notice-body">
                        ${data.content}
                    </div>
                    ${pollHtml}
                `;
            } else if (imagePosition === 'bottom') {
                contentHtml = `
                    <div class="important-notice-body">
                        ${data.content}
                    </div>
                    ${pollHtml}
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
                    ${pollHtml}
                `;
            } else if (imagePosition === 'right') {
                contentHtml = `
                    <div class="notice-with-image-right">
                        <div class="important-notice-body">
                            ${data.content}
                        </div>
                        ${imageHtml}
                    </div>
                    ${pollHtml}
                `;
            }
        } else {
            contentHtml = `
                <div class="important-notice-body">
                    ${data.content}
                </div>
                ${pollHtml}
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
        if (data.poll && data.poll.active) {
            initPollFunctionality(data.id, data.poll);
        }
    }
    function generatePollHTML(poll) {
        const inputType = poll.allowMultipleVotes ? 'checkbox' : 'radio';
        let optionsHtml = '';
        poll.options.forEach(option => {
            optionsHtml += `
                <div class="notice-poll-option">
                    <input type="${inputType}" id="${option.id}" name="poll-option" value="${option.id}">
                    <label for="${option.id}">${option.text}</label>
                </div>
            `;
        });
        return `
            <div class="notice-poll-container" id="poll-container">
                <div class="notice-poll-question">${poll.question}</div>
                <div class="notice-poll-options">
                    ${optionsHtml}
                </div>
                <div class="notice-poll-submit">
                    <button class="notice-btn" id="pollSubmitBtn">提交投票</button>
                </div>
                <div id="poll-result" class="notice-poll-result" style="display: none;"></div>
                <div id="poll-error" class="notice-poll-error" style="display: none;"></div>
            </div>
        `;
    }
    async function checkIfUserHasVoted(noticeId) {
        const hasVoted = localStorage.getItem(`voted_${noticeId}`);
        if (hasVoted === 'true') {
            return Promise.resolve(true);
        }
        try {
            const response = await fetch(`${API_BASE}/notice/has-voted?id=${noticeId}`);
            if (!response.ok) throw new Error('获取投票状态失败');
            const data = await response.json();
            if (data.hasVoted) {
                localStorage.setItem(`voted_${noticeId}`, 'true');
            }
            return data.hasVoted;
        } catch (error) {
            console.error('获取投票状态错误:', error);
            return false;
        }
    }
    function initPollFunctionality(noticeId, pollConfig) {
        const pollContainer = document.getElementById('poll-container');
        const pollSubmitBtn = document.getElementById('pollSubmitBtn');
        const pollResult = document.getElementById('poll-result');
        const pollError = document.getElementById('poll-error');
        checkIfUserHasVoted(noticeId)
            .then(hasVoted => {
                if (hasVoted && pollConfig.showResults) {
                    pollSubmitBtn.disabled = true;
                    pollSubmitBtn.textContent = '已投票';
                    fetchAndDisplayResults(noticeId, pollConfig, pollResult, pollError);
                }
            })
            .catch(error => {
                console.error('检查投票状态错误:', error);
            });
        pollSubmitBtn.addEventListener('click', function () {
            const selectedOptions = Array.from(
                document.querySelectorAll('input[name="poll-option"]:checked')
            ).map(input => input.value);
            if (selectedOptions.length === 0) {
                pollError.textContent = '请至少选择一个选项';
                pollError.style.display = 'block';
                setTimeout(() => {
                    pollError.style.display = 'none';
                }, 3000);
                return;
            }
            pollSubmitBtn.disabled = true;
            pollSubmitBtn.textContent = '提交中...';
            pollError.style.display = 'none';
            submitVote(noticeId, selectedOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('投票提交失败');
                    }
                    return response.json();
                })
                .then(data => {
                    localStorage.setItem(`voted_${noticeId}`, 'true');
                    const thanksElement = document.createElement('div');
                    thanksElement.className = 'notice-poll-thanks';
                    thanksElement.textContent = '感谢你的投票！';
                    pollContainer.insertBefore(thanksElement, pollResult);
                    if (pollConfig.showResults) {
                        displayResults(data.results, pollConfig, pollResult);
                    }
                    pollSubmitBtn.textContent = '已投票';
                })
                .catch(error => {
                    console.error('投票提交错误:', error);
                    pollError.textContent = '投票提交失败，请稍后再试';
                    pollError.style.display = 'block';
                    pollSubmitBtn.disabled = false;
                    pollSubmitBtn.textContent = '重新提交';
                });
        });
        function fetchAndDisplayResults(noticeId, pollConfig, pollResultElement, pollErrorElement) {
            fetch(`${API_BASE}/notice/poll-results?id=${noticeId}`)
                .then(response => {
                    if (!response.ok) throw new Error('获取投票结果失败');
                    return response.json();
                })
                .then(data => {
                    displayResults(data.results, pollConfig, pollResultElement);
                })
                .catch(error => {
                    console.error('获取投票结果错误:', error);
                    pollErrorElement.textContent = '无法加载投票结果';
                    pollErrorElement.style.display = 'block';
                });
        }
        function displayResults(results, pollConfig, pollResultElement) {
            if (!results || !pollConfig || !pollConfig.options) return;
            const optionOrder = pollConfig.options.map(opt => opt.id);
            results.sort((a, b) => {
                const indexA = optionOrder.indexOf(a.id);
                const indexB = optionOrder.indexOf(b.id);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            const totalVotes = results.reduce((sum, item) => sum + item.count, 0);
            let resultHtml = `
                <div class="notice-poll-result-title">当前投票结果 (总票数: ${totalVotes})</div>
            `;
            results.forEach(item => {
                const percent = totalVotes > 0 ? Math.round((item.count / totalVotes) * 100) : 0;
                const option = pollConfig.options.find(opt => opt.id === item.id) || { text: '未知选项' };
                resultHtml += `
                    <div class="notice-poll-result-item">
                        <div>${option.text} (${item.count}票)</div>
                        <div class="notice-poll-result-bar">
                            <div class="notice-poll-result-fill" style="width: ${percent}%"></div>
                            <div class="notice-poll-result-percent">${percent}%</div>
                        </div>
                    </div>
                `;
            });
            pollResultElement.innerHTML = resultHtml;
            pollResultElement.style.display = 'block';
        }
        function submitVote(noticeId, selectedOptions) {
            return fetch(`${API_BASE}/notice/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    noticeId: noticeId,
                    options: selectedOptions
                })
            });
        }
    }
});