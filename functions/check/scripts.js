const R2_PUBLIC_URL_BASE = 'https://pub-454979210b904aba896d4c9675693374.r2.dev';

export async function onRequestGet(context) {
    const { env } = context;
    const bucket = env.SCRIPT_BUCKET;

    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not bound in Pages Function environment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!R2_PUBLIC_URL_BASE) {
        console.error('Hardcoded R2_PUBLIC_URL_BASE is empty!');
        return new Response(JSON.stringify({ error: 'Server configuration error: R2 public URL base is missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      const listed = await bucket.list({
      });

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

      return new Response(JSON.stringify(scriptsData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        },
      });

    } catch (error) {
      console.error('Error listing R2 bucket:', error);
      return new Response(JSON.stringify({ error: 'Failed to retrieve script list from R2' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
}