function initClouds() {
    const cloudContainer = document.querySelector('.cloud-container');
    const cloudImages = [
        'https://jsd.onmicrosoft.cn/gh/zygame1314/zygame1314page@1.6.0/images/cloud-image1.png',
        'https://jsd.onmicrosoft.cn/gh/zygame1314/zygame1314page@1.6.0/images/cloud-image2.png',
        'https://jsd.onmicrosoft.cn/gh/zygame1314/zygame1314page@1.6.0/images/cloud-image3.png'
    ];
    const cloudCount = 15;

    for (let i = 0; i < cloudCount; i++) {
        const cloudWrapper = document.createElement('div');
        cloudWrapper.classList.add('cloud');

        const cloud = document.createElement('div');
        cloud.classList.add('cloud-image');

        const randomImage = cloudImages[Math.floor(Math.random() * cloudImages.length)];
        cloud.style.backgroundImage = `url(${randomImage})`;

        const size = Math.random() * 100 + 100;
        cloudWrapper.style.width = `${size}px`;
        cloudWrapper.style.height = `${size * 0.6}px`;

        cloudWrapper.style.opacity = Math.random() * 0.5 + 0.3;

        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight * 0.6;
        cloudWrapper.style.transform = `translate(${startX}px, ${startY}px)`;

        cloudWrapper.appendChild(cloud);
        cloudContainer.appendChild(cloudWrapper);

        animateCloud(cloudWrapper);
    }

    function animateCloud(cloud) {
        const moveX = (Math.random() - 0.5) * window.innerWidth * 1.5;
        const moveY = (Math.random() - 0.5) * window.innerHeight * 0.2;

        const duration = Math.random() * 20 + 20;

        cloud.style.transition = `transform ${duration}s linear`;

        const currentTransform = cloud.style.transform;
        const translateMatch = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(currentTransform);
        let currentX = 0, currentY = 0;
        if (translateMatch) {
            currentX = parseFloat(translateMatch[1]);
            currentY = parseFloat(translateMatch[2]);
        }

        const newX = currentX + moveX;
        const newY = currentY + moveY;

        requestAnimationFrame(() => {
            cloud.style.transform = `translate(${newX}px, ${newY}px)`;
        });

        setTimeout(() => {
            cloud.style.transition = 'none';
            let resetX = newX;
            let resetY = newY;
            if (newX > window.innerWidth || newX < -cloud.offsetWidth) {
                resetX = -cloud.offsetWidth;
            }
            if (newY > window.innerHeight || newY < -cloud.offsetHeight) {
                resetY = Math.random() * window.innerHeight * 0.6;
            }
            cloud.style.transform = `translate(${resetX}px, ${resetY}px)`;
            animateCloud(cloud);
        }, duration * 1000);
    }

    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const clouds = document.querySelectorAll('.cloud');
        clouds.forEach(cloudWrapper => {
            const cloud = cloudWrapper.querySelector('.cloud-image');
            const rect = cloudWrapper.getBoundingClientRect();
            const cloudX = rect.left + rect.width / 2;
            const cloudY = rect.top + rect.height / 2;

            const deltaX = mouseX - cloudX;
            const deltaY = mouseY - cloudY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const maxDistance = 150;
            if (distance < maxDistance) {
                const moveFactor = (maxDistance - distance) / maxDistance;
                const moveX = deltaX * -0.2 * moveFactor;
                const moveY = deltaY * -0.2 * moveFactor;

                cloud.style.transform = `translate(${moveX}px, ${moveY}px)`;
            } else {
                cloud.style.transform = 'translate(0, 0)';
            }
        });
    });
}
