/**
 * Gallery Order API endpoint
 * POST /api/gallery-order - Save custom photo order for main gallery
 */

const R2_PUBLIC_URL = 'https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev';

// Helper to get albums.json from R2
async function getAlbumsData(env) {
    try {
        const object = await env.R2_BUCKET.get('data/albums.json');
        if (!object) {
            return {};
        }
        const text = await object.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Error reading albums.json:', error);
        return {};
    }
}

// Helper to save albums.json to R2
async function saveAlbumsData(env, data) {
    const jsonString = JSON.stringify(data, null, 4);
    await env.R2_BUCKET.put('data/albums.json', jsonString, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { orderUpdates } = body;

        if (!orderUpdates || !Array.isArray(orderUpdates)) {
            return new Response(JSON.stringify({
                error: 'Missing or invalid orderUpdates'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current albums
        const albums = await getAlbumsData(env);

        // Apply order updates to each photo
        orderUpdates.forEach(update => {
            const { albumKey, photoId, order } = update;

            if (albums[albumKey] && albums[albumKey].images) {
                const photoIndex = albums[albumKey].images.findIndex(img => img.id === photoId);
                if (photoIndex !== -1) {
                    albums[albumKey].images[photoIndex].order = order;
                }
            }
        });

        // Save to R2
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            updatedCount: orderUpdates.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Save gallery order error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to save gallery order'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
