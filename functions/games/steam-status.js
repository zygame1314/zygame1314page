export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    const cache = caches.default;
    let response = await cache.match(context.request);

    if (response) {
        console.log('Cache hit');
        return response;
    }

    console.log('Cache miss');

    const steamAPIKey = context.env.STEAM_API_KEY;
    const steamID = context.env.STEAM_ID;

    const params = new URLSearchParams({
        key: steamAPIKey,
        steamids: steamID,
        format: 'json',
        l: 'schinese',
    }).toString();

    try {
        const statusResponse = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${params}`
        );

        if (!statusResponse.ok) {
            throw new Error(`Steam API Error: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();

        if (statusData.response?.players?.[0]?.gameextrainfo) {
            const gameInfo = statusData.response.players[0];
            if (gameInfo.gameid) {
                try {
                    const gameDetailsParams = new URLSearchParams({
                        appids: gameInfo.gameid,
                        l: 'schinese',
                    }).toString();
                    const gameDetailsResponse = await fetch(
                        `https://store.steampowered.com/api/appdetails?${gameDetailsParams}`
                    );
                    if (gameDetailsResponse.ok) {
                        const gameDetailsData = await gameDetailsResponse.json();
                        if (gameDetailsData[gameInfo.gameid]?.success) {
                            const gameData = gameDetailsData[gameInfo.gameid].data;
                            if (gameData?.name) {
                                gameInfo.gameextrainfo = gameData.name;
                            }
                            if (gameData?.header_image) {
                                statusData.response.players[0].game_header_image = gameData.header_image;
                            }
                        }
                    }
                } catch (gameError) {
                    console.error('Failed to fetch game details:', gameError);
                }
            }
        }

        response = new Response(JSON.stringify(statusData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300',
            },
        });

    } catch (error) {
        console.error('Steam API Error:', error);
        response = new Response(JSON.stringify({
            error: 'Failed to fetch Steam status data',
            message: error.message,
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300',
            },
        });
    }

    context.waitUntil(cache.put(context.request, response.clone()));

    return response;
}