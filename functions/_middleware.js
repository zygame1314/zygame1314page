export async function onRequest(context) {
  const { request, next, env } = context;
  const userAgent = request.headers.get('User-Agent') || '';
  const url = new URL(request.url);
  const pathname = url.pathname;

  const crawlerUserAgents = [
    'Googlebot',
    'Bingbot',
    'Slurp',
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'facebot',
    'facebookexternalhit',
    'ia_archiver',
    'LinkedInBot',
    'Twitterbot',
    'Pinterestbot'
  ];

  const isCrawler = crawlerUserAgents.some(crawler => userAgent.toLowerCase().includes(crawler.toLowerCase()));

  if (isCrawler && pathname.startsWith('/article/')) {
    const articleId = pathname.substring('/article/'.length);
    if (articleId && !articleId.includes('..') && !articleId.includes('/')) {
      try {
        const articleUrl = new URL(`/articles/content/${articleId}.html`, request.url);
        const articleResponse = await env.ASSETS.fetch(new Request(articleUrl, request));

        if (articleResponse.ok) {
          return new Response(articleResponse.body, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200
          });
        } else if (articleResponse.status === 404) {
          console.log(`Article not found for crawler: ${articleId}`);
        } else {
          console.error(`Error fetching article for crawler: ${articleId}, status: ${articleResponse.status}`);
        }
      } catch (error) {
        console.error(`Error processing crawler request for article ${articleId}:`, error);
      }
    }
  }

  return next();
}