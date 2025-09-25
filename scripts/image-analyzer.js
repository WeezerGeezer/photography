#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { exiftool } = require('exiftool-vendored');
const { Ollama } = require('ollama');

/**
 * Image Analysis Service
 * Provides AI-powered image analysis for accessibility and technical metadata
 */
class ImageAnalyzer {
    constructor() {
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

        // Analysis configuration
        this.config = {
            primaryModel: 'llava:7b',      // High quality model
            fallbackModel: 'moondream',    // Lightweight fallback
            enableCache: true,
            cacheDir: path.join(__dirname, '.cache'),
            tempDir: path.join(__dirname, '.temp'),
            timeout: 30000, // 30 seconds

            // AI analysis image settings
            aiImageSettings: {
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 85,
                format: 'jpeg'
            }
        };
    }

    async initialize() {
        // Ensure cache and temp directories exist
        if (this.config.enableCache) {
            await fs.mkdir(this.config.cacheDir, { recursive: true });
        }
        await fs.mkdir(this.config.tempDir, { recursive: true });

        // Test Ollama connection
        try {
            const models = await this.ollama.list();
            const availableModels = models.models.map(m => m.name);

            console.log(`🤖 Available AI models: ${availableModels.join(', ')}`);

            if (!availableModels.includes(this.config.primaryModel)) {
                console.warn(`⚠️  Primary model ${this.config.primaryModel} not found, using fallback`);
                this.config.primaryModel = this.config.fallbackModel;
            }
        } catch (error) {
            throw new Error(`Failed to connect to Ollama: ${error.message}`);
        }
    }

    /**
     * Generate cache key for an image
     */
    getCacheKey(imagePath, analysisType) {
        const filename = path.basename(imagePath);
        return `${filename}_${analysisType}.json`;
    }

    /**
     * Load analysis from cache
     */
    async loadFromCache(imagePath, analysisType) {
        if (!this.config.enableCache) return null;

        try {
            const cacheFile = path.join(this.config.cacheDir, this.getCacheKey(imagePath, analysisType));
            const data = await fs.readFile(cacheFile, 'utf8');
            const cached = JSON.parse(data);

            // Check if file has been modified since cache
            const stats = await fs.stat(imagePath);
            if (new Date(cached.timestamp) < stats.mtime) {
                return null; // Cache is stale
            }

            return cached.result;
        } catch {
            return null;
        }
    }

    /**
     * Save analysis to cache
     */
    async saveToCache(imagePath, analysisType, result) {
        if (!this.config.enableCache) return;

        try {
            const cacheFile = path.join(this.config.cacheDir, this.getCacheKey(imagePath, analysisType));
            const cached = {
                timestamp: new Date().toISOString(),
                imagePath,
                analysisType,
                result
            };
            await fs.writeFile(cacheFile, JSON.stringify(cached, null, 2));
        } catch (error) {
            console.warn(`Warning: Could not save to cache: ${error.message}`);
        }
    }

