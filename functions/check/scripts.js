const CACHE_KEY = 'scripts-list';
const CACHE_TTL = 300;

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const cache = caches.default;
    const cacheUrl = new URL(context.request.url);
    cacheUrl.searchParams.set('cache', CACHE_KEY);
    const cacheRequest = new Request(cacheUrl.toString());

    const cached = await cache.match(cacheRequest);
    if (cached) {
      return cached;
    }

    const stmt = env.DB.prepare("SELECT name, version, size, uploaded_at, download_url FROM scripts ORDER BY name ASC");
    const { results } = await stmt.all();
    const transformedResults = results.map(script => ({
      name: script.name,
      version: script.version,
      size: script.size,
      uploaded: script.uploaded_at,
      downloadUrl: script.download_url,
      key: script.name
    }));
    const responseBody = JSON.stringify(transformedResults, null, 2);
    const headers = new Headers({
      'Content-Type': 'application/json;charset=UTF-8',
      'Cache-Control': 'public, max-age=300'
    });
    const response = new Response(responseBody, { status: 200, headers });

    context.waitUntil(cache.put(cacheRequest, response.clone()));

    return response;
  } catch (error) {
    console.error("Failed to fetch scripts from D1:", error);
    const errorBody = JSON.stringify({ error: "Failed to retrieve script list." });
    const headers = new Headers({
      'Content-Type': 'application/json;charset=UTF-8',
    });
    return new Response(errorBody, { status: 500, headers });
  }
}
