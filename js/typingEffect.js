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
