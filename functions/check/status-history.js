export async function onRequest(context) {
    try {
        const DB = context.env.STATUS_DB;
        if (!DB) {
            throw new Error('未找到 STATUS_DB 数据库绑定，请在 Cloudflare Pages 设置中检查 D1 绑定');
        }

        const now = new Date();
        const fiveHoursAgo = new Date(now.getTime() - 5 * 3600000).toISOString();
        
        const { results: allData, error } = await DB.prepare(
            `SELECT url, status, responseTime, timestamp, statusCode, error 
             FROM status_history 
             WHERE timestamp >= ? 
             ORDER BY timestamp DESC`
        ).bind(fiveHoursAgo).all();
        
        if (error) {
            console.error('数据库查询错误:', error);
            throw new Error('读取状态历史记录失败');
        }

        if (!allData || allData.length === 0) {
            return new Response(JSON.stringify([]), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        return new Response(JSON.stringify(allData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Worker 错误:', error);

        return new Response(JSON.stringify({
            error: error.message || '内部服务器错误',
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });
    }
}