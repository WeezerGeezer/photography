/**
 * Sync endpoint
 * POST /api/sync - Sync local albums.json with R2
 */

// Helper to get albums.json from R2
async function getAlbumsData(env) {
    try {
        const object = await env.R2_BUCKET.get('data/albums.json');
        if (!object) {
            return null;
        }
        const text = await object.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Error reading albums.json from R2:', error);
        return null;
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
        // Get data from request body (local albums.json)
        let localData = null;
        try {
            localData = await request.json();
        } catch {
            // No body provided, just sync from R2
        }

        // Get current R2 data
        const r2Data = await getAlbumsData(env);

        if (localData && localData.albums) {
            // Merge local data with R2 data
            // Local data takes precedence for metadata, R2 for images
            const mergedData = {};

            // Start with R2 data
            if (r2Data) {
                Object.assign(mergedData, r2Data);
            }

            // Merge in local updates
            for (const [key, album] of Object.entries(localData.albums)) {
                if (mergedData[key]) {
                    // Update metadata, preserve images from R2
                    mergedData[key] = {
                        ...mergedData[key],
                        title: album.title || mergedData[key].title,
                        description: album.description || mergedData[key].description,
                        date: album.date || mergedData[key].date,
                        isPrivate: album.isPrivate !== undefined ? album.isPrivate : mergedData[key].isPrivate
                    };
                } else {
                    // New album from local
                    mergedData[key] = album;
                }
            }

            // Save merged data
            await saveAlbumsData(env, mergedData);

            return new Response(JSON.stringify({
                success: true,
                message: 'Data synced successfully',
                albumCount: Object.keys(mergedData).length
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Just return current R2 data
        return new Response(JSON.stringify({
            success: true,
            message: 'Current data retrieved',
            data: r2Data || {}
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Sync error:', error);
        return new Response(JSON.stringify({
            error: 'Sync failed: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    const { env } = context;

    try {
        const data = await getAlbumsData(env);

        return new Response(JSON.stringify({
            success: true,
            data: data || {}
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get sync data error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get data'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
