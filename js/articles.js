import { init } from 'https://cdn.jsdmirror.com/npm/@waline/client@v3/dist/waline.js';

if (!document.querySelector('link[href*="@waline"]')) {
    document.head.insertAdjacentHTML('beforeend',
        '<link rel="stylesheet" href="https://cdn.jsdmirror.com/npm/@waline/client@v3/dist/waline.css">'
    );
}

class ArticlesManager {
    constructor() {
        this.articles = [];
        this.searchQuery = '';
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        this.batchSize = 6;
        this.currentIndex = 0;
        this.loading = false;
        this.allLoaded = false;
        this.selectedTags = new Set();
        this.sidebar = document.querySelector('.sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.initTransitionEffect();
        this.setupSearchListener();
        this.updateSearchHistory();
        this.init();
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

                this.sidebar.style.display = '';
                this.mainContent.style.width = '';
                this.mainContent.style.maxWidth = '';
                this.mainContent.style.margin = '';

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
                    this.setupScrollListener();
                    this.initWaline();
                }
            } else if (path.startsWith('/article/')) {
                const articleId = path.replace('/article/', '');
                const article = this.articles.find(a =>
                    a.contentUrl.replace('/articles/content/', '').replace('.html', '') === articleId
                );
                if (article) {
                    this.currentIndex = 0;
                    this.loading = false;
                    this.allLoaded = false;
                    await this.showArticle(article, true);
                }
            }

            this.transitionMask.classList.remove('active');
            this.transitionMask.classList.add('reverse');
            setTimeout(() => {
                this.transitionMask.classList.remove('reverse');
                if (path === '/') {
                    this.loading = false;
                    this.allLoaded = false;
                    this.updateLoadingIndicator();
                }
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

    setupSearchListener() {
        const searchInput = document.getElementById('article-search');
        const searchButton = document.querySelector('.search-button');
        const suggestions = document.querySelector('.search-suggestions');
        const grid = document.querySelector('.articles-grid');

        searchInput.addEventListener('input', (e) => {
            this.showSuggestions(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value) {
                this.showSuggestions(searchInput.value);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-wrapper')) {
                suggestions.style.display = 'none';
            }
        });

        const handleSearch = () => {
            const query = searchInput.value.trim();
            if (!query) return;

            this.searchQuery = query.toLowerCase();
            this.addToHistory(query);
            this.currentIndex = 0;
            this.renderArticles();

            suggestions.style.display = 'none';

            if (this.searchQuery) {
                setTimeout(() => {
                    const firstMatch = grid.querySelector('.highlight-text');
                    if (firstMatch) {
                        const card = firstMatch.closest('.article-card');
                        card.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        card.classList.add('search-highlight');
                        setTimeout(() => {
                            card.classList.remove('search-highlight');
                        }, 2000);
                    }
                }, 100);
            }
        };

        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });

        document.querySelector('.clear-history').addEventListener('click', () => {
            this.searchHistory = [];
            localStorage.setItem('searchHistory', '[]');
            this.updateSearchHistory();
        });
    }

