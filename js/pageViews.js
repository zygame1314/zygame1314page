const pageUrl = window.location.pathname;

document.getElementById('visit-count').addEventListener('click', function () {
    showNotification('经验 + 3 ♪(´▽｀)', 3, 'success');
});

document.addEventListener('scroll', function () {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > 80) {
        document.body.classList.add('nav-fixed');
    } else {
        document.body.classList.remove('nav-fixed');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const widget = document.querySelector('.visit-counter-widget');
    const BUFFER_SPACE = 70;

    function updateWidgetPosition() {
        const visibleNav = document.querySelector('nav:not([style*="display: none"])');
        if (!visibleNav) return;

        const navRect = visibleNav.getBoundingClientRect();
        const navHeight = visibleNav.offsetHeight;

        if (navRect.top <= 0) {
            widget.style.top = (navHeight + BUFFER_SPACE) + 'px';
        } else {
            const initialPosition = 50;
            widget.style.top = initialPosition + 'px';
        }
    }

    window.addEventListener('scroll', function () {
        requestAnimationFrame(updateWidgetPosition);
    });

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                updateWidgetPosition();
            }
        });
    });

    document.querySelectorAll('nav').forEach(nav => {
        observer.observe(nav, {
            attributes: true,
            attributeFilter: ['style']
        });
    });

    updateWidgetPosition();
    window.addEventListener('load', updateCardHeight);
    updateCardHeight();
});

function updateCardHeight() {
    const frontContent = document.querySelector('.card-front');
    const backContent = document.querySelector('.card-back');
    const widget = document.querySelector('.visit-counter-widget');
    const card = document.querySelector('.visit-counter-card');

    const isFlipped = widget.classList.contains('flipped');

    const height = isFlipped ? backContent.scrollHeight : frontContent.scrollHeight;

    card.style.height = `${height}px`;
    widget.style.height = `${height}px`;
}

document.getElementById('flip-card').addEventListener('click', function () {
    const widget = document.querySelector('.visit-counter-widget');
    widget.classList.add('flipped');

    setTimeout(updateCardHeight, 300);
});

document.getElementById('flip-back').addEventListener('click', function () {
    const widget = document.querySelector('.visit-counter-widget');
    widget.classList.remove('flipped');

    setTimeout(updateCardHeight, 300);
});

function updateCardContentForArticle() {
    const widget = document.querySelector('.visit-counter-widget');
    const backContent = document.querySelector('.card-back');

    widget.classList.add('flipped');
    setTimeout(updateCardHeight, 300);

    backContent.innerHTML = `
        <p id="visit-count">
            阅读次数: <span class="waline-pageview-count">0</span>
        </p>
        <div class="button-container">
            <button id="back-to-home" class="button-style">返回主页</button>
        </div>
    `;

    document.getElementById('back-to-home').addEventListener('click', () => {
        document.querySelector('.back-btn').click();
    });
}

function restoreOriginalCardContent() {
    const frontContent = document.querySelector('.card-front');
    const backContent = document.querySelector('.card-back');

    frontContent.innerHTML = `
        <p id="activation-code" class="activation-code-style">
            某激活码：<span id="activation-code-value">获取中...</span><br>
            每四小时重新生成一次
        </p>
        <div class="button-container">
            <button id="refresh-activation-code" class="button-style">刷新</button>
            <button id="copy-activation-code" class="button-style">复制</button>
        </div>
        <div class="button-container">
            <button id="flip-card" class="button-style flip-button">访问次数</button>
        </div>
    `;

    backContent.innerHTML = `
        <p id="visit-count">
            访问次数: <span class="waline-pageview-count">0</span>
        </p>
        <div class="button-container">
            <button id="flip-back" class="button-style">激活码</button>
        </div>
    `;

    document.getElementById('flip-card').addEventListener('click', function () {
        const widget = document.querySelector('.visit-counter-widget');
        widget.classList.add('flipped');
        setTimeout(updateCardHeight, 300);
    });

    document.getElementById('flip-back').addEventListener('click', function () {
        const widget = document.querySelector('.visit-counter-widget');
        widget.classList.remove('flipped');
        setTimeout(updateCardHeight, 300);
    });

    document.getElementById('visit-count').addEventListener('click', function () {
        showNotification('经验 + 3 ♪(´▽｀)', 3, 'success');
    });

    fetchActivationCode();

    document.getElementById('refresh-activation-code').addEventListener('click', function () {
        showNotification('激活码已刷新', 2, 'warning');
        fetchActivationCode();
    });

    document.getElementById('copy-activation-code').addEventListener('click', function () {
        const activationCodeValue = document.getElementById('activation-code-value').textContent;
        if (activationCodeValue !== '获取中...' && activationCodeValue !== '获取失败') {
            navigator.clipboard.writeText(activationCodeValue)
                .then(() => {
                    showNotification('激活码已复制到剪贴板', 2, 'success');
                })
                .catch(err => {
                    console.error('复制激活码失败:', err);
                    showNotification('复制失败，请重试', 2, 'error');
                });
        } else {
            showNotification('当前激活码不可用', 2, 'error');
        }
    });
}

window.handleArticleView = function () {
    updateCardContentForArticle();
    updateCardHeight();
};

window.handleHomeView = function () {
    restoreOriginalCardContent();
    updateCardHeight();
};
