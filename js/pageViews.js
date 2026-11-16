import { showNotification } from './showNotification.js';
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
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-widget-btn';
    toggleBtn.className = 'button-style';
    toggleBtn.innerText = '隐藏挂件';
    toggleBtn.addEventListener('click', () => {
        if (widget.classList.contains('folded')) {
            widget.classList.remove('folded');
            toggleBtn.innerText = '隐藏挂件';
        } else {
            widget.classList.add('folded');
            toggleBtn.innerText = '显示挂件';
        }
    });
    widget.appendChild(toggleBtn);
    const card = document.querySelector('.visit-counter-card');
    card.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'transform') {
            updateCardHeight();
        }
    });
    const visitCounterWidget = document.querySelector('.visit-counter-widget');
    if (visitCounterWidget) {
        visitCounterWidget.addEventListener('click', function (event) {
            const scriptLink = event.target.closest('a.scroll-to-scripts');
            if (scriptLink) {
                event.preventDefault();
                event.stopPropagation();
                const sidebarContent = document.querySelector('.sidebar-content');
                const targetElement = document.querySelector('#scripts-download');
                if (sidebarContent && targetElement) {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar && !sidebar.classList.contains('active') && window.innerWidth <= 768) {
                        const toggleBtn = document.getElementById('sidebar-toggle');
                        if (toggleBtn) toggleBtn.click();
                        setTimeout(() => {
                            sidebarContent.scrollTo({ top: targetElement.offsetTop - 10, behavior: 'smooth' });
                        }, 300);
                    } else {
                        sidebarContent.scrollTo({ top: targetElement.offsetTop - 10, behavior: 'smooth' });
                    }
                }
                return;
            }
            const contactLink = event.target.closest('a.scroll-to-contact');
            if (contactLink) {
                event.preventDefault();
                event.stopPropagation();
                const targetElement2 = document.querySelector('#contact');
                if (targetElement2) {
                    targetElement2.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }
        });
    }
});
function updateCardHeight() {
    const frontContent = document.querySelector('.card-front');
    const backContent = document.querySelector('.card-back');
    const widget = document.querySelector('.visit-counter-widget');
    const card = document.querySelector('.visit-counter-card');
    const isFlipped = widget.classList.contains('flipped');
    const content = isFlipped ? backContent : frontContent;
    const contentHeight = content.scrollHeight;
    const maxHeight = 500;
    const height = Math.min(contentHeight, maxHeight);
    card.style.height = `${height}px`;
    widget.style.height = `${height}px`;
}
document.getElementById('flip-card').addEventListener('click', function () {
    const widget = document.querySelector('.visit-counter-widget');
    widget.classList.add('flipped');
    updateCardHeight();
});
document.getElementById('flip-back').addEventListener('click', function () {
    const widget = document.querySelector('.visit-counter-widget');
    widget.classList.remove('flipped');
    updateCardHeight();
});
function updateCardContentForArticle() {
    const widget = document.querySelector('.visit-counter-widget');
    const backContent = document.querySelector('.card-back');
    widget.classList.add('flipped');
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
        <div class="activation-info">
            <h4 class="activation-title">购买与提货入口</h4>
            <ol class="activation-steps">
                <li>下单、提货都在<a href="https://xiaoya-get.zygame1314.site" target="_blank"
                        rel="noopener noreferrer">小雅提货站</a>完成：小雅答答答激活码（需 2.2.1+）、清华社英语平台服务，详情见页面说明。</li>
                <li>打不开就试<a href="https://xiaoya-get.zygame1314-666.top" target="_blank"
                        rel="noopener noreferrer">备用地址</a>。</li>
            </ol>
            <div class="friendly-reminder"
                style="font-size: 0.9em; margin-top: 10px; padding: 10px; background-color: var(--theme-bg); border-radius: 5px;">
                <i class="fas fa-lightbulb"
                    style="color: #17a2b8; margin-right: 5px;"></i><strong>提示：</strong>
                下单后自动发货，售出不退；有问题直接<a href="#contact"
                    class="scroll-to-contact">联系我</a>。
            </div>
        </div>
        <div class="script-update-prompt-style">
            <div class="prompt-content">
                <span class="prompt-icon">💡</span>
                <span class="prompt-text">“小雅答答答”脚本有更新啦！快去</span>
                <a href="javascript:void(0)" class="scroll-to-scripts">油猴脚本区</a>
                <span class="prompt-text">看看吧！</span>
            </div>
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
        updateCardHeight();
    });
    document.getElementById('flip-back').addEventListener('click', function () {
        const widget = document.querySelector('.visit-counter-widget');
        widget.classList.remove('flipped');
        updateCardHeight();
    });
    document.getElementById('visit-count').addEventListener('click', function () {
        showNotification('经验 + 3 ♪(´▽｀)', 3, 'success');
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
