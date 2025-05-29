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
    console.log(`[Middleware] Crawler detected for article path.`);
    const articleId = pathname.substring('/article/'.length).split('?')[0].split('#')[0];
    console.log(`[Middleware] Extracted Article ID: ${articleId}`);

    if (articleId && !articleId.includes('..') && !articleId.includes('/')) {
      try {
        const articleAssetPath = `/articles/content/${articleId}.html`;
        console.log(`[Middleware] Attempting to fetch asset: ${articleAssetPath}`);

        const assetRequestUrl = new URL(articleAssetPath, "https://placeholder.com");
        const articleResponse = await env.ASSETS.fetch(new Request(assetRequestUrl.pathname, {
        }));


        console.log(`[Middleware] Asset fetch status: ${articleResponse.status}`);

        if (articleResponse.ok) {
          console.log(`[Middleware] Asset fetched successfully. Returning pre-rendered content.`);
          const responseHeaders = new Headers(articleResponse.headers);
          responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
          return new Response(articleResponse.body, {
            headers: responseHeaders,
            status: 200
          });
        } else if (articleResponse.status === 404) {
          console.log(`[Middleware] Article asset not found: ${articleAssetPath}`);
        } else {
          console.error(`[Middleware] Error fetching article asset: ${articleAssetPath}, status: ${articleResponse.status}`);
        }
      } catch (error) {
        console.error(`[Middleware] Exception during asset fetch for article ${articleId}:`, error);
      }
    } else {
      console.log(`[Middleware] Invalid Article ID: ${articleId}`);
    }
  } else {
    console.log(`[Middleware] Not a crawler or not an article path. Passing to next handler.`);
  }

  console.log(`[Middleware End] Calling next() for path: ${pathname}`);
  return next();
}