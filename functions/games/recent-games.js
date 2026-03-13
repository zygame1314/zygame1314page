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
        let storeAssetsMap = {};
        try {
            const appIdsParams = games.map(g => ({ appid: g.appid }));
            const getItemsUrl = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify({
                ids: appIdsParams,
                context: { country_code: 'CN' },
                data_request: { include_assets: true }
            }))}`;
            const storeResponse = await fetch(getItemsUrl);
            if (storeResponse.ok) {
                const storeData = await storeResponse.json();
                const items = storeData.response.store_items || [];
                items.forEach(item => {
                    if (item.assets) {
                        storeAssetsMap[item.appid] = item.assets;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch store assets:', error);
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
            const BLOCKED_PUBLISHISHERS = [
                'Kagura Games', 'SakuraGame', 'Paradise Project',
                'Alice Soft', 'Shiravune', 'MangaGamer', 'Oneone1', 'Dojin Otome',
                'Kagami Works', 'Pink Peach', 'DSGame', 'Dharker Studio', 'Neko Works',
                'illusion', '072 Project', 'Mango Party', 'qureate', 'WAKU WAKU'
            ];
            const SENSITIVE_KEYWORDS = [
                'Hentai', 'Nude', 'Nudity', 'Sex', 'Erotic', 'Porn',
                'Succubus', 'Bishoujo', 'Waifu', 'Incubus', 'Futanari', 'Netorare'
            ];
            const gameName = (data.name || game.name || "").toLowerCase();
            if (SENSITIVE_KEYWORDS.some(kw => gameName.includes(kw.toLowerCase()))) {
                isRestricted = true;
            }
            const SAFE_PUBLISHERS = [
                'Square Enix', 'Capcom', 'Bandai Namco', 'SEGA', 'PlayStation',
                'Xbox Game Studios', 'Electronic Arts', 'Ubisoft', 'Konami',
                'FromSoftware', 'Rockstar Games', 'Valve', 'NVIDIA', 'Atlus',
                'KOEI TECMO GAMES CO., LTD.', 'Bethesda Softworks', '2K', 'Activision', 'Blizzard Entertainment'
            ];
            const publishers = data.publishers || [];
            const developers = data.developers || [];
            const combined = [...publishers, ...developers];
            if (combined.some(name => BLOCKED_PUBLISHISHERS.some(blocked => name.toLowerCase().includes(blocked.toLowerCase())))) {
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
            let bestImage = data.header_image;
            const assets = storeAssetsMap[game.appid];
            if (assets) {
                const libraryCapsule = assets.library_capsule || assets.library_600x900;
                if (libraryCapsule) {
                    bestImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/${libraryCapsule}`;
                } else if (assets.header) {
                    bestImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/${assets.header}`;
                }
            }
            validGames.push({
                ...game,
                name: data.name || game.name,
                chinese_name: data.name || game.name,
                cover_image: bestImage
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