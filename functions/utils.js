const a = (s) => new TextEncoder().encode(s);
const b = (s) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const sign = (p, k) => crypto.subtle.sign('HMAC', k, a(p)).then(s => b(String.fromCharCode(...new Uint8Array(s))));
export async function verifyToken(token, secret) {
    try {
        const [h, p, s] = token.split('.');
        const k = await crypto.subtle.importKey('raw', a(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        if (s !== await sign(`${h}.${p}`, k)) throw new Error('Invalid signature');
        const decoded = JSON.parse(atob(p));
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token has expired');
        }
        return decoded;
    } catch (e) {
        throw new Error(`Invalid token: ${e.message}`);
    }
}
export async function requireAuth(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未授权：缺少凭证' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
        const JWT_SECRET = env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not configured in environment variables.");
            return new Response(JSON.stringify({ error: '服务未正确配置' }), { status: 500 });
        }
        await verifyToken(token, JWT_SECRET);
        return null;
    } catch (e) {
        return new Response(JSON.stringify({ error: `认证失败: ${e.message}` }), { status: 401 });
    }
}