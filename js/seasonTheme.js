const GREETINGS = {
    spring: "您的春日好运正在派件，请注意查收<br>（打工人的DNA动了）🌸<br>戳我查看春日限定皮肤→",
    summer: "空调WIFI冰西瓜，葛优同款沙发 ☀️<br>温馨提示：本季节容易触发『汗蒸模式』🫠",
    autumn: "朋友圈摄影大赛开赛！<br>金秋皮肤已更新 🍁<br>晒秋装/奶茶/银杏可获点赞暴击",
    winter: "南方人瑟瑟发抖，北方人暖气续命 ❄️<br>取暖基本靠抖的同学请扣1",
    chineseNewYear: "恭喜发财红包拿来🧧<br>（年终奖/压岁钱到账了吗？没到的话先收下这句祝福）",
    midAutumn: "五仁月饼申请出战！🌕<br>月亮不睡我不睡，我是人间小美味",
    dragonBoat: "甜咸粽子别打架了，我全都要 🐉<br>划水冠军已上线",
    lanternFestival: "汤圆：麻薯的东方表亲 🏮<br>吃黑芝麻馅的自动组队",
    christmas: "对象还没找到？先和圣诞老人许个愿吧🎅<br>姜饼人正在赶来的路上",
    halloween: "社恐人cos幽灵最合适了👻<br>今晚不给糖就发老板表情包！",
    valentines: "单身狗保护协会提醒：<br>本日宜关闭朋友圈 💘<br>恋爱脑请走VIP通道",
    qixi: "单身汪注意！今晚银河将上演大型狗粮投放现场🌌<br>星星代写情书服务限时开放（5星好评返现）💌",
    nationalDay: "朋友圈摄影大赛2.0开启！🇨🇳<br>7天假期体验卡已到账，请注意避开人从众模式",
    qingming: "青团：春天限定皮肤已更新🌸<br>踏青模式启动，小心柳絮偷袭！",
    labor: "劳动最光荣，搬砖也能成英雄 🛠<br>系统提示：成就值+10086，摸鱼技能冷却中⏰",
    teacher: "三尺讲台变直播间，粉笔进化成电子笔🖋<br>作业本批注比情书还长（老师辛苦了！🍎）",
    children: "成年人请出示童年通行证🎈<br>今日限时返场：泡泡机模式/棒棒糖能量充满！",
    newyear: "新年副本已加载 99%🎆<br>Flag回收站清空中，新年计划正在生成..."
};

function loadLunarScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdmirror.com/npm/lunar-javascript/lunar.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function setSeasonTheme() {
    try {
        await loadLunarScript();
    } catch (error) {
        console.error('无法加载农历库:', error);
    }

    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let theme = null;
    let greeting = '';

    if (typeof Lunar !== 'undefined') {
        const lunar = Lunar.fromDate(date);
        const lunarMonth = lunar.getMonth();
        const lunarDay = lunar.getDay();

        if ((lunarMonth === 1 && lunarDay <= 14) || (lunarMonth === 12 && lunarDay >= 23)) {
            theme = 'chinese-new-year';
            greeting = GREETINGS.chineseNewYear;
        } else if (lunarMonth === 1 && lunarDay === 15) {
            theme = 'lantern';
            greeting = GREETINGS.lanternFestival;
        } else if (lunarMonth === 5 && lunarDay === 5) {
            theme = 'dragon-boat';
            greeting = GREETINGS.dragonBoat;
        } else if (lunarMonth === 8 && lunarDay === 15) {
            theme = 'mid-autumn';
            greeting = GREETINGS.midAutumn;
        }
        else if (lunarMonth === 7 && lunarDay === 7) {
            theme = 'qixi';
            greeting = GREETINGS.qixi;
        }
        else if ((month === 4 && (day === 4 || day === 5))) {
            theme = 'qingming';
            greeting = GREETINGS.qingming;
        }
    }

    if (!theme) {
        if (month === 12 && day >= 24 && day <= 26) {
            theme = 'christmas';
            greeting = GREETINGS.christmas;
        }
        else if (month === 10 && day === 31) {
            theme = 'halloween';
            greeting = GREETINGS.halloween;
        }
        else if (month === 2 && day === 14) {
            theme = 'valentines';
            greeting = GREETINGS.valentines;
        }
        else if (month === 10 && day >= 1 && day <= 7) {
            theme = 'nationalDay';
            greeting = GREETINGS.nationalDay;
        }
        else if (month === 5 && day >= 1 && day <= 5) {
            theme = 'labor';
            greeting = GREETINGS.labor;
        }
        else if (month === 9 && day === 10) {
            theme = 'teacher';
            greeting = GREETINGS.teacher;
        }
        else if (month === 6 && day === 1) {
            theme = 'children';
            greeting = GREETINGS.children;
        }
        else if (month === 1 && day === 1) {
            theme = 'newyear';
            greeting = GREETINGS.newyear;
        }
    }

    if (!theme) {
        if (month >= 3 && month <= 5) {
            theme = 'spring';
            greeting = GREETINGS.spring;
        } else if (month >= 6 && month <= 8) {
            theme = 'summer';
            greeting = GREETINGS.summer;
        } else if (month >= 9 && month <= 11) {
            theme = 'autumn';
            greeting = GREETINGS.autumn;
        } else {
            theme = 'winter';
            greeting = GREETINGS.winter;
        }
    }

    document.documentElement.style.setProperty('--primary-color', `var(--${theme}-primary)`);
    document.documentElement.style.setProperty('--secondary-color', `var(--${theme}-secondary)`);
    document.documentElement.style.setProperty('--theme-bg', `var(--${theme}-bg)`);

    showNotification(greeting, 5, 'info');
}

document.addEventListener('DOMContentLoaded', setSeasonTheme);