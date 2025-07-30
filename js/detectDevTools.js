(function() {
    let devToolsOpen = false;
    let smallScreenWarningShown = false;
    const devToolsThreshold = 160;
    const minScreenWidth = 360;

    function checkStatus() {
        const isDevToolsCurrentlyOpen = (window.outerWidth - window.innerWidth > devToolsThreshold) ||
                                        (window.outerHeight - window.innerHeight > devToolsThreshold);

        if (isDevToolsCurrentlyOpen && !devToolsOpen) {
            devToolsOpen = true;
            if (typeof showNotification === 'function') {
                showNotification('你选择了红色药丸 💊<br>欢迎进入代码的真实世界！🌐<br>不要迷失在`console.log`里...', 3, 'info');
            }
        } else if (!isDevToolsCurrentlyOpen) {
            devToolsOpen = false;
        }

        const isScreenSmall = window.innerWidth < minScreenWidth;

        if (isScreenSmall && !smallScreenWarningShown) {
            smallScreenWarningShown = true;
            if (typeof showNotification === 'function') {
                showNotification('你这能看清吗？🔍<br>当前设备屏幕太小，可能影响浏览体验。', 3, 'warning');
            }
        } else if (!isScreenSmall) {
            smallScreenWarningShown = false;
        }
    }

    window.addEventListener('resize', checkStatus);

    checkStatus();
})();
