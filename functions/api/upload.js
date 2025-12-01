/**
 * Photo upload endpoint
 * POST /api/upload - Upload a photo to an album
 *
 * NOTE: WebP processing disabled for now due to Cloudflare Pages build limitations.
 * Use local scripts (./import.sh) for WebP processing instead.
 */

// import Photon from '@cf-wasm/photon'; // Disabled - causes build errors on Cloudflare Pages

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

// Generate unique photo ID
function generatePhotoId(filename, albumKey) {
    const albumPrefix = albumKey.substring(0, 3).toLowerCase();
    const baseName = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${albumPrefix}${baseName}_${timestamp}`;
}

// Generate readable title from filename
function generateTitle(filename) {
    return filename
        .replace(/\.[^.]+$/, '') // Remove extension
        .replace(/[_-]/g, ' ')    // Replace underscores/dashes with spaces
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
        .trim();
}

// NOTE: Image processing removed due to Cloudflare Pages build limitations
// Use local scripts (./scripts/import.sh) for WebP processing instead

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const photo = formData.get('photo');
        const albumKey = formData.get('album');
        const skipAI = formData.get('skipAI') === 'true';

        if (!photo || !albumKey) {
            return new Response(JSON.stringify({
                error: 'Missing photo or album'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current albums
        const albums = await getAlbumsData(env);

        if (!albums[albumKey]) {
            return new Response(JSON.stringify({
                error: 'Album not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Read the file
        const arrayBuffer = await photo.arrayBuffer();
        const filename = photo.name;
        const contentType = photo.type || 'image/jpeg';

        // Generate photo ID and paths
        const photoId = generatePhotoId(filename, albumKey);

        // Store original format - use local scripts for WebP processing
        const actualExtension = filename.split('.').pop().toLowerCase();
        const storedExtension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(actualExtension)
            ? actualExtension
            : 'jpg';

        const thumbnailPath = `thumbnails/${albumKey}/${photoId}.${storedExtension}`;
        const fullPath = `full/${albumKey}/${photoId}.${storedExtension}`;

        // Upload to R2 (original format - use local scripts for WebP)
        await env.R2_BUCKET.put(thumbnailPath, arrayBuffer, {
            httpMetadata: {
                contentType: contentType,
                cacheControl: 'public, max-age=31536000'
            }
        });

        await env.R2_BUCKET.put(fullPath, arrayBuffer, {
            httpMetadata: {
                contentType: contentType,
                cacheControl: 'public, max-age=31536000'
            }
        });

        // Create photo entry
        const photoData = {
            id: photoId,
            title: generateTitle(filename),
            thumbnail: `${R2_PUBLIC_URL}/${thumbnailPath}`,
            full: `${R2_PUBLIC_URL}/${fullPath}`,
            date: new Date().toISOString().split('T')[0],
            accessibility: {
                altText: `Photo: ${generateTitle(filename)}`
            },
            technical: {
                camera: null,
                lens: null,
                settings: null,
                sceneAnalysis: null,
                summary: null,
                dimensions: null
            },
            location: null,
            metadata: {
                originalFilename: filename,
                fileSize: arrayBuffer.byteLength,
                captureDate: null,
                processingDate: new Date().toISOString()
            }
        };

        // Add to album
        if (!albums[albumKey].images) {
            albums[albumKey].images = [];
        }
        albums[albumKey].images.push(photoData);

        // Sort by date (newest first)
        albums[albumKey].images.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return new Date(b.date) - new Date(a.date);
        });

        // Save updated albums
        await saveAlbumsData(env, albums);

        return new Response(JSON.stringify({
            success: true,
            photo: photoData
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({
            error: 'Upload failed: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
