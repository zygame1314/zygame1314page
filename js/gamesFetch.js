function initGamesFetch() {
    const gamesListElem = document.querySelector('.games-list');
    const refreshButton = document.getElementById('refreshGames');

    function fetchPopularGames() {
        gamesListElem.innerHTML = '<p>加载中...</p>';

        AV.Cloud.run('fetchPopularGames')
            .then(data => {
                const filteredGames = data.results.filter(game => {
                    return game && Array.isArray(game.tags) && !game.tags.some(tag => tag && tag.slug === 'nsfw');
                });
                displayGames(filteredGames);
            })
            .catch(error => {
                console.error('无法获取游戏数据：', error);
                gamesListElem.innerHTML = "<p>游戏数据暂时不可用，请稍后再试。</p>";
            });
    }

    function displayGames(games) {
        gamesListElem.innerHTML = '';
        if (games.length === 0) {
            gamesListElem.innerHTML = '<p>本月暂无新游戏发售或无法获取游戏数据。</p>';
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
                gameImage.src = 'https://cdn.jsdmirror.com/gh/zygame1314/zygame1314page@1.1.1/images/default-game-cover.png';
                gameImage.classList.add('default-cover');
            }
            gameImage.alt = game.name || '未知游戏';
            gameImage.onerror = function () {
                this.src = 'https://cdn.jsdmirror.com/gh/zygame1314/zygame1314page@1.1.1/images/default-game-cover.png';
                this.classList.add('default-cover');
            };

            gameImage.addEventListener('click', function () {
                if (game.slug) {
                    window.open(`https://rawg.io/games/${game.slug}`, '_blank');
                }
            });

            const gameInfo = document.createElement('div');
            gameInfo.classList.add('game-info');

            const gameTitle = document.createElement('h3');
            gameTitle.textContent = game.name || '未知游戏';

            const gameRelease = document.createElement('p');
            gameRelease.textContent = `发行日期：${game.released || '未知'}`;

            gameInfo.appendChild(gameTitle);
            gameInfo.appendChild(gameRelease);

            gameItem.appendChild(gameImage);
            gameItem.appendChild(gameInfo);

            gamesListElem.appendChild(gameItem);
        });
    }

    fetchPopularGames();

    refreshButton.addEventListener('click', () => {
        fetchPopularGames();
    });

    function fetchRecentlyPlayedGames() {
        AV.Cloud.run('getRecentlyPlayedGames')
            .then(data => {
                displaySteamGames(data.response.games);
            })
            .catch(error => {
                console.error('无法获取最近的 Steam 游戏数据：', error);
                document.querySelector('.steam-games-list').innerHTML = "<p>无法加载最近的 Steam 游戏数据，请稍后再试。</p>";
            });
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
                this.src = 'images/default-game-cover.png';
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
