function initClouds(count = 15) {
    const cloudContainer = document.querySelector('.cloud-container');
    const cloudImages = [
        '../images/cloud-image1.png',
        '../images/cloud-image2.png',
        '../images/cloud-image3.png'
    ];

    const verticalSections = 4;
    const horizontalSections = 4;

    const cloudCount = count || 15;
    const cloudsPerSection = Math.ceil(cloudCount / (verticalSections * horizontalSections));

    for (let v = 0; v < verticalSections; v++) {
        for (let h = 0; h < horizontalSections; h++) {
            for (let i = 0; i < cloudsPerSection; i++) {
                if ((v * horizontalSections * cloudsPerSection) + (h * cloudsPerSection) + i >= cloudCount) {
                    break;
                }

                const cloudWrapper = document.createElement('div');
                cloudWrapper.classList.add('cloud');

                const cloud = document.createElement('div');
                cloud.classList.add('cloud-image');

                const randomImage = cloudImages[Math.floor(Math.random() * cloudImages.length)];
                cloud.style.backgroundImage = `url(${randomImage})`;

                const baseSize = 100;
                const sizeVariation = 100;
                const heightFactor = 1 - (v / verticalSections * 0.3);
                const size = (baseSize + Math.random() * sizeVariation) * heightFactor;

                cloudWrapper.style.width = `${size}px`;
                cloudWrapper.style.height = `${size * 0.6}px`;

                const baseOpacity = 0.3;
                const opacityVariation = 0.2;
                const opacityHeightFactor = 1 - (v / verticalSections * 0.4);
                cloudWrapper.style.opacity = (baseOpacity + Math.random() * opacityVariation) * opacityHeightFactor;

                const sectionWidth = window.innerWidth / horizontalSections;

                const fromLeft = Math.random() < 0.5;
                const startX = fromLeft ? -size : window.innerWidth + size;
                const startY = Math.random() * window.innerHeight;

                cloudWrapper.style.transform = `translate(${startX}px, ${startY}px)`;
                cloudWrapper.style.opacity = '0';

                cloudWrapper.appendChild(cloud);
                cloudContainer.appendChild(cloudWrapper);

                requestAnimationFrame(() => {
                    cloudWrapper.style.transition = 'transform 1.5s ease-out, opacity 1.5s ease-out';

                    const targetX = (h * sectionWidth) + (Math.random() * sectionWidth);
                    const targetY = startY + (Math.random() * 200 - 100);

                    cloudWrapper.style.transform = `translate(${targetX}px, ${targetY}px)`;
                    cloudWrapper.style.opacity = (baseOpacity + Math.random() * opacityVariation) * opacityHeightFactor;

                    setTimeout(() => {
                        animateCloud(cloudWrapper);
                    }, 1500);
                });
            }
        }
    }

    function animateCloud(cloud) {
        const moveX = (Math.random() - 0.5) * window.innerWidth * 1.5;
        const moveY = (Math.random() - 0.5) * window.innerHeight * 0.3;
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

            if (newX > window.innerWidth * 0.9) {
                resetX = -cloud.offsetWidth;
                resetY = Math.random() * window.innerHeight;
            } else if (newX < -cloud.offsetWidth) {
                resetX = window.innerWidth;
                resetY = Math.random() * window.innerHeight;
            }

            if (newY > window.innerHeight) {
                resetY = -cloud.offsetHeight;
                resetX = Math.random() * window.innerWidth;
            } else if (newY < -cloud.offsetHeight) {
                resetY = window.innerHeight;
                resetX = Math.random() * window.innerWidth;
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
