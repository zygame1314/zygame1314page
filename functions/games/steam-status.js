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
    let response;
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
            },
        });
    }
    const timestamp = Date.now();
    const miniprofileUrl = `https://steamcommunity.com/miniprofile/${steamFriendCode}?_=${timestamp}`;
    try {
        const steamResponse = await fetch(miniprofileUrl, {
            headers: {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                "x-requested-with": "XMLHttpRequest",
                "Referer": `https://steamcommunity.com/profiles/${steamFriendCode}/friends/`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
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
            avatar_frame_url: null,
            personaname: null,
            personastate_css_class: 'offline',
            avatar_border_class: 'offline',
            game_logo: null,
            appId: null,
            game_state: null,
            game_name: null,
            rich_presence: null,
            background_video_webm: null,
            background_video_mp4: null,
            featured_badge_icon: null,
            featured_badge_name: null,
            featured_badge_xp: null,
            steam_level: null
        };
        const avatarContainerMatch = html.match(/<div class="playersection_avatar\s+([^"]*)">\s*<img src="([^"]+)">/);
        if (avatarContainerMatch && avatarContainerMatch[2]) {
            player.avatarfull = avatarContainerMatch[2];
            const classes = avatarContainerMatch[1].split(' ');
            const borderClass = classes.find(cls => cls.startsWith('border_color_'));
            if (borderClass) {
                player.avatar_border_class = borderClass.replace('border_color_', '');
            }
        } else {
            const avatarMatch = html.match(/<div class="playersection_avatar[^"]*">\s*<img src="([^"]+)">/);
            if (avatarMatch && avatarMatch[1]) {
                player.avatarfull = avatarMatch[1];
            }
            const offlineAvatarClassMatch = html.match(/<div class="playersection_avatar\s+border_color_([^"]+)">/);
            if (offlineAvatarClassMatch && offlineAvatarClassMatch[1]) {
                player.avatar_border_class = offlineAvatarClassMatch[1].trim();
            }
        }
        const avatarFrameMatch = html.match(/<div class="playersection_avatar_frame">\s*<img src="([^"]+)">/);
        if (avatarFrameMatch && avatarFrameMatch[1]) {
            player.avatar_frame_url = avatarFrameMatch[1];
        }
        const personaMatch = html.match(/<span class="persona\s+([^"]+)">([^<]+)<\/span>/);
        if (personaMatch && personaMatch[1] && personaMatch[2]) {
            player.personastate_css_class = personaMatch[1].trim();
            player.personaname = personaMatch[2].trim();
        } else {
            const offlineNameMatch = html.match(/<div class="miniprofile_playername">([^<]+)<\/div>/);
            if (offlineNameMatch && offlineNameMatch[1]) {
                player.personaname = offlineNameMatch[1].trim();
                player.personastate_css_class = 'offline';
                player.avatar_border_class = 'offline';
            }
        }
        const gameSectionMatch = html.includes('miniprofile_gamesection');
        if (gameSectionMatch) {
            const gameLogoMatch = html.match(/<img class="game_logo" src="[^"]*\/apps\/(\d+)\/[^"]*">/);
            if (gameLogoMatch && gameLogoMatch[1]) {
                const appId = gameLogoMatch[1];
                player.appId = appId;
                const chineseHeaderUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header_schinese.jpg`;
                const defaultHeaderUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

                try {
                    const headResponse = await fetch(chineseHeaderUrl, { method: 'HEAD' });
                    if (headResponse.ok) {
                        player.game_logo = chineseHeaderUrl;
                    } else {
                        player.game_logo = defaultHeaderUrl;
                    }
                } catch (e) {
                    player.game_logo = defaultHeaderUrl;
                }
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
            player.personastate_css_class = 'in-game';
        } else {
        }
        const videoWebmMatch = html.match(/<source src="([^"]+\.webm)" type="video\/webm">/);
        if (videoWebmMatch && videoWebmMatch[1]) {
            player.background_video_webm = videoWebmMatch[1];
        }
        const videoMp4Match = html.match(/<source src="([^"]+\.mp4)" type="video\/mp4">/);
        if (videoMp4Match && videoMp4Match[1]) {
            player.background_video_mp4 = videoMp4Match[1];
        }
        const badgeDetailsMatch = html.match(/<div class="miniprofile_featuredcontainer">\s*<img src="([^"]+)" class="badge_icon">\s*<div class="description">\s*<div class="name">([^<]+)<\/div>\s*<div class="xp">([^<]+)<\/div>\s*<\/div>\s*<\/div>/);
        if (badgeDetailsMatch) {
            player.featured_badge_icon = badgeDetailsMatch[1];
            player.featured_badge_name = badgeDetailsMatch[2].trim();
            player.featured_badge_xp = badgeDetailsMatch[3].trim();
        }
        const levelContainerMatch = html.match(/<div class="miniprofile_featuredcontainer">\s*<div class="friendPlayerLevel[^"]*">\s*<span class="friendPlayerLevelNum">(\d+)<\/span>/);
        if (levelContainerMatch && levelContainerMatch[1]) {
            player.steam_level = parseInt(levelContainerMatch[1], 10);
        }
        const responseData = { success: true, player: player };
        function replaceCdnUrl(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(/https:\/\/cdn\.cloudflare\.steamstatic\.com/g, 'https://cdn.akamai.steamstatic.com')
                                       .replace(/https:\/\/shared\.cloudflare\.steamstatic\.com/g, 'https://shared.akamai.steamstatic.com');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    replaceCdnUrl(obj[key]);
                }
            }
        }
        replaceCdnUrl(responseData);
        response = new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
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
            },
        });
    }
    return response;
}