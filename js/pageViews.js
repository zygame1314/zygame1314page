const PageView = AV.Object.extend('PageViews');
const pageUrl = window.location.pathname;

const query = new AV.Query('PageViews');
query.equalTo('pageUrl', pageUrl);

query.first().then(function (viewRecord) {
    if (viewRecord) {
        viewRecord.increment('views');
        viewRecord.save().then(() => {
            const views = viewRecord.get('views');
            document.getElementById('visit-count').innerText = `访问次数: ${views}`;
        });
    } else {
        const newRecord = new PageView();
        newRecord.set('pageUrl', pageUrl);
        newRecord.set('views', 1);
        newRecord.save().then(() => {
            document.getElementById('visit-count').innerText = `访问次数: 1`;
        });
    }
}).catch(function (error) {
    console.error('获取访问次数出错:', error);
});

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
