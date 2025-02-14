<<<<<<< HEAD
function initTypingEffect() {
    const tagline = document.querySelector('.typing-effect');
    const text = tagline.textContent.replace('\\n', '\n');
    tagline.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            tagline.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    typeWriter();
}
=======
function initTypingEffect() {
    const tagline = document.querySelector('.typing-effect');
    const text = tagline.textContent.replace('\\n', '\n');
    tagline.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            tagline.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    typeWriter();
}
>>>>>>> b029a527becedfc9927b8e11b6ce5e48017539d2
