window.onload = async () => {
    const viewer = new l2dViewer({
        el: document.getElementById('L2dCanvas'),
        basePath: '/data/live2d',
        modelName: 'knight',
        width: 300,
        height: 300,
        mobileLimit: true
    });

    if (viewer && viewer.loadComplete) {
        await viewer.loadComplete;
        showTimeGreeting();
    } else {
        setTimeout(() => {
            showTimeGreeting();
        }, 1000);
    }
};

function showTimeGreeting() {
    const textBox = document.getElementById('live2d-text-box');
    const hour = new Date().getHours();
    const weekDay = new Date().getDay();
    const isWeekend = weekDay === 0 || weekDay === 6;

    let greeting = "";
    if (hour < 3) {
        greeting = "夜深人静，还不休息吗？熬夜对身体不好哦";
    } else if (hour < 6) {
        greeting = "这个点还醒着？是修仙中吗？";
    } else if (hour < 9) {
        greeting = isWeekend ?
            "周末还这么早？悠闲地享受早餐吧~" :
            "早安！新的一天也要充满干劲呢！";
    } else if (hour < 11) {
        greeting = isWeekend ?
            "上午好！今天有什么有趣的计划吗？" :
            "上午好！工作别太累了，来杯咖啡提提神？";
    } else if (hour < 13) {
        greeting = "午饭时间到了！想吃点什么呢？";
    } else if (hour < 15) {
        greeting = "午后时光最容易犯困了，记得喝点水提提神~";
    } else if (hour < 17) {
        greeting = hour === 15 ?
            "下午茶时间！要来块小蛋糕吗？" :
            "下午好！工作注意适当休息哦~";
    } else if (hour < 19) {
        greeting = "快到晚饭时间啦！今天过得开心吗？";
    } else if (hour < 22) {
        greeting = "晚上好！忙碌了一天，记得放松一下~";
    } else {
        greeting = "已经这么晚了，早点休息吧，熬夜会变丑的！";
    }

    textBox.innerHTML = greeting;
    textBox.classList.remove("hide");
    textBox.classList.add("show");

    setTimeout(() => {
        textBox.classList.remove("show");
        textBox.classList.add("hide");
    }, 3000);
}