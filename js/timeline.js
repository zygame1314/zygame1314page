async function loadTimeline() {
    try {
        const response = await fetch('/data/timeline.json');
        const data = await response.json();

        const timelineContainer = document.querySelector('.milestone-timeline');
        timelineContainer.innerHTML = '';

        data.milestones.forEach(milestone => {
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
        });

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

        document.querySelectorAll('.milestone:not(.future-milestone)').forEach(milestone => {
            const content = milestone.querySelector('.milestone-content');
            milestone.addEventListener('mouseenter', () => {
                content.style.maxHeight = content.scrollHeight + 'px';
            });
            milestone.addEventListener('mouseleave', () => {
                content.style.maxHeight = '70px';
            });
        });

    } catch (error) {
        console.error('加载时间轴数据失败:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadTimeline);