/**
 * Middleware for API routes
 * Handles CORS and authentication
 */

// Helper to create CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

// Verify JWT token
async function verifyToken(token, env) {
    if (!token || !env.ADMIN_SECRET) {
        return false;
    }

    try {
        // Simple token verification - the token is just the hashed password
        // In production, use proper JWT verification
        const expectedToken = await hashPassword(env.ADMIN_PASSWORD, env.ADMIN_SECRET);
        return token === expectedToken;
    } catch (e) {
        console.error('Token verification error:', e);
        return false;
    }
}

// Hash password with secret
async function hashPassword(password, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
    const { request, env, next } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders()
        });
    }

    // Public endpoints that don't require auth
    const url = new URL(request.url);
    const publicPaths = ['/api/auth'];
    const isPublic = publicPaths.some(path => url.pathname === path);

    if (!isPublic) {
        // Check authorization
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!await verifyToken(token, env)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders()
                }
            });
        }
    }

    // Continue to the handler
    const response = await next();

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}
