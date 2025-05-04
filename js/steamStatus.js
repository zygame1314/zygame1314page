function initSteamStatus() {
    let updateInterval = null;
    let userLastActive = Date.now();
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
    const UPDATE_INTERVAL = 1 * 60 * 1000;
    function isUserActive() {
        return Date.now() - userLastActive < INACTIVITY_TIMEOUT;
    }
    function updateUserActivity() {
        userLastActive = Date.now();
        if (!updateInterval && !document.hidden) {
            startUpdates();
        }
    }
    function handleVisibilityChange() {
        if (document.hidden) {
            stopUpdates();
            console.log("页面不可见，暂停 Steam 状态更新");
        } else {
            updateUserActivity();
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
                    console.log("用户不活跃或页面不可见，暂停 Steam 状态更新");
                }
            }, UPDATE_INTERVAL);
            console.log(`Steam 状态更新已启动，更新间隔为 ${UPDATE_INTERVAL / 1000} 秒`);
        }
    }
    function stopUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
            console.log("Steam 状态更新已停止");
        }
    }
    async function updateSteamStatus() {
        console.log("正在更新 Steam 状态...");
        try {
            const response = await fetch(`${API_BASE}/games/steam-status`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '无法解析错误响应' }));
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.message || '未知错误'}`);
            }
            const data = await response.json();
            if (!data.success || !data.player) {
                throw new Error(`API 返回无效数据: ${data.message || '玩家数据未找到'}`);
            }
            const player = data.player;
            const statusWidget = document.querySelector('.steam-status-widget');
            if (!statusWidget) {
                console.error("未找到 .steam-status-widget 元素");
                stopUpdates();
                return;
            }
            const avatar = statusWidget.querySelector('.steam-avatar');
            const userInfo = statusWidget.querySelector('.steam-user-info');
            const username = statusWidget.querySelector('.steam-username');
            const status = statusWidget.querySelector('.steam-status');
            const levelElement = statusWidget.querySelector('.steam-level-num');
            const badgeElement = statusWidget.querySelector('.steam-featured-badge');
            const badgeIcon = statusWidget.querySelector('.steam-badge-icon');
            const badgeName = statusWidget.querySelector('.steam-badge-name');
            const badgeXp = statusWidget.querySelector('.steam-badge-xp');
            const backgroundVideo = statusWidget.querySelector('.steam-background-video');
            if (avatar && userInfo) {
                const avatarLink = userInfo.querySelector('a[href*="steamcommunity.com/profiles"]');
                if (!avatarLink) {
                    console.error("未找到 Steam 头像的链接元素 a");
                    return;
                }

                let avatarContainer = avatarLink.querySelector('.steam-avatar-container');
                if (!avatarContainer) {
                    avatarContainer = document.createElement('div');
                    avatarContainer.className = 'steam-avatar-container';
                    avatarLink.appendChild(avatarContainer);
                }

                if (avatar.parentNode !== avatarContainer) {
                    avatarContainer.appendChild(avatar);
                }
                if (avatarContainer.parentNode !== avatarLink) {
                    avatarLink.appendChild(avatarContainer);
                }
                const directAvatarInLink = avatarLink.querySelector(':scope > img.steam-avatar');
                if (directAvatarInLink) {
                    directAvatarInLink.remove();
                }


                if (player.avatarfull && avatar.getAttribute('data-src') !== player.avatarfull) {
                    avatar.setAttribute('data-src', player.avatarfull);
                    avatar.classList.remove('lazy-initialized', 'lazy-loaded', 'lazy-error');
                    avatar.classList.add('lazy-placeholder');
                    avatar.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
                    if (window.reinitializeLazyLoad) {
                        window.reinitializeLazyLoad([avatar]);
                    }
                }

                let avatarFrame = avatarContainer.querySelector('.steam-avatar-frame');
                const currentFrameUrl = avatarFrame ? avatarFrame.dataset.actualSrc : null;

                if (player.avatar_frame_url) {
                    if (!avatarFrame) {
                        avatarFrame = document.createElement('img');
                        avatarFrame.className = 'steam-avatar-frame';
                        avatarFrame.alt = 'Avatar Frame';
                        avatarFrame.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
                        avatarContainer.insertBefore(avatarFrame, avatar);
                    }

                    if (currentFrameUrl !== player.avatar_frame_url) {
                        avatarFrame.classList.remove('loaded');
                        avatarFrame.dataset.actualSrc = player.avatar_frame_url;

                        const imgLoader = new Image();
                        imgLoader.onload = () => {
                            if (avatarFrame.dataset.actualSrc === player.avatar_frame_url) {
                                avatarFrame.src = player.avatar_frame_url;
                                avatarFrame.classList.add('loaded');
                                console.log("Avatar frame loaded:", player.avatar_frame_url);
                            }
                        };
                        imgLoader.onerror = () => {
                            console.error("Failed to load avatar frame:", player.avatar_frame_url);
                            if (avatarFrame.dataset.actualSrc === player.avatar_frame_url) {
                                avatarFrame.style.display = 'none';
                            }
                        };
                        imgLoader.src = player.avatar_frame_url;
                    }
                    avatarFrame.style.display = '';

                } else if (avatarFrame) {
                    avatarFrame.remove();
                }
            }
            if (username && player.personaname) {
                username.textContent = player.personaname;
            }
            let statusText = '未知';
            let statusClass = 'offline';
            const rawStatus = player.personastate_css_class || 'offline';
            if (rawStatus === 'in-game' || player.game_name) {
                statusClass = 'in-game';
                statusText = player.game_state || '游戏中';
            } else if (rawStatus === 'online') {
                statusClass = 'online';
                statusText = '在线';
            } else {
                statusClass = 'offline';
                statusText = '离线';
            }
            const userDetails = statusWidget.querySelector('.steam-user-details');
            let statusLevelRow = userDetails ? userDetails.querySelector('.steam-status-level-row') : null;

            if (userDetails && !statusLevelRow) {
                statusLevelRow = document.createElement('div');
                statusLevelRow.className = 'steam-status-level-row';
                const usernameElement = userDetails.querySelector('.steam-username');
                if (usernameElement && usernameElement.nextSibling) {
                    userDetails.insertBefore(statusLevelRow, usernameElement.nextSibling);
                } else if (usernameElement) {
                    userDetails.appendChild(statusLevelRow);
                }
                else {
                    userDetails.appendChild(statusLevelRow);
                }
            }

            if (status) {
                status.textContent = statusText;
                status.className = `steam-status ${statusClass}`;
                if (statusLevelRow && status.parentNode !== statusLevelRow) {
                    statusLevelRow.appendChild(status);
                }
            }

            statusWidget.className = `steam-status-widget ${statusClass}`;
            const gameInfoElement = statusWidget.querySelector('.steam-game-info') || document.createElement('div');
            gameInfoElement.className = 'steam-game-info';
            if (player.game_name) {
                let gameInfoContent = `
                    <div class="steam-game-name" title="${player.game_name}${player.rich_presence ? ' - ' + player.rich_presence : ''}">
                        ${player.game_state || '正在玩'}: ${player.game_name}
                        ${player.rich_presence ? `<span class="steam-rich-presence">(${player.rich_presence})</span>` : ''}
                    </div>
                `;
                if (player.game_logo) {
                    gameInfoContent += `
                        <img
                            class="steam-game-thumbnail lazy-placeholder"
                            data-src="${player.game_logo}"
                            src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                            alt="${player.game_name}"
                        />
                    `;
                }
                gameInfoElement.innerHTML = gameInfoContent;
                if (!statusWidget.contains(gameInfoElement)) {
                    statusWidget.appendChild(gameInfoElement);
                }
                const gameThumbnail = gameInfoElement.querySelector('.steam-game-thumbnail');
                if (gameThumbnail && window.reinitializeLazyLoad) {
                    window.reinitializeLazyLoad([gameThumbnail]);
                }
            } else {
                if (statusWidget.contains(gameInfoElement)) {
                    gameInfoElement.remove();
                }
            }
            const levelContainer = statusWidget.querySelector('.steam-level');
            if (levelElement && levelContainer && player.steam_level !== null) {
                const level = parseInt(player.steam_level, 10);
                levelElement.textContent = level;

                function getLevelColorClass(lvl) {
                    if (lvl < 0) return 'level-color-0';
                    const tier = Math.floor(lvl / 10);
                    const colorIndex = Math.min(tier, 14);
                    return `level-color-${colorIndex}`;
                }

                const levelColorClass = getLevelColorClass(level);

                levelContainer.className = levelContainer.className.replace(/\blevel-color-\d+\b/g, '').trim();
                levelContainer.classList.add(levelColorClass);

                levelContainer.style.display = 'flex';

                if (statusLevelRow && levelContainer.parentNode !== statusLevelRow) {
                    statusLevelRow.appendChild(levelContainer);
                }

            } else if (levelContainer) {
                levelContainer.style.display = 'none';
                if (statusLevelRow && levelContainer.parentNode !== statusLevelRow) {
                    statusLevelRow.appendChild(levelContainer);
                }
            }


            if (badgeElement && player.featured_badge_icon && player.featured_badge_name) {
                if (badgeIcon && badgeIcon.getAttribute('data-src') !== player.featured_badge_icon) {
                    badgeIcon.setAttribute('data-src', player.featured_badge_icon);
                    badgeIcon.classList.remove('lazy-initialized', 'lazy-loaded', 'lazy-error');
                    badgeIcon.classList.add('lazy-placeholder');
                    badgeIcon.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
                    if (window.reinitializeLazyLoad) {
                        window.reinitializeLazyLoad([badgeIcon]);
                    }
                }
                if (badgeName) badgeName.textContent = player.featured_badge_name;
                if (badgeXp) badgeXp.textContent = player.featured_badge_xp || '';
                badgeElement.style.display = 'flex';
            } else if (badgeElement) {
                badgeElement.style.display = 'none';
            }
            if (backgroundVideo && (player.background_video_webm || player.background_video_mp4)) {
                const webmSource = backgroundVideo.querySelector('source[type="video/webm"]');
                const mp4Source = backgroundVideo.querySelector('source[type="video/mp4"]');
                let videoChanged = false;
                if (webmSource && player.background_video_webm && webmSource.src !== player.background_video_webm) {
                    webmSource.src = player.background_video_webm;
                    videoChanged = true;
                } else if (!webmSource && player.background_video_webm) {
                    const newWebmSource = document.createElement('source');
                    newWebmSource.src = player.background_video_webm;
                    newWebmSource.type = 'video/webm';
                    backgroundVideo.appendChild(newWebmSource);
                    videoChanged = true;
                } else if (webmSource && !player.background_video_webm) {
                    webmSource.remove();
                    videoChanged = true;
                }
                if (mp4Source && player.background_video_mp4 && mp4Source.src !== player.background_video_mp4) {
                    mp4Source.src = player.background_video_mp4;
                    videoChanged = true;
                } else if (!mp4Source && player.background_video_mp4) {
                    const newMp4Source = document.createElement('source');
                    newMp4Source.src = player.background_video_mp4;
                    newMp4Source.type = 'video/mp4';
                    backgroundVideo.appendChild(newMp4Source);
                    videoChanged = true;
                } else if (mp4Source && !player.background_video_mp4) {
                    mp4Source.remove();
                    videoChanged = true;
                }
                if (videoChanged) {
                    backgroundVideo.load();
                    backgroundVideo.play().catch(e => console.log("Autoplay prevented for background video:", e));
                }
                backgroundVideo.style.display = 'block';
            } else if (backgroundVideo) {
                backgroundVideo.style.display = 'none';
                backgroundVideo.innerHTML = '';
            }
            const existingListener = statusWidget.__steamMouseEnterListener;
            if (existingListener) {
                statusWidget.removeEventListener("mouseenter", existingListener);
            }
            const mouseEnterListener = function () {
                let message = '';
                const currentStatusClass = statusClass;
                if (currentStatusClass === 'in-game') {
                    message = `主人正在玩 ${player.game_name} 呢！${player.rich_presence ? `(${player.rich_presence})` : ''}`;
                } else if (currentStatusClass === 'online') {
                    message = `看来主人在线上呢，要去聊聊吗？`;
                } else {
                    message = `主人现在不在线呢，也许有其他事要做吧~`;
                }
                if (message && window.showLive2dNotification) {
                    showLive2dNotification(message);
                }
            };
            statusWidget.addEventListener("mouseenter", mouseEnterListener);
            statusWidget.__steamMouseEnterListener = mouseEnterListener;
        } catch (error) {
            console.error('Steam 状态更新失败:', error);
            const statusWidget = document.querySelector('.steam-status-widget');
            if (statusWidget) {
                const status = statusWidget.querySelector('.steam-status');
                if (status) {
                    status.textContent = '状态更新失败';
                    status.className = 'steam-status error';
                }
                const gameInfoElement = statusWidget.querySelector('.steam-game-info');
                if (gameInfoElement) gameInfoElement.remove();
            }
            if (window.showNotification) {
                showNotification(`Steam状态更新失败: ${error.message}`, 5, 'error');
            }
            stopUpdates();
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(eventName => {
        document.addEventListener(eventName, updateUserActivity, { passive: true });
    });
    if (!document.hidden) {
        startUpdates();
    } else {
        console.log("页面初始加载时不可见，暂不启动 Steam 状态更新");
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSteamStatus);
} else {
    initSteamStatus();
}