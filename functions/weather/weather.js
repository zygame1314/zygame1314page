const DEFAULT_LOCATION = { lat: 60.1695, lon: 24.9354, city: '天际省' };

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestGet(context) {
    try {
        const cf = context.request.cf || {};
        let lat = cf.latitude;
        let lon = cf.longitude;
        const city = cf.city;
        const isDefault = !lat || !lon;

        if (isDefault) {
            lat = DEFAULT_LOCATION.lat;
            lon = DEFAULT_LOCATION.lon;
        }

        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
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
                city: isDefault ? DEFAULT_LOCATION.city : (city || weatherData.name)
            },
            isDefault
        };
        return new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
            }
        });
    }
}