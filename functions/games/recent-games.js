export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    const steamAPIKey = context.env.STEAM_API_KEY;
    const steamID = context.env.STEAM_ID;

    const params = new URLSearchParams({
        key: steamAPIKey,
        steamid: steamID,
        format: 'json',
        count: 4
    }).toString();

    try {
        const response = await fetch(
            `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?${params}`
        );

        if (!response.ok) {
            throw new Error(`Steam API Error: ${response.status}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Steam API Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch Steam games data',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}