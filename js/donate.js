document.addEventListener('DOMContentLoaded', function () {
    var donateButton = document.getElementById('donate-button');
    var donateModal = document.getElementById('donate-modal');
    var closeButton = document.querySelector('.donate-close-button');
    let allDonations = [];
    let currentDisplayCount = 10;
    const incrementAmount = 10;

    function openModal() {
        donateModal.style.display = 'flex';
        donateModal.style.justifyContent = 'center';
        donateModal.style.alignItems = 'center';
        setTimeout(function () {
            donateModal.classList.add('show');
        }, 10);
    }

    function closeModal() {
        donateModal.classList.remove('show');
        setTimeout(function () {
            donateModal.style.display = 'none';
        }, 300);
    }

    donateButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', function (event) {
        if (event.target === donateModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && donateModal.classList.contains('show')) {
            closeModal();
        }
    });

    function updateDayTip() {
        const dayTip = document.getElementById('day-tip');
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const today = new Date();
        const dayOfWeek = today.getDay();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${date}`;

        const daysUntilThursday = (4 - dayOfWeek + 7) % 7;

        const moodEmojis = {
            0: ['🎉', '🍗', '🎊', '💖'],
            1: ['😴', '💤', '🥱', '😪'],
            2: ['🌱', '🌿', '🍀', '🌺'],
            3: ['⏰', '📅', '🗓️', '✨'],
            4: ['🙏', '✌️', '🤞', '💫'],
            5: ['🎵', '🎶', '🎼', '🎸'],
            6: ['📚', '☕', '💻', '🎮'],
        };

        const randomEmoji = arr => arr[Math.floor(Math.random() * arr.length)];
        const todayMood = moodEmojis[dayOfWeek];

        if (dayOfWeek === 4) {
            const phrases = [
                '今天是疯狂星期四！冲鸭！',
                '去KFC整点薯条吗朋友！',
                '今天是肯德基疯狂星期四！'
            ];
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            dayTip.innerHTML = `${randomEmoji(todayMood)} ${dateString} ${randomPhrase}`;
            dayTip.classList.add('thursday');
            dayTip.style.color = '#FFD700';
        } else {
            const waitingPhrases = [
                `距v我50还有${daysUntilThursday}天！`,
                `${daysUntilThursday}天后又是疯狂星期四！`,
            ];
            const randomWaitPhrase = waitingPhrases[Math.floor(Math.random() * waitingPhrases.length)];
            dayTip.innerHTML = `${randomEmoji(todayMood)} ${dateString} 星期${days[dayOfWeek]}<br>${randomWaitPhrase}`;
            dayTip.classList.remove('thursday');
        }
    }

    function renderDonations() {
        const donationList = document.querySelector('.donation-list');
        if (!donationList) return;

        donationList.innerHTML = '';

        if (!allDonations || allDonations.length === 0) {
            donationList.innerHTML = '<div class="donation-empty">暂无捐赠记录，成为第一个支持者吧！</div>';
            return;
        }

        const displayLimit = Math.min(allDonations.length, currentDisplayCount);
        const displayedDonations = allDonations.slice(0, displayLimit);

        displayedDonations.forEach((donation, index) => {
            const donationItem = document.createElement('div');
            donationItem.className = 'donation-item';

            if (donation.amount >= 50) {
                donationItem.classList.add('amount-huge');
            } else if (donation.amount >= 20) {
                donationItem.classList.add('amount-large');
            } else if (donation.amount >= 10) {
                donationItem.classList.add('amount-medium');
            } else {
                donationItem.classList.add('amount-small');
            }

            if (index === 0) {
                donationItem.classList.add('highlighted');
            }

            const platformIcon = donation.platform === 'wechat'
                ? '<i class="fab fa-weixin donation-platform wechat"></i>'
                : '<i class="fab fa-alipay donation-platform alipay"></i>';

            donationItem.innerHTML = `
                <div class="donation-info">
                    <div class="donation-name">${platformIcon}${donation.name}</div>
                    ${donation.message ? `<div class="donation-message">${donation.message}</div>` : ''}
                </div>
                <div class="donation-amount">¥${donation.amount.toFixed(2)}</div>
            `;

            donationList.appendChild(donationItem);
        });

        if (allDonations.length > displayLimit) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'load-more-container';

            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-button';
            loadMoreBtn.innerHTML = `<i class="fas fa-angle-down"></i> 显示更多 (${allDonations.length - displayLimit}条)`;

            loadMoreBtn.addEventListener('click', function () {
                currentDisplayCount += incrementAmount;
                renderDonations();
            });

            loadMoreContainer.appendChild(loadMoreBtn);
            donationList.appendChild(loadMoreContainer);
        }
    }

    function loadDonationList() {
        const donationList = document.querySelector('.donation-list');
        if (!donationList) return;

        donationList.innerHTML = '<div class="donation-loading">加载赞助名单中...</div>';

        fetch(`${API_BASE}/data/donations`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载捐赠记录');
                }
                return response.json();
            })
            .then(donations => {
                if (!donations || donations.length === 0) {
                    donationList.innerHTML = '<div class="donation-empty">暂无捐赠记录，成为第一个支持者吧！</div>';
                    return;
                }

                allDonations = donations.sort((a, b) => new Date(b.date) - new Date(a.date));

                renderDonations();
            })
            .catch(error => {
                console.error('加载捐赠记录失败:', error);
                donationList.innerHTML = '<div class="donation-empty">加载捐赠记录失败，请稍后再试</div>';
            });
    }

    updateDayTip();
    loadDonationList();

    setInterval(updateDayTip, 60000);
});