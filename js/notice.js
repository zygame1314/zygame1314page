class NoticeManager {
    constructor() {
        this.notices = [];
        this.currentIndex = 0;
        this.contentWrapper = document.querySelector('.notice-content-wrapper');
        this.pageDisplay = document.querySelector('.notice-page');
        this.isAnimating = false;
        this.animationQueue = Promise.resolve();
        this.ANIMATION_DURATION = 300;
        this.autoplayInterval = 5000;
        this.autoplayTimer = null;
        this.isPaused = false;

        document.querySelector('.notice-prev').addEventListener('click', () => this.prevNotice());
        document.querySelector('.notice-next').addEventListener('click', () => this.nextNotice());
        document.querySelector('.notice-autoplay').addEventListener('click', () => this.toggleAutoplay());

        this.contentWrapper.addEventListener('mouseenter', () => this.pause());
        this.contentWrapper.addEventListener('mouseleave', () => this.resume());

        this.loadNotices();
        this.startAutoplay();
    }

    async loadNotices() {
        try {
            const response = await fetch('/data/notices.json');
            const data = await response.json();
            this.notices = data.notices;
            this.updateDisplay();
            this.updatePageCount();
        } catch (error) {
            console.error('加载公告失败:', error);
        }
    }

    createContentElement(item) {
        const p = document.createElement('p');
        p.className = item.type;

        if (item.icon) {
            const icon = document.createElement('i');
            icon.className = item.icon;
            p.appendChild(icon);
        }

        if (item.number !== undefined) {
            const span = document.createElement('span');
            span.className = 'step-number';
            span.textContent = item.number + '.';
            p.appendChild(span);
        }

        if (item.highlight) {
            if (Array.isArray(item.highlight)) {
                let text = item.text;
                item.highlight.forEach(hl => {
                    text = text.replace(hl, `<span class="highlight">${hl}</span>`);
                });
                p.innerHTML += text;
            } else if (typeof item.highlight === 'object') {
                if (item.highlight.full) {
                    p.innerHTML += `<span class="highlight">${item.text}</span>`;
                } else {
                    const textParts = item.text.split(item.highlight.text);
                    p.innerHTML += textParts[0];
                    p.innerHTML += `<span class="highlight">${item.highlight.text}</span>`;
                    p.innerHTML += textParts[1];
                }
            } else if (item.highlight === true) {
                p.innerHTML += `<span class="highlight">${item.text}</span>`;
            }
        } else {
            p.innerHTML += item.text;
        }

        if (item.description) {
            const desc = document.createElement('p');
            desc.className = `${item.type}-description`;
            desc.textContent = item.description;
            const container = document.createElement('div');
            container.appendChild(p);
            container.appendChild(desc);
            return container;
        }

        return p;
    }

    async updateDisplay(direction = 'next') {
        if (!this.notices.length) return;

        const animation = async () => {
            const notice = this.notices[this.currentIndex];
            const oldContent = this.contentWrapper.querySelector('.notice-content');

            const content = document.createElement('div');
            content.className = 'notice-content';

            if (notice.title) {
                const header = document.createElement('div');
                header.className = 'notice-header';
                if (notice.icon) {
                    const icon = document.createElement('i');
                    icon.className = notice.icon;
                    header.appendChild(icon);
                }
                const title = document.createElement('h4');
                title.textContent = notice.title;
                header.appendChild(title);
                content.appendChild(header);
            }

            notice.content.forEach(item => {
                content.appendChild(this.createContentElement(item));
            });

            this.contentWrapper.appendChild(content);
            content.offsetHeight;
            content.classList.add('active');

            if (oldContent) {
                oldContent.classList.remove('active');
                oldContent.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');
                await new Promise(resolve => setTimeout(resolve, this.ANIMATION_DURATION));
                oldContent.remove();
            }

            this.updatePageCount();
        };

        this.animationQueue = this.animationQueue
            .then(animation)
            .catch(console.error)
            .finally(() => {
                this.isAnimating = false;
            });
    }

    updatePageCount() {
        this.pageDisplay.textContent = `${this.currentIndex + 1}/${this.notices.length}`;
    }

    startAutoplay() {
        if (!this.autoplayTimer && !this.isPaused) {
            this.autoplayTimer = setInterval(() => {
                if (this.currentIndex >= this.notices.length - 1) {
                    this.currentIndex = -1;
                }
                this.nextNotice();
            }, this.autoplayInterval);
        }
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    toggleAutoplay() {
        const btn = document.querySelector('.notice-autoplay i');
        if (this.autoplayTimer) {
            this.stopAutoplay();
            this.isPaused = true;
            btn.className = 'fas fa-play';
        } else {
            this.isPaused = false;
            this.startAutoplay();
            btn.className = 'fas fa-pause';
        }
    }

    pause() {
        if (!this.isPaused) {
            this.stopAutoplay();
        }
    }

    resume() {
        if (!this.isPaused) {
            this.startAutoplay();
        }
    }

    prevNotice() {
        if (this.currentIndex > 0 && !this.isAnimating) {
            this.stopAutoplay();
            this.currentIndex--;
            this.updateDisplay('prev').then(() => this.startAutoplay());
        }
    }

    nextNotice() {
        if (this.currentIndex < this.notices.length - 1 && !this.isAnimating) {
            this.stopAutoplay();
            this.currentIndex++;
            this.updateDisplay('next').then(() => this.startAutoplay());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NoticeManager();
});