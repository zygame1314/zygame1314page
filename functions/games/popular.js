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

    const gamesPerPage = 5;

    try {
        const response = await fetch(
            'https://store.steampowered.com/api/featured?cc=cn&l=schinese'
        );

        if (!response.ok) {
            throw new Error(`Steam API Error: ${response.status}`);
        }

        const data = await response.json();

        const uniqueGames = Array.from(
            new Map(
                data.featured_win.map(game => [game.id, game])
            ).values()
        );

        const popularGames = uniqueGames
            .slice(0, gamesPerPage)
            .map(game => ({
                id: game.id,
                name: game.name,
                background_image: game.large_capsule_image,
                discounted: game.discounted,
                discount_percent: game.discount_percent,
                original_price: game.original_price,
                final_price: game.final_price,
                windows_available: game.windows_available,
                mac_available: game.mac_available,
                linux_available: game.linux_available,
                controller_support: game.controller_support
            }));

        return new Response(JSON.stringify({
            results: popularGames,
            count: popularGames.length
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Steam API Error:', error);
        return new Response(JSON.stringify({
            error: '获取热门游戏失败',
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