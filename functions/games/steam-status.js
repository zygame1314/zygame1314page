const FRESH_TTL_SECONDS = 60;
const STALE_TTL_SECONDS = 30 * 60;
const STEAM_ID64_OFFSET = 76561197960265728n;
const COMMUNITY_ASSETS_BASE = 'https://shared.akamai.steamstatic.com/community_assets/images/';

const PERSONA_STATE_CLASS = {
    0: 'offline',
    1: 'online',
    2: 'online',
    3: 'online',
    4: 'online',
    5: 'online',
    6: 'online',
};

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

const SAFE_PUBLISHERS = [
    'Square Enix', 'Capcom', 'Bandai Namco', 'SEGA', 'PlayStation',
    'Xbox Game Studios', 'Electronic Arts', 'Ubisoft', 'Konami',
    'FromSoftware', 'CD PROJEKT RED', 'Rockstar Games', 'Valve', 'NVIDIA', 'Atlus',
    'KOEI TECMO GAMES CO., LTD.', 'Bethesda Softworks', '2K', 'Activision', 'Blizzard Entertainment'
];

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

function communityAssetUrl(assetPath) {
    if (!assetPath) return null;
    return `${COMMUNITY_ASSETS_BASE}${String(assetPath).replace(/^\/+/, '')}`;
}

function getSteamId64(env) {
    const steamId = String(env.STEAM_ID || '').trim();
    if (/^\d{17}$/.test(steamId)) return steamId;

    const steamId32 = String(env.STEAM_ID_32 || '').trim();
    if (/^\d+$/.test(steamId32)) {
        return (BigInt(steamId32) + STEAM_ID64_OFFSET).toString();
    }
    return null;
}

async function fetchJson(url, label) {
    const response = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
    });
    if (!response.ok) {
        const body = (await response.text()).slice(0, 200);
        throw new Error(`${label} failed: ${response.status} ${response.statusText} ${body}`.trim());
    }
    return response.json();
}

async function fetchOptionalJson(url, label) {
    try {
        return await fetchJson(url, label);
    } catch (error) {
        console.error(`[Steam] ${error.message}`);
        return null;
    }
}

async function fetchGameInfo(appId) {
    const params = new URLSearchParams({ appids: appId, l: 'schinese' }).toString();
    const payload = await fetchOptionalJson(`https://store.steampowered.com/api/appdetails?${params}`, `appdetails(${appId})`);
    const details = payload?.[appId];
    if (!details || !details.success) return null;

    const data = details.data || {};
    const publishers = [...(data.publishers || []), ...(data.developers || [])];
    const gameName = (data.name || '').toLowerCase();
    const hasSensitiveKeyword = SENSITIVE_KEYWORDS.some(keyword => gameName.includes(keyword.toLowerCase()));
    const hasBlockedPublisher = publishers.some(name => BLOCKED_PUBLISHERS.some(blocked => name.toLowerCase().includes(blocked.toLowerCase())));
    const hasTrustedPublisher = publishers.some(name => SAFE_PUBLISHERS.some(safe => name.toLowerCase().includes(safe.toLowerCase())));

    let restricted = hasSensitiveKeyword || hasBlockedPublisher;
    if (!restricted && !hasTrustedPublisher) {
        if (Number(data.required_age) >= 18) restricted = true;
        const descriptorIds = data.content_descriptors?.ids || [];
        if (descriptorIds.some(id => id === 1 || id === 5)) restricted = true;
    }

    if (restricted && !hasTrustedPublisher) {
        const exempt = Boolean(data.metacritic)
            || (!hasBlockedPublisher && Number(data.recommendations?.total || 0) > 15000);
        if (!exempt) {
            return { safe: false, name: data.name || null, headerImage: null };
        }
    }

    return {
        safe: true,
        name: data.name || null,
        headerImage: data.header_image || null,
    };
}

