#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const ImageAnalyzer = require('./image-analyzer.js');

class PhotoImporter {
    constructor(options = {}) {
        this.projectRoot = path.resolve(__dirname, '..');
        this.albumsJsonPath = path.join(this.projectRoot, 'data', 'albums.json');
        this.albumsDir = path.join(this.projectRoot, 'assets', 'images', 'albums');
        this.thumbnailsDir = path.join(this.projectRoot, 'assets', 'images', 'thumbnails');
        this.fullDir = path.join(this.projectRoot, 'assets', 'images', 'full');

        // Image processing settings
        this.thumbnailSettings = {
            width: 800,
            quality: 85,
            format: 'webp'
        };

        this.fullSettings = {
            width: 2000,
            quality: 90,
            format: 'webp'
        };

        // AI analysis settings
        this.enableAI = !options.noAI;

        // Initialize image analyzer only if AI is enabled
        if (this.enableAI) {
            this.analyzer = new ImageAnalyzer();
            this.analyzerInitialized = false;
        } else {
            this.analyzer = null;
            this.analyzerInitialized = false;
            console.log('🚫 AI analysis disabled - processing will be faster');
        }
    }

    async initializeAnalyzer() {
        if (!this.enableAI) {
            return; // Skip initialization if AI is disabled
        }

        if (!this.analyzerInitialized) {
            try {
                await this.analyzer.initialize();
                this.analyzerInitialized = true;
                console.log('🤖 Image analyzer initialized successfully');
            } catch (error) {
                console.warn(`⚠️  AI analysis unavailable: ${error.message}`);
                console.log('📋 Proceeding with EXIF-only analysis...');
            }
        }
    }

    async run(albumName) {
        try {
            // Initialize analyzer
            await this.initializeAnalyzer();

            if (!albumName) {
                // If no album name provided, scan for all available album folders
                await this.scanAndImportAll();
                return;
            }

            console.log(`🚀 Starting photo import for album: ${albumName}`);
            
            // Check if album folder exists first
            const albumSourceDir = path.join(this.albumsDir, albumName);
            try {
                await fs.access(albumSourceDir);
            } catch {
                console.error(`❌ Album folder "${albumName}" not found at: ${albumSourceDir}`);
                const availableFolders = await this.getAvailableAlbumFolders();
                if (availableFolders.length > 0) {
                    console.log('Available album folders:', availableFolders.join(', '));
                } else {
                    console.log('No album folders found in assets/images/albums/');
                }
                process.exit(1);
            }

            // Load or create album data
            const albumsData = await this.loadAlbumsData();
            let albumData = albumsData[albumName];
            
            // If album doesn't exist in JSON, create it
            if (!albumData) {
                console.log(`📝 Album "${albumName}" not found in albums.json, creating new entry...`);
                albumData = await this.createNewAlbumEntry(albumName);
                albumsData[albumName] = albumData;
            }

            // Check for new photos in the album folder
            const newPhotos = await this.findNewPhotos(albumName, albumData);
            
            if (newPhotos.length === 0) {
                console.log('✅ No new photos found to import');
                return;
            }

            console.log(`📸 Found ${newPhotos.length} new photos to import`);

            // Create directories if they don't exist
            await this.ensureDirectories(albumName);

            // Process each new photo
            const processedPhotos = [];
            for (const photo of newPhotos) {
                try {
                    const processedPhoto = await this.processPhoto(photo, albumName);
                    processedPhotos.push(processedPhoto);
                    console.log(`✅ Processed: ${photo.filename}`);
                } catch (error) {
                    console.error(`❌ Failed to process ${photo.filename}:`, error.message);
                }
            }

            // Update albums.json with new photos
            if (processedPhotos.length > 0) {
                await this.updateAlbumsJson(albumName, albumsData, processedPhotos);
                console.log(`🎉 Successfully imported ${processedPhotos.length} photos to ${albumName} album`);
            }

        } catch (error) {
            console.error('❌ Import failed:', error.message);
            process.exit(1);
        }
    }

    async loadAlbumsData() {
        try {
            const data = await fs.readFile(this.albumsJsonPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // If albums.json doesn't exist, create empty structure
                console.log('📝 albums.json not found, creating new file...');
                return {};
            }
            throw new Error(`Failed to load albums.json: ${error.message}`);
        }
    }

    async getAvailableAlbumFolders() {
        try {
            const items = await fs.readdir(this.albumsDir);
            const folders = [];
            
            for (const item of items) {
                const itemPath = path.join(this.albumsDir, item);
                const stat = await fs.stat(itemPath);
                if (stat.isDirectory()) {
                    folders.push(item);
                }
            }
            
            return folders;
        } catch (error) {
            return [];
        }
    }

