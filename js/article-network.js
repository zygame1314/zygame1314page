class ArticleNetwork {
    constructor() {
        this.canvas = document.getElementById('networkCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.links = [];
        this.simulation = null;
        this.hoveredNode = null;
        this.pixelSize = 2;
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.dpr = window.devicePixelRatio || 1;
        this.isDragging = false;
        this.selectedNode = null;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 60;
        this.particleSystem = [];
        this.lastDragPosition = { x: 0, y: 0 };
        this.dragStartTime = 0;
        this.lastTouchPosition = null;
        this.touchStartTime = 0;
        this.dragStartPosition = { x: 0, y: 0 };
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleNodeClick = this.handleNodeClick.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

        this.initCanvas();
        this.loadData();

        setInterval(() => {
            this.glowIntensity += 0.05 * this.glowDirection;
            if (this.glowIntensity > 1) {
                this.glowDirection = -1;
                this.glowIntensity = 1;
            } else if (this.glowIntensity < 0) {
                this.glowDirection = 1;
                this.glowIntensity = 0;
            }
            this.draw();
        }, 50);
    }

    addParticle(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1;

        this.particleSystem.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: this.getRandomColor(),
            size: this.pixelSize
        });
    }

    updateParticles() {
        const currentTime = Date.now();

        if (currentTime - this.lastParticleTime > 200) {
            const randomNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            if (randomNode) {
                this.addParticle(randomNode.x, randomNode.y);
                this.lastParticleTime = currentTime;
            }
        }

        this.particleSystem = this.particleSystem.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;

            if (particle.life > 0) {
                this.drawPixelRect(
                    particle.x,
                    particle.y,
                    particle.size,
                    particle.color,
                    particle.life
                );
                return true;
            }
            return false;
        });
    }

    initCanvas() {
        const resize = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();

            this.canvas.width = rect.width * this.dpr;
            this.canvas.height = rect.height * this.dpr;

            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;

            this.ctx.scale(this.dpr, this.dpr);

            if (this.simulation) {
                this.simulation.force("center", d3.forceCenter(
                    rect.width / 2,
                    rect.height / 2
                ));
                this.simulation.alpha(0.3).restart();
            }
        };
        resize();
        window.addEventListener('resize', resize);
    }

    async loadData() {
        try {
            const response = await fetch('/articles/index.json');
            const articles = await response.json();
            this.initNetwork(articles);
        } catch (error) {
            console.error('Failed to load articles:', error);
        }
    }

    initNetwork(articles) {
        const tagNodes = new Set();
        articles.forEach(article => {
            article.tags.forEach(tag => tagNodes.add(tag));
        });

        this.nodes = articles.map(article => ({
            id: article.id,
            title: article.title,
            type: 'article',
            radius: 4,
            color: '#FF6B6B'
        }));

        tagNodes.forEach(tag => {
            this.nodes.push({
                id: tag,
                title: tag,
                type: 'tag',
                radius: 6,
                color: '#4ECDC4'
            });
        });

        this.links = [];
        articles.forEach(article => {
            article.tags.forEach(tag => {
                this.links.push({
                    source: this.nodes.find(n => n.id === article.id),
                    target: this.nodes.find(n => n.id === tag),
                    strength: 0.2
                });
            });
        });

        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links)
                .strength(d => d.strength))
            .force("charge", d3.forceManyBody()
                .strength(d => d.type === 'tag' ? -100 : -20)
                .distanceMax(150))
            .force("center", d3.forceCenter(
                this.canvas.width / (2 * this.dpr),
                this.canvas.height / (2 * this.dpr)
            ))
            .force("collision", d3.forceCollide()
                .radius(d => d.radius * 1.5))
            .velocityDecay(0.4)
            .alphaMin(0.01)
            .on("tick", () => this.throttledDraw());

        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseout', () => {
            this.hoveredNode = null;
            this.draw();
        });
    }

    throttledDraw() {
        const currentTime = Date.now();
        if (currentTime - this.lastFrameTime >= this.frameInterval) {
            this.draw();
            this.lastFrameTime = currentTime;
        }
    }

    getRandomColor() {
        const colors = ['#ff004d', '#29adff', '#00e436', '#ffa300', '#ff77a8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    drawPixelRect(x, y, width, color, alpha = 1) {
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        for (let i = 0; i < width; i += this.pixelSize) {
            for (let j = 0; j < width; j += this.pixelSize) {
                this.ctx.fillRect(
                    Math.floor(x - width / 2 + i),
                    Math.floor(y - width / 2 + j),
                    this.pixelSize,
                    this.pixelSize
                );
            }
        }
        this.ctx.globalAlpha = 1;
    }

    drawPixelLine(x1, y1, x2, y2, color) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / (this.pixelSize * 2));

        for (let i = 0; i <= steps; i++) {
            const x = x1 + (dx * i / steps);
            const y = y1 + (dy * i / steps);
            this.ctx.fillStyle = color;
            this.ctx.fillRect(
                Math.floor(x),
                Math.floor(y),
                this.pixelSize,
                this.pixelSize
            );
        }
    }

    draw() {
        const displayWidth = this.canvas.width / this.dpr;
        const displayHeight = this.canvas.height / this.dpr;

        this.ctx.clearRect(0, 0, displayWidth, displayHeight);

        this.links.forEach(link => {
            this.drawPixelLine(
                link.source.x,
                link.source.y,
                link.target.x,
                link.target.y,
                'rgba(255,255,255,0.15)'
            );
        });

        this.links.forEach(link => {
            const progress = (Date.now() % 2000) / 2000;
            this.drawAnimatedLine(
                link.source.x, link.source.y,
                link.target.x, link.target.y,
                progress
            );
        });

        this.updateParticles();

        this.nodes.forEach(node => {
            const size = node.type === 'tag' ? 12 : 8;
            const baseColor = node.color;

            if (node === this.hoveredNode) {
                this.drawPixelRect(node.x, node.y, size + 6, baseColor, 0.2 + this.glowIntensity * 0.3);
                this.drawPixelRect(node.x, node.y, size + 4, baseColor, 0.3 + this.glowIntensity * 0.3);
            }

            if (this.hoveredNode) {
                const isConnected = this.links.some(link =>
                    (link.source === this.hoveredNode && link.target === node) ||
                    (link.target === this.hoveredNode && link.source === node)
                );
                this.drawPixelRect(node.x, node.y, size,
                    isConnected ? '#fff' : (node === this.hoveredNode ? '#fff' : baseColor),
                    isConnected || node === this.hoveredNode ? 1 : 0.6
                );
            } else {
                this.drawPixelRect(node.x, node.y, size, baseColor);
            }
        });

        this.nodes.forEach(node => {
            if (node.type === 'tag' || node === this.hoveredNode) {
                const fontSize = node.type === 'tag' ? 10 : 12;
                this.ctx.font = `${fontSize}px "Zpix"`;
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(node.title, node.x, node.y - 15);
            }
        });
    }

    drawTooltip(node) {
        const padding = 5;
        const text = node.title;

        this.ctx.font = '12px Arial';
        const textWidth = this.ctx.measureText(text).width;
        const tooltipWidth = textWidth + padding * 2;
        const tooltipHeight = 20;

        let x = node.x - tooltipWidth / 2;
        let y = node.y - tooltipHeight - 10;

        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.roundRect(x, y, tooltipWidth, tooltipHeight, 5);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(text, x + padding, y + 14);
    }

    drawAnimatedLine(x1, y1, x2, y2, progress) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / (this.pixelSize * 2));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            if (Math.abs(t - progress) < 0.1) {
                const x = x1 + dx * t;
                const y = y1 + dy * t;
                this.drawPixelRect(x, y, this.pixelSize * 2, '#fff', 0.8);
            }
        }
    }

    handleMouseDown(event) {
        if (this.hoveredNode) {
            this.isDragging = true;
            this.selectedNode = this.hoveredNode;

            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.dragStartTime = Date.now();
            this.dragStartPosition = { x, y };
            this.lastDragPosition = { x, y };

            this.simulation.alphaTarget(0.3).restart();
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.hoveredNode = this.nodes.find(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
        });

        if (this.isDragging && this.selectedNode) {
            this.selectedNode.fx = x;
            this.selectedNode.fy = y;
            this.simulation.alpha(0.3).restart();
        }

        this.draw();
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
    }

    handleMouseUp(event) {
        const dragEndTime = Date.now();
        const dragDuration = dragEndTime - this.dragStartTime;

        if (this.selectedNode) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const dx = x - this.dragStartPosition.x;
            const dy = y - this.dragStartPosition.y;
            const dragDistance = Math.sqrt(dx * dx + dy * dy);

            if (dragDuration < 200 && dragDistance < 5) {
                this.handleNodeClick(this.selectedNode);
            }

            const vx = this.selectedNode.vx;
            const vy = this.selectedNode.vy;
            this.selectedNode.fx = null;
            this.selectedNode.fy = null;
            this.selectedNode.vx = vx;
            this.selectedNode.vy = vy;
        }

        this.isDragging = false;
        this.selectedNode = null;
        this.simulation.alphaTarget(0);
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.hoveredNode = this.nodes.find(node => {
                const dx = x - node.x;
                const dy = y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
            });

            if (this.hoveredNode) {
                this.isDragging = true;
                this.selectedNode = this.hoveredNode;
                this.touchStartTime = Date.now();
                this.dragStartPosition = { x, y };
                this.lastDragPosition = { x, y };
                this.simulation.alphaTarget(0.3).restart();
            }
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (this.isDragging && this.selectedNode && event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.selectedNode.fx = x;
            this.selectedNode.fy = y;
            this.lastDragPosition = { x, y };
            this.simulation.alpha(0.3).restart();
            this.draw();
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;

        if (this.selectedNode) {
            if (touchDuration < 200) {
                const dx = this.lastDragPosition.x - this.dragStartPosition.x;
                const dy = this.lastDragPosition.y - this.dragStartPosition.y;
                const dragDistance = Math.sqrt(dx * dx + dy * dy);

                if (dragDistance < 5) {
                    this.handleNodeClick(this.selectedNode);
                }
            }

            const vx = this.selectedNode.vx;
            const vy = this.selectedNode.vy;
            this.selectedNode.fx = null;
            this.selectedNode.fy = null;
            this.selectedNode.vx = vx;
            this.selectedNode.vy = vy;
        }

        this.isDragging = false;
        this.selectedNode = null;
        this.hoveredNode = null;
        this.simulation.alphaTarget(0);
        this.draw();
    }

    async handleNodeClick(node) {
        if (node.type === 'article') {
            const response = await fetch('/articles/index.json');
            const articles = await response.json();
            const article = articles.find(a => a.id === node.id);

            if (article) {
                const articlesManager = window.articlesManager;
                if (articlesManager) {
                    await articlesManager.showArticle(article);
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ArticleNetwork();
});