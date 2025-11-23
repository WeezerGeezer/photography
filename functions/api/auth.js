/**
 * Authentication endpoint
 * POST /api/auth - Authenticate with password
 */

// Hash password with secret
async function hashPassword(password, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { password } = body;

        // Check if environment variables are set
        if (!env.ADMIN_PASSWORD || !env.ADMIN_SECRET) {
            console.error('Missing ADMIN_PASSWORD or ADMIN_SECRET environment variables');
            return new Response(JSON.stringify({
                error: 'Server configuration error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify password
        if (password !== env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({
                error: 'Invalid password'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate token
        const token = await hashPassword(password, env.ADMIN_SECRET);

        return new Response(JSON.stringify({
            success: true,
            token
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auth error:', error);
        return new Response(JSON.stringify({
            error: 'Authentication failed'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
