export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
    try {
        const url = new URL(context.request.url);
        const lat = url.searchParams.get('lat');
        const lon = url.searchParams.get('lon');
        if (!lat || !lon) {
            return new Response(JSON.stringify({
                error: 'MISSING_COORDS',
                message: '缺少经纬度参数'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        const params = new URLSearchParams({
            lat,
            lon,
            appid: context.env.WEATHER_API_KEY,
            units: 'metric',
            lang: 'zh_cn'
        });
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?${params}`
        );
        if (!response.ok) {
            throw new Error(`天气 API 错误: ${response.status}`);
        }
        const weatherData = await response.json();
        const responseData = {
            weather: weatherData,
            location: {
                city: weatherData.name
            }
        };
        return new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('API 错误:', error);
        return new Response(JSON.stringify({
            error: '获取数据失败',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}