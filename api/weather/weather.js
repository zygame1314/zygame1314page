import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            throw new Error('缺少经纬度参数');
        }

        const params = querystring.stringify({
            lat,
            lon,
            appid: process.env.WEATHER_API_KEY,
            units: 'metric',
            lang: 'zh_cn'
        });

        const weatherData = await new Promise((resolve, reject) => {
            https.get(`https://api.openweathermap.org/data/2.5/weather?${params}`, (resp) => {
                let data = '';
                resp.on('data', (chunk) => data += chunk);
                resp.on('end', () => {
                    if (resp.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`天气 API 错误: ${resp.statusCode}`));
                    }
                });
            }).on('error', reject);
        });

        const responseData = {
            weather: weatherData,
            location: {
                city: weatherData.name
            }
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error('API 错误:', error);
        res.status(500).json({
            error: '获取数据失败',
            message: error.message
        });
    }
}