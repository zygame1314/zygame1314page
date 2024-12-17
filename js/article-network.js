class ArticleNetwork {
    constructor() {
        this.canvas = document.getElementById('networkCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
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
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 4;
        this.lastPinchDistance = null;
        this.offset = { x: 0, y: 0 };
        this.isDraggingCanvas = false;
        this.lastMousePosition = null;
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
        this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseOut.bind(this));
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd);
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

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
                    strength: 0.1
                });
            });
        });

        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links)
                .strength(d => d.strength)
                .distance(50))
            .force("charge", d3.forceManyBody()
                .strength(d => d.type === 'tag' ? -150 : -50)
                .distanceMax(200))
            .force("collision", d3.forceCollide()
                .radius(d => d.radius * 2)
                .strength(0.5))
            .velocityDecay(0.4)
            .alphaMin(0.001)
            .alphaDecay(0.02)
            .on("tick", () => {
                if (!this.isInitialized && this.simulation.alpha() < 0.1) {
                    this.fitView();
                    this.isInitialized = true;
                }
                this.throttledDraw();
            });

        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseout', () => {
            this.hoveredNode = null;
            this.draw();
        });
    }

    fitView() {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });

        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;

        const displayWidth = this.canvas.width / this.dpr;
        const displayHeight = this.canvas.height / this.dpr;
        const scaleX = (displayWidth * 0.8) / boxWidth;
        const scaleY = (displayHeight * 0.8) / boxHeight;
        this.scale = Math.min(scaleX, scaleY, 1);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        this.offset.x = displayWidth / 2 - centerX * this.scale;
        this.offset.y = displayHeight / 2 - centerY * this.scale;

        this.draw();
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

        this.ctx.save();

        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);

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
        this.ctx.restore();
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
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.offset.x) / this.scale;
        const y = (event.clientY - rect.top - this.offset.y) / this.scale;

        this.hoveredNode = this.nodes.find(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
        });

        if (this.hoveredNode) {
            this.isDragging = true;
            this.selectedNode = this.hoveredNode;
            this.dragStartTime = Date.now();
            this.dragStartPosition = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            this.simulation.alphaTarget(0.3).restart();
        } else {
            this.isDraggingCanvas = true;
            this.lastMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    handleMouseMove(event) {
        if (this.isDraggingCanvas && this.lastMousePosition) {
            const dx = event.clientX - this.lastMousePosition.x;
            const dy = event.clientY - this.lastMousePosition.y;

            this.offset.x += dx;
            this.offset.y += dy;

            this.lastMousePosition = {
                x: event.clientX,
                y: event.clientY
            };

            this.draw();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.offset.x) / this.scale;
        const y = (event.clientY - rect.top - this.offset.y) / this.scale;

        if (!this.isDragging) {
            this.hoveredNode = this.nodes.find(node => {
                const dx = x - node.x;
                const dy = y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
            });
        }

        if (this.isDragging && this.selectedNode) {
            this.selectedNode.fx = x;
            this.selectedNode.fy = y;
            this.simulation.alpha(0.3).restart();
        }

        this.draw();
        this.canvas.style.cursor = this.hoveredNode
            ? `url('${encodeURI('../images/cursors/Rath Link.cur')}'), pointer`
            : this.isDraggingCanvas
                ? `url('${encodeURI('../images/cursors/RTON move.cur')}'), grabbing`
                : `url('${encodeURI('../images/cursors/RTON move.cur')}'), grab`;
    }

    handleMouseUp(event) {
        if (this.isDraggingCanvas) {
            this.isDraggingCanvas = false;
            this.lastMousePosition = null;
            return;
        }
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

    handleMouseOut() {
        if (this.isDragging && this.selectedNode) {
            const vx = this.selectedNode.vx;
            const vy = this.selectedNode.vy;

            this.selectedNode.fx = null;
            this.selectedNode.fy = null;

            this.selectedNode.vx = vx;
            this.selectedNode.vy = vy;
        }

        this.isDraggingCanvas = false;
        this.isDragging = false;
        this.lastMousePosition = null;
        this.selectedNode = null;
        this.hoveredNode = null;

        this.simulation.alphaTarget(0);
        this.draw();
    }

    handleWheel(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));

        this.offset.x += mouseX * (1 - delta);
        this.offset.y += mouseY * (1 - delta);

        this.scale = newScale;
        this.draw();
    }

    handleTouchStart(event) {
        event.preventDefault();

        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.lastPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left - this.offset.x) / this.scale;
            const y = (touch.clientY - rect.top - this.offset.y) / this.scale;

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
            } else {
                this.isDraggingCanvas = true;
                this.lastTouchPosition = {
                    x: touch.clientX,
                    y: touch.clientY
                };
            }
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            if (this.lastPinchDistance !== null) {
                const rect = this.canvas.getBoundingClientRect();
                const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

                const scale = currentDistance / this.lastPinchDistance;
                const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * scale));

                this.offset.x += centerX * (1 - scale);
                this.offset.y += centerY * (1 - scale);

                this.scale = newScale;
                this.draw();
            }

            this.lastPinchDistance = currentDistance;
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();

            if (this.isDraggingCanvas && this.lastTouchPosition) {
                const dx = touch.clientX - this.lastTouchPosition.x;
                const dy = touch.clientY - this.lastTouchPosition.y;

                this.offset.x += dx;
                this.offset.y += dy;

                this.lastTouchPosition = {
                    x: touch.clientX,
                    y: touch.clientY
                };

                this.draw();
            } else if (this.isDragging && this.selectedNode) {
                const x = (touch.clientX - rect.left - this.offset.x) / this.scale;
                const y = (touch.clientY - rect.top - this.offset.y) / this.scale;

                this.selectedNode.fx = x;
                this.selectedNode.fy = y;
                this.simulation.alpha(0.3).restart();
                this.draw();
            }
        }
    }

    handleTouchEnd(event) {
        if (this.isDraggingCanvas) {
            this.isDraggingCanvas = false;
            this.lastTouchPosition = null;
        }

        if (this.isDragging) {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - this.touchStartTime;

            if (this.selectedNode) {
                if (touchDuration < 200) {
                    const dx = this.selectedNode.x - this.dragStartPosition.x;
                    const dy = this.selectedNode.y - this.dragStartPosition.y;
                    const dragDistance = Math.sqrt(dx * dx + dy * dy);

                    if (dragDistance < 5) {
                        this.handleNodeClick(this.selectedNode);
                    }
                }

                this.selectedNode.fx = null;
                this.selectedNode.fy = null;
            }

            this.isDragging = false;
            this.selectedNode = null;
        }

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