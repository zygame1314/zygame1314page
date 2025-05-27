export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;

        const { results: countResults } = await env.DB.prepare(`
            SELECT COUNT(*) as total FROM donations
        `).all();
        const total = countResults[0].total;

        const { results } = await env.DB.prepare(`
            SELECT name, amount, date, platform, message
            FROM donations
            ORDER BY date DESC
            LIMIT ? OFFSET ?
        `).bind(limit, offset).all();

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