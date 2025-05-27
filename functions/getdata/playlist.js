export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results } = await env.DB.prepare(`
            SELECT title, artist, path, cover, yt_link as ytLink, comment
            FROM playlist
            ORDER BY id ASC
        `).all();

        return new Response(JSON.stringify({
            songs: results
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=1800'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const { title, artist, path, cover, ytLink, comment } = await request.json();

        const { meta } = await env.DB.prepare(`
            INSERT INTO playlist (title, artist, path, cover, yt_link, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(title, artist, path, cover, ytLink, comment).run();

        return new Response(JSON.stringify({
            success: true,
            id: meta.last_row_id
        }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequestDelete(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            throw new Error('缺少歌曲ID');
        }

        await env.DB.prepare(`
            DELETE FROM playlist WHERE id = ?
        `).bind(id).run();

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}