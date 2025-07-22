let allMilestones = [];
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
const pageSize = 10;

async function loadTimeline() {
    try {
        const timelineContainer = document.querySelector('.milestone-timeline');
        if (!timelineContainer) return;

        isLoading = true;
        timelineContainer.innerHTML = '<div class="timeline-loading">加载时间轴数据中...</div>';

        const response = await fetch(`${API_BASE}/getdata/timeline?page=1&limit=${pageSize}`);
        const data = await response.json();

        isLoading = false;

        if (!data.milestones || data.milestones.length === 0) {
            timelineContainer.innerHTML = '<div class="timeline-empty">暂无时间轴数据</div>';
            return;
        }

        currentPage = data.pagination.page;
        totalPages = data.pagination.totalPages;

        renderMilestones(data.milestones, false);

    } catch (error) {
        isLoading = false;
        console.error('加载时间轴数据失败:', error);
        const timelineContainer = document.querySelector('.milestone-timeline');
        if (timelineContainer) {
            timelineContainer.innerHTML = '<div class="timeline-empty">加载时间轴数据失败，请稍后再试</div>';
        }
    }
}

async function loadMoreTimeline() {
    if (isLoading || currentPage >= totalPages) return;

    isLoading = true;
    const nextPage = currentPage + 1;

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = '加载中...';
    }

    try {
        const response = await fetch(`${API_BASE}/getdata/timeline?page=${nextPage}&limit=${pageSize}`);
        const data = await response.json();

        isLoading = false;

        if (data.milestones && data.milestones.length > 0) {
            currentPage = data.pagination.page;
            totalPages = data.pagination.totalPages;

            renderMilestones(data.milestones, true);
        }

    } catch (error) {
        isLoading = false;
        console.error('加载更多时间轴数据失败:', error);

        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = '查看更多';
        }
    }
}

function renderMilestones(milestones, isLoadMore = false) {
    const timelineContainer = document.querySelector('.milestone-timeline');
    if (!timelineContainer) return;

    if (!isLoadMore) {
        timelineContainer.innerHTML = '';
        allMilestones = [];
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        timelineContainer.appendChild(timelineLine);
    } else {
        const existingFuture = timelineContainer.querySelector('.future-milestone');
        if (existingFuture) existingFuture.remove();
        const existingLoadMore = timelineContainer.querySelector('.load-more-container');
        if (existingLoadMore) existingLoadMore.remove();
    }

    allMilestones = allMilestones.concat(milestones);

    const milestonesHTML = milestones.map(milestone => `
        <div class="milestone">
            <div class="milestone-dot"></div>
            <div class="milestone-content">
                <span class="date">${milestone.date}</span>
                <h3>${milestone.title}</h3>
                <p class="milestone-description">
                    ${milestone.description}
                </p>
            </div>
        </div>
    `).join('');

    timelineContainer.insertAdjacentHTML('beforeend', milestonesHTML);

    const futureMilestoneHTML = `
        <div class="milestone future-milestone">
            <div class="milestone-dot"></div>
            <div class="milestone-content">
                <span class="date">???</span>
                <h3>✨ 此后夜阑，静待新篇……</h3>
            </div>
        </div>
    `;
    timelineContainer.insertAdjacentHTML('beforeend', futureMilestoneHTML);

    if (currentPage < totalPages) {
        const loadMoreHTML = `
            <div class="load-more-container">
                <button id="load-more-btn" class="load-more-btn" ${isLoading ? 'disabled' : ''}>
                    ${isLoading ? '加载中...' : '查看更多'}
                </button>
            </div>
        `;
        timelineContainer.insertAdjacentHTML('beforeend', loadMoreHTML);
        document.getElementById('load-more-btn').addEventListener('click', loadMoreTimeline);
    }

    const timelineLine = timelineContainer.querySelector('.timeline-line');
    if (timelineLine) {
        timelineLine.style.height = `${timelineContainer.scrollHeight}px`;
    }

    addMilestoneInteractions();
}

function addMilestoneInteractions() {
    document.querySelectorAll('.milestone:not(.future-milestone)').forEach(milestone => {
        const content = milestone.querySelector('.milestone-content');
        milestone.addEventListener('mouseenter', () => {
            content.style.maxHeight = content.scrollHeight + 'px';
        });
        milestone.addEventListener('mouseleave', () => {
            content.style.maxHeight = '70px';
        });
    });
}

document.addEventListener('DOMContentLoaded', loadTimeline);