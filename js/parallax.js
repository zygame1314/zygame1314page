<<<<<<< HEAD
function initParallax() {
    const header = document.querySelector('header');

    function handleScroll() {
        const scrollPosition = window.scrollY;
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    }

    window.addEventListener('scroll', handleScroll);
=======
function initParallax() {
    const header = document.querySelector('header');

    function handleScroll() {
        const scrollPosition = window.scrollY;
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    }

    window.addEventListener('scroll', handleScroll);
>>>>>>> b029a527becedfc9927b8e11b6ce5e48017539d2
}