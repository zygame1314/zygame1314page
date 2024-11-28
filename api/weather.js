import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { city } = req.query;

    if (!city) {
        return res.status(400).json({
            error: 'Missing city parameter'
        });
    }

    const params = querystring.stringify({
        q: city,
        appid: process.env.WEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_cn'
    });

    try {
        const data = await new Promise((resolve, reject) => {
            https.get(`https://api.openweathermap.org/data/2.5/weather?${params}`, (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    if (resp.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`Weather API Error: ${resp.statusCode}`));
                    }
                });
            }).on('error', reject);
        });

        const parsedData = JSON.parse(data);
        parsedData.name = city;
        res.status(200).json(parsedData);

    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({
            error: 'Failed to fetch weather data',
            message: error.message
        });
    }
}