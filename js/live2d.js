let app;
let currentModel;
const modelBasePath = '/data/live2d/';
const modelName = 'knight';
const modelJsonPath = `${modelBasePath}${modelName}/${modelName}.model3.json`;
const canvasContainer = document.getElementById('L2dCanvas');
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}
async function loadLive2dLibraries() {
    const libraries = [
        'https://cdn.jsdmirror.com/npm/live2dcubismcore@latest/live2dcubismcore.min.js',
        'https://cdn.jsdmirror.com/npm/pixi.js@5.3.12/dist/pixi.min.js',
        'https://cdn.jsdmirror.com/npm/pixi-live2d-display/dist/cubism4.min.js'
    ];
    try {
        for (const url of libraries) {
            console.log(`Loading library: ${url}`);
            await loadScript(url);
            console.log(`Library loaded: ${url}`);
        }
        window.PIXI = PIXI;
        console.log("All Live2D libraries loaded successfully.");
        return true;
    } catch (error) {
        console.error("Failed to load Live2D libraries:", error);
        if (typeof showLive2dNotification === 'function') {
            showNotification('错误：核心库加载失败', 3, 'error');
        } else {
            showNotification('错误：核心库加载失败，请查看控制台。', 3, 'error');
        }
        return false;
    }
}
async function initializeLive2D() {
    if (window.innerWidth < 1200) {
        console.log("Live2D disabled on mobile devices.");
        if (canvasContainer) {
            canvasContainer.style.display = 'none';
        }
        return;
    }
    if (!canvasContainer) {
        console.error("L2dCanvas container element not found!");
        return;
    }
    const librariesLoaded = await loadLive2dLibraries();
    if (!librariesLoaded) {
        if (canvasContainer) {
            canvasContainer.style.display = 'none';
        }
        return;
    }
    try {
        console.log("Initializing PIXI Application...");
        app = new PIXI.Application({
            width: 300,
            height: 300,
            transparent: true,
            autoStart: true,
            resizeTo: canvasContainer
        });
        canvasContainer.innerHTML = '';
        canvasContainer.appendChild(app.view);
        app.view.className = 'live2d-canvas-view';
        currentModel = await PIXI.live2d.Live2DModel.from(modelJsonPath, {
            idleMotionGroup: 'Idle',
            autoInteract: true,
            onError: (e) => {
                console.error("Error loading Live2D model:", e);
                if (typeof showLive2dNotification === 'function') {
                    showNotification('模型加载出错 (；′⌒`)', 3, 'error');
                }
            }
        });
        if (!currentModel) {
            throw new Error("Live2DModel.from returned undefined or null.");
        }
        console.log("Model loaded successfully:", currentModel);
        app.stage.addChild(currentModel);
        handleResize();
        if (typeof showLive2dNotification === 'function') {
            showTimeGreeting();
        } else {
            console.warn("showLive2dNotification not ready when model loaded.");
            setTimeout(() => {
                if (typeof showLive2dNotification === 'function') {
                    showTimeGreeting();
                } else {
                    console.error("showLive2dNotification still not available for greeting.");
                }
            }, 500);
        }
        window.addEventListener('resize', handleResize);
        window.live2dApp = app;
        window.live2dModel = currentModel;
    } catch (error) {
        console.error("Error during Live2D setup (PIXI/Model):", error);
        if (typeof showLive2dNotification === 'function') {
            showNotification('模型设置失败😭😭', 3, 'error');
        } else {
            showNotification(`模型设置失败，请检查控制台。`, 3, 'error');
        }
        if (canvasContainer) {
            canvasContainer.style.display = 'none';
        }
    }
}
function handleResize() {
    if (!app || !currentModel || !currentModel.width || !currentModel.height) return;
    const fixedScale = 0.2;
    const containerRect = canvasContainer.getBoundingClientRect();
    const viewWidth = containerRect.width;
    const viewHeight = containerRect.height;
    app.renderer.resize(viewWidth, viewHeight);
    currentModel.scale.set(fixedScale);
    currentModel.x = viewWidth / 2;
    currentModel.y = viewHeight / 2;
    currentModel.anchor.set(0.5, 0.5);
    console.log(`Canvas size: ${viewWidth}x${viewHeight}, Using fixed scale: ${fixedScale}`);
}
function showTimeGreeting() {
    if (typeof showLive2dNotification !== 'function') {
        console.warn("showLive2dNotification function not found. Skipping greeting.");
        return;
    }
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
    showLive2dNotification(greeting, 3000);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLive2D);
} else {
    initializeLive2D();
}