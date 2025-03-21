document.addEventListener('DOMContentLoaded', function () {
    var donateButton = document.getElementById('donate-button');
    var donateModal = document.getElementById('donate-modal');
    var closeButton = document.querySelector('.donate-close-button');

    function openModal() {
        donateModal.style.display = 'flex';
        donateModal.style.justifyContent = 'center';
        donateModal.style.alignItems = 'center';
        showNotification(
            '趁着没人，摆个小摊 🍴<br>' +
            '🍳 鸡蛋灌饼 - 6元<br>' +
            '🥙 手抓饼 - 7元<br>' +
            '🍜 烤冷面 - 8元<br>' +
            '🍢 关东煮 - 9元<br>' +
            '🥙 肉夹馍 - 10元<br>' +
            '🧋 奶茶 - 12元<br>' +
            '🍗 炸鸡排 - 13元<br>' +
            '🥟 小笼包 - 15元',
            10,
            'info'
        );
        setTimeout(function () {
            donateModal.classList.add('show');
        }, 10);
    }

    function closeModal() {
        donateModal.classList.remove('show');
        showNotification('(╥﹏╥) 我补药吃土哇', 5, 'error');
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

    updateDayTip();

    setInterval(updateDayTip, 60000);
});