    async createNewAlbumEntry(albumName) {
        // Generate album title from folder name
        const title = albumName
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Generate description based on album name
        const descriptions = {
            nature: 'Capturing the beauty of landscapes and wildlife',
            portraits: 'Professional portraits and candid moments',
            events: 'Capturing special moments at weddings, parties, and corporate events',
            wedding: 'Beautiful wedding photography and memorable moments',
            street: 'Urban life and street photography',
            travel: 'Adventures and destinations from around the world',
            architecture: 'Stunning buildings and architectural details',
            macro: 'Close-up photography revealing intricate details',
            black_and_white: 'Timeless black and white photography',
            lifestyle: 'Lifestyle and everyday moments'
        };

        const description = descriptions[albumName.toLowerCase()] || 
                          `A collection of ${albumName} photography`;

        return {
            title,
            description,
            cover: `${albumName}/cover.jpg`,
            images: []
        };
    }

    async scanAndImportAll() {
        console.log('🔍 Scanning for all album folders...');
        
        const albumFolders = await this.getAvailableAlbumFolders();
        if (albumFolders.length === 0) {
            console.log('📁 No album folders found in assets/images/albums/');
            return;
        }

        console.log(`📂 Found ${albumFolders.length} album folders:`, albumFolders.join(', '));
        
        for (const albumName of albumFolders) {
            console.log(`\n🚀 Processing album: ${albumName}`);
            
            try {
                // Recursively call run for each album
                await this.run(albumName);
            } catch (error) {
                console.error(`❌ Failed to process album "${albumName}":`, error.message);
            }
        }
        
        console.log('\n🎉 Finished scanning all albums!');
    }

