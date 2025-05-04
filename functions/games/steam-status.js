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
    const cacheKey = new Request(new URL(context.request.url).toString() + '-v2', context.request);
    let response = await cache.match(cacheKey);
    if (response) {
        console.log('Cache hit (v2)');
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    }
    console.log('Cache miss (v2)');
    const steamFriendCode = context.env.STEAM_ID_32;
    if (!steamFriendCode) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Configuration Error',
            message: 'STEAM_ID_32 environment variable is not set.',
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
            },
        });
    }
    const miniprofileUrl = `https://steamcommunity.com/miniprofile/${steamFriendCode}`;
    try {
        const steamResponse = await fetch(miniprofileUrl, {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "x-requested-with": "XMLHttpRequest",
                "Referer": `https://steamcommunity.com/profiles/${steamFriendCode}/friends/`
            },
            method: "GET"
        });
        if (!steamResponse.ok) {
            const errorText = await steamResponse.text();
            console.error(`Steam MiniProfile API Error: ${steamResponse.status} ${steamResponse.statusText}`, errorText);
            throw new Error(`Steam MiniProfile API Error: ${steamResponse.status} ${steamResponse.statusText}`);
        }
        const html = await steamResponse.text();
        const player = {
            avatarfull: null,
            personaname: null,
            personastate_css_class: 'offline',
            game_logo: null,
            game_state: null,
            game_name: null,
            rich_presence: null
        };
        const avatarMatch = html.match(/<div class="playersection_avatar[^"]*">\s*<img src="([^"]+)">/);
        if (avatarMatch && avatarMatch[1]) {
            player.avatarfull = avatarMatch[1];
        }
        const personaMatch = html.match(/<span class="persona\s+([^"]+)">([^<]+)<\/span>/);
        if (personaMatch && personaMatch[1] && personaMatch[2]) {
            player.personastate_css_class = personaMatch[1].trim();
            player.personaname = personaMatch[2].trim();
        } else {
            const offlineNameMatch = html.match(/<div class="miniprofile_playername">([^<]+)<\/div>/);
            if (offlineNameMatch && offlineNameMatch[1]) {
                player.personaname = offlineNameMatch[1].trim();
                const offlineAvatarClassMatch = html.match(/<div class="playersection_avatar\s+border_color_([^"]+)">/);
                if (offlineAvatarClassMatch && offlineAvatarClassMatch[1]) {
                    player.personastate_css_class = offlineAvatarClassMatch[1].trim();
                }
            }
        }
        const gameSectionMatch = html.includes('miniprofile_gamesection');
        if (gameSectionMatch) {
            const gameLogoMatch = html.match(/<img class="game_logo" src="([^"]+)">/);
            if (gameLogoMatch && gameLogoMatch[1]) {
                player.game_logo = gameLogoMatch[1];
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
            const gameAvatarClassMatch = html.match(/<div class="playersection_avatar\s+border_color_([^"]+)">/);
            if (gameAvatarClassMatch && gameAvatarClassMatch[1]) {
                player.personastate_css_class = gameAvatarClassMatch[1].trim();
            } else {
                player.personastate_css_class = 'in-game';
            }
        }
        const responseData = { success: true, player: player };
        response = new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60',
            },
        });
    } catch (error) {
        console.error('Steam MiniProfile Fetch/Parse Error:', error);
        response = new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch or parse Steam miniprofile data',
            message: error.message,
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60',
            },
        });
    }
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
}