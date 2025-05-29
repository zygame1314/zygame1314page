export async function onRequestGet(context) {
    const { env } = context;

    try {
        if (!env.DB) {
            return new Response('D1 数据库绑定 (DB) 未找到。请检查 Pages 项目设置。', { status: 500 });
        }

        const stmt = env.DB.prepare(
            'SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants FROM articles ORDER BY date DESC'
        );
        const { results } = await stmt.all();

        if (results) {
            const articles = results.map(article => ({
                ...article,
                tags: article.tags ? JSON.parse(article.tags) : [],
                aiAssistants: article.aiAssistants ? JSON.parse(article.aiAssistants) : []
            }));

            return new Response(JSON.stringify(articles), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } else {
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (e) {
        console.error('从 D1 获取文章时出错:', e.message, e.stack);
        return new Response(`获取文章时出错: ${e.message}`, { status: 500 });
    }
}