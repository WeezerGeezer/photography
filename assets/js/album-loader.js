document.addEventListener('DOMContentLoaded', () => {
    // Only run on album page
    if (!document.querySelector('.album-container')) return;

    // Elements
    const albumTitle = document.getElementById('album-title');
    const albumDescription = document.getElementById('album-description');
    const albumName = document.getElementById('album-name');
    const albumGrid = document.querySelector('.album-grid');
    const shareButton = document.getElementById('share-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    let masonry = null;

    // Get album ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
        window.location.href = 'index.html';
        return;
    }

    // Load album data
    async function loadAlbumData() {
        try {
            console.log('🔍 DEBUG: Loading album data for albumId:', albumId);
            showLoading(true);
            const response = await fetch('/data/albums.json');
            const data = await response.json();

            console.log('🔍 DEBUG: Available albums:', Object.keys(data));

            const album = data[albumId];
            if (!album) {
                console.error('🚨 DEBUG: Album not found. Searched for:', albumId);
                throw new Error('Album not found');
            }

            console.log('✅ DEBUG: Album found:', {
                title: album.title,
                isPrivate: album.isPrivate,
                imageCount: album.images?.length || 0,
                hasImages: !!album.images
            });

            // Allow access to private albums when accessed directly via album URL
            // Private filtering only applies to homepage gallery
            return album;
        } catch (error) {
            console.error('🚨 DEBUG: Error loading album:', error);
            showError('Failed to load album');
        } finally {
            showLoading(false);
        }
    }

    // Render album content
    async function renderAlbum() {
        const album = await loadAlbumData();
        if (!album) return;

        // Update page title and meta description
        document.title = `${album.title} - Photography Portfolio`;
        document.querySelector('meta[name="description"]').content = album.description;

        // Update album header
        albumTitle.textContent = album.title;
        albumDescription.textContent = album.description;
        albumName.textContent = album.title;

        // Sort images by order field (if present), then by date
        const sortedImages = [...album.images].sort((a, b) => {
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

        // Render images
        const fragment = document.createDocumentFragment();
        sortedImages.forEach(image => {
            const item = createAlbumItem(image);
            fragment.appendChild(item);
        });

        albumGrid.appendChild(fragment);

        // Initialize layout and lightbox for album images
        console.log('🔍 DEBUG: Album ID:', albumId);
        console.log('🔍 DEBUG: Album images array:', album.images?.length || 0, 'images');

        if (albumId === 'DSi Early Work') {
            console.log('🎮 DEBUG: Using DSi-specific grid layout for', albumId);
            initializeDSiGridLayout(album.images);
        } else {
            console.log('📸 DEBUG: Initializing standard lightbox for', albumId);

            // Initialize masonry layout for non-DSi albums
            if (!masonry && window.MasonryLayout) {
                masonry = new window.MasonryLayout(albumGrid, {
                    itemSelector: '.gallery-item',
                    columnWidth: 280,
                    gutter: 12
                });
            }

            // Layout the items with a delay to ensure images are added to DOM and start loading
            setTimeout(() => {
                if (masonry) {
                    masonry.layout();
                }
            }, 200);

            initializeLightbox(album.images);
        }
    }

    // Create album item
    function createAlbumItem(image) {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        // Add DSi overlay class if this is a DSi photo
        const urlParams = new URLSearchParams(window.location.search);
        const albumId = urlParams.get('id');
        if (albumId === 'DSi Early Work') {
            item.classList.add('dsi-photo');
            // DSi photos get special grid treatment, not masonry
        }

        // Create img element with load handler for masonry layout
        const img = document.createElement('img');
        img.src = image.thumbnail;
        img.alt = image.title;
        img.loading = 'lazy';
        img.setAttribute('data-full', image.full);
        
        // Let image maintain natural aspect ratio for true masonry
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'gallery-item-info';
        infoDiv.innerHTML = `
            <p class="image-date">${new Date(image.date).toLocaleDateString()}</p>
        `;

        item.appendChild(img);
        item.appendChild(infoDiv);
        
        // Handle image load for proper masonry layout
        img.addEventListener('load', () => {
            item.classList.add('loaded');
        });

        return item;
    }

    // Fallback function to open standard lightbox
    function openStandardLightbox(images, startIndex = 0) {
        console.log('🔄 DEBUG: Opening standard lightbox fallback, index:', startIndex);

        if (!images || images.length === 0) {
            console.error('🚨 DEBUG: No images available for lightbox');
            return;
        }

        const lightbox = document.querySelector('.lightbox');
        if (!lightbox) {
            console.error('🚨 DEBUG: Lightbox element not found');
            return;
        }

        // Set current index and open lightbox
        window.currentLightboxImages = images;
        window.currentLightboxIndex = startIndex;

        const lightboxImg = lightbox.querySelector('.lightbox-img');
        const imageInfo = lightbox.querySelector('.image-info');

        if (lightboxImg && images[startIndex]) {
            lightboxImg.src = images[startIndex].full;
            lightboxImg.alt = images[startIndex].title;

            if (imageInfo) {
                imageInfo.innerHTML = `
                    <h3 class="image-title">${images[startIndex].title || ''}</h3>
                    <p class="image-date">${new Date(images[startIndex].date).toLocaleDateString()}</p>
                `;
            }

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✅ DEBUG: Standard lightbox opened successfully');
        }
    }

    // Initialize lightbox for album images
    function initializeLightbox(images) {
        console.log('📸 DEBUG: Initializing standard lightbox with', images?.length || 0, 'images');
        const lightbox = document.querySelector('.lightbox');
        const lightboxImg = lightbox.querySelector('.lightbox-img');
        const lightboxClose = lightbox.querySelector('.close');
        const lightboxPrev = lightbox.querySelector('.prev');
        const lightboxNext = lightbox.querySelector('.next');
        const imageInfo = lightbox.querySelector('.image-info');

        let currentIndex = 0;

        // Open lightbox
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                currentIndex = index;
                updateLightboxImage();
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // Update lightbox image
        function updateLightboxImage() {
            const image = images[currentIndex];
            lightboxImg.src = image.full;
            lightboxImg.alt = image.title;
            
            // Build EXIF data display
            let exifHTML = '';
            if (image.technical) {
                exifHTML = `
                    <div class="exif-data">
                        <div class="exif-item">
                            <span class="exif-label">Camera</span>
                            <span class="exif-value">${image.technical.camera || 'Unknown'}</span>
                        </div>
                        <div class="exif-item">
                            <span class="exif-label">Lens</span>
                            <span class="exif-value">${image.technical.lens || 'Unknown'}</span>
                        </div>
                        <div class="exif-item">
                            <span class="exif-label">Settings</span>
                            <span class="exif-value">${image.technical.settings || 'N/A'}</span>
                        </div>
                        <div class="exif-item">
                            <span class="exif-label">Date</span>
                            <span class="exif-value">${new Date(image.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                `;
            } else {
                exifHTML = `
                    <div class="exif-data">
                        <div class="exif-item">
                            <span class="exif-label">Date</span>
                            <span class="exif-value">${new Date(image.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                `;
            }

            // Build tags display
            let tagsHTML = '';
            if (image.tags && image.tags.length > 0) {
                tagsHTML = `
                    <div class="image-tags">
                        ${image.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                `;
            }

            // Filter out camera-generated filenames that start with 'PEE'
            const displayTitle = image.title && image.title.startsWith('PEE') ? '' : image.title;

            imageInfo.innerHTML = `
                ${displayTitle ? `<h3 class="image-title">${displayTitle}</h3>` : ''}
                ${exifHTML}
                ${tagsHTML}
            `;

            // Update navigation visibility
            lightboxPrev.style.display = currentIndex > 0 ? 'block' : 'none';
            lightboxNext.style.display = currentIndex < images.length - 1 ? 'block' : 'none';
        }

        // Navigation
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        });

        lightboxNext.addEventListener('click', () => {
            if (currentIndex < images.length - 1) {
                currentIndex++;
                updateLightboxImage();
            }
        });

        lightboxPrev.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateLightboxImage();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    lightbox.classList.remove('active');
                    document.body.style.overflow = '';
                    break;
                case 'ArrowRight':
                    if (currentIndex < images.length - 1) {
                        currentIndex++;
                        updateLightboxImage();
                    }
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        currentIndex--;
                        updateLightboxImage();
                    }
                    break;
            }
        });
    }

    // Initialize DSi-specific grid layout for DSi album
    function initializeDSiGridLayout(images) {
        console.log('🎮 DEBUG: Initializing DSi grid layout with', images?.length || 0, 'images');

        if (!images || images.length === 0) {
            console.error('🚨 DEBUG: No images provided to DSi grid');
            return;
        }

        // Apply DSi-specific CSS grid layout
        const albumGrid = document.querySelector('.album-grid');
        if (albumGrid) {
            albumGrid.classList.add('dsi-grid-layout');
            console.log('✅ DEBUG: Applied DSi grid layout class');
        }

        // Initialize standard lightbox for DSi photos (no special DSi viewer)
        initializeLightbox(images);
        console.log('✅ DEBUG: DSi grid layout initialized with standard lightbox');
    }

    // Share functionality
    if (shareButton && navigator.share) {
        shareButton.style.display = 'block';
        shareButton.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: document.title,
                    text: albumDescription.textContent,
                    url: window.location.href
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        });
    } else {
        shareButton.style.display = 'none';
    }

    // Loading state
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
        albumGrid.style.opacity = show ? '0.5' : '1';
    }

    // Error handling
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        albumGrid.innerHTML = '';
        albumGrid.appendChild(errorDiv);
    }

    // Initialize
    renderAlbum();

    // Lazy loading for album images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});