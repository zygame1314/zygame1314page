class WeatherEffects {
    constructor() {
        this.container = document.querySelector('.background-elements');
        this.cloudContainer = document.querySelector('.cloud-container');
        this.effectIntervals = [];
        this.currentCloudCount = 0;
        this.isTransitioning = false;
    }

    async setWeatherEffect(weatherCode) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        await this.fadeOutEffects();

        const code = weatherCode.toString().padStart(2, '0');

        switch (true) {
            case /^2\d{2}$/.test(code):
                await this.setRainy('heavy');
                break;

            case /^3\d{2}$/.test(code):
                await this.setRainy('light');
                break;

            case /^5\d{2}$/.test(code):
                const rainIntensity = parseInt(code[2]);
                if (rainIntensity <= 1) await this.setRainy('light');
                else if (rainIntensity <= 3) await this.setRainy('moderate');
                else await this.setRainy('heavy');
                break;

            case /^6\d{2}$/.test(code):
                const snowIntensity = parseInt(code[2]);
                if (snowIntensity <= 1) await this.setSnowy('light');
                else if (snowIntensity <= 3) await this.setSnowy('moderate');
                else await this.setSnowy('heavy');
                break;

            case /^7\d{2}$/.test(code):
                await this.setCloudy();
                break;

            case /^80[1-4]$/.test(code):
                await this.setCloudy();
                break;

            case code === '800':
                await this.setSunny();
                break;

            default:
                await this.setSunny();
        }

        this.isTransitioning = false;
    }

    async fadeOutEffects() {
        const effects = document.querySelectorAll('.rain-drop, .snow-flake');
        const fadeOutPromises = Array.from(effects).map(effect => {
            return new Promise(resolve => {
                effect.style.transition = 'opacity 0.5s ease-out';
                effect.style.opacity = '0';
                setTimeout(() => {
                    effect.remove();
                    resolve();
                }, 500);
            });
        });

        this.effectIntervals.forEach(interval => clearInterval(interval));
        this.effectIntervals = [];

        await Promise.all(fadeOutPromises);
    }

    async adjustCloudCount(targetCount) {
        const currentClouds = document.querySelectorAll('.cloud');
        const currentCount = currentClouds.length;

        if (currentCount < targetCount) {
            for (let i = currentCount; i < targetCount; i++) {
                initClouds(1);
            }
        }
        else if (currentCount > targetCount) {
            const cloudsToRemove = Array.from(currentClouds).slice(targetCount);
            cloudsToRemove.forEach(cloud => {
                cloud.remove();
            });
        }
    }
    
    async setCloudy() {
        await this.adjustCloudCount(25);
    }

    async setRainy(intensity = 'moderate') {
        const intensitySettings = {
            light: { interval: 50, opacity: 0.3, count: 15 },
            moderate: { interval: 20, opacity: 0.5, count: 20 },
            heavy: { interval: 10, opacity: 0.7, count: 25 }
        };

        const settings = intensitySettings[intensity];
        await this.adjustCloudCount(settings.count);

        return new Promise(resolve => {
            let opacity = 0;
            const createRainDrop = () => {
                if (opacity > 0) {
                    const drop = document.createElement('div');
                    drop.className = 'rain-drop';
                    drop.style.left = `${Math.random() * 100}vw`;
                    drop.style.top = '-10px';
                    drop.style.opacity = Math.random() * settings.opacity * opacity;
                    this.container.appendChild(drop);

                    const duration = Math.random() * 1 + 0.5;
                    drop.style.animation = `rainfall ${duration}s linear`;

                    drop.addEventListener('animationend', () => {
                        this.createSplash(drop.offsetLeft);
                        drop.remove();
                    });
                }
            };

            setTimeout(() => {
                const fadeIn = setInterval(() => {
                    opacity = Math.min(opacity + 0.1, 1);
                    if (opacity >= 1) {
                        clearInterval(fadeIn);
                        resolve();
                    }
                }, 100);
                this.effectIntervals.push(fadeIn);

                const rainInterval = setInterval(createRainDrop, settings.interval);
                this.effectIntervals.push(rainInterval);
            }, 500);
        });
    }

    createSplash(x) {
        const splashCount = Math.floor(Math.random() * 4) + 3;

        for (let i = 0; i < splashCount; i++) {
            const splash = document.createElement('div');
            splash.className = 'splash-particle';
            splash.style.left = `${x}px`;
            splash.style.bottom = '0';

            const angle = (Math.random() * 360);
            const distance = Math.random() * 15 + 5;

            const moveX = Math.cos(angle * Math.PI / 180) * distance;
            const moveY = Math.sin(angle * Math.PI / 180) * distance;
            splash.style.setProperty('--splash-direction',
                `translate(${moveX}px, ${-Math.abs(moveY)}px)`);

            this.container.appendChild(splash);

            const duration = Math.random() * 0.3 + 0.2;
            splash.style.animation = `splash ${duration}s ease-out forwards`;

            splash.addEventListener('animationend', () => splash.remove());
        }
    }

    async setSnowy(intensity = 'moderate') {
        const intensitySettings = {
            light: { interval: 200, opacity: 0.4, count: 10 },
            moderate: { interval: 100, opacity: 0.7, count: 15 },
            heavy: { interval: 50, opacity: 0.9, count: 20 }
        };

        const settings = intensitySettings[intensity];
        await this.adjustCloudCount(settings.count);

        return new Promise(resolve => {
            let opacity = 0;
            const createSnowflake = () => {
                if (opacity > 0) {
                    const flake = document.createElement('div');
                    flake.className = 'snow-flake';
                    flake.style.left = `${Math.random() * 100}vw`;
                    flake.style.top = '-10px';

                    const currentOpacity = Math.random() * settings.opacity * opacity;
                    flake.style.opacity = currentOpacity;

                    flake.style.transition = 'all 1s ease-out';
                    this.container.appendChild(flake);

                    const duration = Math.random() * 3 + 2;
                    const drift = Math.random() * 30 - 20;

                    flake.style.setProperty('--current-opacity', currentOpacity);
                    flake.style.animation = `snowfall ${duration}s linear`;
                    flake.style.animationTimingFunction = 'ease-in-out';

                    flake.style.transform = `translateX(${Math.random() * drift}px)`;

                    flake.addEventListener('animationend', () => {
                        flake.remove();
                    }, { once: true });
                }
            };

            setTimeout(() => {
                const fadeIn = setInterval(() => {
                    opacity = Math.min(opacity + 0.1, 1);
                    if (opacity >= 1) {
                        clearInterval(fadeIn);
                        resolve();
                    }
                }, 100);
                this.effectIntervals.push(fadeIn);

                const snowInterval = setInterval(createSnowflake, settings.interval);
                this.effectIntervals.push(snowInterval);
            }, 500);
        });
    }

    async setSunny() {
        await this.adjustCloudCount(10);
    }
}