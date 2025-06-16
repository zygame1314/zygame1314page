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
    visitCounterWidget.addEventListener('click', function(event) {
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
});
document.getElementById('flip-back').addEventListener('click', function () {
    const widget = document.querySelector('.visit-counter-widget');
    widget.classList.remove('flipped');
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
            <h4 class="activation-title">激活码获取流程</h4>
            <ol class="activation-steps">
                <li>前往 <a href="https://afdian.com/a/zygame1314" target="_blank" rel="noopener noreferrer">爱发电</a> 购买。</li>
                <li>使用订单号在 <a href="https://xiaoya-get.zygame1314.top" target="_blank" rel="noopener noreferrer">提货页面</a> 提货。</li>
                <li>获取激活码后即可使用。</li>
            </ol>
            <div class="warning-message">
                <div class="warning-header">重要提示</div>
                <div class="warning-content">
                    <p>由于爱发电客服效率问题，我的认证暂未通过，无法自动回复您的爱发电私信，我通常也不会查看。</p>
                    <p>如有任何疑问或紧急事务，请直接添加我的<a href="#contact" class="scroll-to-contact">联系方式</a>进行沟通。</p>
                </div>
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
    });
    document.getElementById('flip-back').addEventListener('click', function () {
        const widget = document.querySelector('.visit-counter-widget');
        widget.classList.remove('flipped');
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
