import { requireAuth } from '../utils.js';

const parseJsonField = (value) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch (e) {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }
};

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const headers = { 'Content-Type': 'application/json' };

    try {
        if (id) {
            const stmt = env.DB.prepare(`
                SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants
                FROM articles WHERE id = ?
            `);
            const { results } = await env.DB.prepare(`
                SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants
                FROM articles WHERE id = ?1
            `).bind(id).all();

            const article = results[0];
            if (!article) {
                return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers });
            }

            article.tags = parseJsonField(article.tags);
            article.aiAssistants = parseJsonField(article.aiAssistants);

            return new Response(JSON.stringify(article), { headers });
        } else {
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;
            const offset = (page - 1) * limit;

            const { results: countResults } = await env.DB.prepare(`
                SELECT COUNT(*) as total FROM articles
            `).all();
            const total = countResults[0].total;

            const { results } = await env.DB.prepare(`
                SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants
                FROM articles
                ORDER BY date DESC
                LIMIT ? OFFSET ?
            `).bind(limit, offset).all();
            return new Response(JSON.stringify({
                data: results.map(article => ({
                    ...article,
                    tags: parseJsonField(article.tags),
                    aiAssistants: parseJsonField(article.aiAssistants),
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }), { headers });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}

export async function onRequestPost(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    const headers = { 'Content-Type': 'application/json' };
    try {
        const { id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants } = await request.json();
        if (!id || !title || !date || !contentUrl) {
            return new Response(JSON.stringify({ error: 'ID, title, date, and contentUrl are required' }), { status: 400, headers });
        }
        await env.DB.prepare(`
            INSERT INTO articles (id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, title, date, excerpt, thumbnail, contentUrl, JSON.stringify(tags || []), JSON.stringify(aiAssistants || [])).run();
        return new Response(JSON.stringify({ success: true, id: id }), { status: 201, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}

export async function onRequestPut(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    const headers = { 'Content-Type': 'application/json' };
    try {
        const { id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants } = await request.json();
        if (!id || !title || !date || !contentUrl) {
            return new Response(JSON.stringify({ error: 'ID, title, date, and contentUrl are required' }), { status: 400, headers });
        }
        const { meta } = await env.DB.prepare(`
            UPDATE articles
            SET title = ?, date = ?, excerpt = ?, thumbnail = ?, contentUrl = ?, tags = ?, aiAssistants = ?
            WHERE id = ?
        `).bind(title, date, excerpt, thumbnail, contentUrl, JSON.stringify(tags || []), JSON.stringify(aiAssistants || []), id).run();
        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Article not found or no changes made' }), { status: 404, headers });
        }
        return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}

export async function onRequestDelete(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    const headers = { 'Content-Type': 'application/json' };
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) {
            return new Response(JSON.stringify({ error: 'Article ID is required' }), { status: 400, headers });
        }
        const { meta } = await env.DB.prepare(`
            DELETE FROM articles WHERE id = ?
        `).bind(id).run();
        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers });
        }
        return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}