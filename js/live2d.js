import { showNotification } from './showNotification.js';
let app;
let currentModel;
let live2dInitialized = false;
let live2dDisabled = false;
const MOBILE_THRESHOLD = 1200;
const modelBasePath = 'https://bucket.zygame1314.site/static/live2d/';
const modelName = 'Doro';
const modelJsonPath = `${modelBasePath}${modelName}/${modelName}.model3.json`;
const canvasContainer = document.getElementById('L2dCanvas');
window.L2D_EXPRESSIONS = {
    ANNOYED: 'Exp1',
    SPEECHLESS: 'Exp2',
    SURPRISED: 'Exp3',
    CONFUSED: 'Exp4',
    SUNGLASSES: 'Exp5',
    BAG: 'Exp6',
    DIZZY: 'Exp7',
    STARRY_EYES: 'Exp8',
    TONGUE_OUT: 'TongueOut',
    HIGHLIGHT_OFF: 'HighlightOFF'
};
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`加载脚本失败: ${url}`));
        document.head.appendChild(script);
    });
}
async function loadLive2dLibraries() {
    const libraries = [
        '/js/lib/live2dcubismcore.min.js',
        '/js/lib/pixi.min.js',
        '/js/lib/cubism4.min.js'
    ];
    try {
        for (const url of libraries) {
            console.log(`正在加载库: ${url}`);
            await loadScript(url);
            console.log(`库已加载: ${url}`);
        }
        window.PIXI = PIXI;
        console.log("所有 Live2D 库加载成功。");
        return true;
    } catch (error) {
        console.error("加载 Live2D 库失败:", error);
        if (typeof showLive2dNotification === 'function') {
            showNotification('错误：核心库加载失败', 3, 'error');
        } else {
            showNotification('错误：核心库加载失败，请查看控制台。', 3, 'error');
        }
        return false;
    }
}
async function initializeLive2D() {
    if (window.innerWidth < MOBILE_THRESHOLD) {
        console.log("Live2D 在移动设备上已禁用。");
        live2dDisabled = true;
        if (canvasContainer) {
            canvasContainer.style.display = 'none';
        }
        return;
    }
    if (live2dInitialized) {
        console.log("Live2D 已初始化，跳过重复初始化。");
        return;
    }
    live2dDisabled = false;
    if (!canvasContainer) {
        console.error("未找到 L2dCanvas 容器元素！");
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
        console.log("正在初始化 PIXI 应用...");
        app = new PIXI.Application({
            transparent: true,
            autoStart: true,
            resizeTo: canvasContainer,
            resolution: window.devicePixelRatio || 1
        });
        canvasContainer.innerHTML = '';
        canvasContainer.appendChild(app.view);
        app.view.className = 'live2d-canvas-view';
        app.renderer.view.style.width = '300px';
        app.renderer.view.style.height = '300px';
        currentModel = await PIXI.live2d.Live2DModel.from(modelJsonPath, {
            onError: (e) => {
                console.error("加载 Live2D 模型时出错:", e);
                if (typeof showLive2dNotification === 'function') {
                    showNotification('模型加载出错 (；′⌒`)', 3, 'error');
                }
            }
        });
        currentModel.motion('Idle');
        currentModel.autoInteract = true;
        if (!currentModel) {
            throw new Error("Live2DModel.from 返回了 undefined 或 null。");
        }
        console.log("模型加载成功:", currentModel);
        app.stage.addChild(currentModel);
        live2dInitialized = true;
        handleResize();

        setTimeout(() => {
            if (typeof showLive2dNotification === 'function') {
                showTimeGreeting();
            } else {
                console.error("showLive2dNotification 函数在延迟后仍然不可用。");
            }
        }, 500);
        window.addEventListener('resize', handleResize);
        window.live2dApp = app;
        window.live2dModel = currentModel;
    } catch (error) {
        console.error("Live2D 设置期间出错 (PIXI/模型):", error);
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
    if (!app || !currentModel || !currentModel.internalModel || !currentModel.internalModel.width || !currentModel.internalModel.height) {
        console.warn("模型或其尺寸不可用于调整大小。");
        return;
    }
    const containerRect = canvasContainer.getBoundingClientRect();
    const viewWidth = containerRect.width;
    const viewHeight = containerRect.height;
    if (viewWidth <= 0 || viewHeight <= 0) {
        console.warn("画布容器尺寸为零或负数。");
        return;
    }
    app.renderer.resize(viewWidth, viewHeight);
    const modelWidth = currentModel.internalModel.width;
    const modelHeight = currentModel.internalModel.height;
    const scaleX = viewWidth / modelWidth;
    const scaleY = viewHeight / modelHeight;
    const scale = Math.min(scaleX, scaleY) * 0.8;
    currentModel.scale.set(-scale, scale);
    currentModel.x = viewWidth / 2;
    currentModel.y = viewHeight / 2;
    currentModel.anchor.set(0.5, 0.5);
    console.log(`画布尺寸: ${viewWidth}x${viewHeight}, 模型原始尺寸: ${modelWidth}x${modelHeight}, 计算缩放比例: ${scale.toFixed(3)}`);
}
function showTimeGreeting() {
    if (typeof showLive2dNotification !== 'function') {
        console.warn("未找到 showLive2dNotification 函数。跳过问候。");
        return;
    }
    const hour = new Date().getHours();
    const weekDay = new Date().getDay();
    const isWeekend = weekDay === 0 || weekDay === 6;
    let greeting = "";
    let expression = L2D_EXPRESSIONS.SUNGLASSES;
    if (hour < 3) {
        greeting = "夜深人静，还不休息吗？熬夜对身体不好哦";
        expression = L2D_EXPRESSIONS.ANNOYED;
    } else if (hour < 6) {
        greeting = "这个点还醒着？是修仙中吗？";
        expression = L2D_EXPRESSIONS.SURPRISED;
    } else if (hour < 9) {
        greeting = isWeekend ?
            "周末还这么早？悠闲地享受早餐吧~" :
            "早安！新的一天也要充满干劲呢！";
        expression = L2D_EXPRESSIONS.STARRY_EYES;
    } else if (hour < 11) {
        greeting = isWeekend ?
            "上午好！今天有什么有趣的计划吗？" :
            "上午好！工作别太累了，来杯咖啡提提神？";
        expression = L2D_EXPRESSIONS.BAG;
    } else if (hour < 13) {
        greeting = "午饭时间到了！想吃点什么呢？";
        expression = L2D_EXPRESSIONS.TONGUE_OUT;
    } else if (hour < 15) {
        greeting = "午后时光最容易犯困了，记得喝点水提提神~";
        expression = L2D_EXPRESSIONS.DIZZY;
    } else if (hour < 17) {
        greeting = hour === 15 ?
            "下午茶时间！要来块小蛋糕吗？" :
            "下午好！工作注意适当休息哦~";
        expression = L2D_EXPRESSIONS.CONFUSED;
    } else if (hour < 19) {
        greeting = "快到晚饭时间啦！今天过得开心吗？";
        expression = L2D_EXPRESSIONS.STARRY_EYES;
    } else if (hour < 22) {
        greeting = "晚上好！忙碌了一天，记得放松一下~";
        expression = L2D_EXPRESSIONS.SUNGLASSES;
    } else {
        greeting = "已经这么晚了，早点休息吧，熬夜会变丑的！";
        expression = L2D_EXPRESSIONS.SPEECHLESS;
    }
    showLive2dNotification(greeting, 3000, expression);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLive2D);
} else {
    initializeLive2D();
}

