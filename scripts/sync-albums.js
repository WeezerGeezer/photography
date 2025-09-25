#!/usr/bin/env node

/**
 * Album Sync Script
 * Detects renamed album directories and updates albums.json accordingly
 * Usage: node sync-albums.js [--dry-run]
 */

const fs = require('fs').promises;
const path = require('path');

class AlbumSyncer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.albumsJsonPath = path.join(this.projectRoot, 'data', 'albums.json');
        this.albumsDir = path.join(this.projectRoot, 'assets', 'images', 'albums');
        this.thumbnailsDir = path.join(this.projectRoot, 'assets', 'images', 'thumbnails');
        this.fullDir = path.join(this.projectRoot, 'assets', 'images', 'full');
        this.dryRun = process.argv.includes('--dry-run');
    }

    async run() {
        console.log('📁 Album Directory Sync Tool');
        console.log('=============================');

        if (this.dryRun) {
            console.log('🔍 Running in DRY RUN mode - no changes will be made');
        }

        try {
            // Load current albums.json
            const albumsData = await this.loadAlbumsData();

            // Get current directory structure
            const currentDirs = await this.getCurrentDirectories();

            // Find mismatches between JSON keys and directory names
            const changes = await this.detectChanges(albumsData, currentDirs);

            if (changes.length === 0) {
                console.log('✅ All album directories are in sync with albums.json');
                return;
            }

            // Display proposed changes
            console.log('\n📋 Detected Changes:');
            changes.forEach((change, index) => {
                console.log(`${index + 1}. ${change.type}:`);
                if (change.type === 'rename') {
                    console.log(`   "${change.oldKey}" → "${change.newKey}"`);
                } else if (change.type === 'missing_json') {
                    console.log(`   New directory found: "${change.directory}"`);
                } else if (change.type === 'missing_directory') {
                    console.log(`   Directory missing for: "${change.key}"`);
                }
            });

            if (!this.dryRun) {
                // Apply changes
                const updatedData = await this.applyChanges(albumsData, changes);
                await this.saveAlbumsData(updatedData);
                console.log('\n✅ Albums.json has been updated successfully!');
            } else {
                console.log('\n🔍 Dry run complete - no changes made');
            }

        } catch (error) {
            console.error('❌ Error during sync:', error.message);
            process.exit(1);
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

    async getCurrentDirectories() {
        try {
            const entries = await fs.readdir(this.albumsDir, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name)
                .filter(name => !name.startsWith('.')); // Ignore hidden directories
        } catch (error) {
            throw new Error(`Failed to read albums directory: ${error.message}`);
        }
    }

    async detectChanges(albumsData, currentDirs) {
        const changes = [];
        const jsonKeys = Object.keys(albumsData);

        // Check for missing directories (JSON entries without corresponding directories)
        for (const key of jsonKeys) {
            if (!currentDirs.includes(key)) {
                // Check if this might be a rename by looking for similar directories
                const possibleMatch = this.findPossibleRename(key, currentDirs, jsonKeys);
                if (possibleMatch) {
                    changes.push({
                        type: 'rename',
                        oldKey: key,
                        newKey: possibleMatch,
                        data: albumsData[key]
                    });
                } else {
                    changes.push({
                        type: 'missing_directory',
                        key: key
                    });
                }
            }
        }

        // Check for new directories (directories without JSON entries)
        for (const dir of currentDirs) {
            if (!jsonKeys.includes(dir)) {
                // Make sure this isn't already part of a rename
                const isPartOfRename = changes.some(change =>
                    change.type === 'rename' && change.newKey === dir
                );

                if (!isPartOfRename) {
                    changes.push({
                        type: 'missing_json',
                        directory: dir
                    });
                }
            }
        }

        return changes;
    }

    findPossibleRename(oldKey, currentDirs, jsonKeys) {
        // Look for directories that exist but aren't in JSON
        const unmatchedDirs = currentDirs.filter(dir => !jsonKeys.includes(dir));

        if (unmatchedDirs.length === 1 && currentDirs.length === jsonKeys.length) {
            // If there's exactly one unmatched directory and the counts match,
            // it's likely a rename
            return unmatchedDirs[0];
        }

        // Look for similar names (basic similarity check)
        for (const dir of unmatchedDirs) {
            if (this.isSimilar(oldKey, dir)) {
                return dir;
            }
        }

        return null;
    }

    isSimilar(str1, str2) {
        // Simple similarity check - could be enhanced
        const words1 = str1.toLowerCase().split(/\s+|[-_]/);
        const words2 = str2.toLowerCase().split(/\s+|[-_]/);

        // Check if they share significant words
        const commonWords = words1.filter(word =>
            word.length > 2 && words2.includes(word)
        );

        return commonWords.length >= Math.min(words1.length, words2.length) * 0.5;
    }

    async applyChanges(albumsData, changes) {
        const updatedData = { ...albumsData };

        for (const change of changes) {
            switch (change.type) {
                case 'rename':
                    console.log(`\n🔄 Renaming album "${change.oldKey}" to "${change.newKey}"`);

                    // Update the key in JSON
                    updatedData[change.newKey] = { ...change.data };
                    delete updatedData[change.oldKey];

                    // Update title to match new directory name
                    updatedData[change.newKey].title = this.generateTitle(change.newKey);

                    // Update all image paths in the album
                    if (updatedData[change.newKey].images) {
                        updatedData[change.newKey].images = updatedData[change.newKey].images.map(img => ({
                            ...img,
                            thumbnail: img.thumbnail.replace(`/${change.oldKey}/`, `/${change.newKey}/`),
                            full: img.full.replace(`/${change.oldKey}/`, `/${change.newKey}/`)
                        }));
                    }

                    // Update cover path if it exists
                    if (updatedData[change.newKey].cover) {
                        updatedData[change.newKey].cover = updatedData[change.newKey].cover.replace(
                            `${change.oldKey}/`, `${change.newKey}/`
                        );
                    }
                    break;

                case 'missing_json':
                    console.log(`\n➕ New directory detected: "${change.directory}"`);
                    console.log('   Run the import script to add this album to the JSON');
                    break;

                case 'missing_directory':
                    console.log(`\n⚠️  Directory missing for album: "${change.key}"`);
                    console.log('   The album entry will remain in JSON but images won\'t be accessible');
                    break;
            }
        }

        return updatedData;
    }

    generateTitle(albumName) {
        return albumName
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async saveAlbumsData(data) {
        try {
            await fs.writeFile(
                this.albumsJsonPath,
                JSON.stringify(data, null, 4),
                'utf8'
            );
        } catch (error) {
            throw new Error(`Failed to save albums.json: ${error.message}`);
        }
    }
}

// Run the script
if (require.main === module) {
    const syncer = new AlbumSyncer();
    syncer.run().catch(console.error);
}

module.exports = AlbumSyncer;