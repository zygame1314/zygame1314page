document.addEventListener('DOMContentLoaded', () => {
    let globalImageObserver;

    function initializeLazyLoad() {
        const lazyImages = document.querySelectorAll('img[data-src]:not(.lazy-initialized)');

        if (lazyImages.length === 0) {
            return;
        }

        if ('IntersectionObserver' in window && !globalImageObserver) {
            globalImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '200px 0px',
                threshold: 0.01
            });
        }

        lazyImages.forEach(img => {
            img.classList.add('lazy-placeholder');
            img.classList.add('lazy-initialized');

            if (!img.src || img.src === window.location.href) {
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }

            if (img.dataset.width && img.dataset.height) {
                img.style.aspectRatio = `${img.dataset.width} / ${img.dataset.height}`;
            }

            if (globalImageObserver) {
                globalImageObserver.observe(img);
            }
        });

        if (!('IntersectionObserver' in window)) {
            console.log("浏览器不支持 IntersectionObserver，使用回退方案");
            const lazyLoad = () => {
                document.querySelectorAll('img.lazy-placeholder').forEach(img => {
                    if (img.getBoundingClientRect().top <= window.innerHeight + 200) {
                        loadImage(img);
                    }
                });
            };

            if (!window.lazyLoadListenersAdded) {
                document.addEventListener('scroll', throttle(lazyLoad, 200));
                window.addEventListener('resize', throttle(lazyLoad, 200));
                window.addEventListener('orientationchange', lazyLoad);
                window.lazyLoadListenersAdded = true;
            }

            lazyLoad();
        }
    }

    function loadImage(img) {
        if (!img.dataset.src || !img.classList.contains('lazy-placeholder')) return;

        const dataSrc = img.dataset.src;

        const tempImg = new Image();

        img.onerror = function () {
            console.log(`图片加载失败: ${this.src}`);
            if (img._userErrorHandler) {
                img._userErrorHandler.call(this);
            } else {
                img.classList.remove('lazy-placeholder');
                img.classList.add('lazy-error');
            }
        };

        tempImg.onload = () => {
            img.src = dataSrc;
            img.classList.remove('lazy-placeholder');
            img.classList.add('lazy-loaded');
        };

        tempImg.onerror = () => {
            if (img._userErrorHandler) {
                img._userErrorHandler.call(img);
            } else {
                img.classList.remove('lazy-placeholder');
                img.classList.add('lazy-error');
            }
        };

        tempImg.src = dataSrc;
    }

    function throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func(...args);
        };
    }

    function observeDynamicImages() {
        const observer = new MutationObserver(mutations => {
            let needsInitialization = false;

            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'IMG' && node.hasAttribute('data-src') &&
                            !node.classList.contains('lazy-initialized')) {
                            needsInitialization = true;
                        }

                        if (node.querySelectorAll) {
                            const lazyImages = node.querySelectorAll('img[data-src]:not(.lazy-initialized)');
                            if (lazyImages.length > 0) {
                                needsInitialization = true;
                            }
                        }
                    });
                }
            });

            if (needsInitialization) {
                initializeLazyLoad();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    window.saveLazyLoadErrorHandler = function (img, handler) {
        if (img && typeof handler === 'function') {
            img._userErrorHandler = handler;
        }
    };

    window.reinitializeLazyLoad = initializeLazyLoad;

    window.reloadLazyImage = function (img) {
        if (img && img.dataset && img.dataset.src) {
            img.classList.remove('lazy-loaded');
            img.classList.remove('lazy-error');
            img.classList.add('lazy-placeholder');
            loadImage(img);
        }
    };

    initializeLazyLoad();

    if ('MutationObserver' in window) {
        observeDynamicImages();
    }
});