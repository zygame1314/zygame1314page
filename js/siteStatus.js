const API_BASE = 'https://zygame1314.site';

class SiteStatus {
    constructor() {
        this.statusHistory = [];
        this.init();
    }

    async loadHistory() {
        try {
            const response = await fetch(`${API_BASE}/check/status-history`);
            this.statusHistory = await response.json();
            this.updateUI(this.statusHistory[0]);
            this.updateChart();
        } catch (error) {
            console.error('加载状态历史失败:', error);
            this.updateUIError();
        }
    }

    async init() {
        await this.loadHistory();
        setInterval(() => this.loadHistory(), 60000);
    }

    updateUI(data) {
        const statusIndicator = document.querySelector('.status-indicator');
        const responseSpan = document.querySelector('.status-response');
        const lastCheck = document.querySelector('.last-check span');

        statusIndicator.className = 'status-indicator ' + data.status;

        if (data.responseTime) {
            responseSpan.textContent = `${data.responseTime}ms`;
        }

        lastCheck.textContent = new Date(data.timestamp).toLocaleString();
    }

    updateUIError() {
        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.className = 'status-indicator offline';
        document.querySelector('.status-response').textContent = '-- ms';
    }

    updateChart() {
        const chartContainer = document.querySelector('.uptime-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '-25 0 330 70');
        svg.style.padding = '5px';

        for (let i = 0; i < 6; i++) {
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('x1', '0');
            gridLine.setAttribute('y1', i * 10 + 5);
            gridLine.setAttribute('x2', '290');
            gridLine.setAttribute('y2', i * 10 + 5);
            gridLine.setAttribute('stroke', 'rgba(255,255,255,0.1)');
            gridLine.setAttribute('stroke-width', '1');
            svg.appendChild(gridLine);
        }

        const now = Date.now();
        const timeLabels = [
            { text: '2小时', minutes: 120 },
            { text: '90分钟', minutes: 90 },
            { text: '60分钟', minutes: 60 },
            { text: '30分钟', minutes: 30 },
            { text: '现在', minutes: 0 }
        ].reverse();

        timeLabels.forEach((label, index) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.textContent = label.text;
            text.setAttribute('x', 5 + (index * 70));
            text.setAttribute('y', 68);
            text.setAttribute('fill', 'rgba(255,255,255,0.5)');
            text.setAttribute('font-size', '10');
            text.setAttribute('text-anchor', 'middle');
            svg.appendChild(text);
        });

        if (this.statusHistory.length > 0) {
            const sortedHistory = [...this.statusHistory].sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let pathD = '';

            const endTime = now;
            const startTime = endTime - (120 * 60 * 1000);

            sortedHistory.forEach((status, index) => {
                const statusTime = new Date(status.timestamp).getTime();
                if (statusTime < startTime) return;

                const timeProgress = 1 - ((statusTime - startTime) / (endTime - startTime));
                const x = 5 + (timeProgress * 270);
                const y = status.status === 'online' ? 15 : 45;

                if (index === 0) {
                    pathD = `M ${x} ${y}`;
                } else {
                    pathD += ` L ${x} ${y}`;
                }

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', status.status === 'online' ? '#2ecc71' : '#e74c3c');
                circle.setAttribute('filter', 'url(#glow)');

                const timeAgo = Math.round((now - statusTime) / 60000);
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `状态: ${status.status === 'online' ? '在线' : '离线'}
时间: ${new Date(status.timestamp).toLocaleTimeString()}
响应: ${status.responseTime || '--'}ms
${timeAgo}分钟前`;
                circle.appendChild(title);

                svg.appendChild(circle);
            });

            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', 'glow');
            filter.innerHTML = `
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            `;
            defs.appendChild(filter);
            svg.appendChild(defs);

            path.setAttribute('d', pathD);
            path.setAttribute('stroke', 'rgba(255,255,255,0.3)');
            path.setAttribute('stroke-width', '1');
            path.setAttribute('fill', 'none');
            svg.insertBefore(path, svg.firstChild);
        }

        chartContainer.appendChild(svg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SiteStatus();
});