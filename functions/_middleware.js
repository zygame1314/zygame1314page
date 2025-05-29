export async function onRequest(context) {
  const { request, next, env } = context;
  const rawUserAgent = request.headers.get('User-Agent') || 'N/A';
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log(`[Middleware Start] Path: ${pathname}, User-Agent: ${rawUserAgent}, URL: ${request.url}`);

  const crawlerUserAgents = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
    'YandexBot', 'Sogou', 'Exabot', 'facebot', 'facebookexternalhit',
    'ia_archiver', 'LinkedInBot', 'Twitterbot', 'Pinterestbot'
  ];

  const isCrawler = crawlerUserAgents.some(crawler => rawUserAgent.toLowerCase().includes(crawler.toLowerCase()));
  console.log(`[Middleware] Is Crawler: ${isCrawler}`);

  if (isCrawler && pathname.startsWith('/article/')) {
    console.log(`[Middleware] Crawler detected for article path: ${pathname}`);
    const articleId = pathname.substring('/article/'.length).split('?')[0].split('#')[0];
    console.log(`[Middleware] Extracted Article ID: ${articleId}`);

    if (articleId && !articleId.includes('..') && !articleId.includes('/')) {
      try {
        const articleAssetRelativePath = `/articles/content/${articleId}.html`;
        console.log(`[Middleware] Attempting to fetch asset from relative path: ${articleAssetRelativePath}`);

        const assetFullUrl = new URL(articleAssetRelativePath, url.origin).toString();

        console.log(`[Middleware] Constructed full URL for asset fetch: ${assetFullUrl}`);

        const articleResponse = await env.ASSETS.fetch(new Request(assetFullUrl));

        console.log(`[Middleware] Asset fetch status for ${assetFullUrl}: ${articleResponse.status}`);

        if (articleResponse.ok) {
          console.log(`[Middleware] Asset ${assetFullUrl} fetched successfully. Returning pre-rendered content.`);
          const responseHeaders = new Headers(articleResponse.headers);
          responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
          return new Response(articleResponse.body, {
            headers: responseHeaders,
            status: 200
          });
        } else if (articleResponse.status === 404) {
          console.log(`[Middleware] Article asset not found at ${assetFullUrl}. Will call next() to allow SPA fallback or 404 from static.`);
        } else {
          console.error(`[Middleware] Error fetching article asset ${assetFullUrl}, status: ${articleResponse.status}. Will call next().`);
        }
      } catch (error) {
        console.error(`[Middleware] Exception during asset fetch for article ID ${articleId} (path ${pathname}):`, error.message, error.stack);
        console.error(`[Middleware] Attempted to fetch: ${articleAssetRelativePath} relative to ${url.origin}`);
      }
    } else {
      console.log(`[Middleware] Invalid Article ID extracted: '${articleId}' from path: ${pathname}. Will call next().`);
    }
  } else {
    console.log(`[Middleware] Not a crawler or not an article path. Passing to next handler.`);
  }

  console.log(`[Middleware End] Calling next() for path: ${pathname}`);
  return next();
}