window.onload = () => {
    new l2dViewer({
        el: document.getElementById('L2dCanvas'),
        basePath: 'https://jsd.onmicrosoft.cn/gh/zygame1314/Live2dV3@1.0.4/assets',
        modelName: 'knight',
        width: 300,
        height: 300
    })
}