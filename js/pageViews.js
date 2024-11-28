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
    updateCardHeight();

    window.addEventListener('load', updateCardHeight);
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
