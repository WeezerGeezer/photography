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

                    <!-- Navigation Controls -->
                    <div class="dsi-nav-controls left">
                        <button class="dsi-nav-btn" id="dsi-prev">&#10094;</button>
                    </div>

                    <div class="dsi-nav-controls right">
                        <button class="dsi-nav-btn" id="dsi-next">&#10095;</button>
                    </div>

                    <!-- DSi Frame -->
                    <div class="dsi-frame">
                        <!-- Top Screen -->
                        <div class="dsi-top-screen">
                            <img class="dsi-photo" id="dsi-photo" src="" alt="" />
                            <!-- Touch areas for mobile navigation -->
                            <div class="dsi-touch-area">
                                <div class="dsi-touch-left" id="dsi-touch-left"></div>
                                <div class="dsi-touch-right" id="dsi-touch-right"></div>
                            </div>
                        </div>

                        <!-- Hinge -->
                        <div class="dsi-hinge"></div>

                        <!-- Bottom Screen -->
                        <div class="dsi-bottom-screen">
                            <div class="dsi-info">
                                <div class="dsi-filename" id="dsi-filename">IMG_0001.JPG</div>
                                <div class="dsi-details" id="dsi-details">640 x 480 • 125 KB</div>
                                <div class="dsi-date" id="dsi-date">2008/03/15 14:30</div>

                                <div class="dsi-navigation">
                                    <div class="dsi-counter" id="dsi-counter">01/12</div>
                                    <div class="dsi-battery">
                                        <div class="dsi-battery-icon"></div>
                                        <div class="dsi-battery-text">FULL</div>
                                    </div>
                                </div>
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

        // Touch controls for mobile
        document.getElementById('dsi-touch-left').addEventListener('click', () => this.prev());
        document.getElementById('dsi-touch-right').addEventListener('click', () => this.next());

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

        // Update filename (simulate DSi camera naming)
        const filename = this.generateDSiFilename(image, this.currentIndex);
        document.getElementById('dsi-filename').textContent = filename;

        // Update details (simulate file info)
        const details = this.generateFileDetails(image);
        document.getElementById('dsi-details').textContent = details;

        // Update date (DSi format)
        const date = this.formatDSiDate(image.date);
        document.getElementById('dsi-date').textContent = date;

        // Update counter
        const counter = `${String(this.currentIndex + 1).padStart(2, '0')}/${String(this.images.length).padStart(2, '0')}`;
        document.getElementById('dsi-counter').textContent = counter;

        // Update navigation button visibility
        const prevBtn = document.getElementById('dsi-prev');
        const nextBtn = document.getElementById('dsi-next');

        prevBtn.style.opacity = this.currentIndex > 0 ? '1' : '0.3';
        nextBtn.style.opacity = this.currentIndex < this.images.length - 1 ? '1' : '0.3';

        prevBtn.style.pointerEvents = this.currentIndex > 0 ? 'auto' : 'none';
        nextBtn.style.pointerEvents = this.currentIndex < this.images.length - 1 ? 'auto' : 'none';

        // Animate battery (fun effect)
        this.animateBattery();
    }

    generateDSiFilename(image, index) {
        // Simulate DSi camera filename format: HNI_00XX.JPG
        const number = String(index + 1).padStart(4, '0');
        return `HNI_${number}.JPG`;
    }

    generateFileDetails(image) {
        // Simulate low-res DSi camera specs
        const width = 256; // DSi camera resolution
        const height = 192;
        const fileSize = Math.floor(Math.random() * 50 + 25); // Random size 25-75 KB

        return `${width} x ${height} • ${fileSize} KB`;
    }

    formatDSiDate(dateString) {
        // Convert to DSi-style date format: YYYY/MM/DD HH:MM
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        return `${year}/${month}/${day} ${hour}:${minute}`;
    }

    animateBattery() {
        const batteryIcon = document.querySelector('.dsi-battery-icon');
        const batteryText = document.querySelector('.dsi-battery-text');

        // Random battery states for fun
        const batteryStates = [
            { level: '100%', text: 'FULL', color: '#00ff00' },
            { level: '80%', text: 'HIGH', color: '#88ff00' },
            { level: '60%', text: 'MED', color: '#ffff00' },
            { level: '40%', text: 'LOW', color: '#ff8800' },
            { level: '20%', text: 'CRITICAL', color: '#ff4400' }
        ];

        const randomState = batteryStates[Math.floor(Math.random() * batteryStates.length)];

        // Update battery display
        batteryIcon.style.background = `linear-gradient(90deg, ${randomState.color} 0%, ${randomState.color} ${randomState.level}, transparent ${randomState.level})`;
        batteryIcon.style.borderColor = randomState.color;
        batteryIcon.querySelector('::after') && (batteryIcon.style.setProperty('--after-bg', randomState.color));
        batteryText.textContent = randomState.text;
        batteryText.style.color = randomState.color;
    }

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