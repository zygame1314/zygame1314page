window.onload = () => {
    new l2dViewer({
        el: document.getElementById('L2dCanvas'),
        basePath: 'https://jsd.proxy.aks.moe/gh/zygame1314/Live2dV3@latest/assets',
        modelName: 'knight',
        width: 300,
        height: 300,
        mobileLimit: true
    })
}