/**
 * Photo API endpoint with dynamic album and photo ID
 * DELETE /api/photos/[album]/[photoId] - Delete a photo
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

export async function onRequestDelete(context) {
    const { params, env } = context;
    // URL-decode the parameters to handle spaces, commas, etc.
    const albumKey = decodeURIComponent(params.album);
    const photoId = decodeURIComponent(params.photoId);

    try {
        // Get current albums
        const albums = await getAlbumsData(env);
        const albumKeys = Object.keys(albums);

        // Check if album exists
        if (!albums[albumKey]) {
            return new Response(JSON.stringify({
                error: 'Album not found',
                requestedKey: albumKey,
                availableKeys: albumKeys,
                r2BucketAvailable: !!env.R2_BUCKET
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find the photo
        const photoIndex = albums[albumKey].images?.findIndex(p => p.id === photoId);

        if (photoIndex === -1 || photoIndex === undefined) {
            return new Response(JSON.stringify({
                error: 'Photo not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const photo = albums[albumKey].images[photoIndex];

        // Delete files from R2
        const deletePromises = [];

        if (photo.thumbnail) {
            const thumbPath = extractR2Path(photo.thumbnail);
            if (thumbPath) {
                deletePromises.push(env.R2_BUCKET.delete(thumbPath));
            }
        }

        if (photo.full) {
            const fullPath = extractR2Path(photo.full);
            if (fullPath) {
                deletePromises.push(env.R2_BUCKET.delete(fullPath));
            }
        }

        await Promise.all(deletePromises);

        // Remove from album
        albums[albumKey].images.splice(photoIndex, 1);

        // Save to R2
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            message: `Photo "${photoId}" deleted`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete photo error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete photo'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
