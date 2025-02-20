export async function onRequest(context) {
    const KV = context.env.STATUS_HISTORY;

    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13);
    const previousHour = new Date(now - 3600000).toISOString().slice(0, 13);

    const [currentData, previousData] = await Promise.all([
        KV.get(`status-${currentHour}`, 'json'),
        KV.get(`status-${previousHour}`, 'json')
    ]);

    const combinedHistory = [];
    if (currentData) combinedHistory.push(...currentData);
    if (previousData) combinedHistory.push(...previousData);

    const sortedHistory = combinedHistory.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    return new Response(JSON.stringify(sortedHistory), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}