window.loadingComplete = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
        const loadingScreen = document.querySelector('.loading-screen');
        const MIN_LOADING_TIME = 500;

        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    resolve();
                }, 500);
            }, MIN_LOADING_TIME);
        } else {
            console.error('加载屏幕元素未找到。');
            resolve();
        }
    });
});