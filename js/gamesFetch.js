function initGamesFetch() {
    const gamesListElem = document.querySelector('.games-list');
    const refreshButton = document.getElementById('refreshGames');
    const API_BASE = 'https://api.zygame1314.site';

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
                gameImage.setAttribute('data-src', game.background_image);
                gameImage.classList.add('fixed-ratio');
            } else {
                gameImage.setAttribute('data-src', '/images/default-game-cover.webp');
                gameImage.classList.add('default-cover');
            }
            gameImage.alt = game.name || '未知游戏';

            gameImage.onerror = function () {
                if (this.getAttribute('data-src') === '/images/default-game-cover.webp') {
                    this.classList.add('default-cover');
                    return;
                }

                console.log(`图片加载失败，切换到默认封面: ${this.getAttribute('data-src')}`);
                this.setAttribute('data-src', '/images/default-game-cover.webp');
                this.classList.add('default-cover');

                const newSrc = this.getAttribute('data-src');
                const tempImg = new Image();
                tempImg.onload = () => {
                    this.src = newSrc;
                    this.classList.remove('lazy-placeholder');
                    this.classList.remove('lazy-error');
                    this.classList.add('lazy-loaded');
                };
                tempImg.onerror = () => {
                    console.error(`默认图片也加载失败: ${newSrc}`);
                    this.classList.remove('lazy-placeholder');
                    this.classList.add('lazy-error');
                };
                tempImg.src = newSrc;
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

            gameItem.addEventListener("mouseenter", function () {
                let message = '';
                const price = game.final_price / 100;

                if (price === 0) {
                    message = `${game.name}是免费游戏哦！快来玩玩看吧~`;
                } else if (game.discounted) {
                    const discount = game.discount_percent;
                    if (discount === 100) {
                        message = `太好了！${game.name}现在免费送！赶快领取吧！`;
                    } else if (discount >= 75) {
                        message = `哇！${game.name}居然打${discount}%的折扣！这也太划算了吧！`;
                    } else if (discount >= 50) {
                        message = `${game.name}现在半价呢，要不要考虑下？`;
                    } else {
                        message = `${game.name}打折了呢，优惠${discount}%，感兴趣吗？`;
                    }
                } else {
                    if (price <= 30) {
                        message = `${game.name}这么便宜！很适合体验一下呢~`;
                    } else if (price <= 100) {
                        message = `${game.name}价格适中，可以试试哦！`;
                    } else if (price <= 200) {
                        message = `${game.name}不便宜呢，不过品质应该有保证吧（大概）~`;
                    } else {
                        message = `${game.name}...好贵的样子，但可能是超级大作！`;
                    }
                }

                if (game.controller_support) {
                    message += ' 还支持手柄游玩呢！';
                }

                showLive2dNotification(message);
            });

            gameInfo.appendChild(gameTitle);
            gameInfo.appendChild(priceInfo);
            gameInfo.appendChild(platformInfo);

            gameItem.appendChild(gameImage);
            gameItem.appendChild(gameInfo);

            gamesListElem.appendChild(gameItem);
        });

        if (window.reinitializeLazyLoad) window.reinitializeLazyLoad();
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
            gameImage.setAttribute('data-src', `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900_schinese.jpg`);
            gameImage.alt = game.name || '未知游戏';

            gameImage.dataset.width = 600;
            gameImage.dataset.height = 900;

            gameImage.dataset.appid = game.appid;

            const customErrorHandler = function () {
                const appid = this.dataset.appid;
                const currentSrc = this.getAttribute('data-src');
                console.log(`Steam 图片加载失败: ${currentSrc}`);

                if (currentSrc.includes('library_600x900_schinese.jpg')) {
                    const newSrc = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
                    console.log(`尝试加载英文版封面: ${newSrc}`);
                    this.setAttribute('data-src', newSrc);

                    if (window.reloadLazyImage) {
                        window.reloadLazyImage(this);
                    }
                }
                else if (currentSrc.includes('library_600x900.jpg')) {
                    const defaultSrc = '/images/default-game-cover.webp';
                    console.log(`英文版封面加载失败，使用默认封面`);
                    this.setAttribute('data-src', defaultSrc);
                    this.classList.add('default-cover');

                    if (window.reloadLazyImage) {
                        window.reloadLazyImage(this);
                    }
                }
                else if (currentSrc === '/images/default-game-cover.webp') {
                    console.error(`默认图片加载失败`);
                    this.classList.remove('lazy-placeholder');
                    this.classList.add('lazy-error');
                }
            };

            if (window.saveLazyLoadErrorHandler) {
                window.saveLazyLoadErrorHandler(gameImage, customErrorHandler);
            }

            gameImage.style.imageRendering = 'crisp-edges';

            gameImage.addEventListener('click', function () {
                window.open(`https://store.steampowered.com/app/${game.appid}`, '_blank');
            });

            gameItem.dataset.playtime = game.playtime_2weeks || 0;
            gameItem.dataset.gameName = game.name;

            if (game.playtime_2weeks > 0) {
                gameItem.classList.add('recently-played');
            }

            gameItem.addEventListener("mouseenter", function () {
                const gameName = this.dataset.gameName;
                const playtime = parseInt(this.dataset.playtime || 0);

                let message = '';
                if (playtime === 0) {
                    message = `诶~${gameName}都快长草了，主人是不是把它遗忘在角落了？`;
                } else if (playtime < 60) {
                    message = `最近就玩了${playtime}分钟的${gameName}？看来主人最近很忙呢~`;
                } else if (playtime < 600) {
                    const hours = Math.floor(playtime / 60);
                    message = `${gameName}最近玩了${hours}小时呢，主人似乎挺投入的嘛！`;
                } else {
                    const hours = Math.floor(playtime / 60);
                    message = `${gameName}最近已经玩了${hours}小时了！看得出来主人真的很喜欢这个游戏呢~`;
                }

                showLive2dNotification(message);
            });

            gameItem.appendChild(gameImage);
            steamGamesListElem.appendChild(gameItem);
        });

        if (window.reinitializeLazyLoad) window.reinitializeLazyLoad();
    }

    fetchRecentlyPlayedGames();
}