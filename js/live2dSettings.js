document.addEventListener('DOMContentLoaded', function () {
    const live2dDisplay = document.getElementById('live2d-display');
    const textBoxDisplay = document.getElementById('text-box-display');
    const live2dCanvas = document.getElementById('L2dCanvas');
    const textBox = document.getElementById('live2d-text-box');
    
    const savedLive2dDisplay = localStorage.getItem('live2dDisplay') !== 'false';
    const savedTextBoxDisplay = localStorage.getItem('textBoxDisplay') !== 'false';

    live2dDisplay.checked = savedLive2dDisplay;
    textBoxDisplay.checked = savedTextBoxDisplay;

    live2dCanvas.style.display = savedLive2dDisplay ? '' : 'none';
    textBox.style.display = savedTextBoxDisplay ? '' : 'none';

    live2dDisplay.addEventListener('change', function () {
        live2dCanvas.style.display = this.checked ? '' : 'none';
        localStorage.setItem('live2dDisplay', this.checked);
    });

    textBoxDisplay.addEventListener('change', function () {
        textBox.style.display = this.checked ? '' : 'none';
        localStorage.setItem('textBoxDisplay', this.checked);
    });
});