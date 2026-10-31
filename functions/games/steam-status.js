const FRESH_TTL_SECONDS = 60;
const STALE_TTL_SECONDS = 30 * 60;
const STEAM_RETRYABLE_STATUS = new Set([403, 408, 425, 429, 500, 502, 503, 504]);

function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...extraHeaders,
        },
    });
}

function getEdgeCache() {
    try {
        return typeof caches !== 'undefined' && caches.default ? caches.default : null;
    } catch {
        return null;
    }
}

async function readCache(cache, key) {
    if (!cache) return null;
    try {
        const cached = await cache.match(key);
        return cached ? await cached.json() : null;
    } catch (error) {
        console.error('Steam status cache read failed:', error);
        return null;
    }
}

async function writeCache(cache, key, data, ttlSeconds) {
    if (!cache) return;
    try {
        await cache.put(key, new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': `public, max-age=${ttlSeconds}`,
            },
        }));
    } catch (error) {
        console.error('Steam status cache write failed:', error);
    }
}

async function fetchMiniprofileHtml(steamFriendCode) {
    const url = `https://steamcommunity.com/miniprofile/${steamFriendCode}?_=${Date.now()}`;
    let lastError = new Error('Steam MiniProfile request failed');
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const steamResponse = await fetch(url, {
                headers: {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                    "x-requested-with": "XMLHttpRequest",
                    "Referer": `https://steamcommunity.com/profiles/${steamFriendCode}/friends/`,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache"
                },
                method: "GET",
                redirect: "follow"
            });
            if (steamResponse.ok) {
                return await steamResponse.text();
            }
            const errorText = (await steamResponse.text()).slice(0, 300);
            console.error(`Steam MiniProfile API Error (attempt ${attempt}): ${steamResponse.status} ${steamResponse.statusText}`, errorText);
            lastError = new Error(`Steam MiniProfile API Error: ${steamResponse.status} ${steamResponse.statusText}`);
            if (!STEAM_RETRYABLE_STATUS.has(steamResponse.status)) break;
        } catch (error) {
            console.error(`Steam MiniProfile request failed (attempt ${attempt}):`, error);
            lastError = error;
        }
        if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    throw lastError;
}

