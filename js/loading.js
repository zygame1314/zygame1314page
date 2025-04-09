document.addEventListener('DOMContentLoaded', () => {
    window.loadingComplete = new Promise((resolve) => {
        window.resolveLoading = resolve;
    });
    const loadingScreen = document.querySelector('.loading-screen');
    const progressFill = document.querySelector('.progress-fill');
    const loadingText = document.querySelector('.loading-text');
    const loadingContent = document.querySelector('.loading-content');
    const loadingHint = document.querySelector('.loading-hint');

    const loadingStages = {
        initializing: {
            progress: 0,
            texts: [
                '[初始化 🚀] 正在启动像素引擎...',
                '[初始化 🔧] 正在加载配置文件...',
                '[初始化 🌟] 正在生成随机种子...'
            ]
        },
        loading: {
            progress: 25,
            texts: [
                '[加载中 📦] 正在打包薛定谔的猫...',
                '[加载中 💾] 正在偷取隔壁服务器的内存...',
                '[加载中 ⚡] 正在注入量子像素...'
            ]
        },
        processing: {
            progress: 50,
            texts: [
                '[处理中 🔄] 正在给像素们喂食咖啡因...',
                '[处理中 🐛] 正在抓取落单的Bug...',
                '[处理中 🎮] 正在调教Live2D助手...'
            ]
        },
        optimizing: {
            progress: 75,
            texts: [
                '[优化中 📊] 正在计算π的最后一位数...',
                '[优化中 🎨] 正在给二进制加上美颜滤镜...',
                '[优化中 🚀] 正在压缩虚空能量...'
            ]
        },
        finalizing: {
            progress: 90,
            texts: [
                '[完成中 🎉] 正在给服务器续命...',
                '[完成中 🌈] 正在思考电子羊的梦...',
                '[完成中 🎯] 准备起飞...'
            ]
        }
    };

    const pixelChar = document.createElement('div');
    pixelChar.className = 'pixel-character';
    loadingContent.appendChild(pixelChar);

    let progress = 0;
    let lastTextUpdateTime = 0;
    let currentStageDisplayed = '';
    const MIN_STAGE_DURATION = 1000;
    const TEXT_UPDATE_INTERVAL = 800;
    const HINT_DISPLAY_DELAY = 100;
    const MIN_LOADING_TIME = 1000;
    let startTime = Date.now();

    setTimeout(() => {
        loadingHint.classList.add('show');
    }, HINT_DISPLAY_DELAY);

    function getCurrentStage(progress) {
        if (progress < 25) return 'initializing';
        if (progress < 50) return 'loading';
        if (progress < 75) return 'processing';
        if (progress < 90) return 'optimizing';
        return 'finalizing';
    }

    function getRandomText(stage) {
        const texts = loadingStages[stage].texts;
        return texts[Math.floor(Math.random() * texts.length)];
    }

    const getResourceFileTypes = () => {
        return ['text/css', 'text/html', 'text/javascript', 'application/javascript', 'application/json'];
    };

    const getAllResources = () => {
        const resources = window.performance.getEntries();
        return resources.filter(resource => {
            if (resource.initiatorType === 'link' ||
                resource.initiatorType === 'script' ||
                resource.initiatorType === 'navigation') {
                return true;
            }

            const url = resource.name.toLowerCase();
            return url.endsWith('.css') ||
                url.endsWith('.js') ||
                url.endsWith('.html') ||
                url.endsWith('.json');
        });
    };

    const calculateProgress = () => {
        const resources = getAllResources();

        let loadedSize = 0;
        let totalSize = 0;

        resources.forEach(resource => {
            if (resource.transferSize) {
                totalSize += resource.transferSize;
                if (resource.responseEnd > 0) {
                    loadedSize += resource.transferSize;
                }
            } else if (resource.decodedBodySize) {
                totalSize += resource.decodedBodySize;
                if (resource.responseEnd > 0) {
                    loadedSize += resource.decodedBodySize;
                }
            }
        });

        if (totalSize === 0) return 0;

        let calculatedProgress = (loadedSize / totalSize) * 100;
        return Math.min(calculatedProgress, 100);
    };

    function updateProgress() {
        const currentTime = Date.now();

        const realProgress = calculateProgress();

        if (realProgress > progress) {
            progress += Math.min(2, (realProgress - progress) * 0.1);
        }

        const elapsedTime = currentTime - startTime;
        const maxAllowedProgress = elapsedTime < MIN_LOADING_TIME ? 95 : 100;

        progress = Math.min(progress, maxAllowedProgress);

        progressFill.style.transform = `translateX(${progress - 100}%)`;
        progressFill.style.width = '100%';
        pixelChar.style.left = `${progress}%`;

        const currentStage = getCurrentStage(progress);

        if (currentStage !== currentStageDisplayed ||
            (currentTime - lastTextUpdateTime > TEXT_UPDATE_INTERVAL)) {
            loadingText.textContent = getRandomText(currentStage);
            lastTextUpdateTime = currentTime;
            currentStageDisplayed = currentStage;
        }

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        } else {
            const finalDelay = Math.max(0, MIN_STAGE_DURATION - (currentTime - lastTextUpdateTime));
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    window.resolveLoading();
                }, 500);
            }, finalDelay);
        }
    }

    const resourceLoadListener = () => {
        updateProgress();
    };

    window.addEventListener('load', () => {
        setTimeout(() => {
            progress = 100;
        }, Math.max(0, MIN_LOADING_TIME - (Date.now() - startTime)));
    });

    setInterval(resourceLoadListener, 200);

    requestAnimationFrame(updateProgress);

    loadingScreen.addEventListener('click', () => {
        progress = Math.min(progress + 10, 100);
    });
});