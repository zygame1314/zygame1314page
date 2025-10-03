import { getCurrentThemeKey } from './seasonTheme.js';

const THEMES = {
    spring: { name: "春日限定", date: "3月-5月", icon: "fas fa-leaf", order: 1 },
    summer: { name: "夏日清凉", date: "6月-8月", icon: "fas fa-sun", order: 2 },
    autumn: { name: "秋日私语", date: "9月-11月", icon: "fas fa-fan", order: 3 },
    winter: { name: "冬日恋歌", date: "12月-2月", icon: "fas fa-snowflake", order: 4 },
    laba: { name: "腊八节", date: "农历十二月初八", icon: "fas fa-stroopwafel", order: 100 },
    newyear: { name: "元旦", date: "1月1日", icon: "fas fa-calendar-day", order: 101 },
    chineseNewYear: { name: "春节", date: "农历正月初一", icon: "fas fa-paper-plane", order: 102 },
    lanternFestival: { name: "元宵节", date: "农历正月十五", icon: "fas fa-lightbulb", order: 103 },
    valentines: { name: "情人节", date: "2月14日", icon: "fas fa-heart", order: 104 },
    qingming: { name: "清明", date: "4月4/5日", icon: "fas fa-cloud-sun-rain", order: 105 },
    labor: { name: "劳动节", date: "5月1日-5日", icon: "fas fa-hard-hat", order: 106 },
    children: { name: "儿童节", date: "6月1日", icon: "fas fa-child", order: 107 },
    dragonBoat: { name: "端午节", date: "农历五月初五", icon: "fas fa-dragon", order: 108 },
    qixi: { name: "七夕", date: "农历七月初七", icon: "fas fa-star", order: 109 },
    teacher: { name: "教师节", date: "9月10日", icon: "fas fa-chalkboard-teacher", order: 110 },
    midAutumn: { name: "中秋节", date: "农历八月十五", icon: "fas fa-moon", order: 111 },
    nationalDay: { name: "国庆节", date: "10月1日-7日", icon: "fas fa-flag", order: 112 },
    doubleNinth: { name: "重阳节", date: "农历九月初九", icon: "fas fa-mountain", order: 113 },
    halloween: { name: "万圣节", date: "10月31日", icon: "fas fa-ghost", order: 114 },
    singlesDay: { name: "光棍节", date: "11月11日", icon: "fas fa-hand-holding-heart", order: 115 },
    winterSolstice: { name: "冬至", date: "12月21/22日", icon: "fas fa-icicles", order: 116 },
    christmas: { name: "圣诞节", date: "12月24-26日", icon: "fas fa-sleigh", order: 117 },
};

function createTimelineItem(theme, isActive) {
    const item = document.createElement('div');
    item.className = 'theme-timeline-item';
    if (isActive) {
        item.classList.add('active');
    }

    const line = document.createElement('div');
    line.className = 'theme-timeline-line';

    const content = document.createElement('div');
    content.className = 'theme-timeline-content';

    const title = document.createElement('div');
    title.className = 'theme-timeline-title';

    const icon = document.createElement('i');
    icon.className = `${theme.icon} theme-timeline-icon`;

    title.appendChild(icon);
    title.append(` ${theme.name}`);

    const date = document.createElement('div');
    date.className = 'theme-timeline-date';
    date.textContent = theme.date;

    content.appendChild(title);
    content.appendChild(date);
    item.appendChild(line);
    item.appendChild(content);

    return item;
}

async function initThemeTimeline() {
    const container = document.querySelector('.theme-timeline-container');
    if (!container) return;

    const currentThemeKey = await getCurrentThemeKey();

    const sortedThemes = Object.entries(THEMES).sort(([, a], [, b]) => a.order - b.order);

    for (const [key, theme] of sortedThemes) {
        const isActive = key === currentThemeKey;
        const item = createTimelineItem(theme, isActive);
        container.appendChild(item);

        if (isActive) {
            setTimeout(() => {
                const containerRect = container.getBoundingClientRect();
                const itemRect = item.getBoundingClientRect();
                const offset = itemRect.top - containerRect.top - (container.clientHeight / 2) + (item.clientHeight / 2);

                container.scrollTo({
                    top: container.scrollTop + offset,
                    behavior: 'smooth'
                });
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', initThemeTimeline);