async function fetchSteamStatus(steamId64, apiKey) {
    const profileQuery = new URLSearchParams({ steamid: steamId64 }).toString();
    const summariesQuery = new URLSearchParams({ key: apiKey, steamids: steamId64 }).toString();
    const levelQuery = new URLSearchParams({ key: apiKey, steamid: steamId64 }).toString();

    const [summaries, equipped, steamLevel] = await Promise.all([
        fetchJson(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?${summariesQuery}`, 'GetPlayerSummaries'),
        fetchOptionalJson(`https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?${profileQuery}`, 'GetProfileItemsEquipped'),
        fetchOptionalJson(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?${levelQuery}`, 'GetSteamLevel'),
    ]);

    const summary = summaries?.response?.players?.[0];
    if (!summary) {
        throw new Error('Steam profile not found');
    }

    const items = equipped?.response || {};
    const miniBackground = items.mini_profile_background || {};
    const profileBackground = items.profile_background || {};
    const avatarFrame = items.avatar_frame || {};
    const animatedAvatar = items.animated_avatar || {};

    const inGame = Boolean(summary.gameid);
    const personaState = Number(summary.personastate) || 0;

    const player = {
        avatarfull: communityAssetUrl(animatedAvatar.image_small) || summary.avatarfull || null,
        avatar_frame_url: communityAssetUrl(avatarFrame.image_small || avatarFrame.image_large),
        personaname: summary.personaname || null,
        personastate_css_class: inGame ? 'in-game' : (PERSONA_STATE_CLASS[personaState] || 'offline'),
        avatar_border_class: inGame ? 'in-game' : (personaState === 0 ? 'offline' : 'online'),
        game_logo: null,
        appId: inGame ? String(summary.gameid) : null,
        game_state: null,
        game_name: inGame ? (summary.gameextrainfo || null) : null,
        rich_presence: null,
        background_video_webm: communityAssetUrl(miniBackground.movie_webm || profileBackground.movie_webm),
        background_video_mp4: communityAssetUrl(miniBackground.movie_mp4 || profileBackground.movie_mp4),
        steam_level: Number.isInteger(steamLevel?.response?.player_level) ? steamLevel.response.player_level : null,
    };

    if (inGame) {
        const gameInfo = await fetchGameInfo(player.appId);
        if (gameInfo && !gameInfo.safe) {
            console.log(`[Steam] Hiding sensitive game activity: ${player.appId}`);
            player.personastate_css_class = 'online';
            player.appId = null;
            player.game_name = null;
        } else if (gameInfo) {
            player.game_logo = gameInfo.headerImage;
        }
    }

    return player;
}

export function onRequestOptions() {
    return new Response(null, { status: 204 });
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const steamId64 = getSteamId64(env);
    const apiKey = String(env.STEAM_API_KEY || '').trim();

    if (!steamId64 || !apiKey) {
        return jsonResponse({
            success: false,
            error: 'Configuration Error',
            message: !steamId64
                ? 'STEAM_ID or STEAM_ID_32 environment variable is not set.'
                : 'STEAM_API_KEY environment variable is not set.',
        }, 500);
    }

    const cache = getEdgeCache();
    const cacheBase = new URL(request.url);
    cacheBase.search = '';
    const freshCacheKey = new Request(`${cacheBase.toString()}?tier=fresh`);
    const staleCacheKey = new Request(`${cacheBase.toString()}?tier=stale`);

    const freshData = await readCache(cache, freshCacheKey);
    if (freshData) {
        return jsonResponse(freshData, 200, { 'X-Steam-Cache': 'HIT' });
    }

    try {
        const player = await fetchSteamStatus(steamId64, apiKey);
        const responseData = { success: true, player };
        await writeCache(cache, freshCacheKey, responseData, FRESH_TTL_SECONDS);
        await writeCache(cache, staleCacheKey, responseData, STALE_TTL_SECONDS);
        return jsonResponse(responseData);
    } catch (error) {
        console.error('Steam status API error:', error);
        const staleData = await readCache(cache, staleCacheKey);
        if (staleData) {
            console.warn('Serving stale Steam status because the Steam Web API request failed');
            return jsonResponse({ ...staleData, stale: true }, 200, { 'X-Steam-Cache': 'STALE' });
        }
        return jsonResponse({
            success: false,
            error: 'Failed to fetch Steam profile data',
            message: error.message,
        }, 503, { 'Retry-After': '60' });
    }
}