<<<<<<< HEAD
var originalTitle = document.title;
var titles = ['(¬_¬) 人呢？', '（；´д｀）ゞ 别乱跑了', '(╯‵□′)╯︵┻━┻赶紧回来'];
var returnTitle = '回来啦~ヾ(≧▽≦*)o';
var titleIndex = 0;
var titleInterval;

document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        titleInterval = setInterval(function () {
            document.title = titles[titleIndex % titles.length];
            titleIndex++;
        }, 2000);
    } else {
        clearInterval(titleInterval);
        document.title = returnTitle;

        setTimeout(function () {
            document.title = originalTitle;
        }, 2000);
    }
=======
var originalTitle = document.title;
var titles = ['(¬_¬) 人呢？', '（；´д｀）ゞ 别乱跑了', '(╯‵□′)╯︵┻━┻赶紧回来'];
var returnTitle = '回来啦~ヾ(≧▽≦*)o';
var titleIndex = 0;
var titleInterval;

document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        titleInterval = setInterval(function () {
            document.title = titles[titleIndex % titles.length];
            titleIndex++;
        }, 2000);
    } else {
        clearInterval(titleInterval);
        document.title = returnTitle;

        setTimeout(function () {
            document.title = originalTitle;
        }, 2000);
    }
>>>>>>> b029a527becedfc9927b8e11b6ce5e48017539d2
});