    showSuggestions(query) {
        if (!query) {
            document.querySelector('.search-suggestions').style.display = 'none';
            return;
        }

        const searchResults = this.articles.map(article => {
            const titleMatch = article.title.toLowerCase().includes(query.toLowerCase());
            const excerptMatch = article.excerpt.toLowerCase().includes(query.toLowerCase());
            const tagMatches = article.tags ? article.tags.filter(tag =>
                tag.toLowerCase().includes(query.toLowerCase())
            ) : [];

            return {
                article,
                matchTypes: [
                    ...(titleMatch ? ['title'] : []),
                    ...(excerptMatch ? ['excerpt'] : []),
                    ...(tagMatches.length > 0 ? ['tag'] : [])
                ],
                matchedTags: tagMatches,
                matchScore: (titleMatch ? 3 : 0) + (excerptMatch ? 2 : 0) + (tagMatches.length > 0 ? 1 : 0)
            };
        })
            .filter(result => result.matchTypes.length > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        const container = document.querySelector('.search-suggestions');
        container.innerHTML = '';

        if (searchResults.length > 0) {
            searchResults.forEach(({ article, matchTypes, matchedTags }) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';

                const icon = document.createElement('i');
                icon.className = matchTypes[0] === 'title' ? 'fas fa-heading' :
                    matchTypes[0] === 'tag' ? 'fas fa-tag' :
                        'fas fa-align-left';

                const content = document.createElement('div');
                content.className = 'suggestion-content';

                const title = document.createElement('div');
                title.className = 'suggestion-title';
                title.textContent = article.title;

                const subtitle = document.createElement('div');
                subtitle.className = 'suggestion-subtitle';

                if (matchedTags.length > 0) {
                    subtitle.innerHTML = `<i class="fas fa-tag"></i> ${matchedTags.join(', ')}`;
                }

                content.appendChild(title);
                if (matchedTags.length > 0) {
                    content.appendChild(subtitle);
                }

                div.appendChild(icon);
                div.appendChild(content);

                div.addEventListener('click', () => {
                    const searchInput = document.getElementById('article-search');
                    searchInput.value = article.title;
                    container.style.display = 'none';
                    this.searchQuery = article.title.toLowerCase();
                    this.addToHistory(article.title);
                    this.currentIndex = 0;
                    this.renderArticles();

                    setTimeout(() => {
                        const grid = document.querySelector('.articles-grid');
                        const firstMatch = grid.querySelector('.highlight-text');
                        if (firstMatch) {
                            const card = firstMatch.closest('.article-card');
                            card.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                            card.classList.add('search-highlight');
                            setTimeout(() => {
                                card.classList.remove('search-highlight');
                            }, 2000);
                        }
                    }, 100);
                });

                container.appendChild(div);
            });
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    addToHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            if (this.searchHistory.length > 5) {
                this.searchHistory.pop();
            }
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
            this.updateSearchHistory(true);
        }
    }

    updateSearchHistory(isNewAdd = false) {
        const container = document.querySelector('.history-tags');

        if (isNewAdd) {
            const tag = document.createElement('span');
            tag.className = 'history-tag';
            tag.textContent = this.searchHistory[0];
            tag.style.opacity = '0';

            tag.addEventListener('click', () => {
                document.getElementById('article-search').value = this.searchHistory[0];
                this.searchQuery = this.searchHistory[0].toLowerCase();
                this.currentIndex = 0;
                this.renderArticles();
            });

            if (container.firstChild) {
                container.insertBefore(tag, container.firstChild);
            } else {
                container.appendChild(tag);
            }

            requestAnimationFrame(() => {
                tag.style.opacity = '1';
            });
        } else {
            const tags = container.querySelectorAll('.history-tag');
            const animationPromises = [];

            tags.forEach(tag => {
                tag.classList.add('removing');
                const promise = new Promise(resolve => {
                    tag.addEventListener('animationend', () => {
                        resolve();
                    });
                });
                animationPromises.push(promise);
            });

            Promise.all(animationPromises).then(() => {
                container.innerHTML = '';
                this.searchHistory.forEach(query => {
                    const tag = document.createElement('span');
                    tag.className = 'history-tag';
                    tag.textContent = query;
                    tag.addEventListener('click', () => {
                        document.getElementById('article-search').value = query;
                        this.searchQuery = query.toLowerCase();
                        this.currentIndex = 0;
                        this.renderArticles();
                    });
                    container.appendChild(tag);
                });
            });
        }
    }

