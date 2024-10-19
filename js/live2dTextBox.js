document.addEventListener("DOMContentLoaded", function () {
    const textBox = document.getElementById("live2d-text-box");

    function isMobileDevice() {
        return window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
    }

    function setupTextHover() {
        const textMap = {
            "#home": "欢迎来到我的主页！不问来人，不问出处，放松就好！",
            "#projects": "这里是我目前发起的项目，也许有一天会充实起来……",
            "#about": "一首小诗，文笔不佳请见谅……",
            "#contact": "发邮件，加QQ，逛Github还是一起steam？",
            "#weather": "当前天气情况，可能不是很准……。",
            "#games": "最近的热门游戏，有没有戳中你的呢？",
            "#steam-games": "我最近在玩的游戏，有没有和你一样的呢？",
            "#visit-counter": "感谢每一位光临的朋友！",
            ".glitch-container": "欢迎来到zygame1314的个人主页！",
            ".typing-effect": "出自唐代李白的《陪侍御叔华登楼歌》。",
            "#vcomments": "评论区区域，使用了Valine评论系统。",
            "#vcomments input": "输入关于你的信息，当然，匿名也欢迎！",
            "#vcomments textarea": "来都来了，不说点什么？",
            "#vcomments button": "点击按钮发表你的评论，要对自己的言论负责哦。",
            ".avatar": "我的头像，派克猫猫！",
            "footer": "这是页面的页脚部分，咱也是有正经备案的！",
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
