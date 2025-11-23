/**
 * Status endpoint
 * GET /api/status - Check R2 connection status
 */

export async function onRequestGet(context) {
    const { env } = context;

    try {
        // Check if R2 binding exists
        if (!env.R2_BUCKET) {
            return new Response(JSON.stringify({
                connected: false,
                error: 'R2 bucket not configured'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Try to list objects to verify connection
        const listed = await env.R2_BUCKET.list({ limit: 1 });

        return new Response(JSON.stringify({
            connected: true,
            bucket: 'photography-portfolio',
            objectCount: listed.objects.length > 0 ? 'Available' : 'Empty'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Status check error:', error);
        return new Response(JSON.stringify({
            connected: false,
            error: error.message
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