    getFilteredArticles() {
        let filtered = this.articles;

        if (this.searchQuery) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(this.searchQuery) ||
                article.excerpt.toLowerCase().includes(this.searchQuery)
            );
        }

        if (this.selectedTags.size > 0) {
            filtered = filtered.filter(article => {
                if (!article.tags) return false;
                return Array.from(this.selectedTags).every(tag =>
                    article.tags.includes(tag)
                );
            });
        }

        return filtered;
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
        const path = window.location.pathname;

        if (path.startsWith('/article/')) {
            await this.loadArticles();
            const articleId = path.replace('/article/', '');
            const article = this.articles.find(a =>
                a.contentUrl.replace('/articles/content/', '').replace('.html', '') === articleId
            );

            if (article) {
                this.sidebar.style.display = 'none';
                const mainContent = document.querySelector('.main-content');
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = '1200px';
                mainContent.style.margin = '0 auto';

                const mainNav = document.querySelector('nav:not(#article-nav)');
                const articleNav = document.getElementById('article-nav');
                mainNav.style.display = 'none';
                articleNav.style.display = 'block';

                await this.showArticle(article, true, true);
            }
        } else {
            await this.loadArticles();
            this.renderTagsFilter();
            this.renderArticles();
            this.initWaline();
            this.setupScrollListener();
            this.loading = false;
            this.allLoaded = false;
        }
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

        const highlightText = (text) => {
            if (!this.searchQuery) return text;
            const regex = new RegExp(`(${this.searchQuery})`, 'gi');
            return text.replace(regex, '<span class="highlight-text">$1</span>');
        };

        const tagsHtml = article.tags ?
            `<div class="article-tags">
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>` : '';

        const aiAssistantsHtml = article.aiAssistants ? `
            <div class="ai-assistant-tags">
                ${article.aiAssistants.map(assistant => `
                    <span class="ai-assistant-tag">
                        <i class="fas fa-robot"></i>
                        ${assistant}
                    </span>
                `).join('')}
            </div>
        ` : '';

        card.innerHTML = `
            <img src="${article.thumbnail}" alt="${article.title}" class="article-thumbnail pixelated">
            <h3 class="article-title">${highlightText(article.title)}</h3>
            <div class="article-meta">
                <i class="far fa-calendar-alt"></i> ${article.date}
                ${tagsHtml}
            </div>
            ${aiAssistantsHtml}
            <p class="article-excerpt">${highlightText(article.excerpt)}</p>
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
            imageUploader: async (file) => {
                const webpBlob = await convertToWebP(file);

                const formData = new FormData();
                formData.append('file', webpBlob, `${file.name.split('.')[0]}.webp`);

                try {
                    const response = await fetch('https://blog.zygame1314.site/comment/upload-image', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('上传失败');
                    }

                    const result = await response.json();
                    return result.url;
                } catch (error) {
                    console.error('上传图片失败:', error);
                    alert('图片上传失败，请重试');
                    return null;
                }
            },
            pageview: true,
            comment: true,
            search: false,
            reaction: false,
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

    async loadLanguage(language) {
        if (!hljs.getLanguage(language)) {
            try {
                await import(`https://cdn.jsdmirror.com/gh/highlightjs/cdn-release@latest/build/languages/${language}.min.js`);
                return true;
            } catch (error) {
                console.warn(`语言包 ${language} 加载失败:`, error);
                return false;
            }
        }
        return true;
    }

    setupImageZoom(container) {
        if (!document.querySelector('.image-modal')) {
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            const modalImg = document.createElement('img');
            modalImg.className = 'modal-image';
            modal.appendChild(modalImg);
            document.body.appendChild(modal);

            modal.addEventListener('click', () => {
                modal.classList.remove('active');
                setTimeout(() => modal.style.display = 'none', 300);
                document.body.style.overflow = '';
            });
        }

        container.querySelectorAll('img').forEach(img => {
            if (!img.closest('.article-thumbnail')) {
                img.addEventListener('click', () => {
                    const modal = document.querySelector('.image-modal');
                    const modalImg = modal.querySelector('.modal-image');
                    modalImg.src = img.src;
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    requestAnimationFrame(() => modal.classList.add('active'));
                });
            }
        });
    }

    async showArticle(article, fromHistory = false, directAccess = false) {
        const existingToc = document.querySelector('.article-toc');
        if (existingToc) {
            existingToc.remove();
        }
        const mainNav = document.querySelector('nav:not(#article-nav)');
        const articleNav = document.getElementById('article-nav');
        mainNav.style.display = 'none';
        articleNav.style.display = 'block';

        if (!directAccess) {
            this.transitionMask.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        window.scrollTo({
            top: 0,
            behavior: directAccess ? 'auto' : 'smooth'
        });

        if (!fromHistory) {
            const articlePath = article.contentUrl.replace('/articles/content/', '').replace('.html', '');
            history.pushState({ articleId: articlePath }, '', `/article/${articlePath}`);
        }

        window.handleArticleView();

        const mainContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.sidebar');

        sidebar.style.display = 'none';

        mainContent.style.width = '100%';
        mainContent.style.maxWidth = '1200px';
        mainContent.style.margin = '0 auto';

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
                ${article.aiAssistants ?
                `<div class="ai-edit-notice">
                    <div class="ai-notice-header">
                        <i class="fas fa-robot"></i> AI辅助创作
                    </div>
                    <div class="ai-assistant-tags">
                        本文由以下AI模型参与编辑：
                        ${article.aiAssistants.map(assistant => `
                            <span class="ai-assistant-tag">
                                <i class="fas fa-robot"></i>
                                ${assistant}
                            </span>
                        `).join('')}
                    </div>
                </div>` :
                `<div class="ai-edit-notice">
                    <div class="ai-notice-header">
                        <i class="fas fa-pen-fancy"></i> 原创内容
                    </div>
                    <div class="ai-assistant-tags">
                        本文为作者原创内容
                    </div>
                </div>`
            }
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
            this.setupImageZoom(articleContent);

            const codeBlocks = articleContent.querySelectorAll('pre code');
            for (const block of codeBlocks) {
                const languageClass = Array.from(block.classList)
                    .find(cls => cls.startsWith('language-'));

                if (languageClass) {
                    const language = languageClass.replace('language-', '');
                    const languageLabel = document.createElement('div');
                    languageLabel.className = 'language-label';

                    const icon = document.createElement('i');
                    switch (language) {
                        case 'html':
                            icon.className = 'fab fa-html5';
                            break;
                        case 'css':
                            icon.className = 'fab fa-css3-alt';
                            break;
                        case 'javascript':
                        case 'js':
                            icon.className = 'fab fa-js';
                            break;
                        case 'python':
                            icon.className = 'fab fa-python';
                            break;
                        case 'java':
                            icon.className = 'fab fa-java';
                            break;
                        case 'json':
                        case 'yaml':
                        case 'yml':
                            icon.className = 'fas fa-cog';
                            break;
                        case 'markdown':
                        case 'md':
                            icon.className = 'fab fa-markdown';
                            break;
                        case 'plaintext':
                            icon.className = 'fas fa-align-left';
                            break;
                        default:
                            icon.className = 'fas fa-code';
                    }

                    languageLabel.appendChild(icon);
                    const text = document.createElement('span');
                    text.textContent = language === 'plaintext' ? '纯文本' : language;
                    languageLabel.appendChild(text);

                    block.parentElement.appendChild(languageLabel);

                    if (language !== 'plaintext') {
                        block.innerHTML = `<div class="code-loading">正在加载 ${language} 语言支持...</div>` + block.innerHTML;
                        const loaded = await this.loadLanguage(language);
                        block.querySelector('.code-loading')?.remove();
                        if (loaded) {
                            block.classList.add('hljs');
                            hljs.highlightElement(block);
                        }
                    }
                }

                if (!block.classList.contains('secure-code')) {
                    const copyButton = document.createElement('button');
                    copyButton.className = 'article-copy-button';
                    copyButton.innerHTML = '<i class="far fa-copy"></i> 复制';

                    copyButton.addEventListener('click', async () => {
                        const code = block.textContent;
                        try {
                            await navigator.clipboard.writeText(code);
                            copyButton.innerHTML = '<i class="fas fa-check"></i> 已复制';
                            copyButton.classList.add('copied');
                            setTimeout(() => {
                                copyButton.innerHTML = '<i class="far fa-copy"></i> 复制';
                                copyButton.classList.remove('copied');
                            }, 2000);
                        } catch (err) {
                            console.error('复制失败:', err);
                            showNotification('复制失败，请重试', 2, 'error');
                        }
                    });

                    block.parentElement.appendChild(copyButton);
                }
            }

            if (this.isArticleOutdated(article.date)) {
                showNotification('这文章有些年头了，内容可能不太新鲜哦~ 😊', 5, 'info');
            }

            const oldToc = document.querySelector('.article-toc');
            if (oldToc) {
                oldToc.remove();
            }

            const tocContainer = document.createElement('div');
            tocContainer.className = 'article-toc';
            tocContainer.innerHTML = `
                <button class="pin-btn" title="固定目录">
                    <i class="fas fa-thumbtack"></i>
                </button>
                <div class="toc-preview"></div>
                <h3>目录</h3>
                <ul></ul>
            `;

            const pinBtn = tocContainer.querySelector('.pin-btn');
            pinBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tocContainer.classList.toggle('pinned');
            });

            const headers = articleContent.querySelectorAll('h2, h3, h4');
            const tocList = tocContainer.querySelector('ul');
            const tocPreview = tocContainer.querySelector('.toc-preview');
            document.body.appendChild(tocContainer);

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

                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.dataset.level = header.tagName.toLowerCase();
                previewItem.dataset.title = header.textContent;

                tocPreview.appendChild(previewItem);
            });

            this.updateActivePreview = () => {
                const SCROLL_OFFSET = 80;
                const PREDICTION_OFFSET = 30;

                const headerPositions = Array.from(headers).map(header => ({
                    top: header.getBoundingClientRect().top,
                    bottom: header.getBoundingClientRect().bottom,
                    header: header
                }));

                let activeHeader = null;
                let minDistance = Infinity;

                headerPositions.forEach(pos => {
                    const predictedTop = pos.top - PREDICTION_OFFSET;
                    const distance = Math.abs(predictedTop - SCROLL_OFFSET);

                    if (distance < minDistance && predictedTop <= SCROLL_OFFSET) {
                        minDistance = distance;
                        activeHeader = pos.header;
                    }
                });

                headers.forEach((header, index) => {
                    const previewItem = tocPreview.children[index];
                    const tocItem = tocList.children[index];

                    if (header === activeHeader) {
                        previewItem.classList.add('active');
                        tocItem.classList.add('active-heading');
                    } else {
                        previewItem.classList.remove('active');
                        tocItem.classList.remove('active-heading');
                    }
                });
            };

            window.addEventListener('scroll', this.updateActivePreview);

            this.initWaline();
        } catch (error) {
            console.error('加载文章失败:', error);
            showNotification('文章加载失败，请稍后重试', 2, 'error');
        }

        if (!directAccess) {
            this.transitionMask.classList.remove('active');
            this.transitionMask.classList.add('reverse');
            setTimeout(() => {
                this.transitionMask.classList.remove('reverse');
            }, 500);
        }

        articleSection.querySelector('.back-btn').addEventListener('click', async () => {
            if (this.updateActivePreview) {
                window.removeEventListener('scroll', this.updateActivePreview);
            }

            this.transitionMask.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 600));

            const allArticleDetails = document.querySelectorAll('#article-detail');
            allArticleDetails.forEach(detail => detail.remove());

            const tocContainer = document.querySelector('.article-toc');
            if (tocContainer) {
                tocContainer.remove();
            }

            const mainNav = document.querySelector('nav:not(#article-nav)');
            const articleNav = document.getElementById('article-nav');
            mainNav.style.display = 'block';
            articleNav.style.display = 'none';

            history.pushState(null, '', '/');

            const mainContent = document.querySelector('.main-content');
            const sections = mainContent.children;
            Array.from(sections).forEach(section => {
                if (section.id !== 'comments') {
                    section.style.display = '';
                }
            });

            sidebar.style.display = '';
            mainContent.style.width = '';
            mainContent.style.maxWidth = '';
            mainContent.style.margin = '';

            window.handleHomeView();

            this.currentIndex = 0;
            this.loading = false;
            this.allLoaded = false;

            this.renderArticles(false);
            this.setupScrollListener();
            this.initWaline();

            this.transitionMask.classList.remove('active');
            this.transitionMask.classList.add('reverse');
            setTimeout(() => {
                this.transitionMask.classList.remove('reverse');
            }, 500);
        });
    }
}

async function convertToWebP(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
                URL.revokeObjectURL(url);
                resolve(blob);
            }, 'image/webp', 0.5);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('图片处理失败'));
        };

        img.src = url;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    window.articlesManager = new ArticlesManager();
});