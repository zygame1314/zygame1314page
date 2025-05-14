document.addEventListener('DOMContentLoaded', function () {
    async function loadProjects() {
        try {
            const response = await fetch('/data/projects.json');
            const data = await response.json();
            return data.projects;
        } catch (error) {
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

    async function initProjects() {
        const projectList = document.querySelector('.project-list');
        const projects = await loadProjects();

        projects.forEach(project => {
            const card = renderProjectCard(project);
            projectList.appendChild(card);
        });

        initPagination();
    }

    function initNoticeControls() {
        const wrapper = document.querySelector('.notice-content-wrapper');
        const notices = document.querySelectorAll('.notice-content');
        const prevBtn = document.querySelector('.notice-prev');
        const nextBtn = document.querySelector('.notice-next');
        const pageText = document.querySelector('.notice-page');
        let currentPage = 0;

        function updatePageNumber() {
            pageText.textContent = `${currentPage + 1}/${notices.length}`;
        }

        function showPage(index) {
            const notices = document.querySelectorAll('.notice-content');
            notices.forEach((notice, i) => {
                if (i === index) {
                    notice.classList.add('active');
                    notice.style.transform = 'translateX(0)';
                } else {
                    notice.classList.remove('active');
                    notice.style.transform = i < index ? 'translateX(-100%)' : 'translateX(100%)';
                }
            });
            currentPage = index;
            updatePageNumber();
        }
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                showPage(currentPage - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentPage < notices.length - 1) {
                showPage(currentPage + 1);
            }
        });

        updatePageNumber();
    }

    initNoticeControls();

    function initPagination() {
        const itemsPerPage = 4;
        const projectList = document.querySelector('.project-list');
        const projectCards = Array.from(projectList.querySelectorAll('.project-card'));
        const totalItems = projectCards.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const paginationContainer = document.querySelector('.pagination');

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.classList.add('pagination-button');
            button.dataset.page = i;
            button.textContent = i;

            if (i === 1) {
                button.classList.add('active');
            }

            button.addEventListener('click', function () {
                const allButtons = paginationContainer.querySelectorAll('.pagination-button');
                allButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                showPage(parseInt(this.dataset.page), itemsPerPage, projectCards);
            });

            paginationContainer.appendChild(button);
        }

        showPage(1, itemsPerPage, projectCards);
    }

    function showPage(pageNumber, itemsPerPage, projectCards) {
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        projectCards.forEach(card => {
            if (card.classList.contains('visible')) {
                card.classList.add('exiting');
                card.classList.remove('visible');
            }
        });

        setTimeout(() => {
            projectCards.forEach(card => {
                card.classList.remove('exiting');
                card.style.display = 'none';
            });

            projectCards.forEach((card, index) => {
                if (index >= startIndex && index < endIndex) {
                    card.style.display = 'block';
                    requestAnimationFrame(() => {
                        card.classList.add('visible');
                    });
                }
            });
        }, 300);
    }

    initProjects();
});
