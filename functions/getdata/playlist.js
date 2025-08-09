import { requireAuth } from '../utils.js';

export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results } = await env.DB.prepare(`
            SELECT id, title, artist, path, cover, yt_link as ytLink, comment, expression
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
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;

    const { env, request } = context;

    try {
        const { title, artist, path, cover, ytLink, comment, expression } = await request.json();

        const { meta } = await env.DB.prepare(`
            INSERT INTO playlist (title, artist, path, cover, yt_link, comment, expression)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(title, artist, path, cover, ytLink, comment, expression).run();

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

export async function onRequestPut(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;

    const { env, request } = context;
    try {
        const { id, title, artist, path, cover, ytLink, comment, expression } = await request.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required for updating' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const { meta } = await env.DB.prepare(`
            UPDATE playlist
            SET title = ?, artist = ?, path = ?, cover = ?, yt_link = ?, comment = ?, expression = ?
            WHERE id = ?
        `).bind(title, artist, path, cover, ytLink, comment, expression, id).run();

        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Song not found or no changes made' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

export async function onRequestDelete(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;

    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            throw new Error('缺少歌曲ID');
        }

        const { meta } = await env.DB.prepare(`
            DELETE FROM playlist WHERE id = ?
        `).bind(id).run();

        if (meta.changes === 0) {
            throw new Error('未找到要删除的记录');
        }

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