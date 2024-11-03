function showNotification(message, duration, type) {
    const container = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.classList.add('notification');

    if (type) {
        notification.classList.add(type);
    }

    const closeButton = document.createElement('span');
    closeButton.classList.add('notification-close-button');
    closeButton.innerHTML = '&times;';
    notification.appendChild(closeButton);

    const messageElement = document.createElement('p');
    messageElement.innerHTML = message;
    messageElement.classList.add('notification-content');
    notification.appendChild(messageElement);

    closeButton.addEventListener('click', () => {
        closeNotification(notification);
    });

    if (duration) {
        const pacmanProgress = document.createElement('div');
        pacmanProgress.classList.add('pacman-progress');

        const pacman = document.createElement('div');
        pacman.classList.add('pacman', 'pacman-mouth');
        pacman.style.animation = `pacman-move ${duration}s linear forwards, pacman-chomp 0.3s infinite`;

        const dotCount = 20;
        const pacmanSpeed = duration * 1000;

        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');

            const dotPosition = (i / dotCount) * 100;
            dot.style.left = `${dotPosition}%`;

            const dotTime = (dotPosition / 100) * pacmanSpeed;

            dot.style.animation = `dot-disappear 0.1s forwards`;
            dot.style.animationDelay = `${dotTime}ms`;

            pacmanProgress.appendChild(dot);
        }

        pacmanProgress.appendChild(pacman);
        notification.appendChild(pacmanProgress);

        setTimeout(() => {
            closeNotification(notification);
        }, duration * 1000);
    }

    container.appendChild(notification);

    notification.addEventListener('animationend', (event) => {
        if (event.animationName === 'notification-close') {
            notification.remove();
        }
    });
}

function closeNotification(notification) {
    notification.classList.add('exit');
}
