import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
    // CORS 配置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const gamesPerPage = 5;
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const params = querystring.stringify({
        key: process.env.RAWG_API_KEY,
        dates: `${formatDate(thirtyDaysAgo)},${formatDate(currentDate)}`,
        ordering: '-added',
        page_size: gamesPerPage
    });

    const requestUrl = `https://api.rawg.io/api/games?${params}`;

    try {
        const data = await new Promise((resolve, reject) => {
            https.get(requestUrl, (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    if (resp.statusCode >= 200 && resp.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`RAWG API Error: ${resp.statusCode}`));
                    }
                });
            }).on('error', reject);
        });

        const parsedData = JSON.parse(data);
        res.status(200).json({
            results: parsedData.results.slice(0, 5),
            count: 5
        });

    } catch (error) {
        console.error('RAWG API Error:', error);
        res.status(500).json({
            error: 'Failed to fetch popular games',
            message: error.message
        });
    }
}