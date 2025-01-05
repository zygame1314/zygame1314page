async function updateSteamStatus() {
    try {
        const response = await fetch('/games/status');
        const data = await response.json();
        const player = data.response.players[0];

        const statusWidget = document.querySelector('.steam-status-widget');
        const avatar = statusWidget.querySelector('.steam-avatar');
        const username = statusWidget.querySelector('.steam-username');
        const status = statusWidget.querySelector('.steam-status');

        avatar.src = player.avatarmedium;
        username.textContent = player.personaname;

        const statusMap = {
            0: ['离线', 'offline'],
            1: ['在线', 'online'],
            2: ['忙碌', 'online'],
            3: ['离开', 'offline'],
            4: ['打盹', 'offline'],
            5: ['正在交易', 'online'],
            6: ['正在游戏', 'in-game']
        };

        const [statusText, statusClass] = statusMap[player.personastate] || ['未知', ''];
        status.textContent = statusText;
        status.className = `steam-status ${statusClass}`;

    } catch (error) {
        console.error('Failed to update Steam status:', error);
    }
}

updateSteamStatus();