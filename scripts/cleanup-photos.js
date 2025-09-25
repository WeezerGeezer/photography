#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Photo Cleanup Tool
 * Detects and removes orphaned entries from albums.json when source images are deleted
 * Also handles cleanup of processed images (thumbnails/full) when source is removed
 */
class PhotoCleanup {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.albumsJsonPath = path.join(this.projectRoot, 'data', 'albums.json');
        this.albumsDir = path.join(this.projectRoot, 'assets', 'images', 'albums');
        this.thumbnailsDir = path.join(this.projectRoot, 'assets', 'images', 'thumbnails');
        this.fullDir = path.join(this.projectRoot, 'assets', 'images', 'full');

        // Statistics tracking
        this.stats = {
            albumsChecked: 0,
            photosChecked: 0,
            orphanedPhotos: 0,
            orphanedAlbums: 0,
            processedFilesRemoved: 0,
            errors: 0
        };
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
     * Check if a source image file exists
     */
    async sourceImageExists(albumName, originalFilename) {
        if (!originalFilename) return false;

        const sourcePath = path.join(this.albumsDir, albumName, originalFilename);
        try {
            await fs.access(sourcePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if an album directory exists
     */
    async albumDirectoryExists(albumName) {
        const albumPath = path.join(this.albumsDir, albumName);
        try {
            const stat = await fs.stat(albumPath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Remove processed image files (thumbnail and full) for a photo
     */
    async removeProcessedFiles(photo, albumName) {
        const filesToRemove = [];

        // Extract filenames from paths
        if (photo.thumbnail) {
            const thumbnailFile = path.basename(photo.thumbnail);
            filesToRemove.push({
                path: path.join(this.thumbnailsDir, albumName, thumbnailFile),
                type: 'thumbnail'
            });
        }

        if (photo.full) {
            const fullFile = path.basename(photo.full);
            filesToRemove.push({
                path: path.join(this.fullDir, albumName, fullFile),
                type: 'full'
            });
        }

        let removedCount = 0;
        for (const file of filesToRemove) {
            try {
                await fs.unlink(file.path);
                console.log(`🗑️  Removed ${file.type}: ${path.basename(file.path)}`);
                removedCount++;
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.warn(`⚠️  Failed to remove ${file.type} ${file.path}: ${error.message}`);
                }
            }
        }

        this.stats.processedFilesRemoved += removedCount;
        return removedCount;
    }

    /**
     * Remove empty album directories from processed images
     */
    async removeEmptyAlbumDirectories(albumName) {
        const directories = [
            path.join(this.thumbnailsDir, albumName),
            path.join(this.fullDir, albumName)
        ];

        for (const dir of directories) {
            try {
                const files = await fs.readdir(dir);
                if (files.length === 0) {
                    await fs.rmdir(dir);
                    console.log(`🗂️  Removed empty directory: ${path.relative(this.projectRoot, dir)}`);
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.warn(`⚠️  Failed to check/remove directory ${dir}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Find all source image files in album directories
     */
    async getAllSourceImages() {
        const sourceImages = new Map(); // albumName -> Set of filenames

        try {
            const albumNames = await fs.readdir(this.albumsDir);

            for (const albumName of albumNames) {
                const albumPath = path.join(this.albumsDir, albumName);
                try {
                    const stat = await fs.stat(albumPath);
                    if (stat.isDirectory()) {
                        const files = await fs.readdir(albumPath);
                        const imageFiles = files.filter(file =>
                            /\.(jpg|jpeg|png|webp|tiff|tif|raw|cr2|nef|arw)$/i.test(file)
                        );
                        sourceImages.set(albumName, new Set(imageFiles));
                    }
                } catch (error) {
                    console.warn(`⚠️  Error reading album directory ${albumName}: ${error.message}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Error reading albums directory: ${error.message}`);
        }

        return sourceImages;
    }

    /**
     * Clean up orphaned photos in a specific album
     */
    async cleanupAlbum(albumName, albumData, options = {}) {
        const { dryRun = false, removeProcessedFiles = true } = options;

        console.log(`\n📂 Checking album: ${albumName} (${albumData.images.length} photos)`);
        this.stats.albumsChecked++;

        // Check if album directory exists
        const albumExists = await this.albumDirectoryExists(albumName);
        if (!albumExists) {
            console.log(`❌ Album directory missing: ${albumName}`);
            this.stats.orphanedAlbums++;

            if (!dryRun) {
                if (removeProcessedFiles) {
                    // Remove all processed files for this album
                    for (const photo of albumData.images) {
                        await this.removeProcessedFiles(photo, albumName);
                    }
                    await this.removeEmptyAlbumDirectories(albumName);
                }
                console.log(`🗑️  Would remove entire album: ${albumName}`);
                return null; // Signal to remove entire album
            } else {
                console.log(`🔍 [DRY RUN] Would remove entire album: ${albumName}`);
                return albumData; // Keep for dry run
            }
        }

        // Check individual photos in the album
        const validPhotos = [];
        let orphanedCount = 0;

        for (const photo of albumData.images) {
            this.stats.photosChecked++;
            const originalFilename = photo.metadata?.originalFilename;

            if (!originalFilename) {
                console.log(`⚠️  Photo ${photo.id} has no original filename, keeping it`);
                validPhotos.push(photo);
                continue;
            }

            const sourceExists = await this.sourceImageExists(albumName, originalFilename);

            if (sourceExists) {
                validPhotos.push(photo);
            } else {
                orphanedCount++;
                this.stats.orphanedPhotos++;
                console.log(`❌ Orphaned photo: ${photo.title || photo.id} (${originalFilename})`);

                if (!dryRun) {
                    if (removeProcessedFiles) {
                        await this.removeProcessedFiles(photo, albumName);
                    }
                    console.log(`🗑️  Removed: ${photo.title || photo.id}`);
                } else {
                    console.log(`🔍 [DRY RUN] Would remove: ${photo.title || photo.id}`);
                }
            }
        }

        if (orphanedCount > 0) {
            console.log(`📊 Found ${orphanedCount} orphaned photos in ${albumName}`);
        } else {
            console.log(`✅ ${albumName}: All photos have valid source files`);
        }

        return {
            ...albumData,
            images: validPhotos
        };
    }

    /**
     * Find albums in JSON that don't have corresponding directories
     */
    async findOrphanedAlbums(albumsData) {
        const orphanedAlbums = [];

        for (const albumName of Object.keys(albumsData)) {
            const albumExists = await this.albumDirectoryExists(albumName);
            if (!albumExists) {
                orphanedAlbums.push(albumName);
            }
        }

        return orphanedAlbums;
    }

    /**
     * Find new albums in directories that aren't in JSON yet
     */
    async findNewAlbums(albumsData) {
        const sourceImages = await this.getAllSourceImages();
        const existingAlbums = new Set(Object.keys(albumsData));
        const newAlbums = [];

        for (const albumName of sourceImages.keys()) {
            if (!existingAlbums.has(albumName) && sourceImages.get(albumName).size > 0) {
                newAlbums.push({
                    name: albumName,
                    imageCount: sourceImages.get(albumName).size
                });
            }
        }

        return newAlbums;
    }

    /**
     * Main cleanup method
     */
    async cleanup(options = {}) {
        const {
            dryRun = false,
            removeProcessedFiles = true,
            albums = [],
            showNewAlbums = true
        } = options;

        console.log(`🧹 Starting photo cleanup${dryRun ? ' (DRY RUN)' : ''}...`);

        const albumsData = await this.loadAlbumsData();
        const updatedAlbumsData = {};

        // Determine which albums to process
        const albumsToProcess = albums.length > 0 ?
            albums.filter(name => albumsData[name]) :
            Object.keys(albumsData);

        if (albumsToProcess.length === 0) {
            console.log('⚠️  No albums found to process');
            return;
        }

        console.log(`📊 Processing ${albumsToProcess.length} albums...`);

        // Process each album
        for (const albumName of albumsToProcess) {
            if (!albumsData[albumName]) {
                console.log(`⚠️  Album "${albumName}" not found in albums.json`);
                continue;
            }

            const cleanedAlbum = await this.cleanupAlbum(
                albumName,
                albumsData[albumName],
                { dryRun, removeProcessedFiles }
            );

            if (cleanedAlbum !== null) {
                updatedAlbumsData[albumName] = cleanedAlbum;
            } else if (!dryRun) {
                console.log(`🗑️  Removed album: ${albumName}`);
            }
        }

        // Keep albums that weren't processed
        for (const albumName of Object.keys(albumsData)) {
            if (!albumsToProcess.includes(albumName)) {
                updatedAlbumsData[albumName] = albumsData[albumName];
            }
        }

        // Show new albums that could be imported
        if (showNewAlbums) {
            const newAlbums = await this.findNewAlbums(albumsData);
            if (newAlbums.length > 0) {
                console.log('\n📁 New albums detected (not yet imported):');
                for (const album of newAlbums) {
                    console.log(`   📂 ${album.name} (${album.imageCount} images)`);
                }
                console.log(`\nRun: ./import.sh "album-name" to import new albums`);
            }
        }

        // Show statistics
        console.log('\n📈 Cleanup Statistics:');
        console.log(`   📂 Albums checked: ${this.stats.albumsChecked}`);
        console.log(`   📸 Photos checked: ${this.stats.photosChecked}`);
        console.log(`   🗑️  Orphaned photos found: ${this.stats.orphanedPhotos}`);
        console.log(`   🗂️  Orphaned albums found: ${this.stats.orphanedAlbums}`);
        console.log(`   🧹 Processed files removed: ${this.stats.processedFilesRemoved}`);
        console.log(`   ❌ Errors: ${this.stats.errors}`);

        // Save updated albums.json
        if (!dryRun && (this.stats.orphanedPhotos > 0 || this.stats.orphanedAlbums > 0)) {
            console.log('\n💾 Saving updated albums.json...');
            await this.saveAlbumsData(updatedAlbumsData);
            console.log('✅ Cleanup completed and albums.json updated');
        } else if (dryRun) {
            console.log('\n🔍 Dry run completed - no changes made');
        } else {
            console.log('\n✨ No orphaned entries found - albums.json unchanged');
        }
    }

    /**
     * Interactive cleanup with confirmation
     */
    async interactiveCleanup() {
        console.log('🔍 Scanning for orphaned photos and albums...\n');

        // First, do a dry run to show what would be cleaned
        await this.cleanup({ dryRun: true, showNewAlbums: true });

        if (this.stats.orphanedPhotos === 0 && this.stats.orphanedAlbums === 0) {
            console.log('\n✅ No cleanup needed!');
            return;
        }

        console.log(`\n⚠️  Found ${this.stats.orphanedPhotos} orphaned photos and ${this.stats.orphanedAlbums} orphaned albums`);
        console.log('This will:');
        console.log('- Remove entries from albums.json');
        console.log('- Delete processed image files (thumbnails and full-size)');
        console.log('- Keep original source files in albums/ directories');

        // In a real CLI, you'd prompt for confirmation here
        // For now, we'll just show what would happen
        console.log('\nTo proceed with cleanup, run:');
        console.log('node cleanup-photos.js --confirm');
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const cleanup = new PhotoCleanup();

    // Parse command line arguments
    const options = {
        albums: [],
        dryRun: true, // Default to dry run for safety
        removeProcessedFiles: true,
        showNewAlbums: true,
        interactive: false
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        switch (arg) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--confirm':
            case '--execute':
                options.dryRun = false;
                break;
            case '--keep-processed':
                options.removeProcessedFiles = false;
                break;
            case '--no-new-albums':
                options.showNewAlbums = false;
                break;
            case '--interactive':
                options.interactive = true;
                break;
            case '--help':
            case '-h':
                console.log(`
📷 Photo Cleanup Tool

Detects and removes orphaned entries from albums.json when source images are deleted.
Also handles cleanup of processed images (thumbnails/full) when source is removed.

Usage: node cleanup-photos.js [options] [album-names...]

Options:
  --dry-run           Preview changes without making them (default)
  --confirm           Execute the cleanup (removes --dry-run)
  --execute           Same as --confirm
  --keep-processed    Don't remove thumbnail/full images
  --no-new-albums    Don't show new albums that could be imported
  --interactive       Interactive mode with confirmation prompts
  --help, -h          Show this help message

Examples:
  node cleanup-photos.js                           # Preview cleanup of all albums
  node cleanup-photos.js --confirm                 # Execute cleanup of all albums
  node cleanup-photos.js nature portraits          # Preview cleanup of specific albums
  node cleanup-photos.js --confirm nature          # Execute cleanup of nature album
  node cleanup-photos.js --interactive             # Interactive mode with prompts

Safety Features:
- Defaults to dry-run mode to preview changes
- Never deletes original source images in albums/ directories
- Only removes JSON entries and processed files (thumbnails/full)
- Shows statistics and detailed logging
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
    process.on('SIGINT', () => {
        console.log('\n🛑 Cleanup cancelled');
        process.exit(0);
    });

    // Run cleanup
    const runCleanup = options.interactive ?
        cleanup.interactiveCleanup() :
        cleanup.cleanup(options);

    runCleanup
        .then(() => {
            console.log('\n🎉 Cleanup process completed');
        })
        .catch((error) => {
            console.error('\n❌ Cleanup failed:', error.message);
            process.exit(1);
        });
}

module.exports = PhotoCleanup;