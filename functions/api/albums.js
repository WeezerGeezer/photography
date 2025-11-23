/**
 * Albums API endpoint
 * POST /api/albums - Create new album
 * PUT /api/albums - Update existing album
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
        const { key, album } = body;

        if (!key || !album) {
            return new Response(JSON.stringify({
                error: 'Missing key or album data'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current albums
        const albums = await getAlbumsData(env);

        // Check if album already exists
        if (albums[key]) {
            return new Response(JSON.stringify({
                error: 'Album already exists'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Add new album
        albums[key] = {
            title: album.title,
            description: album.description || '',
            cover: album.cover || `${key}/cover.jpg`,
            date: album.date || new Date().toISOString().split('T')[0],
            isPrivate: album.isPrivate || false,
            images: []
        };

        // Save to R2
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            album: albums[key]
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create album error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create album'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { key, album } = body;

        if (!key || !album) {
            return new Response(JSON.stringify({
                error: 'Missing key or album data'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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

        // Update album (preserve images array)
        albums[key] = {
            ...albums[key],
            title: album.title,
            description: album.description || '',
            date: album.date || albums[key].date,
            isPrivate: album.isPrivate || false,
            cover: album.cover || albums[key].cover
        };

        // Save to R2
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            album: albums[key]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update album error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to update album'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
