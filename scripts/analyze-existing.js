#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const ImageAnalyzer = require('./image-analyzer.js');

/**
 * Batch Analysis Tool for Existing Photos
 * Updates albums.json with enhanced metadata for existing photos
 */
class BatchPhotoAnalyzer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.albumsJsonPath = path.join(this.projectRoot, 'data', 'albums.json');
        this.albumsDir = path.join(this.projectRoot, 'assets', 'images', 'albums');

        this.analyzer = new ImageAnalyzer();
        this.analyzerInitialized = false;

        // Statistics tracking
        this.stats = {
            processed: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        };
    }

    async initialize() {
        try {
            await this.analyzer.initialize();
            this.analyzerInitialized = true;
            console.log('🤖 Image analyzer initialized successfully');
        } catch (error) {
            console.warn(`⚠️  AI analysis unavailable: ${error.message}`);
            console.log('📋 Proceeding with EXIF-only analysis...');
        }
    }

    async loadAlbumsData() {
        try {
            const data = await fs.readFile(this.albumsJsonPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load albums.json: ${error.message}`);
        }
    }

    async saveAlbumsData(albumsData) {
        try {
            await fs.writeFile(
                this.albumsJsonPath,
                JSON.stringify(albumsData, null, 4),
                'utf8'
            );
        } catch (error) {
            throw new Error(`Failed to save albums.json: ${error.message}`);
        }
    }

    /**
     * Check if photo already has enhanced metadata
     */
    hasEnhancedMetadata(photo) {
        return photo.accessibility && photo.technical && photo.metadata;
    }

    /**
     * Find the original source image for a processed photo
     */
    async findSourceImage(photo, albumName) {
        if (!photo.metadata?.originalFilename) {
            return null;
        }

        // Check album source directory
        const albumSourceDir = path.join(this.albumsDir, albumName);
        const sourcePath = path.join(albumSourceDir, photo.metadata.originalFilename);

        try {
            await fs.access(sourcePath);
            return sourcePath;
        } catch {
            return null;
        }
    }

    /**
     * Format camera settings from EXIF data
     */
    formatCameraSettings(settings) {
        if (!settings) return null;

        const parts = [];
        if (settings.shutterSpeed) parts.push(settings.shutterSpeed);
        if (settings.aperture) parts.push(settings.aperture);
        if (settings.iso) parts.push(`ISO ${settings.iso}`);
        if (settings.focalLength) parts.push(settings.focalLength);

        return parts.length > 0 ? parts.join(', ') : null;
    }

    /**
     * Update a single photo with enhanced metadata
     */
    async updatePhoto(photo, albumName) {
        this.stats.processed++;

        // Skip if already has enhanced metadata
        if (this.hasEnhancedMetadata(photo)) {
            console.log(`⏭️  ${photo.title || photo.id}: Already enhanced`);
            this.stats.skipped++;
            return photo;
        }

        // Find source image
        const sourcePath = await this.findSourceImage(photo, albumName);
        if (!sourcePath) {
            console.warn(`⚠️  ${photo.title || photo.id}: Source image not found`);
            this.stats.skipped++;
            return photo;
        }

        try {
            console.log(`🔍 Analyzing: ${photo.title || photo.id}`);

            // Analyze the source image
            const analysisResult = await this.analyzer.analyzeImage(sourcePath);

            // Update photo with enhanced metadata
            const enhancedPhoto = {
                ...photo,

                // Enhanced metadata structure
                accessibility: {
                    altText: analysisResult?.accessibility?.altText || `Photo: ${photo.title || 'Untitled'}`
                },

                technical: {
                    // Original EXIF data from source image
                    camera: analysisResult?.technical?.exif?.camera?.make ?
                        `${analysisResult.technical.exif.camera.make} ${analysisResult.technical.exif.camera.model}`.trim() : null,
                    lens: analysisResult?.technical?.exif?.camera?.lens || null,
                    settings: this.formatCameraSettings(analysisResult?.technical?.exif?.settings),
                    sceneAnalysis: analysisResult?.technical?.sceneAnalysis || null,
                    summary: analysisResult?.technical?.summary || null,

                    // Keep existing dimensions if available
                    dimensions: photo.metadata ? {
                        width: photo.metadata.width,
                        height: photo.metadata.height,
                        aspectRatio: photo.metadata.width && photo.metadata.height ?
                            Math.round((photo.metadata.width / photo.metadata.height) * 100) / 100 : null
                    } : null
                },

                // Location data if available
                location: analysisResult?.technical?.exif?.location || null,

                // Enhanced file metadata
                metadata: {
                    // Preserve existing metadata
                    ...photo.metadata,
                    // Add new metadata
                    fileSize: analysisResult?.technical?.exif?.file?.size || null,
                    captureDate: analysisResult?.technical?.exif?.capture?.dateTime || null,
                    enhancementDate: new Date().toISOString()
                }
            };

            console.log(`✅ Enhanced: ${photo.title || photo.id}`);
            this.stats.updated++;
            return enhancedPhoto;

        } catch (error) {
            console.error(`❌ Failed to analyze ${photo.title || photo.id}: ${error.message}`);
            this.stats.errors++;
            return photo;
        }
    }

    /**
     * Analyze all photos in a specific album
     */
    async analyzeAlbum(albumName, albumData) {
        console.log(`\n📂 Processing album: ${albumName} (${albumData.images.length} photos)`);

        const updatedImages = [];
        for (const photo of albumData.images) {
            const enhancedPhoto = await this.updatePhoto(photo, albumName);
            updatedImages.push(enhancedPhoto);
        }

        return {
            ...albumData,
            images: updatedImages
        };
    }

    /**
     * Analyze all albums
     */
    async analyzeAll() {
        const albumsData = await this.loadAlbumsData();
        const updatedAlbumsData = {};

        const albumNames = Object.keys(albumsData);
        console.log(`📊 Found ${albumNames.length} albums to process`);

        for (const albumName of albumNames) {
            updatedAlbumsData[albumName] = await this.analyzeAlbum(albumName, albumsData[albumName]);
        }

        return updatedAlbumsData;
    }

    /**
     * Analyze specific albums by name
     */
    async analyzeSpecific(albumNames) {
        const albumsData = await this.loadAlbumsData();
        const updatedAlbumsData = { ...albumsData };

        for (const albumName of albumNames) {
            if (!albumsData[albumName]) {
                console.warn(`⚠️  Album "${albumName}" not found`);
                continue;
            }

            updatedAlbumsData[albumName] = await this.analyzeAlbum(albumName, albumsData[albumName]);
        }

        return updatedAlbumsData;
    }

    /**
     * Main execution method
     */
    async run(options = {}) {
        const { albums = [], dryRun = false } = options;

        await this.initialize();

        let updatedAlbumsData;

        if (albums.length === 0) {
            // Analyze all albums
            updatedAlbumsData = await this.analyzeAll();
        } else {
            // Analyze specific albums
            updatedAlbumsData = await this.analyzeSpecific(albums);
        }

        // Show statistics
        console.log('\n📈 Analysis Statistics:');
        console.log(`   📸 Photos processed: ${this.stats.processed}`);
        console.log(`   ✅ Photos enhanced: ${this.stats.updated}`);
        console.log(`   ⏭️  Photos skipped: ${this.stats.skipped}`);
        console.log(`   ❌ Errors: ${this.stats.errors}`);

        if (!dryRun && this.stats.updated > 0) {
            console.log('\n💾 Saving updated metadata...');
            await this.saveAlbumsData(updatedAlbumsData);
            console.log('✅ albums.json updated successfully');
        } else if (dryRun) {
            console.log('\n🔍 Dry run completed - no changes saved');
        } else {
            console.log('\n✨ No photos needed enhancement');
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.analyzer) {
            try {
                await this.analyzer.cleanup();
            } catch (error) {
                console.warn('Warning during analyzer cleanup:', error.message);
            }
        }
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const analyzer = new BatchPhotoAnalyzer();

    // Parse command line arguments
    const options = {
        albums: [],
        dryRun: false
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        switch (arg) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--all':
                options.albums = [];
                break;
            case '--help':
            case '-h':
                console.log(`
Usage: node analyze-existing.js [options] [album-names...]

Options:
  --dry-run           Preview changes without saving
  --all               Analyze all albums (default)
  --help, -h          Show this help message

Examples:
  node analyze-existing.js                    # Analyze all albums
  node analyze-existing.js nature portraits   # Analyze specific albums
  node analyze-existing.js --dry-run          # Preview all changes
                `);
                process.exit(0);
                break;
            default:
                if (!arg.startsWith('--')) {
                    options.albums.push(arg);
                }
                break;
        }
        i++;
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await analyzer.cleanup();
        process.exit(0);
    });

    // Run analysis
    analyzer.run(options)
        .then(() => {
            console.log('\n🎉 Batch analysis completed');
        })
        .catch((error) => {
            console.error('\n❌ Batch analysis failed:', error.message);
            process.exit(1);
        })
        .finally(async () => {
            await analyzer.cleanup();
        });
}

module.exports = BatchPhotoAnalyzer;