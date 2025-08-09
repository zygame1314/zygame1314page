// A (very) simple JWT library
const a = (s) => new TextEncoder().encode(s)
const b = (s) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
const sign = (p, k) => crypto.subtle.sign('HMAC', k, p).then(s => b(String.fromCharCode(...new Uint8Array(s))))
const _alg = 'HS256'

async function createToken(data, secret) {
    const i = { alg: _alg, typ: 'JWT' }
    const k = await crypto.subtle.importKey('raw', a(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const p = `${b(JSON.stringify(i))}.${b(JSON.stringify(data))}`
    const s = await sign(p, k)
    return `${p}.${s}`
}

async function verifyToken(token, secret) {
    try {
        const [h, p, s] = token.split('.')
        const k = await crypto.subtle.importKey('raw', a(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
        if (s !== await sign(`${h}.${p}`, k)) throw new Error('Invalid signature')
        return JSON.parse(atob(p))
    } catch (e) {
        throw new Error('Invalid token')
    }
}


export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { username, password } = await request.json();
        
        // --- IMPORTANT ---
        // These secrets should be set in your Cloudflare Pages project settings
        // `ADMIN_USERNAME` and `ADMIN_PASSWORD`
        const ADMIN_USER = env.ADMIN_USERNAME;
        const ADMIN_PASS = env.ADMIN_PASSWORD;
        const JWT_SECRET = env.JWT_SECRET; // Should be a long, random string

        if (!ADMIN_USER || !ADMIN_PASS || !JWT_SECRET) {
            return new Response(JSON.stringify({ error: '服务未正确配置' }), { status: 500 });
        }

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            const token = await createToken({
                user: username,
                // expires in 1 day
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) 
            }, JWT_SECRET);
            
            return new Response(JSON.stringify({ success: true, token }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401 });
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器内部错误' }), { status: 500 });
    }
}


export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
    }

    const token = authHeader.split(' ');
    
    try {
        const JWT_SECRET = env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error("JWT secret not configured");

        const decoded = await verifyToken(token, JWT_SECRET);
        
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            return new Response(JSON.stringify({ error: '令牌已过期' }), { status: 401 });
        }
        
        return new Response(JSON.stringify({ success: true, user: decoded.user }), { status: 200 });

    } catch (e) {
        return new Response(JSON.stringify({ error: '无效的令牌' }), { status: 401 });
    }
}