export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;

        const { results: countResults } = await env.DB.prepare(`
            SELECT COUNT(*) as total FROM timeline
        `).all();
        const total = countResults[0].total;

        const { results } = await env.DB.prepare(`
            SELECT date, title, description
            FROM timeline
            ORDER BY date DESC
            LIMIT ? OFFSET ?
        `).bind(limit, offset).all();

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return new Response(JSON.stringify({
            milestones: results,
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
        const { date, title, description } = await request.json();

        const { meta } = await env.DB.prepare(`
            INSERT INTO timeline (date, title, description)
            VALUES (?, ?, ?)
        `).bind(date, title, description).run();

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
    const { env, request } = context;

    try {
        const { id, date, title, description } = await request.json();

        await env.DB.prepare(`
            UPDATE timeline 
            SET date = ?, title = ?, description = ?
            WHERE id = ?
        `).bind(date, title, description, id).run();

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

export async function onRequestDelete(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            throw new Error('缺少时间线节点ID');
        }

        await env.DB.prepare(`
            DELETE FROM timeline WHERE id = ?
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