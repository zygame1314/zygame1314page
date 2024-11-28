import https from 'https';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const clientIP = req.headers['x-real-ip'];

        const data = await new Promise((resolve, reject) => {
            const apiUrl = `https://restapi.amap.com/v3/ip?ip=${clientIP}&key=${process.env.AMAP_KEY}`;

            https.get(apiUrl, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        if (!parsedData || typeof parsedData !== 'object') {
                            reject(new Error('Invalid API response'));
                            return;
                        }
                        resolve(parsedData);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        if (data.status !== '1') {
            throw new Error(data.info || 'API request failed');
        }

        res.status(200).json({
            lat: parseFloat(data.rectangle?.split(',')[1]) || 39.9042,
            lon: parseFloat(data.rectangle?.split(',')[0]) || 116.4074,
            city: data.city || '未知城市',
            province: data.province || '未知省份'
        });

    } catch (error) {
        console.error('Location API Error:', error);
        res.status(200).json({
            lat: 39.9042,
            lon: 116.4074,
            city: '北京市',
            province: '北京市'
        });
    }
}