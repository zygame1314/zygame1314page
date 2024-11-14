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
