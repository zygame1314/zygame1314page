const API_BASE = 'https://zygame1314.site';

class SiteStatus {
    constructor() {
        this.statusHistory = [];
        this.updateInterval = null;
        this.userLastActive = Date.now();
        this.INACTIVITY_TIMEOUT = 5 * 60 * 1000;
        this.init();
        this.setupActivityTracking();
    }

    isUserActive() {
        return Date.now() - this.userLastActive < this.INACTIVITY_TIMEOUT;
    }

    updateUserActivity() {
        this.userLastActive = Date.now();

        if (!this.updateInterval) {
            this.startUpdates();
        }
    }

    setupActivityTracking() {
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(eventName => {
            document.addEventListener(eventName, () => this.updateUserActivity());
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.stopUpdates();
        } else {
            this.updateUserActivity();
            this.startUpdates();
        }
    }

    startUpdates() {
        if (!this.updateInterval) {
            this.loadHistory();

            this.updateInterval = setInterval(() => {
                if (!document.hidden && this.isUserActive()) {
                    this.loadHistory();
                } else {
                    this.stopUpdates();
                }
            }, 60000);

            console.log("站点状态更新已启动");
        }
    }

    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log("站点状态更新已暂停");
        }
    }

    async loadHistory() {
        try {
            const response = await fetch(`${API_BASE}/check/status-history`);
            this.statusHistory = await response.json();

            const latestStatuses = this.groupLatestStatusesBySite(this.statusHistory);
            this.updateUI(latestStatuses);
            this.updateChart();
        } catch (error) {
            console.error('加载状态历史失败:', error);
            this.updateUIError();
        }
    }

    groupLatestStatusesBySite(history) {
        const sites = new Map();
        history.forEach(status => {
            if (!sites.has(status.url) ||
                new Date(status.timestamp) > new Date(sites.get(status.url).timestamp)) {
                sites.set(status.url, status);
            }
        });
        return Array.from(sites.values());
    }

    async init() {
        // 首次加载
        await this.loadHistory();
        // 开始定时更新
        this.startUpdates();
    }

    updateUI(statuses) {
        const statusContainer = document.querySelector('.site-status-widget');
        statusContainer.innerHTML = '';

        statuses.forEach(status => {
            const siteName = this.getSiteName(status.url);
            const statusHTML = `
                <div class="status-item" data-site="${siteName}"
                     onmouseenter="this.dispatchEvent(new CustomEvent('site-status-hover', 
                     {detail: {status: '${status.status}', responseTime: ${status.responseTime}, site: '${siteName}'}}))">
                    <span class="status-label">
                        <i class="fas ${this.getSiteIcon(siteName)}"></i>
                        ${siteName}
                    </span>
                    <span class="status-indicator ${status.status} ${siteName}"></span>
                    <span class="status-response">
                        ${status.responseTime ? status.responseTime + 'ms' : '--'}
                    </span>
                </div>
            `;
            statusContainer.insertAdjacentHTML('beforeend', statusHTML);
        });

        document.querySelectorAll('.status-item').forEach(item => {
            item.addEventListener('site-status-hover', (e) => {
                const { status, responseTime, site } = e.detail;
                const message = this.getStatusMessage(site, status, responseTime);
                if (typeof window.showLive2dNotification === 'function') {
                    window.showLive2dNotification(message, 3000);
                }
            });
        });

        const lastCheck = document.querySelector('.last-check span');
        if (statuses.length > 0) {
            lastCheck.textContent = new Date(statuses[0].timestamp).toLocaleString();
        }
    }

    getStatusMessage(site, status, responseTime) {
        const getSpeedComment = (rt) => {
            if (!rt) return '';
            if (rt < 100) return '，超快！✨';
            if (rt < 500) return '，还不错呢～';
            if (rt < 1000) return '，还可以接受啦';
            if (rt < 3000) return '，有点慢呢，凑合凑活吧';
            return '，好像有点卡的说...';
        };

        const messages = {
            '主站': {
                online: [
                    `主站状态良好！响应时间${responseTime}ms${getSpeedComment(responseTime)}`,
                    `主站运行正常，${responseTime}ms的响应速度${getSpeedComment(responseTime)}`,
                    `主站一切正常${responseTime ? `，${responseTime}ms${getSpeedComment(responseTime)}` : '，放心访问吧！'}`
                ],
                offline: [
                    "啊哦，主站似乎遇到了一些小问题...",
                    "主站暂时不在线，让我们稍等一下~",
                    "主人！主站好像出故障了！"
                ]
            },
            '源站': {
                online: [
                    `源站运行正常！${responseTime}ms${getSpeedComment(responseTime)}`,
                    `源站状态良好，${responseTime}ms的响应速度${getSpeedComment(responseTime)}`,
                    `源站准备就绪${responseTime ? `，${responseTime}ms${getSpeedComment(responseTime)}` : '！'}`
                ],
                offline: [
                    "源站暂时失联了，不过不用担心~",
                    "源站似乎在开小差呢...",
                    "源站遇到了一些技术问题，主人应该正在处理~"
                ]
            },
            'CDN': {
                online: [
                    `CDN工作正常！${responseTime}ms${getSpeedComment(responseTime)}`,
                    `CDN加速中，${responseTime}ms的速度${getSpeedComment(responseTime)}`,
                    `CDN运转良好${responseTime ? `，${responseTime}ms${getSpeedComment(responseTime)}` : '～'}`
                ],
                offline: [
                    "CDN似乎出了点问题，可能会影响加载速度...",
                    "CDN暂时不可用，网站访问可能会变慢~",
                    "CDN连接不上了，让主人看看是怎么回事~"
                ]
            }
        };

        const statusMessages = messages[site][status.toLowerCase()];
        return statusMessages[Math.floor(Math.random() * statusMessages.length)];
    }

    getSiteName(url) {
        switch (url) {
            case 'https://zygame1314.site':
                return '主站';
            case 'https://zygame1314page.pages.dev':
                return '源站';
            case 'https://cdn.jsdmirror.com/gh/jquery/jquery/dist/jquery.min.js':
                return 'CDN';
            default:
                return '未知站点';
        }
    }

    getSiteIcon(siteName) {
        switch (siteName) {
            case '主站':
                return 'fa-home';
            case '源站':
                return 'fa-code-branch';
            case 'CDN':
                return 'fa-cloud';
            default:
                return 'fa-server';
        }
    }

    updateUIError() {
        const statusContainer = document.querySelector('.site-status-widget');
        statusContainer.innerHTML = `
            <div class="status-item">
                <span class="status-label">
                    <i class="fas fa-exclamation-triangle"></i>
                    状态获取失败
                </span>
            </div>
        `;
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
            { text: '60分钟', minutes: 60 },
            { text: '45分钟', minutes: 45 },
            { text: '30分钟', minutes: 30 },
            { text: '15分钟', minutes: 15 },
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

            const sitePositions = {
                '主站': 15,
                '源站': 30,
                'CDN': 45
            };

            const siteColors = {
                '主站': {
                    online: '#2ecc71',
                    offline: '#e74c3c'
                },
                '源站': {
                    online: '#3498db',
                    offline: '#e74c3c'
                },
                'CDN': {
                    online: '#9b59b6',
                    offline: '#e74c3c'
                }
            };

            const sitePaths = new Map();

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let pathD = '';

            const endTime = now;
            const startTime = endTime - (60 * 60 * 1000);

            sortedHistory.forEach((status, index) => {
                const statusTime = new Date(status.timestamp).getTime();
                if (statusTime < startTime) return;

                const timeProgress = 1 - ((statusTime - startTime) / (endTime - startTime));
                const x = 5 + (timeProgress * 270);
                const siteName = this.getSiteName(status.url);
                const y = sitePositions[siteName];

                if (!sitePaths.has(siteName)) {
                    sitePaths.set(siteName, `M ${x} ${y}`);
                } else {
                    sitePaths.set(siteName, sitePaths.get(siteName) + ` L ${x} ${y}`);
                }

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', '3');

                const color = status.status === 'online'
                    ? siteColors[siteName].online
                    : siteColors[siteName].offline;
                circle.setAttribute('fill', color);
                circle.setAttribute('filter', 'url(#glow)');
                circle.setAttribute('class', `status-point ${siteName}`);

                const timeAgo = Math.round((now - statusTime) / 60000);
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `站点: ${siteName}
    状态: ${status.status === 'online' ? '在线' : '离线'}
    时间: ${new Date(status.timestamp).toLocaleTimeString()}
    响应: ${status.responseTime || '--'}ms
    ${timeAgo}分钟前`;
                circle.appendChild(title);

                svg.appendChild(circle);
            });

            Object.entries(sitePositions).forEach(([siteName, y]) => {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.textContent = siteName;
                label.setAttribute('x', '-2');
                label.setAttribute('y', y + 4);
                label.setAttribute('fill', 'rgba(255,255,255,0.5)');
                label.setAttribute('font-size', '10');
                label.setAttribute('text-anchor', 'end');
                svg.appendChild(label);
            });

            sitePaths.forEach((pathD, siteName) => {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathD);
                path.setAttribute('stroke', 'rgba(255,255,255,0.3)');
                path.setAttribute('stroke-width', '1');
                path.setAttribute('fill', 'none');
                path.setAttribute('class', `status-path ${siteName}`);
                svg.insertBefore(path, svg.firstChild);
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