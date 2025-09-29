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

        // Render images
        const fragment = document.createDocumentFragment();
        album.images.forEach(image => {
            const item = createAlbumItem(image);
            fragment.appendChild(item);
        });

        albumGrid.appendChild(fragment);

        // Initialize masonry layout
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

        // Initialize lightbox or DSi viewer for album images
        console.log('🔍 DEBUG: Album ID:', albumId, 'DSi viewer available:', !!window.DSiViewer);
        console.log('🔍 DEBUG: Album images array:', album.images?.length || 0, 'images');

        if (albumId === 'DSi Early Work' && window.DSiViewer) {
            console.log('🎮 DEBUG: Attempting to initialize DSi viewer for', albumId);
            try {
                initializeDSiViewer(album.images);
                console.log('✅ DEBUG: DSi viewer initialized successfully');
            } catch (error) {
                console.error('🚨 DEBUG: DSi viewer failed, falling back to standard lightbox:', error);
                initializeLightbox(album.images);
            }
        } else {
            console.log('📸 DEBUG: Initializing standard lightbox for', albumId);
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

    // Initialize DSi viewer for DSi album
    function initializeDSiViewer(images) {
        console.log('🎮 DEBUG: Initializing DSi viewer with', images?.length || 0, 'images');

        if (!images || images.length === 0) {
            console.error('🚨 DEBUG: No images provided to DSi viewer, falling back to standard lightbox');
            initializeLightbox(images);
            return;
        }

        let dsiViewer = null;

        // Create DSi viewer instance
        if (window.DSiViewer) {
            try {
                dsiViewer = new window.DSiViewer();
                console.log('✅ DEBUG: DSi viewer instance created successfully');
            } catch (error) {
                console.error('🚨 DEBUG: Error creating DSi viewer:', error);
                console.log('🔄 DEBUG: Falling back to standard lightbox');
                initializeLightbox(images);
                return;
            }
        } else {
            console.error('🚨 DEBUG: DSiViewer class not available, falling back to standard lightbox');
            initializeLightbox(images);
            return;
        }

        // Open DSi viewer when gallery items are clicked
        const galleryItems = document.querySelectorAll('.gallery-item');
        console.log('🔍 DEBUG: Found', galleryItems.length, 'gallery items for DSi viewer');

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🎮 DEBUG: DSi photo clicked, index:', index);
                if (dsiViewer) {
                    try {
                        dsiViewer.open(images, index);
                        console.log('✅ DEBUG: DSi viewer opened successfully');
                    } catch (error) {
                        console.error('🚨 DEBUG: Error opening DSi viewer:', error);
                        console.log('🔄 DEBUG: Attempting fallback to standard lightbox');
                        // Fallback: manually trigger standard lightbox
                        openStandardLightbox(images, index);
                    }
                } else {
                    console.error('🚨 DEBUG: DSi viewer not available, using fallback');
                    openStandardLightbox(images, index);
                }
            });
        });
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