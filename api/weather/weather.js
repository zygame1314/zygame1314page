import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const clientIP = req.headers['x-real-ip'];
        const locationData = await new Promise((resolve, reject) => {
            const apiUrl = `https://restapi.amap.com/v3/ip?ip=${clientIP}&key=${process.env.AMAP_KEY}`;

            https.get(apiUrl, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        if (!parsedData || typeof parsedData !== 'object') {
                            reject(new Error('无效的位置 API 响应'));
                            return;
                        }
                        resolve(parsedData);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        const params = querystring.stringify({
            q: location.city,
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

        res.status(200).json({
            location,
            weather: {
                ...weatherData,
                name: location.city
            }
        });

    } catch (error) {
        console.error('API 错误:', error);
        res.status(200).json({
            lat: 39.9042,
            lon: 116.4074,
            city: '北京市',
            province: '北京市'
        });
    }
}