import https from 'https';
import querystring from 'querystring';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const steamAPIKey = process.env.STEAM_API_KEY;
    const steamID = process.env.STEAM_ID;

    const params = querystring.stringify({
        key: steamAPIKey,
        steamid: steamID,
        format: 'json',
        count: 4
    });

    try {
        const data = await new Promise((resolve, reject) => {
            https.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?${params}`, (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    if (resp.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`Steam API returned ${resp.statusCode}`));
                    }
                });
            }).on('error', reject);
        });

        const parsedData = JSON.parse(data);
        res.status(200).json(parsedData);

    } catch (error) {
        console.error('Steam API Error:', error);
        res.status(500).json({
            error: 'Failed to fetch Steam games data',
            message: error.message
        });
    }
}