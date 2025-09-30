#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class PhotoReorder {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.albumsJsonPath = path.join(this.projectRoot, 'data', 'albums.json');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async loadAlbums() {
        try {
            const data = await fs.readFile(this.albumsJsonPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load albums.json: ${error.message}`);
        }
    }

    async saveAlbums(data) {
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

    question(query) {
        return new Promise(resolve => this.rl.question(query, resolve));
    }

    async selectAlbum(albums) {
        console.log('\n📁 Available Albums:');
        const albumNames = Object.keys(albums);
        albumNames.forEach((name, index) => {
            const count = albums[name].images?.length || 0;
            console.log(`  ${index + 1}. ${name} (${count} photos)`);
        });

        const answer = await this.question('\nEnter album number: ');
        const index = parseInt(answer) - 1;

        if (index < 0 || index >= albumNames.length) {
            throw new Error('Invalid album selection');
        }

        return albumNames[index];
    }

    displayPhotos(photos) {
        console.log('\n📸 Current Photo Order:');
        photos.forEach((photo, index) => {
            const orderField = photo.order !== undefined ? `[order: ${photo.order}]` : '[no order]';
            console.log(`  ${index + 1}. ${photo.title} ${orderField} (${photo.date})`);
        });
    }

    async reorderMenu(albumName, album) {
        while (true) {
            this.displayPhotos(album.images);

            console.log('\n🔧 Options:');
            console.log('  1. Set order for all photos (1, 2, 3...)');
            console.log('  2. Move specific photo to position');
            console.log('  3. Clear all order values (revert to date sorting)');
            console.log('  4. Swap two photos');
            console.log('  5. Save and exit');
            console.log('  6. Exit without saving');

            const choice = await this.question('\nSelect option: ');

            switch (choice) {
                case '1':
                    await this.setSequentialOrder(album);
                    break;
                case '2':
                    await this.movePhotoToPosition(album);
                    break;
                case '3':
                    await this.clearAllOrder(album);
                    break;
                case '4':
                    await this.swapPhotos(album);
                    break;
                case '5':
                    return true; // Save
                case '6':
                    return false; // Don't save
                default:
                    console.log('❌ Invalid option');
            }
        }
    }

    async setSequentialOrder(album) {
        console.log('\n⚙️  Setting sequential order for all photos...');
        album.images.forEach((photo, index) => {
            photo.order = index + 1;
        });
        console.log('✅ Sequential order applied (1, 2, 3...)');
    }

    async clearAllOrder(album) {
        const confirm = await this.question('\n⚠️  Clear all order values? This will revert to date sorting. (y/n): ');
        if (confirm.toLowerCase() === 'y') {
            album.images.forEach(photo => {
                delete photo.order;
            });
            console.log('✅ All order values cleared');
        }
    }

    async movePhotoToPosition(album) {
        const fromAnswer = await this.question('\nEnter photo number to move: ');
        const fromIndex = parseInt(fromAnswer) - 1;

        if (fromIndex < 0 || fromIndex >= album.images.length) {
            console.log('❌ Invalid photo number');
            return;
        }

        const toAnswer = await this.question('Enter new position: ');
        const toIndex = parseInt(toAnswer) - 1;

        if (toIndex < 0 || toIndex >= album.images.length) {
            console.log('❌ Invalid position');
            return;
        }

        // Remove photo from old position
        const [photo] = album.images.splice(fromIndex, 1);
        // Insert at new position
        album.images.splice(toIndex, 0, photo);

        // Update order values for all photos
        album.images.forEach((photo, index) => {
            photo.order = index + 1;
        });

        console.log(`✅ Moved "${photo.title}" to position ${toIndex + 1}`);
    }

    async swapPhotos(album) {
        const first = await this.question('\nEnter first photo number: ');
        const firstIndex = parseInt(first) - 1;

        const second = await this.question('Enter second photo number: ');
        const secondIndex = parseInt(second) - 1;

        if (firstIndex < 0 || firstIndex >= album.images.length ||
            secondIndex < 0 || secondIndex >= album.images.length) {
            console.log('❌ Invalid photo numbers');
            return;
        }

        // Swap photos
        [album.images[firstIndex], album.images[secondIndex]] =
        [album.images[secondIndex], album.images[firstIndex]];

        // Update order values
        album.images.forEach((photo, index) => {
            photo.order = index + 1;
        });

        console.log(`✅ Swapped photos at positions ${firstIndex + 1} and ${secondIndex + 1}`);
    }

    async run() {
        try {
            console.log('🎨 Photo Reorder Utility\n');

            const albums = await this.loadAlbums();
            const albumName = await this.selectAlbum(albums);
            const album = albums[albumName];

            console.log(`\n📖 Working with album: ${albumName}`);
            console.log(`   ${album.images.length} photos total`);

            const shouldSave = await this.reorderMenu(albumName, album);

            if (shouldSave) {
                await this.saveAlbums(albums);
                console.log('\n✅ Changes saved to albums.json');
            } else {
                console.log('\n❌ Changes discarded');
            }

        } catch (error) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }
}

// CLI execution
if (require.main === module) {
    const reorder = new PhotoReorder();
    reorder.run();
}

module.exports = PhotoReorder;