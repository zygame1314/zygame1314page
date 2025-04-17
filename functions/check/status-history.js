export async function onRequest(context) {
    try {
        const DB = context.env.STATUS_DB;
        if (!DB) {
            throw new Error('未找到 STATUS_DB 数据库绑定，请在 Cloudflare Pages 设置中检查 D1 绑定');
        }

        const url = new URL(context.request.url);
        const minutes = parseInt(url.searchParams.get('minutes') || '60');

        const validMinutes = Math.min(Math.max(10, minutes), 10080);

        const samplingStrategy = getSamplingStrategy(validMinutes);

        const now = new Date();
        const startTime = new Date(now.getTime() - validMinutes * 60000).toISOString();

        let query = '';
        let params = [];

        if (samplingStrategy.type === 'all') {
            query = `SELECT url, status, responseTime, timestamp, statusCode, error 
                     FROM status_history 
                     WHERE timestamp >= ? 
                     ORDER BY timestamp DESC`;
            params = [startTime];
        } else if (samplingStrategy.type === 'interval') {
            query = `SELECT url, status, responseTime, timestamp, statusCode, error 
                     FROM status_history 
                     WHERE timestamp >= ?
                     AND (CAST(strftime('%M', timestamp) AS INTEGER) % ? = 0)
                     ORDER BY timestamp DESC`;
            params = [startTime, samplingStrategy.interval];
        } else if (samplingStrategy.type === 'limit') {
            const { results: sites } = await DB.prepare(
                `SELECT DISTINCT url FROM status_history WHERE timestamp >= ?`
            ).bind(startTime).all();

            let allData = [];
            for (const site of sites) {
                const { results: siteData } = await DB.prepare(
                    `SELECT url, status, responseTime, timestamp, statusCode, error 
                     FROM status_history 
                     WHERE url = ? AND timestamp >= ? 
                     ORDER BY timestamp DESC 
                     LIMIT ?`
                ).bind(site.url, startTime, samplingStrategy.limit).all();

                allData = [...allData, ...siteData];
            }

            return new Response(JSON.stringify(allData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        const { results: allData, error } = await DB.prepare(query).bind(...params).all();

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

function getSamplingStrategy(minutes) {
    if (minutes <= 60) {
        return { type: 'all' };
    } else if (minutes <= 720) {
        return { type: 'interval', interval: 60 };
    } else if (minutes <= 1440) {
        return { type: 'interval', interval: 120 };
    } else if (minutes <= 4320) {
        return { type: 'interval', interval: 360 };
    } else {
        return { type: 'interval', interval: 840 };
    }
}