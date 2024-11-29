import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('原始请求URL:', req.url);
        console.log('请求参数:', req.query);

        const { lat, lon } = req.query;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error('经纬度参数格式无效');
        }

        if (!latitude || !longitude) {
            throw new Error('缺少经纬度参数');
        }

        const params = querystring.stringify({
            lat: latitude,
            lon: longitude,
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

        res.status(200).json(weatherData);

    } catch (error) {
        console.error('API 错误:', error);
        res.status(500).json({
            error: '获取数据失败',
            message: error.message
        });
    }
}