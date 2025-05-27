export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results } = await env.DB.prepare(`
            SELECT id, title, image_url as imageUrl, github_url as githubUrl, 
                   description, type, actions
            FROM projects
            ORDER BY id ASC
        `).all();

        const projects = results.map(project => ({
            id: project.id,
            title: project.title,
            imageUrl: project.imageUrl,
            githubUrl: project.githubUrl,
            description: project.description,
            type: project.type,
            actions: project.actions ? JSON.parse(project.actions) : null
        }));

        return new Response(JSON.stringify({
            projects: projects
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
        const { id, title, imageUrl, githubUrl, description, type, actions } = await request.json();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO projects (id, title, image_url, github_url, description, type, actions, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            id,
            title,
            imageUrl,
            githubUrl,
            description,
            type || 'normal',
            actions ? JSON.stringify(actions) : null
        ).run();

        return new Response(JSON.stringify({
            success: true,
            id: id
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
            throw new Error('缺少项目ID');
        }

        await env.DB.prepare(`
            DELETE FROM projects WHERE id = ?
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