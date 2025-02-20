export async function onRequest(context) {
    try {
        const KV = context.env.STATUS_HISTORY;
        if (!KV) {
            throw new Error('未找到 STATUS_HISTORY KV 绑定，请在 Cloudflare Pages 设置中检查 KV 绑定');
        }

        const now = new Date();
        const currentHour = now.toISOString().slice(0, 13);
        const previousHour = new Date(now - 3600000).toISOString().slice(0, 13);

        let currentData = [], previousData = [];
        try {
            [currentData, previousData] = await Promise.all([
                KV.get(`status-${currentHour}`, 'json'),
                KV.get(`status-${previousHour}`, 'json')
            ]);
        } catch (kvError) {
            console.error('KV 读取失败:', kvError);
            throw new Error('读取状态历史记录失败');
        }

        currentData = Array.isArray(currentData) ? currentData : [];
        previousData = Array.isArray(previousData) ? previousData : [];

        const combinedHistory = [...currentData, ...previousData];

        if (combinedHistory.length === 0) {
            return new Response(JSON.stringify([]), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        const sortedHistory = combinedHistory.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        return new Response(JSON.stringify(sortedHistory), {
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