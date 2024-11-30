const PageView = AV.Object.extend('PageViews');
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
    const nav = document.querySelector('nav');
    const widget = document.querySelector('.visit-counter-widget');
    const navHeight = nav.offsetHeight;
    const BUFFER_SPACE = 70;

    function updateWidgetPosition() {
        const navRect = nav.getBoundingClientRect();
        const scrollY = window.scrollY;

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
