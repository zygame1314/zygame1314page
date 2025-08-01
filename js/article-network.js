class ArticleNetwork {
    constructor() {
        this.canvas = document.getElementById('networkCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
        this.isActive = false;
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
        this.frameInterval = 1000 / 60;
        this.particleSystem = [];
        this.dragStartTime = 0;
        this.lastTouchPosition = null;
        this.touchStartTime = 0;
        this.dragStartPosition = { x: 0, y: 0 };
        this.titleScaleThreshold = 1.2;
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 4;
        this.lastPinchDistance = null;
        this.offset = { x: 0, y: 0 };
        this.isDraggingCanvas = false;
        this.lastMousePosition = null;
        this.activeCanvas = this.canvas;
        this.activeCtx = this.ctx;
        this.maxParticles = 100;
        this.drawTimeout = null;
        this.minOffset = { x: -2000, y: -2000 };
        this.maxOffset = { x: 2000, y: 2000 };
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleNodeClick = this.handleNodeClick.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.initCanvas();
        this.createOverlay();
        this.addFullscreenButton();
        this.initFullscreenModal();
    }
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = (error) => reject(new Error(`Failed to load script: ${src}. Error: ${error}`));
            document.body.appendChild(script);
        });
    }
    createOverlay() {
        const container = this.canvas.parentElement;
        const overlay = document.createElement('div');
        overlay.className = 'network-overlay';
        const text = document.createElement('div');
        text.className = 'network-overlay-text';
        text.innerHTML = '探索文章关系网络……';
        const startBtn = document.createElement('button');
        startBtn.className = 'network-start-btn';
        startBtn.innerHTML = '<i class="fas fa-project-diagram" style="margin-right: 8px;"></i>构建知识网络';
        startBtn.addEventListener('mouseenter', () => {
        });
        startBtn.addEventListener('click', () => {
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>构建中...';
            startBtn.disabled = true;
            setTimeout(() => this.initializeNetwork(), 800);
        });
        const hint = document.createElement('div');
        hint.className = 'network-hint';
        hint.textContent = '发现文章之间隐藏的关联，可拖拽交互，点击文章可直接阅读';
        overlay.appendChild(text);
        overlay.appendChild(startBtn);
        overlay.appendChild(hint);
        this.createBackgroundEffect(overlay);
        this.networkOverlay = overlay;
        container.appendChild(overlay);
    }
    createBackgroundEffect(overlay) {
        const numDots = 25;
        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.width = '1px';
            dot.style.height = '1px';
            dot.style.backgroundColor = 'rgba(255,255,255,0.3)';
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            const size = Math.random() * 2 + 1;
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.animation = `float ${3 + Math.random() * 5}s infinite ease-in-out`;
            overlay.appendChild(dot);
        }
    }
    async initializeNetwork() {
        if (this.isActive) return;
        this.isActive = true;
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
        this.networkOverlay.style.opacity = '0';
        this.networkOverlay.style.transform = 'scale(1.1)';
        this.networkOverlay.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        setTimeout(() => {
            this.networkOverlay.style.display = 'none';
        }, 700);
        try {
            await this.loadData();
        } catch (error) {
            console.error('Failed to initialize network:', error);
        }
        this.startAnimationLoop();
    }
    startAnimationLoop() {
        this.animationInterval = setInterval(() => {
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
        this.lastParticleTime = Date.now();
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
        if (this.particleSystem.length > this.maxParticles) {
            this.particleSystem.splice(0, this.particleSystem.length - this.maxParticles);
        }
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
            const response = await fetch(`${API_BASE}/article/list`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const articles = await response.json();
            await this.loadScript('/js/lib/d3.min.js');
            console.log('D3.js loaded successfully.');
            this.initNetwork(articles);
        } catch (error) {
            console.error('Failed to load data or D3.js:', error);
            this.networkOverlay.innerHTML = '<div class="network-overlay-text" style="color: red;">加载关系网络失败，请稍后重试。</div>';
            this.networkOverlay.style.opacity = '1';
            this.networkOverlay.style.display = 'flex';
            const startBtn = this.networkOverlay.querySelector('.network-start-btn');
            if (startBtn) startBtn.style.display = 'none';
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
                .strength(d => d.strength * 0.8)
                .distance(80))
            .force("charge", d3.forceManyBody()
                .strength(d => d.type === 'tag' ? -250 : -120)
                .distanceMax(250))
            .force("collision", d3.forceCollide()
                .radius(d => d.radius * 3)
                .strength(0.5))
            .velocityDecay(0.5)
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
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.draw();
                this.animationFrameId = null;
            });
        }
    }
    getRandomColor() {
        const colors = ['#ff004d', '#29adff', '#00e436', '#ffa300', '#ff77a8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    drawPixelRect(x, y, width, color, alpha = 1, ctx = this.ctx) {
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        for (let i = 0; i < width; i += this.pixelSize) {
            for (let j = 0; j < width; j += this.pixelSize) {
                ctx.fillRect(
                    Math.floor(x - width / 2 + i),
                    Math.floor(y - width / 2 + j),
                    this.pixelSize,
                    this.pixelSize
                );
            }
        }
        ctx.globalAlpha = 1;
    }
    drawPixelLine(x1, y1, x2, y2, color, ctx = this.ctx) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / (this.pixelSize * 2));
        for (let i = 0; i <= steps; i++) {
            const x = x1 + (dx * i / steps);
            const y = y1 + (dy * i / steps);
            ctx.fillStyle = color;
            ctx.fillRect(
                Math.floor(x),
                Math.floor(y),
                this.pixelSize,
                this.pixelSize
            );
        }
    }
    addFullscreenButton() {
        const button = document.createElement('button');
        button.className = 'network-fullscreen-btn';
        button.innerHTML = '<i class="fas fa-expand"></i>';
        this.canvas.parentElement.appendChild(button);
        button.addEventListener('click', () => {
            this.showFullscreen();
        });
    }
    initFullscreenModal() {
        this.fullscreenModal = document.getElementById('network-modal');
        this.fullscreenCanvas = document.getElementById('networkCanvasFullscreen');
        this.fullscreenCtx = this.fullscreenCanvas.getContext('2d');
        const closeBtn = document.querySelector('.network-modal-close');
        closeBtn.addEventListener('click', () => {
            this.hideFullscreen();
        });
        this.fullscreenModal.addEventListener('click', (e) => {
            if (e.target === this.fullscreenModal) {
                this.hideFullscreen();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.fullscreenModal.style.display === 'block') {
                this.hideFullscreen();
            }
        });
    }
    showFullscreen() {
        this.fullscreenModal.style.display = 'block';
        const modalContent = document.querySelector('.network-modal-content');
        const rect = modalContent.getBoundingClientRect();
        this.fullscreenCanvas.width = rect.width * this.dpr;
        this.fullscreenCanvas.height = rect.height * this.dpr;
        this.fullscreenCanvas.style.width = `${rect.width}px`;
        this.fullscreenCanvas.style.height = `${rect.height}px`;
        this.originalScale = this.scale;
        this.originalOffset = { ...this.offset };
        this.activeCanvas = this.fullscreenCanvas;
        this.activeCtx = this.fullscreenCtx;
        this.fullscreenCtx.scale(this.dpr, this.dpr);
        this.lastPinchDistance = null;
        this.isDragging = false;
        this.isDraggingCanvas = false;
        this.lastTouchPosition = null;
        this.cleanupFullscreenEvents?.();
        this.setupFullscreenEvents();
        requestAnimationFrame(() => {
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
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const displayWidth = this.fullscreenCanvas.width / this.dpr;
            const displayHeight = this.fullscreenCanvas.height / this.dpr;
            const scaleX = (displayWidth * 0.8) / boxWidth;
            const scaleY = (displayHeight * 0.8) / boxHeight;
            this.scale = Math.min(scaleX, scaleY, 2);
            this.offset.x = displayWidth / 2 - centerX * this.scale;
            this.offset.y = displayHeight / 2 - centerY * this.scale;
            this.draw();
        });
    }
    hideFullscreen() {
        this.fullscreenModal.classList.add('closing');
        setTimeout(() => {
            this.fullscreenModal.style.display = 'none';
            this.fullscreenModal.classList.remove('closing');
            this.activeCanvas = this.canvas;
            this.activeCtx = this.ctx;
            this.scale = this.originalScale;
            this.offset = { ...this.originalOffset };
            this.fitView();
            if (typeof this.cleanupFullscreenEvents === 'function') {
                this.cleanupFullscreenEvents();
                this.cleanupFullscreenEvents = null;
            }
            this.lastPinchDistance = null;
            this.isDragging = false;
            this.isDraggingCanvas = false;
            this.lastTouchPosition = null;
            this.hoveredNode = null;
            this.selectedNode = null;
        }, 300);
    }
    setupFullscreenEvents() {
        if (this.cleanupFullscreenEvents) {
            this.cleanupFullscreenEvents();
        }
        const boundHandlers = new Map();
        const events = [
            ['mousedown', this.handleMouseDown],
            ['mousemove', this.handleMouseMove],
            ['mouseup', this.handleMouseUp],
            ['wheel', this.handleWheel],
            ['touchstart', this.handleTouchStart],
            ['touchmove', this.handleTouchMove],
            ['touchend', this.handleTouchEnd],
            ['touchcancel', this.handleTouchEnd],
            ['mouseout', this.handleMouseOut],
            ['mouseleave', this.handleMouseOut]
        ];
        events.forEach(([event, handler]) => {
            const boundHandler = handler.bind(this);
            boundHandlers.set(event, boundHandler);
            const options = ['touchstart', 'touchmove', 'wheel'].includes(event)
                ? { passive: false }
                : undefined;
            this.fullscreenCanvas.addEventListener(event, boundHandler, options);
        });
        this.cleanupFullscreenEvents = () => {
            boundHandlers.forEach((handler, event) => {
                this.fullscreenCanvas.removeEventListener(event, handler);
            });
            boundHandlers.clear();
        };
    }
    draw() {
        const drawOnCanvas = (canvas, ctx) => {
            const displayWidth = canvas.width / this.dpr;
            const displayHeight = canvas.height / this.dpr;
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            ctx.save();
            ctx.translate(this.offset.x, this.offset.y);
            ctx.scale(this.scale, this.scale);
            this.links.forEach(link => {
                this.drawPixelLine(
                    link.source.x,
                    link.source.y,
                    link.target.x,
                    link.target.y,
                    'rgba(255,255,255,0.15)',
                    ctx
                );
            });
            this.links.forEach(link => {
                const progress = (Date.now() % 2000) / 2000;
                this.drawAnimatedLine(
                    link.source.x, link.source.y,
                    link.target.x, link.target.y,
                    progress,
                    ctx
                );
            });
            this.updateParticles(ctx);
            this.nodes.forEach(node => {
                const size = node.type === 'tag' ? 12 : 8;
                const baseColor = node.color;
                if (node === this.hoveredNode) {
                    this.drawPixelRect(node.x, node.y, size + 6, baseColor, 0.2 + this.glowIntensity * 0.3, ctx);
                    this.drawPixelRect(node.x, node.y, size + 4, baseColor, 0.3 + this.glowIntensity * 0.3, ctx);
                }
                if (this.hoveredNode) {
                    const isConnected = this.links.some(link =>
                        (link.source === this.hoveredNode && link.target === node) ||
                        (link.target === this.hoveredNode && link.source === node)
                    );
                    this.drawPixelRect(node.x, node.y, size,
                        isConnected ? '#fff' : (node === this.hoveredNode ? '#fff' : baseColor),
                        isConnected || node === this.hoveredNode ? 1 : 0.6,
                        ctx
                    );
                } else {
                    this.drawPixelRect(node.x, node.y, size, baseColor, 1, ctx);
                }
            });
            const nodesToLabel = this.nodes.filter(node =>
                (this.scale >= this.titleScaleThreshold && node.type === 'article') ||
                node.type === 'tag' ||
                node === this.hoveredNode
            );
            this.calculateLabelPositions(nodesToLabel, ctx);
            nodesToLabel
                .sort((a, b) => (a === this.hoveredNode) ? 1 : (b === this.hoveredNode ? -1 : 0))
                .forEach(node => {
                    this.drawNodeLabel(node, ctx);
                });
            ctx.restore();
        };
        drawOnCanvas(this.canvas, this.ctx);
        if (this.fullscreenModal && this.fullscreenModal.style.display === 'block') {
            drawOnCanvas(this.fullscreenCanvas, this.fullscreenCtx);
        }
    }
    calculateLabelPositions(nodes, ctx) {
        const positions = [
            { x: 0, y: -15 },
            { x: 0, y: 20 },
            { x: -20, y: 0 },
            { x: 20, y: 0 },
            { x: -15, y: -15 },
            { x: 15, y: -15 },
            { x: -15, y: 15 },
            { x: 15, y: 15 }
        ];
        const occupied = new Map();
        const sortedNodes = [...nodes].sort((a, b) =>
            (a === this.hoveredNode) ? -1 : (b === this.hoveredNode ? 1 : 0)
        );
        sortedNodes.forEach(node => {
            const fontSize = node.type === 'tag' ? 10 : 14;
            ctx.font = `${fontSize}px "zpix"`;
            const textWidth = ctx.measureText(node.title).width;
            const textHeight = fontSize + 2;
            if (node.labelOffset && !(node === this.hoveredNode && !node.wasHovered)) {
                const rect = {
                    x: node.x + node.labelOffset.x - textWidth / 2,
                    y: node.y + node.labelOffset.y - textHeight,
                    width: textWidth,
                    height: textHeight
                };
                occupied.set(node.id, rect);
                return;
            }
            let bestPosition = null;
            let minOverlap = Infinity;
            for (const pos of positions) {
                const labelX = node.x + pos.x;
                const labelY = node.y + pos.y;
                const rect = {
                    x: labelX - textWidth / 2,
                    y: labelY - textHeight,
                    width: textWidth,
                    height: textHeight
                };
                let overlap = 0;
                for (const [, occupiedRect] of occupied) {
                    if (this.rectsOverlap(rect, occupiedRect)) {
                        overlap += this.calculateOverlap(rect, occupiedRect);
                    }
                }
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    bestPosition = pos;
                }
            }
            node.labelOffset = bestPosition || positions[0];
            node.wasHovered = node === this.hoveredNode;
            const rect = {
                x: node.x + node.labelOffset.x - textWidth / 2,
                y: node.y + node.labelOffset.y - textHeight,
                width: textWidth,
                height: textHeight
            };
            occupied.set(node.id, rect);
        });
    }
    rectsOverlap(rect1, rect2) {
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect2.x + rect2.width < rect1.x ||
            rect1.y + rect1.height < rect2.y ||
            rect2.y + rect2.height < rect1.y
        );
    }
    calculateOverlap(rect1, rect2) {
        const xOverlap = Math.max(0,
            Math.min(rect1.x + rect1.width, rect2.x + rect2.width) -
            Math.max(rect1.x, rect2.x)
        );
        const yOverlap = Math.max(0,
            Math.min(rect1.y + rect1.height, rect2.y + rect2.height) -
            Math.max(rect1.y, rect2.y)
        );
        return xOverlap * yOverlap;
    }
    drawNodeLabel(node, ctx) {
        const fontSize = node.type === 'tag' ? 10 : 14;
        ctx.font = `${fontSize}px "zpix"`;
        ctx.textAlign = 'center';
        const offsetX = node.labelOffset?.x || 0;
        const offsetY = node.labelOffset?.y || -15;
        if (node.type === 'article') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(node.title, node.x + offsetX, node.y + offsetY);
            ctx.fillStyle = node === this.hoveredNode ? '#FFE166' : '#7BFFF0';
        } else {
            ctx.fillStyle = node === this.hoveredNode ? '#FFE166' : '#fff';
        }
        ctx.fillText(node.title, node.x + offsetX, node.y + offsetY);
        if (node === this.hoveredNode) {
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fillText(node.title, node.x + offsetX, node.y + offsetY);
            ctx.shadowBlur = 0;
        }
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
    drawAnimatedLine(x1, y1, x2, y2, progress, ctx = this.ctx) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / (this.pixelSize * 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            if (Math.abs(t - progress) < 0.1) {
                const x = x1 + (dx * i / steps);
                const y = y1 + (dy * i / steps);
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1 - Math.abs(t - progress) * 10;
                ctx.fillRect(
                    Math.floor(x),
                    Math.floor(y),
                    this.pixelSize * 2,
                    this.pixelSize * 2
                );
                ctx.globalAlpha = 1;
            }
        }
    }
    resetDragState() {
        if (this.selectedNode) {
            this.selectedNode.fx = null;
            this.selectedNode.fy = null;
        }
        this.isDragging = false;
        this.isDraggingCanvas = false;
        this.lastMousePosition = null;
        this.lastTouchPosition = null;
        this.selectedNode = null;
        this.hoveredNode = null;
        this.simulation.alphaTarget(0);
    }
    handleMouseDown(event) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.offset.x) / this.scale;
        const y = (event.clientY - rect.top - this.offset.y) / this.scale;
        if (canvas !== this.activeCanvas) return;
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
        const canvas = event.target;
        if (canvas !== this.activeCanvas) return;
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
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.offset.x) / this.scale;
        const y = (event.clientY - rect.top - this.offset.y) / this.scale;
        if (!this.isDragging) {
            const oldHoveredNode = this.hoveredNode;
            this.hoveredNode = this.nodes.find(node => {
                const dx = x - node.x;
                const dy = y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
            });
            if (oldHoveredNode !== this.hoveredNode) {
                if (oldHoveredNode) oldHoveredNode.wasHovered = false;
                if (this.hoveredNode) this.hoveredNode.wasHovered = true;
            }
        }
        if (this.isDragging && this.selectedNode) {
            this.selectedNode.fx = x;
            this.selectedNode.fy = y;
            this.simulation.alpha(0.3).restart();
        }
        this.draw();
        const cursor = this.hoveredNode
            ? `url('${encodeURI('/images/cursors/Rath Link.cur')}'), pointer`
            : this.isDraggingCanvas
                ? `url('${encodeURI('/images/cursors/RTON move.cur')}'), grabbing`
                : `url('${encodeURI('/images/cursors/RTON move.cur')}'), grab`;
        this.activeCanvas.style.cursor = cursor;
    }
    handleMouseUp(event) {
        const canvas = event.target;
        if (canvas !== this.activeCanvas) return;
        if (this.isDraggingCanvas) {
            this.isDraggingCanvas = false;
            this.lastMousePosition = null;
            return;
        }
        const dragEndTime = Date.now();
        const dragDuration = dragEndTime - this.dragStartTime;
        if (this.selectedNode) {
            const rect = canvas.getBoundingClientRect();
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
        this.resetDragState();
        this.draw();
    }
    handleWheel(event) {
        event.preventDefault();
        const rect = this.activeCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const worldX = (mouseX - this.offset.x) / this.scale;
        const worldY = (mouseY - this.offset.y) / this.scale;
        const zoomIntensity = 0.1;
        const zoom = event.deltaY > 0 ? (1 - zoomIntensity) : (1 + zoomIntensity);
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoom));
        this.offset.x = mouseX - worldX * newScale;
        this.offset.y = mouseY - worldY * newScale;
        this.scale = newScale;
        this.draw();
    }
    handleTouchStart(event) {
        const canvas = event.target;
        if (canvas !== this.activeCanvas) return;
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
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left - this.offset.x) / this.scale;
            const y = (touch.clientY - rect.top - this.offset.y) / this.scale;
            this.touchStartNode = this.nodes.find(node => {
                const dx = x - node.x;
                const dy = y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
            });
            if (this.touchStartNode) {
                this.isDragging = true;
                this.selectedNode = this.touchStartNode;
                this.touchStartTime = Date.now();
                this.dragStartPosition = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
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
        const canvas = event.target;
        if (canvas !== this.activeCanvas) return;
        event.preventDefault();
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            if (this.lastPinchDistance !== null) {
                const rect = canvas.getBoundingClientRect();
                const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
                const worldX = (centerX - this.offset.x) / this.scale;
                const worldY = (centerY - this.offset.y) / this.scale;
                const zoomIntensity = 0.5;
                const scaleFactor = currentDistance / this.lastPinchDistance;
                const scale = 1 + (scaleFactor - 1) * zoomIntensity;
                const newScale = Math.max(
                    this.minScale,
                    Math.min(this.maxScale, this.scale * scale)
                );
                this.offset.x = centerX - worldX * newScale;
                this.offset.y = centerY - worldY * newScale;
                this.scale = newScale;
                this.draw();
            }
            this.lastPinchDistance = currentDistance;
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left - this.offset.x) / this.scale;
            const y = (touch.clientY - rect.top - this.offset.y) / this.scale;
            if (!this.isDragging && !this.isDraggingCanvas) {
                this.hoveredNode = this.nodes.find(node => {
                    const dx = x - node.x;
                    const dy = y - node.y;
                    return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
                });
            }
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
                const dragX = (touch.clientX - rect.left - this.offset.x) / this.scale;
                const dragY = (touch.clientY - rect.top - this.offset.y) / this.scale;
                this.selectedNode.fx = dragX;
                this.selectedNode.fy = dragY;
                this.hoveredNode = this.selectedNode;
                this.simulation.alpha(0.3).restart();
                this.draw();
            }
        }
        this.offset.x = Math.max(this.minOffset.x, Math.min(this.maxOffset.x, this.offset.x));
        this.offset.y = Math.max(this.minOffset.y, Math.min(this.maxOffset.y, this.offset.y));
        if (this.drawTimeout) clearTimeout(this.drawTimeout);
        this.drawTimeout = setTimeout(() => this.draw(), 16);
    }
    handleTouchEnd(event) {
        if (this.touchStartNode &&
            Date.now() - this.touchStartTime < 300 &&
            Math.abs(event.changedTouches[0].clientX - (this.dragStartPosition.x + this.activeCanvas.getBoundingClientRect().left)) < 10 &&
            Math.abs(event.changedTouches[0].clientY - (this.dragStartPosition.y + this.activeCanvas.getBoundingClientRect().top)) < 10) {
            this.handleNodeClick(this.touchStartNode);
        }
        this.resetDragState();
        this.touchStartNode = null;
        this.hoveredNode = null;
        this.draw();
    }
    async handleNodeClick(node) {
        if (node.type === 'article') {
            const response = await fetch('/article/list');
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
    if (window.innerWidth < 1200) {
        console.log('文章网络图在移动设备上已禁用。');
        const networkContainer = document.getElementById('article-network-container');
        if (networkContainer) {
            networkContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-color-secondary);">关系网络图在移动端不可用。</p>';
        }
        return;
    }
    window.articleNetwork = new ArticleNetwork();
});