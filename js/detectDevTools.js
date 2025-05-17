let devToolsOpen = false;
let smallScreenWarningShown = false;

function detectDevTools() {
    const threshold = 160;
    const minScreenWidth = 360;

    if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
    ) {
        if (!devToolsOpen) {
            devToolsOpen = true;
            showNotification('你选择了红色药丸 💊<br>欢迎进入代码的真实世界！🌐<br>不要迷失在`console.log`里...', 3, 'info');
        }
    } else {
        devToolsOpen = false;
    }

    if (window.innerWidth < minScreenWidth) {
        if (!smallScreenWarningShown) {
            smallScreenWarningShown = true;
            showNotification('你这能看清吗？🔍<br>当前设备屏幕太小，可能影响浏览体验。', 3, 'warning');
        }
    } else {
        smallScreenWarningShown = false;
    }
}

setInterval(detectDevTools, 1000);
