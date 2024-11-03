document.addEventListener('DOMContentLoaded', function () {
    var donateButton = document.getElementById('donate-button');
    var donateModal = document.getElementById('donate-modal');
    var closeButton = document.querySelector('.close-button');

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
});
