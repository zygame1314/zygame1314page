import { requireAuth } from '../utils.js';

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    try {
        if (id) {
            // Get a single article
            const { results } = await env.DB.prepare(`
                SELECT id, title, content, created_at as createdAt, updated_at as updatedAt, tags, category
                FROM articles WHERE id = ?
            `).bind(id).all();
            
            const article = results;
            if (!article) {
                return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404 });
            }
            return new Response(JSON.stringify(article));

        } else {
            // Get a list of articles with pagination
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;
            const offset = (page - 1) * limit;

            const { results: countResults } = await env.DB.prepare(`
                SELECT COUNT(*) as total FROM articles
            `).all();
            const total = countResults.total;

            const { results } = await env.DB.prepare(`
                SELECT id, title, created_at as createdAt, updated_at as updatedAt, tags, category
                FROM articles
                ORDER BY created_at DESC
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
        const { title, content, tags, category } = await request.json();
        if (!title || !content) {
            return new Response(JSON.stringify({ error: 'Title and content are required' }), { status: 400 });
        }

        const { meta } = await env.DB.prepare(`
            INSERT INTO articles (title, content, tags, category)
            VALUES (?, ?, ?, ?)
        `).bind(title, content, tags, category).run();

        return new Response(JSON.stringify({ success: true, id: meta.last_row_id }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function onRequestPut(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;

    const { env, request } = context;
    try {
        const { id, title, content, tags, category } = await request.json();
        if (!id || !title || !content) {
            return new Response(JSON.stringify({ error: 'ID, title, and content are required' }), { status: 400 });
        }

        const { meta } = await env.DB.prepare(`
            UPDATE articles 
            SET title = ?, content = ?, tags = ?, category = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(title, content, tags, category, id).run();

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