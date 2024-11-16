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

    function createClickEffect(x, y) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('click-particle');
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';

            const size = Math.random() * 15 + 5;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            const colors = ['#ffcc00', '#ff6600', '#ff0066', '#cc00ff', '#0066ff'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';

            const angle = (i / particleCount) * 2 * Math.PI;
            const velocity = 5 + Math.random() * 5;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            cursorTrail.appendChild(particle);

            particle.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${vx * 10}px, ${vy * 10}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });

            setTimeout(() => particle.remove(), 1000);
        }
    }

    let particles = [];
    function handleMouseMove(e) {
        createParticle(e.clientX, e.clientY);

        if (particles.length > 100) {
            particles[0].remove();
            particles.shift();
        }
    }

    document.addEventListener('click', (e) => {
        createClickEffect(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', handleMouseMove);
}