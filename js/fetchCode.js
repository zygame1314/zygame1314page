function getDeviceFingerprint() {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    return `${screenInfo}-${timeZone}-${language}-${platform}`;
}

function generateActivationCode() {
    const deviceInfo = getDeviceFingerprint();
    const timestamp = Math.floor(Date.now() / (1000 * 3600 * 4));
    const raw = deviceInfo + timestamp;

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
    return code;
}

function fetchActivationCode() {
    try {
        const activationCode = generateActivationCode();
        document.getElementById('activation-code-value').textContent = activationCode;
    } catch (error) {
        console.error('生成激活码失败:', error);
        document.getElementById('activation-code-value').textContent = '获取失败';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchActivationCode();
});

document.getElementById('refresh-activation-code').addEventListener('click', function () {
    showNotification('激活码已刷新', 5, 'warning');
    fetchActivationCode();
});

document.getElementById('copy-activation-code').addEventListener('click', function () {
    const activationCodeValue = document.getElementById('activation-code-value').textContent;

    if (activationCodeValue !== '获取中...' && activationCodeValue !== '获取失败') {
        navigator.clipboard.writeText(activationCodeValue)
            .then(() => {
                showNotification('激活码已复制到剪贴板', 5, 'success');
            })
            .catch(err => {
                console.error('复制激活码失败:', 'error');
                showNotification('复制失败，请重试', 5, 'error');
            });
    } else {
        showNotification('当前激活码不可用', 5, 'error');
    }
});

