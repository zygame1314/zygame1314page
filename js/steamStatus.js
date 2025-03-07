function initSteamStatus() {
    const API_BASE = 'https://zygame1314.site';
    const STEAM_STATUS = {
        OFFLINE: 0,
        ONLINE: 1,
        BUSY: 2,
        AWAY: 3,
        SNOOZE: 4,
        TRADING: 5,
        LOOKING_TO_PLAY: 6
    };

    let updateInterval = null;
    let userLastActive = Date.now();
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

    function isUserActive() {
        return Date.now() - userLastActive < INACTIVITY_TIMEOUT;
    }

    function updateUserActivity() {
        userLastActive = Date.now();

        if (!updateInterval) {
            startUpdates();
        }
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            stopUpdates();
        } else {
            updateUserActivity();
            startUpdates();
        }
    }

    function startUpdates() {
        if (!updateInterval) {
            updateSteamStatus();
            updateInterval = setInterval(() => {
                if (!document.hidden && isUserActive()) {
                    updateSteamStatus();
                } else {
                    stopUpdates();
                }
            }, 60 * 1000);
            console.log("Steam状态更新已启动");
        }
    }

    function stopUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
            console.log("Steam状态更新已暂停");
        }
    }

    async function updateSteamStatus() {
        try {
            const response = await fetch(`${API_BASE}/games/steam-status`);
            const data = await response.json();
            const player = data.response.players[0];

            const statusWidget = document.querySelector('.steam-status-widget');
            const avatar = statusWidget.querySelector('.steam-avatar');
            const username = statusWidget.querySelector('.steam-username');
            const status = statusWidget.querySelector('.steam-status');

            avatar.src = player.avatarfull;
            username.textContent = player.personaname;

            let statusText = '';
            let statusClass = '';

            if (player.gameextrainfo) {
                if (player.personastate === STEAM_STATUS.SNOOZE) {
                    statusText = '挂机中';
                    statusClass = 'in-game-away';
                } else {
                    statusText = '正在游戏';
                    statusClass = 'in-game';
                }
            } else {
                switch (player.personastate) {
                    case STEAM_STATUS.OFFLINE:
                        statusText = '离线';
                        statusClass = 'offline';
                        break;
                    case STEAM_STATUS.ONLINE:
                        statusText = '在线';
                        statusClass = 'online';
                        break;
                    case STEAM_STATUS.BUSY:
                        statusText = '忙碌';
                        statusClass = 'busy';
                        break;
                    case STEAM_STATUS.AWAY:
                        statusText = '离开';
                        statusClass = 'away';
                        break;
                    case STEAM_STATUS.SNOOZE:
                        statusText = '打盹';
                        statusClass = 'snooze';
                        break;
                    case STEAM_STATUS.TRADING:
                        statusText = '想要交易';
                        statusClass = 'trading';
                        break;
                    case STEAM_STATUS.LOOKING_TO_PLAY:
                        statusText = '想要玩游戏';
                        statusClass = 'looking-to-play';
                        break;
                    default:
                        statusText = '在线';
                        statusClass = 'online';
                }
            }

            status.textContent = statusText;
            status.className = `steam-status ${statusClass}`;
            statusWidget.className = `steam-status-widget ${statusClass}`;

            const gameInfoElement = statusWidget.querySelector('.steam-game-info') ||
                document.createElement('div');
            gameInfoElement.className = 'steam-game-info';

            if (player.gameextrainfo && player.gameid) {
                gameInfoElement.innerHTML = `正在游玩: ${player.gameextrainfo}`;

                if (!statusWidget.contains(gameInfoElement)) {
                    statusWidget.appendChild(gameInfoElement);
                }
            } else {
                gameInfoElement.remove();
            }

            statusWidget.addEventListener("mouseenter", function () {
                let message = '';
                if (player.gameextrainfo) {
                    if (player.personastate === STEAM_STATUS.AWAY) {
                        message = `主人在挂机呢，可能临时离开了~`;
                    } else {
                        message = `主人正在玩${player.gameextrainfo}呢！`;
                    }
                } else {
                    switch (player.personastate) {
                        case STEAM_STATUS.OFFLINE:
                            message = `主人现在不在线呢，也许有其他事要做吧~`;
                            break;
                        case STEAM_STATUS.ONLINE:
                            message = `看来主人在线上呢，要去聊聊吗？`;
                            break;
                        case STEAM_STATUS.BUSY:
                            message = `主人现在很忙呢，先不要打扰他了~`;
                            break;
                        case STEAM_STATUS.AWAY:
                            message = `主人暂时离开了，等会再来看看吧~`;
                            break;
                        case STEAM_STATUS.SNOOZE:
                            message = `主人正在打盹呢，不要吵醒他哦~`;
                            break;
                        case STEAM_STATUS.TRADING:
                            message = `主人想要交易哦，有好东西要给他吗？`;
                            break;
                        case STEAM_STATUS.LOOKING_TO_PLAY:
                            message = `主人在寻找玩伴呢，要一起玩游戏吗？`;
                            break;
                    }
                }
                showLive2dNotification(message, 3000);
            });

        } catch (error) {
            console.error('Steam状态更新失败:', error);
            showNotification('Steam状态更新失败', 5, 'error');
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(eventName => {
        document.addEventListener(eventName, updateUserActivity);
    });

    startUpdates();
}

document.addEventListener('DOMContentLoaded', initSteamStatus);