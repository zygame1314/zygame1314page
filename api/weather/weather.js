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
                        if (!parsedData || typeof parsedData !== 'object' || parsedData.status === '0') {
                            resolve({
                                status: '1',
                                rectangle: '116.4074,39.9042,116.4074,39.9042',
                                city: '北京市',
                                province: '北京市'
                            });
                            return;
                        }
                        resolve(parsedData);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', (err) => {
                resolve({
                    status: '1',
                    rectangle: '116.4074,39.9042,116.4074,39.9042',
                    city: '北京市',
                    province: '北京市'
                });
            });
        });

        const location = {
            lat: parseFloat(locationData.rectangle?.split(',')[1]) || 39.9042,
            lon: parseFloat(locationData.rectangle?.split(',')[0]) || 116.4074,
            city: locationData.city || '北京市',
            province: locationData.province || '北京市'
        };

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
        res.status(500).json({
            error: '获取数据失败',
            message: error.message
        });
    }
}