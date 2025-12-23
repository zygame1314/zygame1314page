export function initParallax() {
    const header = document.querySelector('header');
    let ticking = false;
    function updateParallax() {
        const scrollPosition = window.scrollY;
        if (scrollPosition > header.offsetHeight) {
            ticking = false;
            return;
        }
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        ticking = false;
    }
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
}