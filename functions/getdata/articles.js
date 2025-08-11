import { requireAuth } from '../utils.js';
export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    try {
        if (id) {
            const { results } = await env.DB.prepare(`
                SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants, contentUrl
                FROM articles WHERE id = ?
            `).bind(id).all();
            const article = results[0];
            if (!article) {
                return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404 });
            }
            return new Response(JSON.stringify(article));
        } else {
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;
            const offset = (page - 1) * limit;
            const { results: countResults } = await env.DB.prepare(`
                SELECT COUNT(*) as total FROM articles
            `).all();
            const total = countResults[0].total;
            const { results } = await env.DB.prepare(`
                SELECT id, title, date, excerpt, thumbnail, tags
                FROM articles
                ORDER BY date DESC
                LIMIT ? OFFSET ?
            `).bind(limit, offset).all();
            return new Response(JSON.stringify({
                data: results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }));
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function onRequestPost(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const { id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants } = await request.json();
        if (!id || !title || !date || !contentUrl) {
            return new Response(JSON.stringify({ error: 'ID, title, date, and contentUrl are required' }), { status: 400 });
        }
        await env.DB.prepare(`
            INSERT INTO articles (id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants).run();
        return new Response(JSON.stringify({ success: true, id: id }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
export async function onRequestPut(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const { id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants } = await request.json();
        if (!id || !title || !date || !contentUrl) {
            return new Response(JSON.stringify({ error: 'ID, title, date, and contentUrl are required' }), { status: 400 });
        }
        const { meta } = await env.DB.prepare(`
            UPDATE articles
            SET title = ?, date = ?, excerpt = ?, thumbnail = ?, contentUrl = ?, tags = ?, aiAssistants = ?
            WHERE id = ?
        `).bind(title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants, id).run();
        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Article not found or no changes made' }), { status: 404 });
        }
        return new Response(JSON.stringify({ success: true }));
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
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
            return new Response(JSON.stringify({ error: 'Article ID is required' }), { status: 400 });
        }
        const { meta } = await env.DB.prepare(`
            DELETE FROM articles WHERE id = ?
        `).bind(id).run();
        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404 });
        }
        return new Response(JSON.stringify({ success: true }));
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}