export default {
    async fetch() {
        const startTime = Date.now();

        try {
            const response = await fetch('https://zygame1314.site');
            const endTime = Date.now();

            if (response.ok) {
                return new Response(JSON.stringify({
                    status: 'online',
                    responseTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    statusCode: response.status
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            throw new Error(`Status: ${response.status}`);

        } catch (error) {
            return new Response(JSON.stringify({
                status: 'offline',
                error: error.message,
                timestamp: new Date().toISOString()
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};