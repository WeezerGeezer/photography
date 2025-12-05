/**
 * Gallery Order Reset API endpoint
 * POST /api/gallery-order/reset - Reset all photos to date-based order (removes order field)
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
        // Get current albums
        const albums = await getAlbumsData(env);

        // Remove order field from all photos
        let removedCount = 0;
        Object.keys(albums).forEach(albumKey => {
            if (albums[albumKey].images) {
                albums[albumKey].images.forEach(img => {
                    if (img.order !== undefined) {
                        delete img.order;
                        removedCount++;
                    }
                });
            }
        });

        // Save to R2
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            message: 'Gallery order reset to date-based sorting',
            removedCount
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Reset gallery order error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to reset gallery order'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
