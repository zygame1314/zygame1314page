function fetchActivationCode() {
    AV.Cloud.run('getCurrentActivationCode')
        .then(function (result) {
            const activationCode = result.code;
            document.getElementById('activation-code-value').textContent = activationCode;
        })
        .catch(function (error) {
            console.error('Failed to fetch activation code:', error);
            document.getElementById('activation-code-value').textContent = '获取失败';
        });
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

