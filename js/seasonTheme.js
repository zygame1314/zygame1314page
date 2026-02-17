import { showNotification } from './showNotification.js';
import { Lunar } from 'lunar-javascript';

const GREETINGS = {
    spring: "借绿意寄深情，万物生长不负春光。🌸",
    summer: "蝉鸣与晚风，是属于这个季节最温柔的相遇。☀️",
    autumn: "林间红叶随风起，愿你所得皆所期。🍁",
    winter: "凛冬散尽，星河长明。凡是过往，皆为序章。❄️",
    chineseNewYear: "旧岁已展千重锦，新年再进百尺竿。🧧<br>恭祝你：万事顺意，阖家安康。",
    midAutumn: "月圆满，意深重。祝你岁岁年年，共赏清晖。🌕",
    dragonBoat: "蒲月安康，粽香情长。愿你百病不侵，岁岁常欢愉。🐉",
    lanternFestival: "长灯如昼，愿所求皆如愿，所行皆坦途。🏮",
    christmas: "在这个寒冷的季节，愿你的世界始终温暖如初。🎄",
    halloween: "夜色朦胧，星光微漾。与其等待奇迹，不如亲手点亮灯盏。👻",
    valentines: "爱意随风起，风止意难平。在这个浪漫的日子里，祝你爱人亦爱己。💖",
    qixi: "银河辽阔，愿所有的相遇都是久别重逢。🌌",
    nationalDay: "锦绣中华，山河浩瀚。愿祖国繁荣昌盛，也愿你在这个假期找回属于自己的惬意。🪭",
    qingming: "清明雨落，思念成河。愿逝者安息，生者珍惜。🌸",
    labor: "致敬每一个平凡而伟大的奋斗者。愿你的付出，终将熠熠生辉。🛠️",
    teacher: "一支粉笔，两袖微尘，三尺讲台，四季耕耘。致敬灵魂的工程师！🍎",
    children: "愿你历经千帆，归来仍是少年。愿那份童心永远是你对抗生活的一道光。🎈",
    newyear: "朝暮更迭，始而复周。新年副本已开启，愿所有遗憾都在春暖花开时弥补。🎆",
    laba: "一碗粥，一份情。愿你在冬日里，胃里有暖，心里有爱。🥣",
    doubleNinth: "登高望远，遍插茱萸。愿时光慢行，愿故人常健。⛰️",
    singlesDay: "一个人也可以活得灿烂璀璨。愿你无需依附，也足够精彩。✨",
    winterSolstice: "冬至大如年，人间小团圆。愿寒冷的冬夜里，总有一盏明灯为你而亮。饺子还是汤圆？🥟",
    womensDay: "春风十里，不如笑靥如花的你。愿你眼里有光，心中有爱，活成自己喜欢的模样。💐",
    programmerDay: "Hello World! 愿你的代码永无 Bug，梦想终成现实。01101000 01101001 💻",
    youthDay: "不负青春，不负韶华。愿你历经千帆，心中仍是那个追风少年。⚡"
};

export async function getCurrentThemeKey() {
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let theme = null;
    let lunar;

    if (typeof Lunar !== 'undefined' || Lunar) {
        try {
            lunar = Lunar.fromDate(date);
            const lunarMonth = lunar.getMonth();
            const lunarDay = lunar.getDay();

            if ((lunarMonth === 1 && lunarDay <= 14) || (lunarMonth === 12 && lunarDay >= 23)) {
                theme = 'chineseNewYear';
            } else if (lunarMonth === 1 && lunarDay === 15) {
                theme = 'lanternFestival';
            } else if (lunarMonth === 5 && lunarDay === 5) {
                theme = 'dragonBoat';
            } else if (lunarMonth === 8 && lunarDay === 15) {
                theme = 'midAutumn';
            } else if (lunarMonth === 7 && lunarDay === 7) {
                theme = 'qixi';
            } else if (lunarMonth === 9 && lunarDay === 9) {
                theme = 'doubleNinth';
            } else if (lunarMonth === 12 && lunarDay === 8) {
                theme = 'laba';
            } else if ((month === 4 && (day === 4 || day === 5))) {
                theme = 'qingming';
            }
        } catch (e) {
            console.error("Lunar date calculation failed:", e);
        }
    }

    if (!theme && lunar) {
        const solarTerm = lunar.getJieQi();
        if (solarTerm === '冬至') {
            theme = 'winterSolstice';
        } else if (month === 11 && day === 11) {
            theme = 'singlesDay';
        } else if (month === 12 && day >= 24 && day <= 26) {
            theme = 'christmas';
        } else if (month === 10 && day === 31) {
            theme = 'halloween';
        } else if (month === 2 && day === 14) {
            theme = 'valentines';
        } else if (month === 10 && day >= 1 && day <= 7) {
            theme = 'nationalDay';
        } else if (month === 5 && day >= 1 && day <= 5) {
            theme = 'labor';
        } else if (month === 9 && day === 10) {
            theme = 'teacher';
        } else if (month === 6 && day === 1) {
            theme = 'children';
        } else if (month === 1 && day === 1) {
            theme = 'newyear';
        } else if (month === 3 && day === 8) {
            theme = 'womensDay';
        } else if (month === 5 && day === 4) {
            theme = 'youthDay';
        } else if (month === 10 && day === 24) {
            theme = 'programmerDay';
        }
    }

    if (!theme) {
        if (month >= 3 && month <= 5) {
            theme = 'spring';
        } else if (month >= 6 && month <= 8) {
            theme = 'summer';
        } else if (month >= 9 && month <= 11) {
            theme = 'autumn';
        } else {
            theme = 'winter';
        }
    }
    return theme;
}

async function setSeasonTheme() {
    const themeKey = await getCurrentThemeKey();
    if (!themeKey) return;

    const greeting = GREETINGS[themeKey];

    document.documentElement.style.setProperty('--primary-color', `var(--${themeKey}-primary)`);
    document.documentElement.style.setProperty('--secondary-color', `var(--${themeKey}-secondary)`);
    document.documentElement.style.setProperty('--theme-bg', `var(--${themeKey}-bg)`);

    showNotification(greeting, 5, 'info');
}

document.addEventListener('DOMContentLoaded', setSeasonTheme);