let resizeCheckTimer = null;
window.addEventListener('resize', () => {
    if (resizeCheckTimer) clearTimeout(resizeCheckTimer);
    resizeCheckTimer = setTimeout(() => {
        const isMobile = window.innerWidth < MOBILE_THRESHOLD;
        if (live2dInitialized && isMobile) {
            console.log("切换到小屏，销毁 Live2D。");
            destroyLive2D();
        } else if (!live2dInitialized && !isMobile && live2dDisabled) {
            console.log("切换到大屏，重新初始化 Live2D。");
            if (canvasContainer) {
                canvasContainer.style.display = '';
            }
            initializeLive2D();
        }
    }, 300);
});

function destroyLive2D() {
    try {
        if (currentModel) {
            app.stage.removeChild(currentModel);
            currentModel.destroy({ children: true, texture: true, baseTexture: true });
            currentModel = null;
        }
        if (app) {
            app.destroy(true, { children: true, texture: true, baseTexture: true });
            app = null;
        }
        if (canvasContainer) {
            canvasContainer.innerHTML = '';
            canvasContainer.style.display = 'none';
        }
        window.live2dApp = null;
        window.live2dModel = null;
    } catch (e) {
        console.error("销毁 Live2D 时出错:", e);
    }
    live2dInitialized = false;
    live2dDisabled = true;
}