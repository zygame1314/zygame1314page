export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const headers = {
        "Content-Type": "application/json"
    };
    try {
        const url = new URL(context.request.url);
        const noticeId = url.searchParams.get("id");
        if (!noticeId) {
            return new Response(JSON.stringify({
                error: "缺少通知ID参数"
            }), {
                status: 400,
                headers: headers
            });
        }
        const kv = context.env.POLL_RESULTS;
        let results = await kv.get(`results_${noticeId}`);
        if (!results) {
            results = "[]";
        }
        const parsedResults = JSON.parse(results);
        parsedResults.sort((a, b) => b.count - a.count);
        return new Response(JSON.stringify({
            success: true,
            results: parsedResults
        }), {
            headers: headers
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: "获取投票结果失败",
            details: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
