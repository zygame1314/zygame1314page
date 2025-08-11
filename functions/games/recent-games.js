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
        count: 4
    }).toString();
    try {
        const recentGamesResponse = await fetch(
            `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?${params}`
        );
        if (!recentGamesResponse.ok) {
            throw new Error(`Steam API Error: ${recentGamesResponse.status}`);
        }
        const recentGamesData = await recentGamesResponse.json();
        const games = recentGamesData.response.games || [];
        const gamesWithDetails = await Promise.all(games.map(async game => {
            const appDetailsParams = new URLSearchParams({
                appids: game.appid,
                l: 'schinese'
            }).toString();
            try {
                const detailsResponse = await fetch(
                    `https://store.steampowered.com/api/appdetails?${appDetailsParams}`
                );
                const detailsData = await detailsResponse.json();
                if (detailsData[game.appid].success) {
                    return {
                        ...game,
                        name: detailsData[game.appid].data.name,
                        chinese_name: detailsData[game.appid].data.name
                    };
                }
            } catch (error) {
                console.error(`Failed to fetch details for game ${game.appid}:`, error);
            }
            return game;
        }));
        recentGamesData.response.games = gamesWithDetails;
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