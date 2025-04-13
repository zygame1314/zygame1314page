
const R2_PUBLIC_URL_BASE = 'https://pub-454979210b904aba896d4c9675693374.r2.dev';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestGet(context) {
    const { env } = context;
    const bucket = env.SCRIPT_BUCKET;

    const createJsonResponse = (body, status) => {
        const headers = new Headers({
            'Content-Type': 'application/json',
            ...corsHeaders
        });
        if (status === 200) {
            headers.set('Cache-Control', 'public, max-age=60');
        }
        return new Response(JSON.stringify(body), { status, headers });
    };

    if (!bucket) {
      return createJsonResponse({ error: 'R2 bucket not bound in Pages Function environment' }, 500);
    }

    if (!R2_PUBLIC_URL_BASE) {
        console.error('Hardcoded R2_PUBLIC_URL_BASE is empty!');
        return createJsonResponse({ error: 'Server configuration error: R2 public URL base is missing' }, 500);
    }

    try {
      const listed = await bucket.list({});
      const scriptsData = [];

      for (const obj of listed.objects) {
        if (!obj.key.endsWith('.user.js')) {
          continue;
        }

        const head = await bucket.head(obj.key);
        if (!head) continue;

        const publicUrl = `${R2_PUBLIC_URL_BASE.replace(/\/$/, '')}/${obj.key}`;

        scriptsData.push({
          key: obj.key,
          name: head.customMetadata?.scriptName || obj.key,
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