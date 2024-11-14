function initParallax() {
    const header = document.querySelector('header');
    const pixelStars = document.querySelector('.pixel-stars');

    function handleScroll() {
        const scrollPosition = window.scrollY;
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        pixelStars.style.transform = `translateY(${scrollPosition * 0.1}px)`;
    }

    window.addEventListener('scroll', handleScroll);
}