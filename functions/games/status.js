<<<<<<< HEAD
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
        steamids: steamID,
        format: 'json',
        l: 'schinese'
    }).toString();

    try {
        const statusResponse = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${params}`
        );

        if (!statusResponse.ok) {
            throw new Error(`Steam API Error: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();

        return new Response(JSON.stringify(statusData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        });

    } catch (error) {
        console.error('Steam API Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch Steam status data',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
=======
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
        steamids: steamID,
        format: 'json',
        l: 'schinese'
    }).toString();

    try {
        const statusResponse = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${params}`
        );

        if (!statusResponse.ok) {
            throw new Error(`Steam API Error: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();

        return new Response(JSON.stringify(statusData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        });

    } catch (error) {
        console.error('Steam API Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch Steam status data',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
>>>>>>> b029a527becedfc9927b8e11b6ce5e48017539d2
}