L2Dwidget.init({
    model: {
        jsonPath: '/models/Knight/model3.json',  // 指定模型的路径
        scale: 1  // 缩放比例，可以根据需要调整
    },
    display: {
        position: "right",  // 模型显示位置，可以是 'right' 或 'left'
        width: 150,         // 模型的宽度
        height: 300,        // 模型的高度
        hOffset: 0,         // 水平偏移量
        vOffset: -20        // 垂直偏移量
    },
    mobile: {
        show: true,          // 移动端是否显示模型
        scale: 0.5          // 移动端的模型缩放比例
    },
    react: {
        opacityDefault: 0.7,  // 模型默认的透明度
        opacityOnHover: 0.9   // 鼠标悬浮时模型的透明度
    }
});
