document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const galleryGrid = document.querySelector('.gallery-grid');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxClose = lightbox.querySelector('.close');
    const lightboxPrev = lightbox.querySelector('.prev');
    const lightboxNext = lightbox.querySelector('.next');
    const lightboxLoading = lightbox.querySelector('.lightbox-loading');
    const loadMoreBtn = document.getElementById('load-more');
    const loadingIndicator = document.getElementById('loading-indicator');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // State
    let currentImages = [];
    let currentIndex = 0;
    let currentFilter = 'all';
    let page = 1;
    const imagesPerPage = 20;
    let masonry = null;
    let loading = false;
    let hasMoreImages = true;

    // Fetch images from the server
    async function fetchImages(filter = 'all', page = 1) {
        try {
            const response = await fetch(`/data/albums.json`);
            const data = await response.json();

            // Flatten all images from albums (excluding private albums)
            let images = [];
            Object.values(data).forEach(album => {
                // Skip private albums
                if (album.isPrivate) return;

                images = images.concat(album.images.map(img => ({
                    ...img,
                    album: album.title
                })));
            });

            // Filter by tag if not 'all'
            if (filter !== 'all') {
                images = images.filter(img =>
                    img.tags && img.tags.includes(filter)
                );
            }

            // Sort by date
            images.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Paginate
            const start = (page - 1) * imagesPerPage;
            const paginatedImages = images.slice(start, start + imagesPerPage);

            // Update hasMoreImages flag
            hasMoreImages = start + imagesPerPage < images.length;

            return { images: paginatedImages, hasMore: hasMoreImages };
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    }

    // Create gallery item
    function createGalleryItem(image) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
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
            ${image.album ? `<h3>${image.album}</h3>` : ''}
        `;

        item.appendChild(img);
        item.appendChild(infoDiv);

        // Make images clickable to open lightbox
        item.addEventListener('click', () => {
            openLightbox(image);
        });
        
        // Handle image load for proper masonry layout
        img.addEventListener('load', () => {
            item.classList.add('loaded');
        });
        
        return item;
    }

    // Render gallery
    async function renderGallery(filter = 'all', append = false) {
        if (loading) return;
        loading = true;

        // Show appropriate loading state
        if (append && loadingIndicator) {
            // Show spinner for infinite scroll
            loadingIndicator.style.display = 'flex';
        } else if (!append && galleryGrid.children.length === 0) {
            // Show skeleton for initial load
            showSkeletonLoader();
        }

        const result = await fetchImages(filter, page);
        const images = result.images || result; // Support both old and new return format
        
        if (!append) {
            galleryGrid.innerHTML = '';
            currentImages = [];
        }

        const fragment = document.createDocumentFragment();
        images.forEach(image => {
            fragment.appendChild(createGalleryItem(image));
            currentImages.push(image);
        });

        galleryGrid.appendChild(fragment);
        
        // Hide loading indicators
        hideSkeletonLoader();
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        loading = false;
        
        // Initialize or update masonry layout
        if (!masonry && window.MasonryLayout) {
            masonry = new window.MasonryLayout(galleryGrid, {
                itemSelector: '.gallery-item',
                columnWidth: 300,
                gutter: 16
            });
        }
        
        // Wait for images to start loading before initial layout
        // Use a longer delay to ensure lazy-loaded images have begun loading
        setTimeout(() => {
            if (masonry) {
                masonry.layout();

                // Additional layout after a bit more time to catch any delayed image loads
                setTimeout(() => {
                    masonry.layout();
                }, 500);
            }
        }, 100);
    }

    // Lightbox functionality
    function openLightbox(image) {
        currentIndex = currentImages.findIndex(img => img.id === image.id);
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateLightboxImage() {
        const image = currentImages[currentIndex];
        lightboxImg.src = image.full;
        lightboxImg.alt = image.title;
        
        // Update image info with EXIF data
        const imageInfo = lightbox.querySelector('.image-info');

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
        const displayTitle = image.title && image.title.startsWith('PEE') ? '' : (image.album || image.title);

        imageInfo.innerHTML = `
            ${displayTitle ? `<h3 class="image-title">${displayTitle}</h3>` : ''}
            ${exifHTML}
            ${tagsHTML}
        `;

        // Update navigation visibility
        lightboxPrev.style.display = currentIndex > 0 ? 'block' : 'none';
        // Show next button if there are more images loaded OR if more images can be loaded
        lightboxNext.style.display = (currentIndex < currentImages.length - 1 || hasMoreImages) ? 'block' : 'none';
    }

    async function nextImage() {
        if (currentIndex < currentImages.length - 1) {
            currentIndex++;
            updateLightboxImage();

            // Check if we're near the end and need to load more images
            const threshold = 5; // Load more when within 5 images of the end
            const remaining = currentImages.length - 1 - currentIndex;

            if (remaining <= threshold && hasMoreImages && !loading) {
                // Show loading indicator
                if (lightboxLoading) lightboxLoading.style.display = 'flex';

                // Load more images in the background
                page++;
                await renderGallery(currentFilter, true);

                // Hide loading indicator
                if (lightboxLoading) lightboxLoading.style.display = 'none';
            }
        } else if (hasMoreImages && !loading) {
            // We're at the very end but more images are available
            // Show loading indicator
            if (lightboxLoading) lightboxLoading.style.display = 'flex';

            page++;
            await renderGallery(currentFilter, true);

            // Hide loading indicator
            if (lightboxLoading) lightboxLoading.style.display = 'none';

            // After loading, move to the next image if it exists
            if (currentIndex < currentImages.length - 1) {
                currentIndex++;
                updateLightboxImage();
            }
        }
    }

    function prevImage() {
        if (currentIndex > 0) {
            currentIndex--;
            updateLightboxImage();
        }
    }

    // Event Listeners
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
        }
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            applyFilter(filter);
        });
    });

    // Function to apply filter (used by both sidebar and mobile)
    function applyFilter(filter) {
        // Update active state for sidebar filters only
        filterBtns.forEach(b => b.classList.remove('active'));
        filterBtns.forEach(b => {
            if (b.dataset.filter === filter) {
                b.classList.add('active');
            }
        });

        // Reset pagination and update gallery
        page = 1;
        currentFilter = filter;
        hasMoreImages = true;
        renderGallery(filter);
    }

    // Listen for mobile filter changes
    document.addEventListener('filterChange', (e) => {
        const filter = e.detail.filter;
        applyFilter(filter);
    });

    // Infinite scroll functionality
    function setupInfiniteScroll() {
        const threshold = 1000; // Load more when 1000px from bottom
        
        function checkScroll() {
            if (loading || !hasMoreImages) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollTop + windowHeight >= documentHeight - threshold) {
                page++;
                renderGallery(currentFilter, true);
            }
        }
        
        // Throttle scroll events for better performance
        let ticking = false;
        function throttledCheckScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', throttledCheckScroll);
    }

    // Legacy load more button (hidden by default now)
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none'; // Hide the load more button
        loadMoreBtn.addEventListener('click', () => {
            page++;
            renderGallery(currentFilter, true);
        });
    }

    // Skeleton loader functions
    function showSkeletonLoader() {
        const existingSkeleton = document.querySelector('.skeleton-container');
        if (existingSkeleton) return;

        const skeletonContainer = document.createElement('div');
        skeletonContainer.className = 'skeleton-container';

        // Create skeleton items with varied heights for realism
        const skeletonHeights = ['skeleton-image', 'skeleton-image tall', 'skeleton-image landscape', 'skeleton-image tall', 'skeleton-image', 'skeleton-image landscape'];

        for (let i = 0; i < 12; i++) {
            const skeletonItem = document.createElement('div');
            skeletonItem.className = 'skeleton-item';

            const skeletonImage = document.createElement('div');
            skeletonImage.className = skeletonHeights[i % skeletonHeights.length];

            skeletonItem.appendChild(skeletonImage);
            skeletonContainer.appendChild(skeletonItem);
        }

        galleryGrid.parentNode.insertBefore(skeletonContainer, galleryGrid);
    }

    function hideSkeletonLoader() {
        const skeleton = document.querySelector('.skeleton-container');
        if (skeleton) {
            skeleton.remove();
        }
    }

    // Initialize gallery and infinite scroll
    renderGallery();
    setupInfiniteScroll();

    // Lazy loading for gallery images
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