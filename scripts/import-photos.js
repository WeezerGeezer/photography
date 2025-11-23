#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { exiftool } = require('exiftool-vendored');
const ImageAnalyzer = require('./image-analyzer.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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

        // R2 upload settings
        this.enableR2 = !options.noR2;
        this.r2Client = null;
        this.r2Bucket = process.env.R2_BUCKET_NAME || 'photography-portfolio';
        this.r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev';

        // Initialize image analyzer only if AI is enabled
        if (this.enableAI) {
            this.analyzer = new ImageAnalyzer();
            this.analyzerInitialized = false;
        } else {
            this.analyzer = null;
            this.analyzerInitialized = false;
            console.log('🚫 AI analysis disabled - processing will be faster');
        }

        // Initialize R2 client if enabled
        if (this.enableR2) {
            this.initializeR2Client();
        } else {
            console.log('🚫 R2 upload disabled - files will only be saved locally');
        }
    }

    initializeR2Client() {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

        if (!accountId || !accessKeyId || !secretAccessKey) {
            console.warn('⚠️  R2 credentials not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
            console.log('📋 Proceeding without R2 upload...');
            this.enableR2 = false;
            return;
        }

        this.r2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        console.log('☁️  R2 client initialized successfully');
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
        // Create ID from album prefix + filename without extension + timestamp
        const albumPrefix = albumName.substring(0, 3);
        const baseName = path.parse(filename).name;

        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6);

        // Preserve original filename case and characters (except spaces/special chars in middle)
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '');

        // Use full basename with timestamp appended
        return `${albumPrefix}${cleanBaseName}_${timestamp}`;
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

        // Always extract EXIF data (independent of AI analysis)
        console.log(`📷 Extracting EXIF data from ${filename}...`);
        const exifData = await this.extractExifData(sourcePath);

        // Analyze original image for enhanced AI metadata (if enabled)
        let analysisResult = null;
        if (this.enableAI && this.analyzerInitialized) {
            try {
                console.log(`🔍 Analyzing ${filename} for AI-enhanced metadata...`);
                analysisResult = await this.analyzer.analyzeImage(sourcePath);
            } catch (error) {
                console.warn(`⚠️  AI analysis failed for ${filename}: ${error.message}`);
            }
        } else if (!this.enableAI) {
            console.log(`📸 Processing ${filename} (EXIF only, no AI analysis)...`);
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

        // Upload to R2 if enabled
        // R2 bucket structure: /thumbnails/[album]/[file].webp and /full/[album]/[file].webp
        const r2ThumbnailKey = `thumbnails/${albumName}/${outputName}`;
        const r2FullKey = `full/${albumName}/${outputName}`;
        let r2ThumbnailUrl = null;
        let r2FullUrl = null;

        if (this.enableR2 && this.r2Client) {
            r2ThumbnailUrl = await this.uploadToR2(thumbnailPath, r2ThumbnailKey);
            r2FullUrl = await this.uploadToR2(fullPath, r2FullKey);
        }

        // Get basic image metadata from Sharp
        const sharpMetadata = await sharp(sourcePath).metadata();

        // Use capture date from EXIF if available, otherwise fall back to file creation date
        // Prefer direct exifData, fall back to analysisResult for backwards compatibility
        const captureDate = exifData?.capture?.dateTime || analysisResult?.technical?.exif?.capture?.dateTime;
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
                console.warn(`Failed to parse capture date for ${filename}, using file creation date:`, error.message);
                // Fall back to file creation date
                const stats = await fs.stat(sourcePath);
                displayDate = stats.birthtime.toISOString().split('T')[0];
            }
        } else {
            // No EXIF data - use file creation date
            const stats = await fs.stat(sourcePath);
            displayDate = stats.birthtime.toISOString().split('T')[0];
        }

        // Build enhanced metadata structure
        // Use direct exifData first, fall back to analysisResult for AI-enhanced data
        const cameraInfo = exifData?.camera || analysisResult?.technical?.exif?.camera;
        const settingsInfo = exifData?.settings || analysisResult?.technical?.exif?.settings;
        const locationInfo = exifData?.location || analysisResult?.technical?.exif?.location;
        const fileInfo = exifData?.file || analysisResult?.technical?.exif?.file;
        const captureDateInfo = exifData?.capture?.dateTime || analysisResult?.technical?.exif?.capture?.dateTime;

        const photoData = {
            id,
            title: this.generateTitle(filename),
            // Use R2 URLs if available, otherwise fall back to local paths
            thumbnail: r2ThumbnailUrl || `assets/images/thumbnails/${albumName}/${outputName}`,
            full: r2FullUrl || `assets/images/full/${albumName}/${outputName}`,
            date: displayDate,

            // Enhanced metadata structure
            accessibility: {
                altText: analysisResult?.accessibility?.altText || `Photo: ${this.generateTitle(filename)}`
            },

            technical: {
                // Original EXIF data from source image (always extracted)
                camera: cameraInfo?.make ?
                    `${cameraInfo.make} ${cameraInfo.model || ''}`.trim() : null,
                lens: cameraInfo?.lens || null,
                settings: this.formatCameraSettings(settingsInfo),
                // AI-enhanced analysis (only when AI is enabled)
                sceneAnalysis: analysisResult?.technical?.sceneAnalysis || null,
                summary: analysisResult?.technical?.summary || null,

                // Processed image dimensions
                dimensions: {
                    width: sharpMetadata.width,
                    height: sharpMetadata.height,
                    aspectRatio: Math.round((sharpMetadata.width / sharpMetadata.height) * 100) / 100
                }
            },

            // Location data if available (from EXIF)
            location: locationInfo || null,

            // File metadata
            metadata: {
                originalFilename: filename,
                fileSize: fileInfo?.size || null,
                captureDate: captureDateInfo || null,
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

    /**
     * Upload a file to Cloudflare R2
     * @param {string} localPath - Local file path to upload
     * @param {string} r2Key - The key (path) in R2 bucket
     * @returns {string} The public URL of the uploaded file
     */
    async uploadToR2(localPath, r2Key) {
        if (!this.enableR2 || !this.r2Client) {
            return null;
        }

        try {
            const fileBuffer = await fs.readFile(localPath);

            const command = new PutObjectCommand({
                Bucket: this.r2Bucket,
                Key: r2Key,
                Body: fileBuffer,
                ContentType: 'image/webp',
            });

            await this.r2Client.send(command);
            const publicUrl = `${this.r2PublicUrl}/${r2Key}`;
            console.log(`   ☁️  Uploaded to R2: ${r2Key}`);
            return publicUrl;
        } catch (error) {
            console.error(`   ❌ R2 upload failed for ${r2Key}:`, error.message);
            return null;
        }
    }

    /**
     * Extract EXIF metadata directly (independent of AI analysis)
     * This ensures camera details are always captured even when AI is disabled
     */
    async extractExifData(imagePath) {
        try {
            const tags = await exiftool.read(imagePath);

            return {
                // Camera information
                camera: {
                    make: tags.Make || null,
                    model: tags.Model || null,
                    lens: tags.LensModel || tags.LensInfo || null,
                },

                // Technical settings
                settings: {
                    aperture: tags.FNumber ? `f/${tags.FNumber}` : null,
                    shutterSpeed: tags.ShutterSpeed || null,
                    iso: tags.ISO || null,
                    focalLength: tags.FocalLength ? `${tags.FocalLength}mm` : null,
                    focalLengthIn35mm: tags.FocalLengthIn35mmFormat ? `${tags.FocalLengthIn35mmFormat}mm` : null,
                },

                // Capture information
                capture: {
                    dateTime: tags.DateTimeOriginal || tags.DateTime,
                    exposureMode: tags.ExposureMode,
                    exposureProgram: tags.ExposureProgram,
                    meteringMode: tags.MeteringMode,
                    flash: tags.Flash,
                    whiteBalance: tags.WhiteBalance,
                },

                // Location data (if available)
                location: tags.GPSLatitude && tags.GPSLongitude ? {
                    latitude: tags.GPSLatitude,
                    longitude: tags.GPSLongitude,
                    altitude: tags.GPSAltitude,
                    direction: tags.GPSImgDirection,
                } : null,

                // File information
                file: {
                    size: tags.FileSize,
                    format: tags.FileType,
                    created: tags.FileCreateDate,
                    modified: tags.FileModifyDate,
                }
            };

        } catch (error) {
            console.warn(`⚠️  Failed to extract EXIF data from ${path.basename(imagePath)}:`, error.message);
            return null;
        }
    }

    generateTitle(filename) {
        // Convert filename to readable title
        return path.parse(filename).name
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }

    async updateAlbumsJson(albumName, albumsData, newPhotos) {
        // Create a map of existing photos by ID to preserve order values
        const existingPhotosById = new Map();
        albumsData[albumName].images.forEach(photo => {
            if (photo.order !== undefined) {
                existingPhotosById.set(photo.id, photo.order);
            }
        });

        // Add new photos to the album
        albumsData[albumName].images.push(...newPhotos);

        // Sort images by order (if present), then by date (newest first)
        albumsData[albumName].images.sort((a, b) => {
            // If both have order field, sort by order
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // If only one has order, prioritize it
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            // Otherwise sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
        });

        // Restore order values for existing photos
        albumsData[albumName].images.forEach(photo => {
            if (existingPhotosById.has(photo.id)) {
                photo.order = existingPhotosById.get(photo.id);
            }
        });

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

        // Close exiftool process (used for direct EXIF extraction)
        try {
            await exiftool.end();
        } catch (error) {
            console.warn('Warning during exiftool cleanup:', error.message);
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
    let noR2 = false;

    // Parse command line arguments
    for (const arg of args) {
        if (arg === '--no-ai') {
            noAI = true;
        } else if (arg === '--no-r2') {
            noR2 = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Photo Importer - Import and process photos for the portfolio

Usage: node import-photos.js [album-name] [options]

Options:
  --no-ai    Disable AI analysis (faster processing, EXIF only)
  --no-r2    Disable R2 upload (local files only)
  --help     Show this help message

Environment Variables (for R2 upload):
  CLOUDFLARE_ACCOUNT_ID   Your Cloudflare account ID
  R2_ACCESS_KEY_ID        R2 API access key ID
  R2_SECRET_ACCESS_KEY    R2 API secret access key
  R2_BUCKET_NAME          R2 bucket name (default: photography-portfolio)
  R2_PUBLIC_URL           R2 public URL (default: https://pub-your-bucket-id.r2.dev)
            `);
            process.exit(0);
        } else if (!arg.startsWith('--')) {
            albumName = arg;
        }
    }

    const importer = new PhotoImporter({ noAI, noR2 });

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
