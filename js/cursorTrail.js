function initCursorTrail() {
    const cursorTrail = document.createElement('div');
    cursorTrail.classList.add('cursor-trail');
    document.body.appendChild(cursorTrail);

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.classList.add('trail-particle');
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        const size = Math.random() * 10 + 5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        const colors = ['#ffcc00', '#ff6600', '#ff0066', '#cc00ff', '#0066ff'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const shape = Math.random() > 0.5 ? '50%' : '0%';
        particle.style.borderRadius = shape;

        cursorTrail.appendChild(particle);

        setTimeout(() => {
            particle.style.opacity = 0;
            setTimeout(() => {
                particle.remove();
            }, 500);
        }, 0);
    }

    let particles = [];
    function handleMouseMove(e) {
        createParticle(e.clientX, e.clientY);

        if (particles.length > 100) {
            particles[0].remove();
            particles.shift();
        }
    }

    document.addEventListener('mousemove', handleMouseMove);
}
