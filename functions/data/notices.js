export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results } = await env.DB.prepare(`
            SELECT title, icon, content
            FROM notices
            ORDER BY id ASC
        `).all();

        const notices = results.map(notice => ({
            title: notice.title,
            icon: notice.icon,
            content: JSON.parse(notice.content)
        }));

        return new Response(JSON.stringify({
            notices: notices
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
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