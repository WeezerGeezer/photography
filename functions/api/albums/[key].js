/**
 * Album API endpoint with dynamic key
 * DELETE /api/albums/[key] - Delete an album
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

export async function onRequestDelete(context) {
    const { params, env } = context;
    const { key } = params;

    try {
        // Get current albums
        const albums = await getAlbumsData(env);

        // Check if album exists
        if (!albums[key]) {
            return new Response(JSON.stringify({
                error: 'Album not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const album = albums[key];

        // Delete all photos from R2
        if (album.images && album.images.length > 0) {
            const deletePromises = [];

            for (const image of album.images) {
                // Extract paths from URLs
                if (image.thumbnail) {
                    const thumbPath = extractR2Path(image.thumbnail);
                    if (thumbPath) {
                        deletePromises.push(env.R2_BUCKET.delete(thumbPath));
                    }
                }
                if (image.full) {
                    const fullPath = extractR2Path(image.full);
                    if (fullPath) {
                        deletePromises.push(env.R2_BUCKET.delete(fullPath));
                    }
                }
            }

            // Wait for all deletions
            await Promise.all(deletePromises);
        }

        // Delete album from data
        delete albums[key];

        // Save to R2
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            message: `Album "${key}" deleted`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete album error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete album'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Extract R2 path from full URL
function extractR2Path(url) {
    if (!url) return null;

    try {
        if (url.startsWith(R2_PUBLIC_URL)) {
            return url.replace(R2_PUBLIC_URL + '/', '');
        }
        // Handle relative paths
        if (url.startsWith('assets/images/')) {
            return url.replace('assets/images/', '');
        }
        return null;
    } catch (e) {
        return null;
    }
}
