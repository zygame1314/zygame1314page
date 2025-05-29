export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (request.method === 'GET') {
        try {
            if (!env.DB) {
                return new Response('D1 数据库绑定 (DB) 未找到。请检查 Pages 项目设置。', {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'text/plain',
                    }
                });
            }

            const stmt = env.DB.prepare(
                'SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants FROM articles ORDER BY date DESC'
            );
            const { results } = await stmt.all();

            if (results && results.length > 0) {
                const articles = results.map(article => ({
                    ...article,
                    tags: article.tags ? JSON.parse(article.tags) : [],
                    aiAssistants: article.aiAssistants ? JSON.parse(article.aiAssistants) : []
                }));

                return new Response(JSON.stringify(articles), {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                });
            } else {
                return new Response(JSON.stringify([]), {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (e) {
            console.error('从 D1 获取文章时出错:', e.message, e.stack);
            return new Response(`获取文章时出错: ${e.message}`, {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'text/plain',
                }
            });
        }
    }

    if (request.method === 'HEAD') {
        return new Response(null, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            }
        });
    }


    return new Response('方法不允许 (Method Not Allowed)', {
        status: 405,
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain',
            'Allow': 'GET, HEAD, OPTIONS',
        },
    });
}