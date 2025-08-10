const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
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
      'Cache-Control': 'public, max-age=300',
      ...corsHeaders
    });

    return new Response(responseBody, { status: 200, headers });

  } catch (error) {
    console.error("Failed to fetch scripts from D1:", error);

    const errorBody = JSON.stringify({ error: "Failed to retrieve script list." });
    const headers = new Headers({
      'Content-Type': 'application/json;charset=UTF-8',
      ...corsHeaders
    });
    
    return new Response(errorBody, { status: 500, headers });
  }
}
