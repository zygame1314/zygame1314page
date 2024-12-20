document.addEventListener("DOMContentLoaded", function () {
    const textBox = document.getElementById("live2d-text-box");

    function isMobileDevice() {
        return window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
    }

    function setupTextHover() {
        const textBoxEnabled = localStorage.getItem('textBoxDisplay') !== 'false';
        if (!textBoxEnabled) {
            removeTextHover();
            return;
        }

        const textMap = {
            "#home": "欢迎来到我的主页！不问来人，不问出处，放松就好！",
            "#projects": "这里是我目前发起的项目，也许有一天会充实起来……",
            "#about": "一行诗韵承载梦想，一段代码编织未来；漫漫旅途记录成长，人生如诗静待绽放……",
            "#contact": "发邮件，加QQ，逛Github还是一起steam？",
            "#weather": "当前天气情况，数据来源于OpenWeatherMap。",
            "#games": "最近的热门游戏，数据来源于Steam。",
            "#steam-games": "我最近在玩的游戏，有没有和你一样的呢？",
            "#live2d-settings": "在这里可以调整Live2D模型的设置，按照你的喜好来吧！",
            "#article-network": "这是一个展示文章之间关联的网络图，通过它可以发现更多相关内容~",
            "#articles": "这里是我的文章分享，包含各类主题，欢迎阅读！",
            "#donate-button-section": "如果你喜欢我的项目，可以考虑捐赠支持一下~",
            ".glitch-container": "欢迎来到zygame1314的个人主页！",
            ".typing-effect": "出自唐代李白的《陪侍御叔华登楼歌》。",
            "#dev-journey": "记录了我的编程历程，从最初的梦想到现在的点点进步~",
            "#waline": "期待听到你的想法和建议！别客气，说说看~",
            ".avatar": "我的头像，派克猫猫！",
            "footer": "页脚区域：有备案信息，还有CDN赞助商的标志，正经着呢！",
            ".Canvas": "没有可以思考的心智。<br>没有可以屈从的意志。<br>没有为苦难哭泣的声音。<br>生于神与虚空之手。<br>你必封印在众人梦中散布瘟疫的障目之光。<br>你是容器。<br>你是空洞骑士。"
        };

        for (const [selector, text] of Object.entries(textMap)) {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener("mouseenter", function () {
                    textBox.innerHTML = text;
                    textBox.classList.remove("hide");
                    textBox.classList.add("show");
                });

                element.addEventListener("mouseleave", function () {
                    textBox.classList.remove("show");
                    textBox.classList.add("hide");
                });
            }
        }
    }

    function removeTextHover() {
        textBox.style.display = "none";
    }

    if (!isMobileDevice()) {
        setupTextHover();
    } else {
        removeTextHover();
    }

    window.addEventListener("resize", function () {
        if (isMobileDevice()) {
            removeTextHover();
        } else {
            textBox.style.display = "";
            setupTextHover();
        }
    });
});
