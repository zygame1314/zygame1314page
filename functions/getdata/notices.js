import { requireAuth } from '../utils.js';
export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(`
            SELECT id, title, icon, content
            FROM notices
            ORDER BY id ASC
        `).all();
        const notices = results.map(notice => ({
            id: notice.id,
            title: notice.title,
            icon: notice.icon,
            content: JSON.parse(notice.content)
        }));
        return new Response(JSON.stringify({
            notices: notices
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
export async function onRequestPost(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const { title, icon, content } = await request.json();
        const { meta } = await env.DB.prepare(`
            INSERT INTO notices (title, icon, content)
            VALUES (?, ?, ?)
        `).bind(title, icon, JSON.stringify(content)).run();
        return new Response(JSON.stringify({
            success: true,
            id: meta.last_row_id
        }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
export async function onRequestPut(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const { id, title, icon, content } = await request.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required for updating' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const { meta } = await env.DB.prepare(`
            UPDATE notices
            SET title = ?, icon = ?, content = ?
            WHERE id = ?
        `).bind(title, icon, JSON.stringify(content), id).run();
        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Notice not found or no changes made' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
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
            throw new Error('缺少公告ID');
        }
        const { meta } = await env.DB.prepare(`
            DELETE FROM notices WHERE id = ?
        `).bind(id).run();
        if (meta.changes === 0) {
            throw new Error('未找到要删除的记录');
        }
        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}