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
    const cache = caches.default;
    let response = await cache.match(context.request);
    if (response) {
        console.log('Cache hit for popular games');
        return response;
    }
    console.log('Cache miss for popular games');
    const gamesPerPage = 5;
    try {
        let response = await fetch(
            'https://store.steampowered.com/api/featuredcategories?cc=cn&l=schinese'
        );
        if (!response.ok) {
            throw new Error(`Steam API Error: ${response.status}`);
        }
        const data = await response.json();
        const topSellers = (data && data.top_sellers && Array.isArray(data.top_sellers.items)) ? data.top_sellers.items : [];
        const popularGames = topSellers
            .slice(0, gamesPerPage)
            .map(game => {
                if (!game || typeof game !== 'object' || !game.id || !game.name || !game.large_capsule_image) {
                    console.warn('Skipping invalid game item:', game);
                    return null;
                }
                return {
                    id: game.id,
                    name: game.name,
                    background_image: game.large_capsule_image,
                    discounted: (game.discount_percent ?? 0) > 0,
                    discount_percent: game.discount_percent ?? 0,
                    original_price: game.original_price ?? null,
                    final_price: game.final_price ?? null,
                    windows_available: true,
                    mac_available: game.mac_available ?? false,
                    linux_available: game.linux_available ?? false,
                    controller_support: game.controller_support ?? 'none'
                };
            })
            .filter(game => game !== null);
        response = new Response(JSON.stringify({
            results: popularGames,
            count: popularGames.length
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
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
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60',
            }
        });
    }
    context.waitUntil(cache.put(context.request, response.clone()));
    return response;
}