<<<<<<< HEAD
function initPongGame() {
    const canvas = document.getElementById('pongGame');
    const ctx = canvas.getContext('2d');

    const config = {
        paddleWidth: 8,
        paddleHeight: 80,
        ballSize: 6,
        speed: 2,
        paddleSpeed: 3,
        paddleSmoothing: 0.05,
        paddleMaxSpeed: 5
    };

    let ball = {
        x: 0,
        y: 0,
        dx: config.speed,
        dy: config.speed
    };

    let paddle = {
        left: 0,
        right: 0
    };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        paddle.left = canvas.height / 2;
        paddle.right = canvas.height / 2;
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
        if (ball.dx < 0) {
            targetLeft = predictBallPosition('left');
        }

        let targetRight = paddle.right;
        if (ball.dx > 0) {
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
        }
    }

    function draw() {
        ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        ctx.fillStyle = `${primaryColor}80`;
        ctx.fillRect(0, paddle.left - config.paddleHeight / 2, config.paddleWidth, config.paddleHeight);
        ctx.fillRect(canvas.width - config.paddleWidth, paddle.right - config.paddleHeight / 2, config.paddleWidth, config.paddleHeight);

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.arc(ball.x, ball.y, config.ballSize, 0, Math.PI * 2);
        ctx.fill();
    }

    function gameLoop() {
        updatePaddles();
        updateBall();
        draw();
        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', resize);
    resize();
    gameLoop();
=======
function initPongGame() {
    const canvas = document.getElementById('pongGame');
    const ctx = canvas.getContext('2d');

    const config = {
        paddleWidth: 8,
        paddleHeight: 80,
        ballSize: 6,
        speed: 2,
        paddleSpeed: 3,
        paddleSmoothing: 0.05,
        paddleMaxSpeed: 5
    };

    let ball = {
        x: 0,
        y: 0,
        dx: config.speed,
        dy: config.speed
    };

    let paddle = {
        left: 0,
        right: 0
    };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        paddle.left = canvas.height / 2;
        paddle.right = canvas.height / 2;
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
        if (ball.dx < 0) {
            targetLeft = predictBallPosition('left');
        }

        let targetRight = paddle.right;
        if (ball.dx > 0) {
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
        }
    }

    function draw() {
        ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        ctx.fillStyle = `${primaryColor}80`;
        ctx.fillRect(0, paddle.left - config.paddleHeight / 2, config.paddleWidth, config.paddleHeight);
        ctx.fillRect(canvas.width - config.paddleWidth, paddle.right - config.paddleHeight / 2, config.paddleWidth, config.paddleHeight);

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.arc(ball.x, ball.y, config.ballSize, 0, Math.PI * 2);
        ctx.fill();
    }

    function gameLoop() {
        updatePaddles();
        updateBall();
        draw();
        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', resize);
    resize();
    gameLoop();
>>>>>>> b029a527becedfc9927b8e11b6ce5e48017539d2
}