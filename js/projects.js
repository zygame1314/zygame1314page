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

        if (project.type === 'tetris') {
            card.innerHTML = `
                <h3>${project.title}</h3>
                <canvas id="tetris-canvas"></canvas>
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

        if (document.getElementById('tetris-canvas')) {
            initTetris();
        }

        initPagination();
    }

    function initTetris() {
        const canvas = document.getElementById('tetris-canvas');
        const context = canvas.getContext('2d');
        let blockWidth, blockHeight;

        function resizeCanvas() {
            canvas.height = canvas.width * 2;
            blockWidth = canvas.width / 10;
            blockHeight = canvas.height / 20;
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const grid = createMatrix(10, 20);

        const shapes = {
            I: [[1, 1, 1, 1]],
            J: [
                [0, 1],
                [0, 1],
                [1, 1]
            ],
            L: [
                [1, 0],
                [1, 0],
                [1, 1]
            ],
            O: [
                [1, 1],
                [1, 1]
            ],
            S: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            T: [
                [1, 1, 1],
                [0, 1, 0]
            ],
            Z: [
                [1, 1, 0],
                [0, 1, 1]
            ]
        };

        const player = {
            pos: { x: 0, y: 0 },
            matrix: null
        };

        let dropCounter = 0;
        let dropInterval = 100;
        let lastTime = 0;

        function createMatrix(w, h) {
            const matrix = [];
            while (h--) {
                matrix.push(new Array(w).fill(0));
            }
            return matrix;
        }

        function createPiece() {
            const types = 'TJLOSZI';
            const type = types[(types.length * Math.random()) | 0];
            return shapes[type];
        }

        function collide(grid, player) {
            const m = player.matrix;
            const o = player.pos;
            for (let y = 0; y < m.length; ++y) {
                for (let x = 0; x < m[y].length; ++x) {
                    if (
                        m[y][x] !== 0 &&
                        (grid[y + o.y] && grid[y + o.y][x + o.x]) !== 0
                    ) {
                        return true;
                    }
                }
            }
            return false;
        }

        function merge(grid, player) {
            player.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        grid[y + player.pos.y][x + player.pos.x] = value;
                    }
                });
            });
        }

        function gridSweep() {
            outer: for (let y = grid.length - 1; y >= 0; --y) {
                for (let x = 0; x < grid[y].length; ++x) {
                    if (grid[y][x] === 0) {
                        continue outer;
                    }
                }
                const row = grid.splice(y, 1)[0].fill(0);
                grid.unshift(row);
                ++y;
            }
        }

        function rotate(matrix) {
            const result = [];
            for (let y = 0; y < matrix[0].length; y++) {
                result[y] = [];
                for (let x = 0; x < matrix.length; x++) {
                    result[y][x] = matrix[matrix.length - 1 - x][y];
                }
            }
            return result;
        }

        function rotateMatrix(matrix, times) {
            let result = matrix;
            for (let i = 0; i < times; i++) {
                result = rotate(result);
            }
            return result;
        }

        function getDropPosition(matrix, x, grid) {
            let y = 0;
            const player = { pos: { x, y }, matrix };
            while (!collide(grid, player)) {
                player.pos.y++;
            }
            player.pos.y--;
            return player.pos.y;
        }

        function simulateMerge(grid, matrix, pos) {
            const newGrid = grid.map(row => row.slice());

            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        newGrid[y + pos.y][x + pos.x] = value;
                    }
                });
            });

            const result = gridSweepSim(newGrid);

            return result;
        }

        function gridSweepSim(grid) {
            let linesCleared = 0;
            let newGrid = grid.map(row => row.slice());
            outer: for (let y = newGrid.length - 1; y >= 0; --y) {
                for (let x = 0; x < newGrid[y].length; ++x) {
                    if (newGrid[y][x] === 0) {
                        continue outer;
                    }
                }
                newGrid.splice(y, 1);
                newGrid.unshift(new Array(newGrid[0].length).fill(0));
                linesCleared++;
                y++;
            }
            return { grid: newGrid, linesCleared };
        }

        function countHoles(grid) {
            let holes = 0;
            const cols = grid[0].length;
            const rows = grid.length;
            for (let x = 0; x < cols; x++) {
                let blockFound = false;
                for (let y = 0; y < rows; y++) {
                    if (grid[y][x] !== 0) {
                        blockFound = true;
                    } else if (blockFound && grid[y][x] === 0) {
                        holes++;
                    }
                }
            }
            return holes;
        }

        function getAggregateHeight(grid) {
            let aggregateHeight = 0;
            const cols = grid[0].length;
            const rows = grid.length;
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    if (grid[y][x] !== 0) {
                        aggregateHeight += (rows - y);
                        break;
                    }
                }
            }
            return aggregateHeight;
        }

        function evaluateGrid(gridInfo) {
            const { grid, linesCleared } = gridInfo;

            let score = 0;

            const lineClearWeight = 760;
            const holeWeight = 1000;
            const aggregateHeightWeight = 50;
            const maxHeightWeight = 500;
            const rowTransitionsWeight = 20;
            const columnTransitionsWeight = 20;
            const totalWellsWeight = 50;

            score += linesCleared * lineClearWeight;

            const holes = countHoles(grid);
            score -= holes * holeWeight;

            const aggregateHeight = getAggregateHeight(grid);
            score -= aggregateHeight * aggregateHeightWeight;

            const maxHeight = getMaxHeight(grid);
            score -= maxHeight * maxHeightWeight;

            const rowTransitions = getRowTransitions(grid);
            score -= rowTransitions * rowTransitionsWeight;

            const columnTransitions = getColumnTransitions(grid);
            score -= columnTransitions * columnTransitionsWeight;

            const totalWells = getTotalWells(grid);
            score -= totalWells * totalWellsWeight;

            return score;
        }

        function getMaxHeight(grid) {
            const cols = grid[0].length;
            const rows = grid.length;
            let maxHeight = 0;

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    if (grid[y][x] !== 0) {
                        let height = rows - y;
                        if (height > maxHeight) {
                            maxHeight = height;
                        }
                        break;
                    }
                }
            }
            return maxHeight;
        }

        function getRowTransitions(grid) {
            let transitions = 0;
            const cols = grid[0].length;
            const rows = grid.length;

            for (let y = 0; y < rows; y++) {
                let prevCell = 1;
                for (let x = 0; x < cols; x++) {
                    let cell = grid[y][x] === 0 ? 0 : 1;
                    if (cell !== prevCell) {
                        transitions++;
                    }
                    prevCell = cell;
                }
                if (prevCell === 0) {
                    transitions++;
                }
            }
            return transitions;
        }

        function getColumnTransitions(grid) {
            let transitions = 0;
            const cols = grid[0].length;
            const rows = grid.length;

            for (let x = 0; x < cols; x++) {
                let prevCell = 1;
                for (let y = 0; y < rows; y++) {
                    let cell = grid[y][x] === 0 ? 0 : 1;
                    if (cell !== prevCell) {
                        transitions++;
                    }
                    prevCell = cell;
                }
            }
            return transitions;
        }

        function getTotalWells(grid) {
            let totalWells = 0;
            const cols = grid[0].length;
            const rows = grid.length;

            for (let x = 0; x < cols; x++) {
                let wellDepth = 0;
                for (let y = 0; y < rows; y++) {
                    if (grid[y][x] === 0 &&
                        (x === 0 || grid[y][x - 1] !== 0) &&
                        (x === cols - 1 || grid[y][x + 1] !== 0)) {
                        wellDepth++;
                    } else {
                        if (wellDepth > 0) {
                            totalWells += (wellDepth * (wellDepth + 1)) / 2;
                            wellDepth = 0;
                        }
                    }
                }
                if (wellDepth > 0) {
                    totalWells += (wellDepth * (wellDepth + 1)) / 2;
                }
            }
            return totalWells;
        }

        function findBestPlacement(matrix, grid) {
            let bestScore = -Infinity;
            let bestX = 0;
            let bestRotation = 0;
            let validMoveFound = false;

            for (let r = 0; r < 4; r++) {
                const rotatedMatrix = rotateMatrix(matrix, r);
                const maxPosX = grid[0].length - rotatedMatrix[0].length;

                for (let x = 0; x <= maxPosX; x++) {
                    const y = getDropPosition(rotatedMatrix, x, grid);
                    if (y < 0) continue;

                    validMoveFound = true;

                    const simulationResult = simulateMerge(grid, rotatedMatrix, { x, y });
                    const score = evaluateGrid(simulationResult);

                    if (score > bestScore) {
                        bestScore = score;
                        bestX = x;
                        bestRotation = r;
                    }
                }
            }

            if (!validMoveFound) {
                return null;
            }

            return { bestX, bestRotation };
        }

        function playerReset() {
            player.matrix = createPiece();
            player.pos.y = 0;

            const placement = findBestPlacement(player.matrix, grid);

            if (placement === null) {
                grid.forEach(row => row.fill(0));
                return;
            }

            const { bestX, bestRotation } = placement;

            player.matrix = rotateMatrix(player.matrix, bestRotation);

            player.pos.x = bestX;

            if (collide(grid, player)) {
                grid.forEach(row => row.fill(0));
            }
        }

        function playerDrop() {
            player.pos.y++;
            if (collide(grid, player)) {
                player.pos.y--;
                merge(grid, player);
                playerReset();
                gridSweep();
            }
            dropCounter = 0;
        }

        function update(time = 0) {
            const deltaTime = time - lastTime;
            lastTime = time;

            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }

            draw();
            requestAnimationFrame(update);
        }

        function draw() {
            context.fillStyle = '#000';
            context.fillRect(0, 0, canvas.width, canvas.height);

            drawMatrix(grid, { x: 0, y: 0 });
            drawMatrix(player.matrix, player.pos);
        }

        function drawMatrix(matrix, offset) {
            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        context.fillStyle = '#FFCC00';
                        context.fillRect(
                            (x + offset.x) * blockWidth,
                            (y + offset.y) * blockHeight,
                            blockWidth,
                            blockHeight
                        );
                        context.strokeStyle = '#000';
                        context.strokeRect(
                            (x + offset.x) * blockWidth,
                            (y + offset.y) * blockHeight,
                            blockWidth,
                            blockHeight
                        );
                    }
                });
            });
        }

        playerReset();
        update();
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
