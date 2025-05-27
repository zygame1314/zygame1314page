export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results } = await env.DB.prepare(`
            SELECT id, active, title, content, expiry_date as expiryDate
            FROM important_notices
            WHERE active = 1
            ORDER BY created_at DESC
            LIMIT 1
        `).all();

        if (results.length === 0) {
            return new Response(JSON.stringify({
                active: false
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=60'
                }
            });
        }

        const notice = results[0];

        if (notice.expiryDate && new Date(notice.expiryDate) < new Date()) {
            await env.DB.prepare(`
                UPDATE important_notices 
                SET active = 0 
                WHERE id = ?
            `).bind(notice.id).run();

            return new Response(JSON.stringify({
                active: false
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=60'
                }
            });
        }

        return new Response(JSON.stringify(notice), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60'
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
        const { id, active, title, content, expiryDate } = await request.json();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO important_notices (id, active, title, content, expiry_date, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(id, active, title, content, expiryDate).run();

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