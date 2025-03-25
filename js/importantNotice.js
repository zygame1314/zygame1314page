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
            const response = await fetch(`/notice/has-voted?id=${noticeId}`);
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
                    fetchAndDisplayResults(noticeId);
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
                    thanksElement.textContent = '感谢您的参与！';
                    pollContainer.insertBefore(thanksElement, pollResult);

                    if (pollConfig.showResults) {
                        displayResults(data.results);
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

        function fetchAndDisplayResults(noticeId) {
            fetch(`/notice/poll-results?id=${noticeId}`)
                .then(response => {
                    if (!response.ok) throw new Error('获取投票结果失败');
                    return response.json();
                })
                .then(data => {
                    displayResults(data.results);
                })
                .catch(error => {
                    console.error('获取投票结果错误:', error);
                    pollError.textContent = '无法加载投票结果';
                    pollError.style.display = 'block';
                });
        }

        function displayResults(results) {
            if (!results) return;

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

            pollResult.innerHTML = resultHtml;
            pollResult.style.display = 'block';
        }

        function submitVote(noticeId, selectedOptions) {
            return fetch('/notice/vote', {
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