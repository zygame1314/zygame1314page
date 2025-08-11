export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS' && pathname.startsWith('/functions/')) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  const rawUserAgent = request.headers.get('User-Agent') || '无User-Agent';

  console.log(`[中间件开始] 请求路径: ${pathname}, User-Agent: ${rawUserAgent}, 完整URL: ${request.url}`);

  const crawlerUserAgents = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
    'YandexBot', 'Sogou', 'Exabot', 'facebot', 'facebookexternalhit',
    'ia_archiver', 'LinkedInBot', 'Twitterbot', 'Pinterestbot'
  ];

  const isCrawler = crawlerUserAgents.some(crawler => rawUserAgent.toLowerCase().includes(crawler.toLowerCase()));
  console.log(`[中间件信息] 是否为爬虫: ${isCrawler}`);

  if (isCrawler && pathname.startsWith('/article/')) {
    console.log(`[中间件信息] 检测到爬虫访问文章路径: ${pathname}`);
    const articleId = pathname.substring('/article/'.length).split('?')[0].split('#')[0];
    console.log(`[中间件信息] 提取的文章ID: ${articleId}`);

    if (articleId && !articleId.includes('..') && !articleId.includes('/')) {
      try {
        const articleAssetRelativePath = `/articles/content/${articleId}.html`;
        console.log(`[中间件信息] 尝试从相对路径获取静态资源: ${articleAssetRelativePath}`);
        const assetFullUrl = new URL(articleAssetRelativePath, url.origin).toString();
        console.log(`[中间件信息] 构建的静态资源完整URL: ${assetFullUrl}`);

        const articleResponse = await env.ASSETS.fetch(new Request(assetFullUrl));
        console.log(`[中间件信息] 文章静态资源获取状态 (${assetFullUrl}): ${articleResponse.status}`);

        if (articleResponse.ok) {
          console.log(`[中间件成功] 成功获取文章静态资源 ${assetFullUrl}。正在返回预渲染内容。`);
          const responseHeaders = new Headers(articleResponse.headers);
          responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
          return new Response(articleResponse.body, {
            headers: responseHeaders,
            status: 200
          });
        } else if (articleResponse.status === 404) {
          console.log(`[中间件警告] 未找到文章静态资源 ${assetFullUrl}。尝试提供自定义404页面。`);
          try {
            const custom404PagePath = "/custom/404.html";
            const custom404FullUrl = new URL(custom404PagePath, url.origin).toString();
            console.log(`[中间件信息] 尝试获取自定义404页面: ${custom404FullUrl}`);
            const custom404Response = await env.ASSETS.fetch(new Request(custom404FullUrl));

            if (custom404Response.ok) {
              console.log(`[中间件成功] 找到自定义404页面。以404状态码提供其内容。`);
              const responseHeaders = new Headers(custom404Response.headers);
              responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
              return new Response(custom404Response.body, {
                headers: responseHeaders,
                status: 404
              });
            } else {
              console.warn(`[中间件警告] 自定义404页面 (${custom404FullUrl}) 获取失败，状态码: ${custom404Response.status}。将返回通用404文本。`);
              return new Response('页面未找到 (自定义404页面亦不可用)', {
                status: 404,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
              });
            }
          } catch (custom404Error) {
            console.error(`[中间件错误] 获取自定义404页面时发生异常:`, custom404Error.message, custom404Error.stack);
            return new Response('页面未找到 (处理自定义404页面时发生错误)', {
              status: 404,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          }
        } else {
          console.error(`[中间件错误] 获取文章静态资源 ${assetFullUrl} 失败，状态码: ${articleResponse.status}。将调用 next()。`);
        }
      } catch (error) {
        console.error(`[中间件异常] 为文章ID ${articleId} (路径 ${pathname}) 获取静态资源时发生异常:`, error.message, error.stack);
        console.error(`[中间件异常] 尝试获取的相对路径: ${articleAssetRelativePath}，基准Origin: ${url.origin}`);
      }
    } else {
      console.log(`[中间件警告] 从路径 ${pathname} 提取的文章ID无效: '${articleId}'。将调用 next()。`);
    }
  } else {
    console.log(`[中间件信息] 非爬虫请求或非文章路径。将传递给下一个处理器。`);
  }

  console.log(`[中间件结束] 针对路径 ${pathname} 调用 next()。`);
  const response = await next();

  if (pathname.startsWith('/functions/')) {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}