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
        let lat = url.searchParams.get('lat');
        let lon = url.searchParams.get('lon');
        let useIP = url.searchParams.get('useIP') === 'true';

        if (useIP || (!lat && !lon)) {
            if (context.request.cf && context.request.cf.latitude && context.request.cf.longitude) {
                lat = context.request.cf.latitude;
                lon = context.request.cf.longitude;
            } else {
                return new Response(JSON.stringify({
                    error: 'IP_LOCATION_FAILED',
                    message: '无法获取IP地理位置信息'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        }

        if (!lat || !lon) {
            throw new Error('缺少经纬度参数');
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