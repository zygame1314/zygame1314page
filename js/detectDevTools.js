let devToolsOpen = false;

function detectDevTools() {
    const threshold = 160;

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
}

setInterval(detectDevTools, 1000);
