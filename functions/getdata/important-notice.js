export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results } = await env.DB.prepare(`
            SELECT
                id, active, title, content, expiry_date as expiryDate,
                image_url, image_alt, image_position, image_width, image_height,
                poll_config
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

        const rawNotice = results[0];

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
        const { id, active, title, content, expiryDate, image, poll } = await request.json();

        const imageUrl = image && image.url ? image.url : null;
        const imageAlt = image && image.alt ? image.alt : null;
        const imagePosition = image && image.position ? image.position : null;
        const imageWidth = image && image.width ? image.width : null;
        const imageHeight = image && image.height ? image.height : null;

        const pollConfig = poll && poll.active ? JSON.stringify(poll) : null;

        await env.DB.prepare(`
            INSERT OR REPLACE INTO important_notices
                (id, active, title, content, expiry_date,
                 image_url, image_alt, image_position, image_width, image_height,
                 poll_config, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            id, active, title, content, expiryDate,
            imageUrl, imageAlt, imagePosition, imageWidth, imageHeight,
            pollConfig
        ).run();

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