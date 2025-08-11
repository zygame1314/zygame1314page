import { requireAuth } from '../utils.js';
export function onRequestOptions() {
    return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';
    try {
        if (isAdmin) {
            const authError = await requireAuth(context);
            if (authError) return authError;
            const { results: rawNotices } = await env.DB.prepare(`
                SELECT
                    id, active, title, content, expiry_date as expiryDate,
                    image_url, image_alt, image_position, image_width, image_height,
                    poll_config
                FROM important_notices
                ORDER BY created_at DESC
            `).all();
            const notices = (rawNotices || []).map(rawNotice => ({
                id: rawNotice.id,
                active: rawNotice.active,
                title: rawNotice.title,
                content: rawNotice.content,
                expiryDate: rawNotice.expiryDate,
                image: (rawNotice.image_url || rawNotice.image_alt || rawNotice.image_position || rawNotice.image_width || rawNotice.image_height) ? {
                    url: rawNotice.image_url,
                    alt: rawNotice.image_alt,
                    position: rawNotice.image_position,
                    width: rawNotice.image_width,
                    height: rawNotice.image_height
                } : null,
                poll: rawNotice.poll_config ? JSON.parse(rawNotice.poll_config) : null
            }));
            return new Response(JSON.stringify({ notices }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            const { results } = await env.DB.prepare(`
                SELECT
                    id, active, title, content, expiry_date as expiryDate,
                    image_url, image_alt, image_position, image_width, image_height,
                    poll_config
                FROM important_notices
                WHERE active = 1
                ORDER BY created_at DESC
                LIMIT 3
            `).all();
            if (results.length === 0) {
                return new Response(JSON.stringify({ active: false, notices: [] }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
            const notices = [];
            const expiredIds = [];
            for (const rawNotice of results) {
                const notice = {
                    id: rawNotice.id,
                    active: rawNotice.active,
                    title: rawNotice.title,
                    content: rawNotice.content,
                    expiryDate: rawNotice.expiryDate,
                    image: (rawNotice.image_url || rawNotice.image_alt || rawNotice.image_position || rawNotice.image_width || rawNotice.image_height) ? {
                        url: rawNotice.image_url,
                        alt: rawNotice.image_alt,
                        position: rawNotice.image_position,
                        width: rawNotice.image_width,
                        height: rawNotice.image_height
                    } : null,
                    poll: rawNotice.poll_config ? JSON.parse(rawNotice.poll_config) : null
                };
                if (notice.expiryDate && new Date(notice.expiryDate) < new Date()) {
                    expiredIds.push(notice.id);
                } else {
                    notices.push(notice);
                }
            }
            if (expiredIds.length > 0) {
                const placeholders = expiredIds.map(() => '?').join(',');
                await env.DB.prepare(`
                    UPDATE important_notices
                    SET active = 0
                    WHERE id IN (${placeholders})
                `).bind(...expiredIds).run();
            }
            return new Response(JSON.stringify({ active: notices.length > 0, notices: notices }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
export async function onRequestPut(context) {
    const authError = await requireAuth(context);
    if (authError) return authError;
    const { env, request } = context;
    try {
        const { id, active, title, content, expiryDate, image, poll } = await request.json();
        const imageUrl = image && image.url ? image.url : null;
        const imageAlt = image && image.alt ? image.alt : null;
        const imagePosition = image && image.position ? image.position : null;
        const imageWidth = image && image.width ? image.width : null;
        const imageHeight = image && image.height ? image.height : null;
        const pollConfig = poll ? JSON.stringify(poll) : null;
        await env.DB.prepare(`
            INSERT OR REPLACE INTO important_notices
                (id, active, title, content, expiry_date,
                 image_url, image_alt, image_position, image_width, image_height,
                 poll_config, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            id,
            active,
            title,
            content,
            expiryDate || null,
            imageUrl || null,
            imageAlt || null,
            imagePosition || null,
            imageWidth || null,
            imageHeight || null,
            pollConfig || null
        ).run();
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
export async function onRequestDelete(context) {
    const authError = await requireAuth(context);
    if (authError) return authError;
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ error: '缺少ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    try {
        await env.DB.prepare('DELETE FROM important_notices WHERE id = ?').bind(id).run();
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