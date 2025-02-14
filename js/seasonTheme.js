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
    valentines: "单身狗保护协会提醒：<br>本日宜关闭朋友圈 💘<br>恋爱脑请走VIP通道"
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