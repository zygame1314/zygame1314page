export function onRequestOptions() {
    return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const cache = caches.default;
    let response = await cache.match(context.request);
    if (response) {
        console.log('Cache hit for recent games');
        return response;
    }
    console.log('Cache miss for recent games');
    const steamAPIKey = context.env.STEAM_API_KEY;
    const steamID = context.env.STEAM_ID;
    const params = new URLSearchParams({
        key: steamAPIKey,
        steamid: steamID,
        format: 'json',
        count: 10
    }).toString();
    try {
        const recentGamesResponse = await fetch(
            `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?${params}`
        );
        if (!recentGamesResponse.ok) {
            throw new Error(`Steam API Error: ${recentGamesResponse.status}`);
        }
        const recentGamesData = await recentGamesResponse.json();
        let games = recentGamesData.response.games || [];
        const BLOCKED_APP_IDS = [];
        games = games.filter(game => !BLOCKED_APP_IDS.includes(game.appid));
        const detailsPromises = games.map(async (game) => {
            const appDetailsParams = new URLSearchParams({
                appids: game.appid,
                l: 'schinese'
            }).toString();
            try {
                const response = await fetch(
                    `https://store.steampowered.com/api/appdetails?${appDetailsParams}`
                );
                if (response.ok) {
                    const data = await response.json();
                    return { appid: game.appid, details: data[game.appid] };
                }
            } catch (error) {
                console.error(`Failed to fetch details for game ${game.appid}:`, error);
            }
            return { appid: game.appid, details: null };
        });
        const detailsResults = await Promise.all(detailsPromises);
        let detailsMap = {};
        for (const result of detailsResults) {
            if (result.details) {
                detailsMap[result.appid] = result.details;
            }
        }
        const validGames = [];
        for (const game of games) {
            const details = detailsMap[game.appid];
            if (!details || !details.success) {
                continue;
            }
            const data = details.data;
            let isRestricted = false;
            if (data.required_age >= 18) {
                isRestricted = true;
            }
            if (!isRestricted && data.content_descriptors && data.content_descriptors.ids) {
                const blockedDescriptors = [1, 5];
                const hasExplicitContent = data.content_descriptors.ids.some(id =>
                    blockedDescriptors.includes(id)
                );
                if (hasExplicitContent) isRestricted = true;
            }
            let isSensitivePublisher = false;
            const BLOCKED_PUBLISHERS = [
                'Kagura Games',
                'SakuraGame',
                'Paradise Project',
                'Alice Soft',
                'Shiravune',
                'MangaGamer',
                'Oneone1'
            ];
            const SAFE_PUBLISHERS = [
                'Square Enix',
                'Capcom',
                'Bandai Namco',
                'SEGA',
                'PlayStation',
                'Xbox Game Studios',
                'Electronic Arts',
                'Ubisoft',
                'Konami',
                'FromSoftware',
                'CD PROJEKT RED',
                'Rockstar Games'
            ];
            const publishers = data.publishers || [];
            const developers = data.developers || [];
            const combined = [...publishers, ...developers];
            if (combined.some(name => BLOCKED_PUBLISHERS.some(blocked => name.toLowerCase().includes(blocked.toLowerCase())))) {
                isRestricted = true;
                isSensitivePublisher = true;
            }
            let isTrustedPublisher = false;
            if (combined.some(name => SAFE_PUBLISHERS.some(safe => name.toLowerCase().includes(safe.toLowerCase())))) {
                isTrustedPublisher = true;
            }
            if (isRestricted) {
                if (isTrustedPublisher) {
                }
                else {
                    let isExempt = false;
                    if (data.metacritic) {
                        isExempt = true;
                    }
                    else if (!isSensitivePublisher && data.recommendations && data.recommendations.total > 15000) {
                        isExempt = true;
                    }
                    if (!isExempt) {
                        continue;
                    }
                }
            }
            validGames.push({
                ...game,
                name: data.name || game.name,
                chinese_name: data.name || game.name
            });
        }
        recentGamesData.response.games = validGames.slice(0, 4);
        response = new Response(JSON.stringify(recentGamesData), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Steam API Error:', error);
        response = new Response(JSON.stringify({
            error: 'Failed to fetch Steam games data',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    context.waitUntil(cache.put(context.request, response.clone()));
    return response;
}