    async findNewPhotos(albumName, albumData) {
        const albumSourceDir = path.join(this.albumsDir, albumName);
        
        try {
            await fs.access(albumSourceDir);
        } catch {
            console.log(`📁 No source folder found at: ${albumSourceDir}`);
            return [];
        }

        const files = await fs.readdir(albumSourceDir);
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|webp|tiff|raw|cr2|nef|arw)$/i.test(file)
        );

        // Get existing photo IDs to avoid duplicates
        const existingIds = new Set(albumData.images.map(img => img.id));
        
        const newPhotos = [];
        for (const filename of imageFiles) {
            const photoId = this.generatePhotoId(filename, albumName);
            
            if (!existingIds.has(photoId)) {
                newPhotos.push({
                    filename,
                    id: photoId,
                    sourcePath: path.join(albumSourceDir, filename)
                });
            }
        }

        return newPhotos;
    }

    generatePhotoId(filename, albumName) {
        // Create ID from album prefix + filename without extension
        const albumPrefix = albumName.substring(0, 3);
        const baseName = path.parse(filename).name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6);

        // Use full basename (no length limit) to avoid collisions
        return `${albumPrefix}${baseName}${timestamp}`;
    }

    async ensureDirectories(albumName) {
        const dirs = [
            path.join(this.thumbnailsDir, albumName),
            path.join(this.fullDir, albumName)
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async processPhoto(photo, albumName) {
        const { filename, id, sourcePath } = photo;
        const fileExtension = path.parse(filename).ext.toLowerCase();

        // Generate output filenames
        const outputName = `${id}.webp`;
        const thumbnailPath = path.join(this.thumbnailsDir, albumName, outputName);
        const fullPath = path.join(this.fullDir, albumName, outputName);

        // Analyze original image for metadata (before processing)
        let analysisResult = null;
        if (this.enableAI && this.analyzerInitialized) {
            try {
                console.log(`🔍 Analyzing ${filename} for enhanced metadata...`);
                analysisResult = await this.analyzer.analyzeImage(sourcePath);
            } catch (error) {
                console.warn(`⚠️  Analysis failed for ${filename}: ${error.message}`);
            }
        } else if (!this.enableAI) {
            console.log(`📸 Processing ${filename} (no AI analysis)...`);
        }

        // Process thumbnail
        await sharp(sourcePath)
            .resize(this.thumbnailSettings.width, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: this.thumbnailSettings.quality })
            .toFile(thumbnailPath);

        // Process full-size image
        await sharp(sourcePath)
            .resize(this.fullSettings.width, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: this.fullSettings.quality })
            .toFile(fullPath);

        // Get basic image metadata from Sharp
        const sharpMetadata = await sharp(sourcePath).metadata();

        // Use capture date from EXIF if available, otherwise fall back to processing date
        const captureDate = analysisResult?.technical?.exif?.capture?.dateTime;
        let displayDate;
        if (captureDate) {
            try {
                // Handle ExifDateTime object with year/month/day properties
                if (captureDate.year && captureDate.month && captureDate.day) {
                    const year = captureDate.year;
                    const month = String(captureDate.month).padStart(2, '0');
                    const day = String(captureDate.day).padStart(2, '0');
                    displayDate = `${year}-${month}-${day}`;
                }
                // Handle ISO format (2023-05-15T10:30:00) and EXIF format (2023:05:15 10:30:00)
                else if (typeof captureDate === 'string') {
                    // Replace EXIF format colons with dashes for the date part
                    const normalizedDate = captureDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                    displayDate = normalizedDate.split('T')[0].split(' ')[0]; // Get YYYY-MM-DD part
                } else {
                    throw new Error('Unrecognized date format');
                }
            } catch (error) {
                console.warn(`Failed to parse capture date for ${filename}, using processing date:`, error.message);
                displayDate = new Date().toISOString().split('T')[0];
            }
        } else {
            displayDate = new Date().toISOString().split('T')[0];
        }

        // Build enhanced metadata structure
        const photoData = {
            id,
            title: this.generateTitle(filename),
            thumbnail: `assets/images/thumbnails/${albumName}/${outputName}`,
            full: `assets/images/full/${albumName}/${outputName}`,
            date: displayDate,

            // Enhanced metadata structure
            accessibility: {
                altText: analysisResult?.accessibility?.altText || `Photo: ${this.generateTitle(filename)}`
            },

            technical: {
                // Original EXIF data from source image
                camera: analysisResult?.technical?.exif?.camera?.make ?
                    `${analysisResult.technical.exif.camera.make} ${analysisResult.technical.exif.camera.model}`.trim() : null,
                lens: analysisResult?.technical?.exif?.camera?.lens || null,
                settings: this.formatCameraSettings(analysisResult?.technical?.exif?.settings),
                sceneAnalysis: analysisResult?.technical?.sceneAnalysis || null,
                summary: analysisResult?.technical?.summary || null,

                // Processed image dimensions
                dimensions: {
                    width: sharpMetadata.width,
                    height: sharpMetadata.height,
                    aspectRatio: Math.round((sharpMetadata.width / sharpMetadata.height) * 100) / 100
                }
            },

            // Location data if available
            location: analysisResult?.technical?.exif?.location || null,

            // File metadata
            metadata: {
                originalFilename: filename,
                fileSize: analysisResult?.technical?.exif?.file?.size || null,
                captureDate: analysisResult?.technical?.exif?.capture?.dateTime || null,
                processingDate: new Date().toISOString()
            }
        };

        return photoData;
    }

    formatCameraSettings(settings) {
        if (!settings) return null;

        const parts = [];
        if (settings.shutterSpeed) parts.push(settings.shutterSpeed);
        if (settings.aperture) parts.push(settings.aperture);
        if (settings.iso) parts.push(`ISO ${settings.iso}`);
        if (settings.focalLength) parts.push(settings.focalLength);

        return parts.length > 0 ? parts.join(', ') : null;
    }

    generateTitle(filename) {
        // Convert filename to readable title
        return path.parse(filename).name
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }

    async updateAlbumsJson(albumName, albumsData, newPhotos) {
        // Add new photos to the album
        albumsData[albumName].images.push(...newPhotos);
        
        // Sort images by date (newest first)
        albumsData[albumName].images.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Write updated data back to albums.json
        await fs.writeFile(
            this.albumsJsonPath,
            JSON.stringify(albumsData, null, 4),
            'utf8'
        );
    }

    async cleanup() {
        // Cleanup analyzer resources
        if (this.enableAI && this.analyzer) {
            try {
                await this.analyzer.cleanup();
            } catch (error) {
                console.warn('Warning during analyzer cleanup:', error.message);
            }
        }

        // Optional: Clean up source files after successful import
        // This is commented out for safety - uncomment if you want to move files instead of copy
        /*
        console.log('🧹 Cleaning up source files...');
        for (const photo of processedPhotos) {
            await fs.unlink(photo.sourcePath);
        }
        */
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    let albumName = null;
    let noAI = false;

    // Parse command line arguments
    for (const arg of args) {
        if (arg === '--no-ai') {
            noAI = true;
        } else if (!arg.startsWith('--')) {
            albumName = arg;
        }
    }

    const importer = new PhotoImporter({ noAI });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await importer.cleanup();
        process.exit(0);
    });

    importer.run(albumName)
        .then(() => {
            console.log('✅ Import completed successfully');
        })
        .catch((error) => {
            console.error('❌ Import failed:', error.message);
            process.exit(1);
        })
        .finally(async () => {
            await importer.cleanup();
        });
}

module.exports = PhotoImporter;