export function onRequestOptions() {
    return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    let response;
    const steamFriendCode = context.env.STEAM_ID_32;
    if (!steamFriendCode) {
        return jsonResponse({
            success: false,
            error: 'Configuration Error',
            message: 'STEAM_ID_32 environment variable is not set.',
        }, 500);
    }
    const cache = getEdgeCache();
    const cacheBase = new URL(context.request.url);
    cacheBase.search = '';
    const freshCacheKey = new Request(`${cacheBase.toString()}?tier=fresh`);
    const staleCacheKey = new Request(`${cacheBase.toString()}?tier=stale`);

    const freshData = await readCache(cache, freshCacheKey);
    if (freshData) {
        return jsonResponse(freshData, 200, { 'X-Steam-Cache': 'HIT' });
    }
    try {
        const html = await fetchMiniprofileHtml(steamFriendCode);
        const player = {
            avatarfull: null,
            avatar_frame_url: null,
            personaname: null,
            personastate_css_class: 'offline',
            avatar_border_class: 'offline',
            game_logo: null,
            appId: null,
            game_state: null,
            game_name: null,
            rich_presence: null,
            background_video_webm: null,
            background_video_mp4: null,
            featured_badge_icon: null,
            featured_badge_name: null,
            featured_badge_xp: null,
            steam_level: null
        };
        const avatarContainerMatch = html.match(/<div class="playersection_avatar\s+([^"]*)">\s*<img src="([^"]+)">/);
        if (avatarContainerMatch && avatarContainerMatch[2]) {
            player.avatarfull = avatarContainerMatch[2];
            const classes = avatarContainerMatch[1].split(' ');
            const borderClass = classes.find(cls => cls.startsWith('border_color_'));
            if (borderClass) {
                player.avatar_border_class = borderClass.replace('border_color_', '');
            }
        } else {
            const avatarMatch = html.match(/<div class="playersection_avatar[^"]*">\s*<img src="([^"]+)">/);
            if (avatarMatch && avatarMatch[1]) {
                player.avatarfull = avatarMatch[1];
            }
            const offlineAvatarClassMatch = html.match(/<div class="playersection_avatar\s+border_color_([^"]+)">/);
            if (offlineAvatarClassMatch && offlineAvatarClassMatch[1]) {
                player.avatar_border_class = offlineAvatarClassMatch[1].trim();
            }
        }
        const avatarFrameMatch = html.match(/<div class="playersection_avatar_frame">\s*<img src="([^"]+)">/);
        if (avatarFrameMatch && avatarFrameMatch[1]) {
            player.avatar_frame_url = avatarFrameMatch[1];
        }
        const personaMatch = html.match(/<span class="persona\s+([^"]+)">([^<]+)<\/span>/);
        if (personaMatch && personaMatch[1] && personaMatch[2]) {
            player.personastate_css_class = personaMatch[1].trim();
            player.personaname = personaMatch[2].trim();
        } else {
            const offlineNameMatch = html.match(/<div class="miniprofile_playername">([^<]+)<\/div>/);
            if (offlineNameMatch && offlineNameMatch[1]) {
                player.personaname = offlineNameMatch[1].trim();
                player.personastate_css_class = 'offline';
                player.avatar_border_class = 'offline';
            }
        }
        const gameSectionMatch = html.includes('miniprofile_gamesection');
        if (gameSectionMatch) {
            const gameLogoMatch = html.match(/<img class="game_logo" src="[^"]*\/apps\/(\d+)\/[^"]*">/);
            let currentGameAppId = null;
            if (gameLogoMatch && gameLogoMatch[1]) {
                currentGameAppId = gameLogoMatch[1];
                let isSafeToDisplay = true;
                let apiHeaderImage = null;
                try {
                    const appDetailsParams = new URLSearchParams({
                        appids: currentGameAppId,
                        l: 'schinese'
                    }).toString();
                    const detailsResponse = await fetch(`https://store.steampowered.com/api/appdetails?${appDetailsParams}`);
                    if (detailsResponse.ok) {
                        const detailsJson = await detailsResponse.json();
                        const details = detailsJson[currentGameAppId];
                        if (details && details.success) {
                            const data = details.data;
                            apiHeaderImage = data.header_image;
                            let isRestricted = false;
                            let isSensitivePublisher = false;
                            const BLOCKED_PUBLISHERS = [
                                'Kagura Games', 'SakuraGame', 'Paradise Project',
                                'Alice Soft', 'Shiravune', 'MangaGamer', 'Oneone1', 'Dojin Otome',
                                'Kagami Works', 'Pink Peach', 'DSGame', 'Dharker Studio', 'Neko Works',
                                'illusion', '072 Project', 'Mango Party', 'qureate', 'WAKU WAKU'
                            ];
                            const SENSITIVE_KEYWORDS = [
                                'Hentai', 'Nude', 'Nudity', 'Sex', 'Erotic', 'Porn',
                                'Succubus', 'Bishoujo', 'Waifu', 'Incubus', 'Futanari', 'Netorare'
                            ];
                            const gameName = (data.name || "").toLowerCase();
                            if (SENSITIVE_KEYWORDS.some(kw => gameName.includes(kw.toLowerCase()))) {
                                isRestricted = true;
                            }
                            const publishers = [...(data.publishers || []), ...(data.developers || [])];
                            if (publishers.some(name => BLOCKED_PUBLISHERS.some(blocked => name.toLowerCase().includes(blocked.toLowerCase())))) {
                                isSensitivePublisher = true;
                                isRestricted = true;
                            }
                            const SAFE_PUBLISHERS = [
                                'Square Enix', 'Capcom', 'Bandai Namco', 'SEGA', 'PlayStation',
                                'Xbox Game Studios', 'Electronic Arts', 'Ubisoft', 'Konami',
                                'FromSoftware', 'CD PROJEKT RED', 'Rockstar Games', 'Valve', 'NVIDIA', 'Atlus',
                                'KOEI TECMO GAMES CO., LTD.', 'Bethesda Softworks', '2K', 'Activision', 'Blizzard Entertainment'
                            ];
                            let isTrustedPublisher = false;
                            if (publishers.some(name => SAFE_PUBLISHERS.some(safe => name.toLowerCase().includes(safe.toLowerCase())))) {
                                isTrustedPublisher = true;
                            }
                            if (!isRestricted && !isTrustedPublisher) {
                                if (data.required_age >= 18) isRestricted = true;
                                if (data.content_descriptors && data.content_descriptors.ids) {
                                    if (data.content_descriptors.ids.some(id => [1, 5].includes(id))) {
                                        isRestricted = true;
                                    }
                                }
                            }
                            if (isRestricted) {
                                if (isTrustedPublisher) {
                                    isSafeToDisplay = true;
                                } else {
                                    let isExempt = false;
                                    if (data.metacritic) isExempt = true;
                                    else if (!isSensitivePublisher && data.recommendations && data.recommendations.total > 15000) {
                                        isExempt = true;
                                    }
                                    if (!isExempt) isSafeToDisplay = false;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to verify game safety", e);
                }
                let storeAssets = null;
                try {
                    const getItemsUrl = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify({
                        ids: [{ appid: currentGameAppId }],
                        context: { country_code: 'CN' },
                        data_request: { include_assets: true }
                    }))}`;
                    const storeResponse = await fetch(getItemsUrl);
                    if (storeResponse.ok) {
                        const storeData = await storeResponse.json();
                        storeAssets = storeData.response.store_items?.[0]?.assets;
                    }
                } catch (e) {
                    console.error("Failed to fetch store assets", e);
                }
                if (!isSafeToDisplay) {
                    console.log(`Hiding sensitive game activity: ${currentGameAppId}`);
                    player.personastate_css_class = 'online';
                    player.game_state = null;
                    player.game_name = null;
                    player.rich_presence = null;
                    player.appId = null;
                    player.game_logo = null;
                } else {
                    player.appId = currentGameAppId;
                    let bestImage = apiHeaderImage;
                    if (storeAssets) {
                        if (storeAssets.header) {
                            bestImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${currentGameAppId}/${storeAssets.header}`;
                        } else if (storeAssets.library_capsule) {
                            bestImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${currentGameAppId}/${storeAssets.library_capsule}`;
                        }
                    }
                    player.game_logo = bestImage;
                }
                const gameStateMatch = html.match(/<span class="game_state">([^<]+)<\/span>/);
                if (gameStateMatch && gameStateMatch[1]) {
                    player.game_state = gameStateMatch[1].trim();
                }
                const gameNameMatch = html.match(/<span class="miniprofile_game_name">([^<]+)<\/span>/);
                if (gameNameMatch && gameNameMatch[1]) {
                    player.game_name = gameNameMatch[1].trim();
                }
                const richPresenceMatch = html.match(/<span class="rich_presence">([^<]+)<\/span>/);
                if (richPresenceMatch && richPresenceMatch[1]) {
                    player.rich_presence = richPresenceMatch[1].trim();
                }
                player.personastate_css_class = 'in-game';
            }
        } else {
        }
        const videoWebmMatch = html.match(/<source src="([^"]+\.webm)" type="video\/webm">/);
        if (videoWebmMatch && videoWebmMatch[1]) {
            player.background_video_webm = videoWebmMatch[1];
        }
        const videoMp4Match = html.match(/<source src="([^"]+\.mp4)" type="video\/mp4">/);
        if (videoMp4Match && videoMp4Match[1]) {
            player.background_video_mp4 = videoMp4Match[1];
        }
        const badgeDetailsMatch = html.match(/<div class="miniprofile_featuredcontainer">\s*<img src="([^"]+)" class="badge_icon">\s*<div class="description">\s*<div class="name">([^<]+)<\/div>\s*<div class="xp">([^<]+)<\/div>\s*<\/div>\s*<\/div>/);
        if (badgeDetailsMatch) {
            player.featured_badge_icon = badgeDetailsMatch[1];
            player.featured_badge_name = badgeDetailsMatch[2].trim();
            player.featured_badge_xp = badgeDetailsMatch[3].trim();
        }
        const levelContainerMatch = html.match(/<div class="miniprofile_featuredcontainer">\s*<div class="friendPlayerLevel[^"]*">\s*<span class="friendPlayerLevelNum">(\d+)<\/span>/);
        if (levelContainerMatch && levelContainerMatch[1]) {
            player.steam_level = parseInt(levelContainerMatch[1], 10);
        }
        const responseData = { success: true, player: player };
        function replaceCdnUrl(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(/https:\/\/cdn\.cloudflare\.steamstatic\.com/g, 'https://cdn.akamai.steamstatic.com')
                        .replace(/https:\/\/shared\.cloudflare\.steamstatic\.com/g, 'https://shared.akamai.steamstatic.com');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    replaceCdnUrl(obj[key]);
                }
            }
        }
        replaceCdnUrl(responseData);
        await writeCache(cache, freshCacheKey, responseData, FRESH_TTL_SECONDS);
        await writeCache(cache, staleCacheKey, responseData, STALE_TTL_SECONDS);
        response = jsonResponse(responseData);
    } catch (error) {
        console.error('Steam MiniProfile Fetch/Parse Error:', error);
        const staleData = await readCache(cache, staleCacheKey);
        if (staleData) {
            console.warn('Serving stale Steam status because Steam rejected the request');
            response = jsonResponse({ ...staleData, stale: true }, 200, { 'X-Steam-Cache': 'STALE' });
        } else {
            response = jsonResponse({
                success: false,
                error: 'Failed to fetch or parse Steam miniprofile data',
                message: error.message,
            }, 503, { 'Retry-After': '60' });
        }
    }
    return response;
}