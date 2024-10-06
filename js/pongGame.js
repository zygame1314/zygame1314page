function initPongGame() {
    var canvas = document.getElementById('pongGame');
    var context = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    var paddleWidth = 10;
    var paddleHeight = 100;
    var ballRadius = 8;

    var leftPaddleY = (canvas.height - paddleHeight) / 2;
    var rightPaddleY = (canvas.height - paddleHeight) / 2;

    var ballX = canvas.width / 2;
    var ballY = canvas.height / 2;
    var ballSpeedX = 1.5;
    var ballSpeedY = 1.5;

    document.addEventListener('mousemove', function (e) {
        var mouseY = e.clientY;

        leftPaddleY = mouseY - paddleHeight / 2;
        rightPaddleY = mouseY - paddleHeight / 2;

        clampPaddlePosition();
    });

    document.addEventListener('touchmove', function (e) {
        var touch = e.touches[0];
        var touchY = touch.clientY;

        leftPaddleY = touchY - paddleHeight / 2;
        rightPaddleY = touchY - paddleHeight / 2;

        clampPaddlePosition();
    });

    function clampPaddlePosition() {
        if (leftPaddleY < 0) {
            leftPaddleY = 0;
            rightPaddleY = 0;
        }
        if (leftPaddleY + paddleHeight > canvas.height) {
            leftPaddleY = canvas.height - paddleHeight;
            rightPaddleY = canvas.height - paddleHeight;
        }
    }

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        context.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        context.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

        context.beginPath();
        context.arc(ballX, ballY, ballRadius, 0, Math.PI * 2, true);
        context.fill();

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballY < ballRadius || ballY > canvas.height - ballRadius) {
            ballSpeedY = -ballSpeedY;
        }

        if (ballX - ballRadius < paddleWidth) {
            if (ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
                ballSpeedX = -ballSpeedX;
            } else {
                resetBall();
            }
        }

        if (ballX + ballRadius > canvas.width - paddleWidth) {
            if (ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
                ballSpeedX = -ballSpeedX;
            } else {
                resetBall();
            }
        }

        requestAnimationFrame(draw);
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
        ballSpeedY = 3;
    }

    draw();
}
