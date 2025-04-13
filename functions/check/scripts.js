export async function onRequestGet(context) {
    const { env } = context;
    const bucket = env.SCRIPT_BUCKET;

    const r2PublicUrlBase = env.R2_PUBLIC_URL_BASE;
  
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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
  
        let publicUrl = '';
        if (r2PublicUrlBase) {
            publicUrl = `${r2PublicUrlBase.replace(/\/$/, '')}/${obj.key}`;
        }
         else {
            console.warn(`Cannot construct public URL for ${obj.key} due to missing environment variables.`);
            continue;
        }
        // --------------------------
  
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
      return new Response(JSON.stringify({ error: 'Failed to retrieve script list' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }