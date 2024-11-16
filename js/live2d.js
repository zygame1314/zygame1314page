window.onload = () => {
    new l2dViewer({
        el: document.getElementById('L2dCanvas'),
        basePath: '/Live2dV3/assets',
        modelName: 'knight',
        width: 300,
        height: 300,
        mobileLimit: true
    })
}