    /**
     * Extract comprehensive EXIF metadata
     */
    async extractExifData(imagePath) {
        const cacheKey = 'exif';
        const cached = await this.loadFromCache(imagePath, cacheKey);
        if (cached) return cached;

        try {
            const tags = await exiftool.read(imagePath);

            const exifData = {
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

                // Image properties
                image: {
                    width: tags.ImageWidth || tags.ExifImageWidth,
                    height: tags.ImageHeight || tags.ExifImageHeight,
                    orientation: tags.Orientation,
                    colorSpace: tags.ColorSpace,
                    bitDepth: tags.BitsPerSample,
                    compression: tags.Compression,
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

            await this.saveToCache(imagePath, cacheKey, exifData);
            return exifData;

        } catch (error) {
            console.error(`Failed to extract EXIF data from ${imagePath}:`, error.message);
            return null;
        }
    }

    /**
     * Create a temporary resized version of an image for AI analysis
     */
    async createTempImageForAI(imagePath) {
        const tempFileName = `ai_${Date.now()}_${path.basename(imagePath, path.extname(imagePath))}.jpg`;
        const tempPath = path.join(this.config.tempDir, tempFileName);

        try {
            // Check original image size
            const stats = await fs.stat(imagePath);
            const fileSizeMB = stats.size / (1024 * 1024);

            // If image is small enough, use original
            if (fileSizeMB <= 2) {
                return imagePath;
            }

            console.log(`📏 Resizing large image (${fileSizeMB.toFixed(1)}MB) for AI analysis...`);

            // Resize image for AI analysis
            await sharp(imagePath)
                .resize(this.config.aiImageSettings.maxWidth, this.config.aiImageSettings.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: this.config.aiImageSettings.quality,
                    mozjpeg: true
                })
                .toFile(tempPath);

            return tempPath;

        } catch (error) {
            console.warn(`Failed to create temp image: ${error.message}`);
            return imagePath; // Fallback to original
        }
    }

    /**
     * Clean up temporary image file
     */
    async cleanupTempImage(tempPath, originalPath) {
        if (tempPath !== originalPath) {
            try {
                await fs.unlink(tempPath);
            } catch (error) {
                // Silent cleanup failure
            }
        }
    }

    /**
     * Generate AI-powered image analysis
     */
    async analyzeWithAI(imagePath, prompt, model = null) {
        const modelToUse = model || this.config.primaryModel;
        let tempImagePath = null;

        try {
            console.log(`🔍 Analyzing ${path.basename(imagePath)} with ${modelToUse}...`);

            // Create temporary resized version for AI analysis
            tempImagePath = await this.createTempImageForAI(imagePath);

            // Read temp image as base64
            const imageBuffer = await fs.readFile(tempImagePath);
            const base64Image = imageBuffer.toString('base64');

            const response = await Promise.race([
                this.ollama.chat({
                    model: modelToUse,
                    messages: [{
                        role: 'user',
                        content: prompt,
                        images: [base64Image]
                    }],
                    options: {
                        temperature: 0.3,
                        timeout: 60000, // 60 second timeout per request
                    }
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Analysis timeout')), this.config.timeout)
                )
            ]);

            return response.message.content.trim();

        } catch (error) {
            console.error(`AI analysis failed with ${modelToUse}:`, error.message);

            // Try fallback model if primary failed and we haven't tried it yet
            if (modelToUse !== this.config.fallbackModel && !error.message.includes('timeout')) {
                console.log(`🔄 Retrying with fallback model: ${this.config.fallbackModel}`);
                return await this.analyzeWithAI(imagePath, prompt, this.config.fallbackModel);
            }

            // Return graceful fallbacks instead of throwing
            if (prompt.includes('accessibility')) {
                return `Photo: ${path.basename(imagePath, path.extname(imagePath))}`;
            } else {
                return 'AI analysis temporarily unavailable';
            }
        } finally {
            // Clean up temporary image
            if (tempImagePath) {
                await this.cleanupTempImage(tempImagePath, imagePath);
            }
        }
    }

    /**
     * Generate accessibility alt text
     */
    async generateAltText(imagePath) {
        const cacheKey = 'alttext';
        const cached = await this.loadFromCache(imagePath, cacheKey);
        if (cached) return cached;

        const prompt = `Describe this image in one concise sentence for accessibility purposes. Focus on the main subject, setting, and important visual elements. Keep it under 125 characters and make it suitable for screen readers. Do not start with "This is" or "The image shows".`;

        try {
            const description = await this.analyzeWithAI(imagePath, prompt);
            await this.saveToCache(imagePath, cacheKey, description);
            return description;
        } catch (error) {
            console.error(`Failed to generate alt text: ${error.message}`);
            return 'Image description unavailable';
        }
    }

    /**
     * Generate technical scene analysis
     */
    async generateSceneAnalysis(imagePath) {
        const cacheKey = 'scene';
        const cached = await this.loadFromCache(imagePath, cacheKey);
        if (cached) return cached;

        const prompt = `Analyze this photograph's technical and compositional aspects. Describe: lighting conditions (natural/artificial, quality, direction), composition (rule of thirds, symmetry, etc.), depth of field, camera angle/perspective, and overall mood/atmosphere. Be concise and technical, focusing on photographic elements rather than just subject matter.`;

        try {
            const analysis = await this.analyzeWithAI(imagePath, prompt);
            await this.saveToCache(imagePath, cacheKey, analysis);
            return analysis;
        } catch (error) {
            console.error(`Failed to generate scene analysis: ${error.message}`);
            return 'Technical analysis unavailable';
        }
    }

    /**
     * Perform comprehensive image analysis
     */
    async analyzeImage(imagePath) {
        if (!await this.isValidImage(imagePath)) {
            throw new Error(`Invalid image file: ${imagePath}`);
        }

        console.log(`📸 Analyzing: ${path.basename(imagePath)}`);

        const [exifData, altText, sceneAnalysis] = await Promise.all([
            this.extractExifData(imagePath),
            this.generateAltText(imagePath),
            this.generateSceneAnalysis(imagePath)
        ]);

        return {
            accessibility: {
                altText
            },
            technical: {
                exif: exifData,
                sceneAnalysis,
                // Generate technical summary from EXIF
                summary: this.formatTechnicalSummary(exifData)
            },
            analysis: {
                timestamp: new Date().toISOString(),
                model: this.config.primaryModel
            }
        };
    }

    /**
     * Format technical summary from EXIF data
     */
    formatTechnicalSummary(exifData) {
        if (!exifData) return null;

        const parts = [];

        // Camera and lens
        if (exifData.camera.make && exifData.camera.model) {
            parts.push(`${exifData.camera.make} ${exifData.camera.model}`);
        }
        if (exifData.camera.lens) {
            parts.push(`${exifData.camera.lens}`);
        }

        // Settings
        const settings = [];
        if (exifData.settings.shutterSpeed) settings.push(exifData.settings.shutterSpeed);
        if (exifData.settings.aperture) settings.push(exifData.settings.aperture);
        if (exifData.settings.iso) settings.push(`ISO ${exifData.settings.iso}`);
        if (exifData.settings.focalLength) settings.push(exifData.settings.focalLength);

        if (settings.length > 0) {
            parts.push(settings.join(', '));
        }

        // Dimensions
        if (exifData.image.width && exifData.image.height) {
            parts.push(`${exifData.image.width}x${exifData.image.height}`);
        }

        return parts.join(' | ');
    }

    /**
     * Check if file is a valid image
     */
    async isValidImage(imagePath) {
        try {
            const stats = await fs.stat(imagePath);
            if (!stats.isFile()) return false;

            const ext = path.extname(imagePath).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.raw', '.cr2', '.nef', '.arw'].includes(ext);
        } catch {
            return false;
        }
    }

    /**
     * Batch analyze multiple images
     */
    async analyzeDirectory(directoryPath, options = {}) {
        const {
            extensions = ['.jpg', '.jpeg', '.png', '.webp'],
            maxConcurrent = 3,
            onProgress = () => {}
        } = options;

        const files = await fs.readdir(directoryPath);
        const imageFiles = files.filter(file =>
            extensions.includes(path.extname(file).toLowerCase())
        );

        console.log(`🔍 Found ${imageFiles.length} images to analyze`);

        const results = [];
        const semaphore = new Array(maxConcurrent).fill(null).map(() => Promise.resolve());

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const imagePath = path.join(directoryPath, file);

            // Wait for available slot
            await Promise.race(semaphore);

            // Find completed promise and replace it
            const completedIndex = semaphore.findIndex(p => p !== null);
            semaphore[completedIndex] = this.analyzeImage(imagePath)
                .then(result => {
                    results.push({ file, result });
                    onProgress(results.length, imageFiles.length);
                })
                .catch(error => {
                    console.error(`Failed to analyze ${file}:`, error.message);
                    results.push({ file, error: error.message });
                    onProgress(results.length, imageFiles.length);
                });
        }

        // Wait for all remaining analyses
        await Promise.all(semaphore);

        return results;
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await exiftool.end();
        } catch (error) {
            console.warn('Warning during cleanup:', error.message);
        }

        // Clean up temp directory
        try {
            const tempFiles = await fs.readdir(this.config.tempDir);
            for (const file of tempFiles) {
                if (file.startsWith('ai_')) {
                    await fs.unlink(path.join(this.config.tempDir, file));
                }
            }
        } catch (error) {
            // Silent cleanup failure
        }
    }
}

// CLI usage
if (require.main === module) {
    const analyzer = new ImageAnalyzer();

    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await analyzer.cleanup();
        process.exit(0);
    });

    async function main() {
        try {
            await analyzer.initialize();

            const imagePath = process.argv[2];
            if (!imagePath) {
                console.log('Usage: node image-analyzer.js <image-path>');
                console.log('   or: node image-analyzer.js <directory-path>');
                process.exit(1);
            }

            const stats = await fs.stat(imagePath);

            if (stats.isFile()) {
                // Analyze single image
                const result = await analyzer.analyzeImage(imagePath);
                console.log('\n📋 Analysis Results:');
                console.log(JSON.stringify(result, null, 2));

            } else if (stats.isDirectory()) {
                // Analyze directory
                const results = await analyzer.analyzeDirectory(imagePath, {
                    onProgress: (completed, total) => {
                        console.log(`📊 Progress: ${completed}/${total} images analyzed`);
                    }
                });

                console.log(`\n✅ Completed analysis of ${results.length} images`);
                console.log('Results saved to cache for future use.');
            }

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            process.exit(1);
        } finally {
            await analyzer.cleanup();
        }
    }

    main();
}

module.exports = ImageAnalyzer;