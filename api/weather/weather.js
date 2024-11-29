import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
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

        const reverseGeocodingParams = querystring.stringify({
            lat,
            lon,
            key: process.env.AMAP_KEY
        });

        const location = await new Promise((resolve, reject) => {
            https.get(`https://restapi.amap.com/v3/geocode/regeo?${reverseGeocodingParams}`, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        if (!parsedData || typeof parsedData !== 'object') {
                            reject(new Error('无效的位置 API 响应'));
                            return;
                        }
                        resolve({
                            city: parsedData.regeocode?.addressComponent?.city || '未知城市',
                            province: parsedData.regeocode?.addressComponent?.province || '未知省份'
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        res.status(200).json({
            location,
            weather: weatherData
        });

    } catch (error) {
        console.error('API 错误:', error);
        res.status(500).json({
            error: '获取数据失败',
            message: error.message
        });
    }
}