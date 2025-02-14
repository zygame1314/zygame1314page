document.addEventListener("DOMContentLoaded", function () {
    const textBox = document.getElementById("live2d-text-box");
    let notificationTimer = null;


    window.showLive2dNotification = function (text, duration = 1000) {
        if (notificationTimer) {
            clearTimeout(notificationTimer);
        }

        textBox.innerHTML = text;
        textBox.classList.remove("hide");
        textBox.classList.add("show");

        notificationTimer = setTimeout(() => {
            textBox.classList.remove("show");
            textBox.classList.add("hide");
        }, duration);
    };

    function setupTextHover() {
        const textBoxEnabled = localStorage.getItem('textBoxDisplay') !== 'false';
        if (!textBoxEnabled) {
            removeTextHover();
            return;
        }

        const weatherDialogs = {
            thunderstorm: {
                cold: ["打雷啦！这种天气最适合待在家里了，记得关好门窗！"],
                mild: ["打雷啦！记得关好门窗，注意安全哦~"],
                hot: ["又是打雷又是闷热的，要开空调降温吗？"]
            },
            drizzle: {
                cold: ["冷冷的毛毛雨，记得添件衣服带把伞~"],
                mild: ["毛毛雨天气，带把伞出门吧~"],
                hot: ["下着小雨，倒是让这闷热的天气凉快了些~"]
            },
            rain: {
                cold: ["特别冷的下雨天，要穿暖和点再出门哦~"],
                mild: ["下雨天记得带伞，别着凉了~"],
                hot: ["下雨天总算凉快些了，但还是要带伞哦~"]
            },
            snow: {
                cold: ["下雪了！虽然很美，但要注意保暖哦~"],
                mild: ["居然下雪了！要不要出去看看？记得添件外套~"],
                hot: ["这温度还下雪？大概是系统坏掉了..."]
            },
            clear: {
                cold: ["就算是晴天也挺冷的，要是出门记得多穿点~"],
                mild: ["天气晴朗，温度正好，要出去走走吗？"],
                hot: ["特别热的大晴天，记得防晒降温哦~"]
            },
            clouds: {
                cold: ["特别冷的多云天气，要注意保暖~"],
                mild: ["云朵飘飘的，温度也很舒服呢~"],
                hot: ["闷热的多云，不过好在有云遮挡阳光~"]
            }
        };

        const textMap = {
            "#home": "欢迎来到主人的主页！不问来人，不问出处，放松就好！",
            "#projects": "这里是主人目前发起的项目，何不来看看？",
            "#about": "一行诗韵承载梦想，一段代码编织未来；漫漫旅途记录成长，人生如诗静待绽放……",
            "#contact": "发邮件，加QQ，逛Github还是一起steam？",
            "#live2d-settings": "在这里可以调整Live2D模型的设置，按照你的喜好来吧！",
            "#article-network": "这是一个展示文章之间关联的网络图，通过它可以发现更多相关内容~",
            "#articles": "这里是主人的文章分享，包含各类主题，欢迎阅读！",
            "#donate-button-section": "如果你喜欢主人的项目，可以考虑捐赠支持一下~",
            ".glitch-container": "欢迎来到zygame1314的个人主页！",
            ".typing-effect": "出自唐代李白的《陪侍御叔华登楼歌》。",
            "#dev-journey": "记录了主人的编程历程，从最初的梦想到现在的点点进步~",
            "#waline": "期待听到你的想法和建议！别客气，说说看~",
            ".avatar": "主人的头像，派克猫猫！",
            "footer": "这里是页脚区域，包含了一些关于本站的信息。",
            ".Canvas": "没有可以思考的心智。<br>没有可以屈从的意志。<br>没有为苦难哭泣的声音。<br>生于神与虚空之手。<br>你必封印在众人梦中散布瘟疫的障目之光。<br>你是容器。<br>你是空洞骑士。"
        };

        const weatherWidget = document.querySelector('.weather-widget');
        if (weatherWidget) {
            weatherWidget.addEventListener("mouseenter", async function () {
                const temperature = document.querySelector('.temperature')?.textContent;
                const description = document.querySelector('.description')?.textContent;

                if (!temperature || !description || temperature.trim() === '' || description.trim() === '') {
                    showLive2dNotification("天气数据还在路上~稍后再来看看吧!", 2000);
                    return;
                }

                const weatherClass = Array.from(weatherWidget.classList)
                    .find(cls => cls.startsWith('weather-') && cls !== 'weather-widget');

                let weatherType = '';
                if (weatherClass) {
                    weatherType = weatherClass.replace('weather-', '');
                    console.log('Weather type:', weatherType);
                }

                let tempComment = '';
                const temp = parseInt(temperature);
                if (temp <= 0) {
                    tempComment = "好冷啊，要注意保暖哦！";
                } else if (temp < 10) {
                    tempComment = "天气有点凉，多穿点衣服~";
                } else if (temp < 20) {
                    tempComment = "温度很舒适呢！";
                } else if (temp < 30) {
                    tempComment = "天气渐暖，别穿太多啦~";
                } else {
                    tempComment = "好热呀，记得防暑降温！";
                }

                let weatherDialog = '';
                if (weatherType && weatherDialogs[weatherType]) {
                    let tempRange = '';
                    if (temp <= 10) {
                        tempRange = 'cold';
                    } else if (temp < 26) {
                        tempRange = 'mild';
                    } else {
                        tempRange = 'hot';
                    }

                    const dialogArray = weatherDialogs[weatherType][tempRange];
                    if (dialogArray && dialogArray.length > 0) {
                        weatherDialog = dialogArray[Math.floor(Math.random() * dialogArray.length)];
                    }
                }

                const message = `${description}，${temperature}。${weatherDialog || ''}`;
                showLive2dNotification(message, 3000);
            });
        }

        for (const [selector, text] of Object.entries(textMap)) {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener("mouseenter", function () {
                    showLive2dNotification(text, 2000);
                });
            }
        }
    }

    setupTextHover();
});
