const R2_PUBLIC_URL_BASE = 'https://bucket.zygame1314.top';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;
  const bucket = env.R2_BUCKET;

  const createJsonResponse = (body, status) => {
    const headers = new Headers({ 'Content-Type': 'application/json', ...corsHeaders });
    if (status === 200) { headers.set('Cache-Control', 'public, max-age=60'); }
    return new Response(JSON.stringify(body), { status, headers });
  };

  if (!bucket) { return createJsonResponse({ error: 'R2 bucket not bound' }, 500); }
  if (!R2_PUBLIC_URL_BASE) { return createJsonResponse({ error: 'Server config error: R2 URL base missing' }, 500); }

  try {
    const listed = await bucket.list({});
    const scriptsData = [];

    for (const obj of listed.objects) {
      if (!obj.key.endsWith('.user.js')) { continue; }

      const head = await bucket.head(obj.key);
      if (!head) continue;

      const publicUrl = `${R2_PUBLIC_URL_BASE.replace(/\/$/, '')}/${obj.key}`;

      const version = head.customMetadata?.scriptVersion || 'N/A';

      scriptsData.push({
        key: obj.key,
        name: head.customMetadata?.scriptName || obj.key,
        version: version,
        size: head.size,
        uploaded: head.uploaded.toISOString(),
        etag: head.httpEtag,
        downloadUrl: publicUrl
      });
    }

    scriptsData.sort((a, b) => a.name.localeCompare(b.name));

    return createJsonResponse(scriptsData, 200);

  } catch (error) {
    console.error('Error listing R2 bucket:', error);
    return createJsonResponse({ error: 'Failed to retrieve script list from R2' }, 500);
  }
}