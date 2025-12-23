export function initPongGame() {
    if (window.innerWidth < 1200) {
        return;
    }
    const canvas = document.getElementById('pongGame');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const config = {
        paddleWidth: 8,
        paddleHeight: 80,
        ballSize: 6,
        speed: 5,
        paddleSpeed: 5,
        paddleSmoothing: 0.05,
        paddleMaxSpeed: 10,
        predictionThreshold: 300,
        trailLength: 10,
        trailFade: 0.8
    };
    let ball = {
        x: 0,
        y: 0,
        dx: config.speed,
        dy: config.speed
    };
    let ballTrail = [];
    let paddle = {
        left: 0,
        right: 0
    };
    let primaryColor;
    let isVisible = true;
    let animationId;
    function updatePrimaryColor() {
        primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    }
    const resolutionScale = 0.7;
    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * resolutionScale;
        canvas.height = height * resolutionScale;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        paddle.left = canvas.height / 2;
        paddle.right = canvas.height / 2;
        ballTrail = [];
        updatePrimaryColor();
    }
    function predictBallPosition(side) {
        let steps;
        if (side === 'left') {
            steps = (config.paddleWidth - ball.x) / ball.dx;
        } else {
            steps = (canvas.width - config.paddleWidth - ball.x) / ball.dx;
        }
        return ball.y + ball.dy * steps;
    }
    function updatePaddles() {
        let targetLeft = paddle.left;
        if (ball.dx < 0 && ball.x < config.predictionThreshold) {
            targetLeft = predictBallPosition('left');
        }
        let targetRight = paddle.right;
        if (ball.dx > 0 && (canvas.width - ball.x) < config.predictionThreshold) {
            targetRight = predictBallPosition('right');
        }
        let leftDelta = (targetLeft - paddle.left) * config.paddleSmoothing;
        let rightDelta = (targetRight - paddle.right) * config.paddleSmoothing;
        leftDelta = Math.max(-config.paddleMaxSpeed, Math.min(config.paddleMaxSpeed, leftDelta));
        rightDelta = Math.max(-config.paddleMaxSpeed, Math.min(config.paddleMaxSpeed, rightDelta));
        paddle.left += leftDelta;
        paddle.right += rightDelta;
        paddle.left = Math.max(config.paddleHeight / 2, Math.min(canvas.height - config.paddleHeight / 2, paddle.left));
        paddle.right = Math.max(config.paddleHeight / 2, Math.min(canvas.height - config.paddleHeight / 2, paddle.right));
    }
    function updateBall() {
        ballTrail.push({
            x: ball.x,
            y: ball.y,
            size: config.ballSize * resolutionScale,
            alpha: 1
        });
        if (ballTrail.length > config.trailLength) {
            ballTrail.shift();
        }
        for (let i = 0; i < ballTrail.length - 1; i++) {
            ballTrail[i].alpha *= config.trailFade;
            ballTrail[i].size *= 0.95;
        }
        ball.x += ball.dx;
        ball.y += ball.dy;
        if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;
        if (ball.x < config.paddleWidth &&
            ball.y > paddle.left - config.paddleHeight / 2 &&
            ball.y < paddle.left + config.paddleHeight / 2) {
            ball.dx *= -1;
        }
        if (ball.x > canvas.width - config.paddleWidth &&
            ball.y > paddle.right - config.paddleHeight / 2 &&
            ball.y < paddle.right + config.paddleHeight / 2) {
            ball.dx *= -1;
        }
        if (ball.x < 0 || ball.x > canvas.width) {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.dx = config.speed * (Math.random() > 0.5 ? 1 : -1);
            ball.dy = config.speed * (Math.random() > 0.5 ? 1 : -1);
            ballTrail = [];
        }
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `${primaryColor}80`;
        const pHeight = config.paddleHeight * resolutionScale;
        const pWidth = config.paddleWidth * resolutionScale;
        ctx.fillRect(0, paddle.left - pHeight / 2, pWidth, pHeight);
        ctx.fillRect(canvas.width - pWidth, paddle.right - pHeight / 2, pWidth, pHeight);
        for (let i = 0; i < ballTrail.length; i++) {
            const trail = ballTrail[i];
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${trail.alpha})`;
            ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.arc(ball.x, ball.y, config.ballSize * resolutionScale, 0, Math.PI * 2);
        ctx.fill();
    }
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    function gameLoop(timestamp) {
        if (!isVisible) return;
        if (timestamp - lastTime >= frameInterval) {
            lastTime = timestamp;
            updatePaddles();
            updateBall();
            draw();
        }
        animationId = requestAnimationFrame(gameLoop);
    }
    const observer = new MutationObserver(updatePrimaryColor);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
        if (isVisible) {
            lastTime = performance.now();
            gameLoop(lastTime);
        } else {
            cancelAnimationFrame(animationId);
        }
    });
    window.addEventListener('resize', resize);
    resize();
    gameLoop(0);
}