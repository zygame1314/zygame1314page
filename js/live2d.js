window.onload = () => {
    new l2dViewer({
        el: document.getElementById('L2dCanvas'),
        basePath: 'https://cdn.jsdmirror.com/gh/zygame1314/Live2dV3@1.6.8/assets',
        modelName: 'knight',
        width: 300,
        height: 300,
        mobileLimit: true
    })
}