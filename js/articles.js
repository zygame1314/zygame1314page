import { init } from 'https://npm.onmicrosoft.cn/@waline/client@v3/dist/waline.js';

if (!document.querySelector('link[href*="@waline"]')) {
    document.head.insertAdjacentHTML('beforeend',
        '<link rel="stylesheet" href="https://npm.onmicrosoft.cn/@waline/client@v3/dist/waline.css">'
    );
}

class ArticlesManager {
    constructor() {
        this.articles = [];
        this.batchSize = 6;
        this.currentIndex = 0;
        this.loading = false;
        this.allLoaded = false;
        this.selectedTags = new Set();
        this.initTransitionEffect();
        this.init();
        const handleInitialPath = async () => {
            const path = window.location.pathname;
            if (path.startsWith('/article/')) {
                await this.loadArticles();
                const articleId = path.replace('/article/', '');
                const article = this.articles.find(a =>
                    a.contentUrl.replace('/articles/content/', '').replace('.html', '') === articleId
                );
                if (article) {
                    await this.showArticle(article, true);
                }
            }
        };

        handleInitialPath();
        window.addEventListener('popstate', async (event) => {
            const path = window.location.pathname;
            this.transitionMask.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 600));

            if (path === '/') {
                const tocContainer = document.querySelector('.article-toc');
                if (tocContainer) {
                    tocContainer.remove();
                }
                const mainNav = document.querySelector('nav:not(#article-nav)');
                const articleNav = document.getElementById('article-nav');
                mainNav.style.display = 'block';
                articleNav.style.display = 'none';

                const articleSection = document.getElementById('article-detail');
                if (articleSection) {
                    articleSection.remove();
                    this.currentIndex = 0;
                    this.loading = false;
                    this.allLoaded = false;
                    await this.loadArticles();

                    const sections = document.querySelector('.main-content').children;
                    Array.from(sections).forEach(section => {
                        if (section.id !== 'comments') {
                            section.style.display = '';
                        }
                    });

                    window.handleHomeView();
                    this.renderArticles(false);
                    this.initWaline();
                }
            } else if (path.startsWith('/article/')) {
                const articleId = path.replace('/article/', '');
                const article = this.articles.find(a =>
                    a.contentUrl.replace('/articles/content/', '').replace('.html', '') === articleId
                );
                if (article) {
                    await this.showArticle(article, true);
                }
            }

            this.transitionMask.classList.remove('active');
            this.transitionMask.classList.add('reverse');
            setTimeout(() => {
                this.transitionMask.classList.remove('reverse');
            }, 500);
        });

        document.querySelector('.scroll-to-top').addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    initTransitionEffect() {
        const mask = document.createElement('div');
        mask.className = 'transition-mask';
        document.body.appendChild(mask);
        this.transitionMask = mask;
    }

    getAllTags() {
        const tagsSet = new Set();
        this.articles.forEach(article => {
            if (article.tags) {
                article.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet);
    }

    renderTagsFilter() {
        const tagsFilter = document.querySelector('.tags-filter');
        const allTags = this.getAllTags();

        allTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'filter-tag';
            tagElement.textContent = tag;

            tagElement.addEventListener('click', () => {
                tagElement.classList.toggle('active');
                if (this.selectedTags.has(tag)) {
                    this.selectedTags.delete(tag);
                } else {
                    this.selectedTags.add(tag);
                }
                this.currentIndex = 0;
                this.renderArticles();
            });

            tagsFilter.appendChild(tagElement);
        });
    }

    getFilteredArticles() {
        if (this.selectedTags.size === 0) {
            return this.articles;
        }

        return this.articles.filter(article => {
            if (!article.tags) return false;
            return Array.from(this.selectedTags).every(selectedTag =>
                article.tags.includes(selectedTag)
            );
        });
    }

    renderArticles(append = false) {
        const grid = document.querySelector('.articles-grid');
        if (!append) {
            grid.innerHTML = '';
        }

        const filteredArticles = this.getFilteredArticles();

        if (filteredArticles.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <p>${this.selectedTags.size > 0 ? '没有找到符合所选标签的文章' : '暂无文章'}</p>
            `;
            grid.appendChild(emptyMessage);
            this.allLoaded = true;
            this.loading = false;
            this.updateLoadingIndicator();
            return;
        }

        const endIndex = this.currentIndex + this.batchSize;
        const currentBatch = filteredArticles.slice(this.currentIndex, endIndex);

        currentBatch.forEach(article => {
            const card = this.createArticleCard(article);
            grid.appendChild(card);
        });

        this.currentIndex = endIndex;
        this.allLoaded = this.currentIndex >= filteredArticles.length;
        this.loading = false;
        this.updateLoadingIndicator();
    }

    async init() {
        await this.loadArticles();
        this.renderTagsFilter();
        this.renderArticles();
        this.setupScrollListener();
    }

    async loadArticles() {
        try {
            const response = await fetch('/articles/index.json');
            if (!response.ok) {
                throw new Error('无法加载文章列表');
            }
            this.articles = await response.json();
        } catch (error) {
            console.error('加载文章列表失败:', error);
            this.articles = [];
            showNotification('加载文章列表失败，请稍后重试', 2, 'error');
        }
    }

    setupScrollListener() {
        const loadingIndicator = document.querySelector('.loading-indicator');

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.loading && !this.allLoaded) {
                this.loading = true;
                this.updateLoadingIndicator();
                this.renderArticles(true);
            }
        });

        observer.observe(loadingIndicator);
    }

    updateLoadingIndicator() {
        const indicator = document.querySelector('.loading-indicator');
        indicator.style.display = this.allLoaded ? 'none' : 'block';
    }

    createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';

        const tagsHtml = article.tags ?
            `<div class="article-tags">
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
             </div>` : '';

        card.innerHTML = `
            <img src="${article.thumbnail}" alt="${article.title}" class="article-thumbnail pixelated">
            <h3 class="article-title">${article.title}</h3>
            <div class="article-meta">
                <i class="far fa-calendar-alt"></i> ${article.date}
                ${tagsHtml}
            </div>
            <p class="article-excerpt">${article.excerpt}</p>
        `;
        card.addEventListener('click', () => {
            this.showArticle(article);
        });

        return card;
    }

    initWaline() {
        const walineContainer = document.querySelector('#waline');
        walineContainer.innerHTML = '';
        return init({
            el: '#waline',
            serverURL: 'https://comment.zygame1314.site',
            placeholder: '说点什么……',
            avatar: 'mp',
            meta: ['nick', 'mail'],
            pageSize: 10,
            lang: 'zh-CN',
            highlight: true,
            recordIP: true,
            emoji: [
                'https://valine-emoji.bili33.top/bilibilitv',
            ],
            imageUploader: false,
            pageview: true,
            comment: true,
            search: false,
            locale: {
                placeholder: '说点什么……',
                sofa: '快来发表你的评论吧~',
            }
        });
    }

    isArticleOutdated(articleDate) {
        const now = new Date();
        const articleTime = new Date(articleDate);
        const monthsDiff = (now.getFullYear() - articleTime.getFullYear()) * 12 +
            (now.getMonth() - articleTime.getMonth());
        return monthsDiff >= 6;
    }

    async showArticle(article, fromHistory = false) {
        const mainNav = document.querySelector('nav:not(#article-nav)');
        const articleNav = document.getElementById('article-nav');
        mainNav.style.display = 'none';
        articleNav.style.display = 'block';

        this.transitionMask.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 600));

        if (!fromHistory) {
            const articlePath = article.contentUrl.replace('/articles/content/', '').replace('.html', '');
            history.pushState({ articleId: articlePath }, '', `/article/${articlePath}`);
        }

        window.handleArticleView();

        const mainContent = document.querySelector('.main-content');
        const articleSection = document.createElement('section');
        articleSection.id = 'article-detail';
        articleSection.innerHTML = `
            <div class="article-header">
                <button class="back-btn">
                    <i class="fas fa-arrow-left"></i> 返回主页
                </button>
                <h1>${article.title}</h1>
                <div class="article-meta">
                    <i class="far fa-calendar-alt"></i> ${article.date}
                    ${article.tags ?
                `<div class="article-tags">
                            ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>` : ''
            }
                </div>
            </div>
            <div class="article-content">
                加载中...
            </div>
        `;

        const sections = mainContent.children;
        Array.from(sections).forEach(section => {
            if (section.id !== 'comments') {
                section.style.display = 'none';
            }
        });

        mainContent.insertBefore(articleSection, document.getElementById('comments'));

        try {
            const response = await fetch(article.contentUrl);
            if (!response.ok) throw new Error('文章加载失败');
            const content = await response.text();
            const articleContent = articleSection.querySelector('.article-content');
            articleContent.innerHTML = content;

            if (this.isArticleOutdated(article.date)) {
                showNotification('这文章有些年头了，内容可能不太新鲜哦~ 😊', 5, 'info');
            }

            const tocContainer = document.createElement('div');
            tocContainer.className = 'article-toc';
            tocContainer.innerHTML = `
                <div class="toc-toggle">
                    <i class="fas fa-chevron-left"></i>
                </div>
                <h3>目录</h3>
                <ul></ul>
            `;
            document.body.appendChild(tocContainer);

            const tocToggle = tocContainer.querySelector('.toc-toggle');
            tocToggle.addEventListener('click', () => {
                tocContainer.classList.toggle('collapsed');
                localStorage.setItem('tocCollapsed', tocContainer.classList.contains('collapsed'));
            });

            const isCollapsed = localStorage.getItem('tocCollapsed') === 'true';
            if (isCollapsed) {
                tocContainer.classList.add('collapsed');
            }

            const headers = articleContent.querySelectorAll('h2, h3, h4');
            const tocList = tocContainer.querySelector('ul');

            headers.forEach((header, index) => {
                header.id = `heading-${index}`;

                const li = document.createElement('li');
                li.className = `toc-${header.tagName.toLowerCase()}`;

                const a = document.createElement('a');
                a.href = `#heading-${index}`;
                a.textContent = header.textContent;

                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    header.scrollIntoView({ behavior: 'smooth' });
                });

                li.appendChild(a);
                tocList.appendChild(li);
            });

            this.initWaline();
        } catch (error) {
            console.error('加载文章失败:', error);
            showNotification('文章加载失败，请稍后重试', 2, 'error');
        }

        this.transitionMask.classList.remove('active');
        this.transitionMask.classList.add('reverse');
        setTimeout(() => {
            this.transitionMask.classList.remove('reverse');
        }, 500);

        articleSection.querySelector('.back-btn').addEventListener('click', async () => {
            this.transitionMask.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 600));

            const tocContainer = document.querySelector('.article-toc');
            if (tocContainer) {
                tocContainer.remove();
            }

            const mainNav = document.querySelector('nav:not(#article-nav)');
            const articleNav = document.getElementById('article-nav');
            mainNav.style.display = 'block';
            articleNav.style.display = 'none';

            history.pushState(null, '', '/');
            articleSection.remove();
            Array.from(sections).forEach(section => {
                if (section.id !== 'comments') {
                    section.style.display = '';
                }
            });

            window.handleHomeView();
            this.initWaline();

            this.transitionMask.classList.remove('active');
            this.transitionMask.classList.add('reverse');
            setTimeout(() => {
                this.transitionMask.classList.remove('reverse');
            }, 500);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ArticlesManager();
});