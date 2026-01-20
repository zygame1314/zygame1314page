export function initCursorTrail() {
    const cursorTrail = document.createElement('div');
    cursorTrail.classList.add('cursor-trail');
    document.body.appendChild(cursorTrail);
    let isScheduled = false;
    let lastX = 0;
    let lastY = 0;
    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.classList.add('trail-particle');
        particle.style.transform = `translate(${x}px, ${y}px)`;
        const size = Math.random() * 8 + 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        const colors = ['#ffcc00', '#ff6600', '#ff0066', '#cc00ff', '#0066ff'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const shape = Math.random() > 0.5 ? '50%' : '0%';
        particle.style.borderRadius = shape;
        cursorTrail.appendChild(particle);
        const animation = particle.animate([
            { opacity: 1, transform: `translate(${x}px, ${y}px) scale(1)` },
            { opacity: 0, transform: `translate(${x}px, ${y}px) scale(0.5)` }
        ], {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        animation.onfinish = () => {
            particle.remove();
        };
    }
    function createClickEffect(x, y) {
        const particleCount = 12;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('click-particle');
            particle.style.transform = `translate(${x}px, ${y}px)`;
            const size = Math.random() * 15 + 5;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            const colors = ['#ffcc00', '#ff6600', '#ff0066', '#cc00ff', '#0066ff'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            const angle = (i / particleCount) * 2 * Math.PI;
            const velocity = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            fragment.appendChild(particle);
            particle.animate([
                { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
                { transform: `translate(${x + vx}px, ${y + vy}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            }).onfinish = () => particle.remove();
        }
        cursorTrail.appendChild(fragment);
    }
    function handleMouseMove(e) {
        lastX = e.clientX;
        lastY = e.clientY;
        if (!isScheduled) {
            isScheduled = true;
            requestAnimationFrame(() => {
                createParticle(lastX, lastY);
                isScheduled = false;
            });
        }
    }
    document.addEventListener('click', (e) => {
        createClickEffect(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
}