function initParallax() {
    const header = document.querySelector('header');

    function handleScroll() {
        const scrollPosition = window.scrollY;
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    }

    window.addEventListener('scroll', handleScroll);
}