document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth < 1200) {
        console.log("Live2D 文本组件在移动设备上已禁用。");
        const textBoxContainer = document.getElementById("live2d-text-box");
        if (textBoxContainer) {
            textBoxContainer.style.display = 'none';
        }
        return;
    }
    const textBox = document.getElementById("live2d-text-box");
    let notificationTimer = null;
    function calculateDisplayDuration(text) {
        const baseTime = 1000;
        const perCharTime = 100;
        return Math.min(baseTime + text.length * perCharTime, 8000);
    }
    window.showLive2dNotification = function (text, duration = null, expression = null) {
        if (notificationTimer) {
            clearTimeout(notificationTimer);
        }

        if (window.live2dModel && expression) {
            window.live2dModel.expression(expression);
        }

        const displayTime = duration || calculateDisplayDuration(text);
        textBox.innerHTML = `<span>${text}</span>`;
        textBox.classList.remove("hide");
        textBox.classList.add("show");

        notificationTimer = setTimeout(() => {
            textBox.classList.remove("show");
            textBox.classList.add("hide");
        }, displayTime);
    };
    function setupTextHover() {
        const textBoxEnabled = localStorage.getItem('textBoxDisplay') !== 'false';
        if (!textBoxEnabled) {
            removeTextHover();
            return;
        }
        const weatherDialogs = {
            thunderstorm: {
                cold: { message: "打雷啦！这种天气最适合待在家里了，记得关好门窗！", expression: L2D_EXPRESSIONS.SURPRISED },
                mild: { message: "打雷啦！记得关好门窗，注意安全哦~", expression: L2D_EXPRESSIONS.SURPRISED },
                hot: { message: "又是打雷又是闷热的，要开空调降温吗？", expression: L2D_EXPRESSIONS.ANNOYED }
            },
            drizzle: {
                cold: { message: "冷冷的毛毛雨，记得添件衣服带把伞~", expression: L2D_EXPRESSIONS.CONFUSED },
                mild: { message: "毛毛雨天气，带把伞出门吧~", expression: L2D_EXPRESSIONS.BAG },
                hot: { message: "下着小雨，倒是让这闷热的天气凉快了些~", expression: L2D_EXPRESSIONS.SUNGLASSES }
            },
            rain: {
                cold: { message: "特别冷的下雨天，要穿暖和点再出门哦~", expression: L2D_EXPRESSIONS.ANNOYED },
                mild: { message: "下雨天记得带伞，别着凉了~", expression: L2D_EXPRESSIONS.BAG },
                hot: { message: "下雨天总算凉快些了，但还是要带伞哦~", expression: L2D_EXPRESSIONS.SUNGLASSES }
            },
            snow: {
                cold: { message: "下雪了！虽然很美，但要注意保暖哦~", expression: L2D_EXPRESSIONS.STARRY_EYES },
                mild: { message: "居然下雪了！要不要出去看看？记得添件外套~", expression: L2D_EXPRESSIONS.STARRY_EYES },
                hot: { message: "这温度还下雪？大概是系统坏掉了...", expression: L2D_EXPRESSIONS.SPEECHLESS }
            },
            clear: {
                cold: { message: "就算是晴天也挺冷的，要是出门记得多穿点~", expression: L2D_EXPRESSIONS.CONFUSED },
                mild: { message: "天气晴朗，温度正好，要出去走走吗？", expression: L2D_EXPRESSIONS.SUNGLASSES },
                hot: { message: "特别热的大晴天，记得防晒降温哦~", expression: L2D_EXPRESSIONS.DIZZY }
            },
            clouds: {
                cold: { message: "特别冷的多云天气，要注意保暖~", expression: L2D_EXPRESSIONS.ANNOYED },
                mild: { message: "云朵飘飘的，温度也很舒服呢~", expression: L2D_EXPRESSIONS.BAG },
                hot: { message: "闷热的多云，不过好在有云遮挡阳光~", expression: L2D_EXPRESSIONS.SPEECHLESS }
            }
        };
        const textMap = {
            "#home": { message: "欢迎来到主人的主页！不问来人，不问出处，放松就好！", expression: L2D_EXPRESSIONS.SUNGLASSES },
            "#projects": { message: "这里是主人目前发起的项目，何不来看看？", expression: L2D_EXPRESSIONS.STARRY_EYES },
            "#about": { message: "一行诗韵承载梦想，一段代码编织未来；漫漫旅途记录成长，人生如诗静待绽放……", expression: L2D_EXPRESSIONS.SUNGLASSES },
            "#contact": { message: "发邮件，加QQ，逛Github还是一起steam？", expression: L2D_EXPRESSIONS.CONFUSED },
            "#live2d-settings": { message: "在这里可以调整Live2D模型的设置，按照你的喜好来吧！设置后记得刷新页面哦~", expression: L2D_EXPRESSIONS.DIZZY },
            "#article-network": { message: "这是一个展示文章之间关联的网络图，通过它可以发现更多相关内容~", expression: L2D_EXPRESSIONS.BAG },
            "#articles": { message: "这里是主人的文章分享，包含各类主题，欢迎阅读！", expression: L2D_EXPRESSIONS.BAG },
            "#donate-button-section": { message: "如果你喜欢主人的项目，可以考虑捐赠支持一下~", expression: L2D_EXPRESSIONS.STARRY_EYES },
            ".glitch-container": { message: "欢迎来到zygame1314的个人主页！", expression: L2D_EXPRESSIONS.SUNGLASSES },
            ".typing-effect": { message: "出自唐代李白的《陪侍御叔华登楼歌》。", expression: L2D_EXPRESSIONS.BAG },
            "#dev-journey": { message: "记录了主人的编程历程，从最初的梦想到现在的点点进步~", expression: L2D_EXPRESSIONS.BAG },
            "#waline": { message: "期待听到你的想法和建议！别客气，说说看~", expression: L2D_EXPRESSIONS.SURPRISED },
            ".avatar": { message: "“猎人握着片手剑，立于寒风之中。这剑，是斩过龙的，也是格挡过猛击的。然而，今日的怪物，却狡猾异常。猎人屡次出击，却总是差之毫厘。他听见有人在窃笑，说：'看哪，这便是一个哦润吉的下场！' 猎人紧咬牙关，他不信这'哦润吉'的命运，正如他不信这世间的黑暗一般。”", expression: L2D_EXPRESSIONS.SURPRISED },
            "footer": { message: "这里是页脚区域，包含了一些关于本站的信息。", expression: L2D_EXPRESSIONS.SUNGLASSES }
        };
        const weatherWidget = document.querySelector('.weather-widget');
        if (weatherWidget) {
            weatherWidget.addEventListener("mouseenter", async function () {
                const temperature = document.querySelector('.temperature')?.textContent;
                const description = document.querySelector('.description')?.textContent;
                if (!temperature || !description || temperature.trim() === '' || description.trim() === '') {
                    showLive2dNotification("天气数据还在路上~稍后再来看看吧!", null, L2D_EXPRESSIONS.CONFUSED);
                    return;
                }

                const temp = parseInt(temperature);
                let tempComment = '';
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
                let expression = L2D_EXPRESSIONS.SUNGLASSES;

                const weatherClass = Array.from(weatherWidget.classList).find(cls => cls.startsWith('weather-') && cls !== 'weather-widget');
                if (weatherClass) {
                    const weatherType = weatherClass.replace('weather-', '');
                    let tempRange = '';
                    if (temp <= 10) {
                        tempRange = 'cold';
                    } else if (temp < 26) {
                        tempRange = 'mild';
                    } else {
                        tempRange = 'hot';
                    }

                    if (weatherDialogs[weatherType] && weatherDialogs[weatherType][tempRange]) {
                        const dialogData = weatherDialogs[weatherType][tempRange];
                        weatherDialog = dialogData.message;
                        expression = dialogData.expression;
                    }
                }

                const message = `${description}，${temperature}。 ${weatherDialog} ${tempComment}`.trim().replace(/  +/g, ' ');
                showLive2dNotification(message, null, expression);
            });
        }
        for (const [selector, text] of Object.entries(textMap)) {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener("mouseenter", function () {
                    if (typeof text === 'string') {
                        showLive2dNotification(text);
                    } else {
                        showLive2dNotification(text.message, null, text.expression);
                    }
                });
            }
        }
    }
    setupTextHover();
});
