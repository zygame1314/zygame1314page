import https from 'https';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const gamesPerPage = 5;

    try {
        const data = await new Promise((resolve, reject) => {
            https.get('https://store.steampowered.com/api/featured', (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    if (resp.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`Steam API Error: ${resp.statusCode}`));
                    }
                });
            }).on('error', reject);
        });

        const parsedData = JSON.parse(data);

        const popularGames = parsedData.featured_win.slice(0, gamesPerPage).map(game => ({
            id: game.id,
            name: game.name,
            background_image: game.large_capsule_image,
            released: game.release_date,
            rating: game.review_score
        }));

        res.status(200).json({
            results: popularGames,
            count: popularGames.length
        });

    } catch (error) {
        console.error('Steam API Error:', error);
        res.status(500).json({
            error: 'Failed to fetch popular Steam games',
            message: error.message
        });
    }
}