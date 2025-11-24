/**
 * Debug endpoint - REMOVE AFTER DEBUGGING
 * GET /api/debug - Check environment variable availability
 */

export async function onRequestGet(context) {
    const { env } = context;

    // Don't expose actual values, just check if they exist
    const debugInfo = {
        hasAdminPassword: !!env.ADMIN_PASSWORD,
        hasAdminSecret: !!env.ADMIN_SECRET,
        hasR2Bucket: !!env.R2_BUCKET,
        envKeys: Object.keys(env || {}),
        timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(debugInfo, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
