/**
 * DSi Photo Viewer Module
 * Creates a Nintendo DSi-themed photo viewing experience
 */

class DSiViewer {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.isActive = false;
        this.element = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        this.createElement();
        this.setupEventListeners();
    }

    createElement() {
        // Create the DSi lightbox HTML structure
        const dsiHTML = `
            <div class="dsi-lightbox" id="dsi-lightbox">
                <div class="dsi-viewer-container">
                    <!-- Close Button -->
                    <button class="dsi-close" id="dsi-close">&times;</button>

                    <!-- DSi Frame with actual frame image -->
                    <div class="dsi-frame">
                        <!-- Top Screen (Photo Display) -->
                        <div class="dsi-top-screen">
                            <img class="dsi-photo" id="dsi-photo" src="" alt="" />
                        </div>

                        <!-- Bottom Screen (Navigation) -->
                        <div class="dsi-bottom-screen">
                            <div class="dsi-nav-container">
                                <button class="dsi-nav-arrow" id="dsi-prev">◀</button>
                                <div class="dsi-counter" id="dsi-counter">01/65</div>
                                <button class="dsi-nav-arrow" id="dsi-next">▶</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', dsiHTML);
        this.element = document.getElementById('dsi-lightbox');
    }

    setupEventListeners() {
        // Navigation controls
        document.getElementById('dsi-close').addEventListener('click', () => this.close());
        document.getElementById('dsi-prev').addEventListener('click', () => this.prev());
        document.getElementById('dsi-next').addEventListener('click', () => this.next());

        // No more separate touch areas - navigation is in bottom screen

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });

        // Touch swipe gestures
        this.element.addEventListener('touchstart', (e) => {
            if (!this.isActive) return;
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        this.element.addEventListener('touchend', (e) => {
            if (!this.isActive) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Only trigger swipe if horizontal movement is greater than vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.prev(); // Swipe right = previous
                } else {
                    this.next(); // Swipe left = next
                }
            }
        });

        // Click outside to close
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });
    }

    open(images, startIndex = 0) {
        this.images = images;
        this.currentIndex = startIndex;
        this.isActive = true;

        this.updateDisplay();
        this.element.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add DSi startup sound effect (optional)
        this.playSound('startup');
    }

    close() {
        this.isActive = false;
        this.element.classList.remove('active');
        document.body.style.overflow = '';

        // Add DSi shutdown sound effect (optional)
        this.playSound('shutdown');
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateDisplay();
            this.playSound('navigate');
        }
    }

    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.updateDisplay();
            this.playSound('navigate');
        }
    }

    updateDisplay() {
        const image = this.images[this.currentIndex];
        if (!image) return;

        // Update photo
        const photoElement = document.getElementById('dsi-photo');
        photoElement.src = image.full;
        photoElement.alt = image.accessibility?.altText || image.title;

        // Simple counter display only

        // Update counter
        const counter = `${String(this.currentIndex + 1).padStart(2, '0')}/${String(this.images.length).padStart(2, '0')}`;
        document.getElementById('dsi-counter').textContent = counter;

        // Update navigation button states
        const prevBtn = document.getElementById('dsi-prev');
        const nextBtn = document.getElementById('dsi-next');

        prevBtn.disabled = this.currentIndex <= 0;
        nextBtn.disabled = this.currentIndex >= this.images.length - 1;
    }

    // Removed DSi simulation functions - keeping it simple with just navigation

    playSound(type) {
        // Optional: Add DSi sound effects
        // This would require actual sound files
        try {
            const audio = new Audio(`/assets/sounds/dsi-${type}.mp3`);
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore audio errors if sounds don't exist
            });
        } catch (e) {
            // Sounds are optional
        }
    }

    // Static method to check if DSi viewer should be used
    static isDSiAlbum(albumKey) {
        return albumKey === 'DSi Early Work';
    }

    // Static method to initialize DSi viewer for an album
    static initForAlbum(albumKey, images) {
        if (!DSiViewer.isDSiAlbum(albumKey)) {
            return null;
        }

        const viewer = new DSiViewer();

        // Override gallery item click handlers
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            const img = item.querySelector('img');
            if (img) {
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    viewer.open(images, index);
                });
            }
        });

        return viewer;
    }
}

// Export for use in other modules
window.DSiViewer = DSiViewer;

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Module is loaded and ready
    });
} else {
    // DOM is already loaded
}

export default DSiViewer;