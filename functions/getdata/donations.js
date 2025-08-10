import { requireAuth } from '../utils.js';

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;
        const platformFilter = url.searchParams.get('platform');

        let whereClause = '';
        const params = [];

        if (platformFilter) {
            whereClause = 'WHERE platform = ?';
            params.push(platformFilter);
        }

        const countQuery = `SELECT COUNT(*) as total FROM donations ${whereClause}`;
        const { results: countResults } = await env.DB.prepare(countQuery).bind(...params).all();
        const total = countResults[0].total;

        const dataQuery = `
            SELECT id, name, amount, date, platform, message
            FROM donations
            ${whereClause}
            ORDER BY date DESC
            LIMIT ? OFFSET ?
        `;
        
        const dataParams = [...params, limit, offset];
        const { results } = await env.DB.prepare(dataQuery).bind(...dataParams).all();

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return new Response(JSON.stringify({
            data: results,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext,
                hasPrev
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300'
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
        const { name, amount, date, platform, message } = await request.json();

        const { meta } = await env.DB.prepare(`
            INSERT INTO donations (name, amount, date, platform, message)
            VALUES (?, ?, ?, ?, ?)
        `).bind(name, amount, date, platform, message).run();

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
        const { id, name, amount, date, platform, message } = await request.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required for updating' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const { meta } = await env.DB.prepare(`
            UPDATE donations
            SET name = ?, amount = ?, date = ?, platform = ?, message = ?
            WHERE id = ?
        `).bind(name, amount, date, platform, message, id).run();

        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Donation not found or no changes made' }), { 
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
            throw new Error('缺少捐献记录ID');
        }

        const { meta } = await env.DB.prepare(`
            DELETE FROM donations WHERE id = ?
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