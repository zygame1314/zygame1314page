import { API_BASE } from './config.js';
document.addEventListener('DOMContentLoaded', function () {
    let currentPage = 1;
    let totalPages = 1;
    let isLoading = false;
    const itemsPerPage = 4;

    async function loadProjects(page = 1) {
        try {
            isLoading = true;
            const response = await fetch(`${API_BASE}/getdata/projects?page=${page}&limit=${itemsPerPage}`);
            const data = await response.json();

            isLoading = false;

            if (data.pagination) {
                currentPage = data.pagination.page;
                totalPages = data.pagination.totalPages;
            }

            return data.projects || [];
        } catch (error) {
            isLoading = false;
            console.error('加载项目数据失败:', error);
            return [];
        }
    }

    function renderProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';

        if (project.type === 'construction') {
            card.innerHTML = `
                <div class="construction-card">
                    <div class="construction-header">
                        <div class="construction-icon">⚒️</div>
                        <div class="construction-title">${project.title}</div>
                    </div>
                    <div class="blueprint-grid">
                        <div class="blueprint-item"></div>
                        <div class="blueprint-item"></div>
                        <div class="blueprint-item"></div>
                    </div>
                    <div class="construction-progress">
                        <div class="progress-bar"></div>
                    </div>
                    <div class="construction-status">创意构建中</div>
                    <div class="construction-eta">敬请期待</div>
                </div>
            `;

            return card;
        }
        card.innerHTML = `
            <a href="${project.githubUrl}" target="_blank">
                <img data-src="${project.imageUrl}" alt="${project.title}">
            </a>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-actions">
                ${project.actions.map(action => `
                    <a href="${action.url}" class="button" ${action.type === 'external' ? 'target="_blank"' : ''}>
                        ${action.text}
                    </a>
                `).join('')}
            </div>
        `;

        return card;
    }


    async function displayProjectsPage(page) {
        if (isLoading) return;
        const projectList = document.querySelector('.project-list');
        if (!projectList) {
            console.error('.project-list element not found');
            return;
        }

        const existingCards = projectList.querySelectorAll('.project-card.visible');
        existingCards.forEach(card => {
            card.classList.remove('visible');
            card.classList.add('exiting');
        });

        setTimeout(async () => {
            projectList.innerHTML = '';

            const projects = await loadProjects(page);
            projects.forEach(project => {
                const card = renderProjectCard(project);
                projectList.appendChild(card);
                card.style.display = 'none';
                requestAnimationFrame(() => {
                    card.style.display = 'block';
                    requestAnimationFrame(() => {
                        card.classList.add('visible');
                    });
                });
            });

            updatePaginationUI();
        }, 300);
    }

    function updatePaginationUI() {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) {
            return;
        }
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.classList.add('pagination-button');
            button.dataset.page = i;
            button.textContent = i;

            if (i === currentPage) {
                button.classList.add('active');
            }

            button.addEventListener('click', function () {
                const pageNum = parseInt(this.dataset.page);
                if (pageNum !== currentPage && !isLoading) {
                    displayProjectsPage(pageNum);
                }
            });
            paginationContainer.appendChild(button);
        }
    }

    function initNoticeControls() {
        const wrapper = document.querySelector('.notice-content-wrapper');
        if (!wrapper) return;

        const notices = document.querySelectorAll('.notice-content');
        const prevBtn = document.querySelector('.notice-prev');
        const nextBtn = document.querySelector('.notice-next');
        const pageText = document.querySelector('.notice-page');

        if (!prevBtn || !nextBtn || !pageText) {
            if (pageText && notices.length === 0) pageText.textContent = "0/0";
            return;
        }

        let currentNoticePage = 0;

        function updateNoticePageNumber() {
            if (notices.length > 0) {
                pageText.textContent = `${currentNoticePage + 1}/${notices.length}`;
            } else {
                pageText.textContent = "0/0";
            }
        }

        function showNoticePageAtIndex(index) {
            if (notices.length === 0) return;

            notices.forEach((notice, i) => {
                if (i === index) {
                    notice.classList.add('active');
                    notice.style.transform = 'translateX(0)';
                } else {
                    notice.classList.remove('active');
                    notice.style.transform = i < index ? 'translateX(-100%)' : 'translateX(100%)';
                }
            });
            currentNoticePage = index;
            updateNoticePageNumber();
        }

        prevBtn.addEventListener('click', () => {
            if (currentNoticePage > 0) {
                showNoticePageAtIndex(currentNoticePage - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentNoticePage < notices.length - 1) {
                showNoticePageAtIndex(currentNoticePage + 1);
            }
        });

        if (notices.length > 0) {
            showNoticePageAtIndex(0);
        } else {
            updateNoticePageNumber();
        }
    }

    initNoticeControls();
    displayProjectsPage(1);
});

