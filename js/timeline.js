async function loadTimeline() {
    try {
        const response = await fetch(`${API_BASE}/data/timeline`);
        const data = await response.json();

        data.milestones.sort((a, b) => {
            const dateA = new Date(a.date.replace(/年|月/g, '-').replace('日', ''));
            const dateB = new Date(b.date.replace(/年|月/g, '-').replace('日', ''));
            return dateB - dateA;
        });

        const timelineContainer = document.querySelector('.milestone-timeline');
        timelineContainer.innerHTML = '';

        const initialDisplay = 10;
        const loadMoreCount = 10;
        const totalMilestones = data.milestones.length;

        let currentlyShown = Math.min(initialDisplay, totalMilestones);

        function renderMilestones(count) {
            timelineContainer.innerHTML = '';

            for (let i = 0; i < count; i++) {
                if (i >= data.milestones.length) break;

                const milestone = data.milestones[i];
                const milestoneHTML = `
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
                `;
                timelineContainer.innerHTML += milestoneHTML;
            }

            const futureMilestoneHTML = `
                <div class="milestone future-milestone">
                    <div class="milestone-dot"></div>
                    <div class="milestone-content">
                        <span class="date">???</span>
                        <h3>✨ 此后夜阑，静待新篇……</h3>
                    </div>
                </div>
            `;
            timelineContainer.innerHTML += futureMilestoneHTML;

            if (count < totalMilestones) {
                const loadMoreHTML = `
                    <div class="load-more-container">
                        <button id="load-more-btn" class="load-more-btn">查看更多</button>
                    </div>
                `;
                timelineContainer.innerHTML += loadMoreHTML;

                document.getElementById('load-more-btn').addEventListener('click', () => {
                    const newCount = Math.min(currentlyShown + loadMoreCount, totalMilestones);
                    currentlyShown = newCount;
                    renderMilestones(currentlyShown);
                });
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

        renderMilestones(currentlyShown);

    } catch (error) {
        console.error('加载时间轴数据失败:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadTimeline);