function initGamesFetch() {
    const gamesListElem = document.querySelector('.games-list');
    const refreshButton = document.getElementById('refreshGames');
    const API_BASE = 'https://zygame1314page.vercel.app/api';

    async function fetchPopularGames() {
        gamesListElem.innerHTML = '<p>加载中...</p>';

        try {
            const response = await fetch(`${API_BASE}/games/popular`);
            if (!response.ok) throw new Error('API请求失败');
            const data = await response.json();
            displayGames(data.results);
        } catch (error) {
            console.error('无法获取游戏数据：', error);
            gamesListElem.innerHTML = "<p>游戏数据暂时不可用，请稍后再试。</p>";
        }
    }

    function displayGames(games) {
        gamesListElem.innerHTML = '';
        if (!games || games.length === 0) {
            gamesListElem.innerHTML = '<p>暂无热门游戏数据。</p>';
            return;
        }

        games.forEach(game => {
            if (!game) return;

            const gameItem = document.createElement('div');
            gameItem.classList.add('game-item');

            const gameImage = document.createElement('img');
            if (game.background_image) {
                gameImage.src = game.background_image;
            } else {
                gameImage.src = '../images/default-game-cover.png';
                gameImage.classList.add('default-cover');
            }
            gameImage.alt = game.name || '未知游戏';
            gameImage.onerror = function () {
                this.src = '../images/default-game-cover.png';
                this.classList.add('default-cover');
            };

            gameImage.addEventListener('click', function () {
                window.open(`https://store.steampowered.com/app/${game.id}`, '_blank');
            });

            const gameInfo = document.createElement('div');
            gameInfo.classList.add('game-info');

            const gameTitle = document.createElement('h3');
            gameTitle.textContent = game.name || '未知游戏';

            const priceInfo = document.createElement('p');
            if (game.discounted) {
                const originalPrice = (game.original_price / 100).toFixed(2);
                const finalPrice = (game.final_price / 100).toFixed(2);
                priceInfo.innerHTML = `
                    <span class="original-price">¥${originalPrice}</span>
                    <span class="discount">-${game.discount_percent}%</span>
                    <span class="final-price">¥${finalPrice}</span>
                `;
            } else {
                const price = (game.original_price / 100).toFixed(2);
                priceInfo.textContent = `¥${price}`;
            }

            const platformInfo = document.createElement('p');
            const platforms = [];
            if (game.windows_available) platforms.push('Windows');
            if (game.mac_available) platforms.push('Mac');
            if (game.linux_available) platforms.push('Linux');
            platformInfo.textContent = `支持平台: ${platforms.join(', ')}`;

            if (game.controller_support) {
                const controllerInfo = document.createElement('p');
                controllerInfo.textContent = `支持手柄: ${game.controller_support === 'full' ? '完全支持' : '部分支持'}`;
                gameInfo.appendChild(controllerInfo);
            }

            gameInfo.appendChild(gameTitle);
            gameInfo.appendChild(priceInfo);
            gameInfo.appendChild(platformInfo);

            gameItem.appendChild(gameImage);
            gameItem.appendChild(gameInfo);

            gamesListElem.appendChild(gameItem);
        });
    }

    fetchPopularGames();

    refreshButton.addEventListener('click', () => {
        showNotification('热门游戏已刷新', 5, 'warning');
        fetchPopularGames();
    });

    async function fetchRecentlyPlayedGames() {
        try {
            const response = await fetch(`${API_BASE}/games/recent-games`);
            if (!response.ok) throw new Error('Steam API请求失败');
            const data = await response.json();
            displaySteamGames(data.response.games);
        } catch (error) {
            console.error('无法获取最近的 Steam 游戏数据：', error);
            document.querySelector('.steam-games-list').innerHTML =
                "<p>无法加载最近的 Steam 游戏数据，请稍后再试。</p>";
        }
    }

    function displaySteamGames(games) {
        const steamGamesListElem = document.querySelector('.steam-games-list');
        steamGamesListElem.innerHTML = '';

        if (!games || games.length === 0) {
            steamGamesListElem.innerHTML = '<p>最近没有可展示的游戏</p>';
            return;
        }

        games.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.classList.add('game-item');

            const gameImage = document.createElement('img');
            gameImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
            gameImage.alt = game.name || '未知游戏';
            gameImage.onerror = function () {
                this.src = '../images/default-game-cover.png';
                this.classList.add('default-cover');
            };
            gameImage.style.imageRendering = 'crisp-edges';

            gameImage.addEventListener('click', function () {
                window.open(`https://store.steampowered.com/app/${game.appid}`, '_blank');
            });

            gameItem.appendChild(gameImage);
            steamGamesListElem.appendChild(gameItem);
        });
    }

    fetchRecentlyPlayedGames();
}