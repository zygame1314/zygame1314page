export async function onRequest(context) {
    try {
        const KV = context.env.STATUS_HISTORY;
        if (!KV) {
            throw new Error('未找到 STATUS_HISTORY KV 绑定，请在 Cloudflare Pages 设置中检查 KV 绑定');
        }

        const now = new Date();
        const promises = [];

        for (let i = 0; i < 5; i++) {
            const time = new Date(now - i * 3600000);
            const hourKey = time.toISOString().slice(0, 13);
            promises.push(KV.get(`status-${hourKey}`, 'json'));
        }

        let allData = [];
        try {
            const results = await Promise.all(promises);
            allData = results
                .filter(data => Array.isArray(data))
                .flat();
        } catch (kvError) {
            console.error('KV 读取失败:', kvError);
            throw new Error('读取状态历史记录失败');
        }

        if (allData.length === 0) {
            return new Response(JSON.stringify([]), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        const sortedHistory = allData.sort((a, b) =>
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