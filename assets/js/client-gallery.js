/**
 * Client Gallery System
 * Hash-based token authentication for private photo galleries
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only run on client gallery page
    if (!document.querySelector('.client-gallery-container')) return;

    // Elements
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const galleryContent = document.getElementById('gallery-content');
    const galleryTitle = document.getElementById('gallery-title');
    const galleryDescription = document.getElementById('gallery-description');
    const galleryGrid = document.querySelector('.client-gallery-grid');
    const photoCountText = document.getElementById('photo-count-text');
    const selectedCount = document.getElementById('selected-count');
    const clientDetails = document.getElementById('client-details');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const selectDownloadBtn = document.getElementById('select-download-btn');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxClose = lightbox.querySelector('.close');
    const lightboxPrev = lightbox.querySelector('.prev');
    const lightboxNext = lightbox.querySelector('.next');
    const downloadCurrentBtn = document.getElementById('download-current');

    // State
    let currentAlbum = null;
    let currentImages = [];
    let currentIndex = 0;
    let selectedPhotos = new Set();
    let selectionMode = false;

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showError();
        return;
    }

    // Load gallery data
    async function loadClientGallery() {
        try {
            const response = await fetch('/data/albums.json');
            const data = await response.json();

            // Find album by token (album key should include the token)
            const albumKey = `client-${token}`;
            const album = data[albumKey];

            if (!album || !album.isPrivate) {
                throw new Error('Gallery not found');
            }

            // Check expiry if set
            if (album.expiryDate && new Date() > new Date(album.expiryDate)) {
                throw new Error('Gallery has expired');
            }

            currentAlbum = album;
            currentImages = album.images || [];

            renderGallery();

        } catch (error) {
            console.error('Error loading client gallery:', error);
            showError();
        }
    }

    function renderGallery() {
        // Update page title
        document.title = `${currentAlbum.title} - Photography Portfolio`;

        // Show gallery content
        loadingState.style.display = 'none';
        galleryContent.style.display = 'block';

        // Update gallery info
        galleryTitle.textContent = currentAlbum.title;
        galleryDescription.textContent = currentAlbum.description;
        photoCountText.textContent = `${currentImages.length} photo${currentImages.length !== 1 ? 's' : ''}`;

        // Update client info in sidebar
        if (currentAlbum.clientInfo) {
            clientDetails.innerHTML = `
                <p><strong>${currentAlbum.clientInfo.name}</strong></p>
                <p class="delivery-date">Delivered: ${new Date(currentAlbum.clientInfo.deliveryDate).toLocaleDateString()}</p>
                ${currentAlbum.expiryDate ? `<p class="expiry-date">Access until: ${new Date(currentAlbum.expiryDate).toLocaleDateString()}</p>` : ''}
            `;
        }

        // Render photos
        renderPhotos();

        // Setup download functionality
        setupDownloadButtons();

        // Setup lightbox
        setupLightbox();
    }

    function renderPhotos() {
        galleryGrid.innerHTML = '';

        currentImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item client-photo-item';
            item.dataset.index = index;

            // Add selection checkbox if in selection mode
            const selectionCheckbox = selectionMode ? `
                <div class="photo-selection">
                    <input type="checkbox" id="select-${index}" ${selectedPhotos.has(index) ? 'checked' : ''}>
                    <label for="select-${index}"></label>
                </div>
            ` : '';

            item.innerHTML = `
                ${selectionCheckbox}
                <img src="${image.thumbnail}" alt="${image.title}" loading="lazy">
                <div class="photo-actions">
                    <button class="download-single" data-index="${index}">Download</button>
                </div>
            `;

            // Click to open lightbox (if not in selection mode)
            const img = item.querySelector('img');
            img.addEventListener('click', () => {
                if (!selectionMode) {
                    openLightbox(index);
                }
            });

            // Selection checkbox handling
            if (selectionMode) {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedPhotos.add(index);
                        item.classList.add('selected');
                    } else {
                        selectedPhotos.delete(index);
                        item.classList.remove('selected');
                    }
                    updateSelectedCount();
                });

                if (selectedPhotos.has(index)) {
                    item.classList.add('selected');
                }
            }

            // Individual download button
            const downloadBtn = item.querySelector('.download-single');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadPhoto(index);
            });

            galleryGrid.appendChild(item);
        });
    }

    function setupDownloadButtons() {
        downloadAllBtn.addEventListener('click', downloadAllPhotos);

        selectDownloadBtn.addEventListener('click', () => {
            selectionMode = !selectionMode;

            if (selectionMode) {
                selectDownloadBtn.textContent = 'Download Selected';
                selectDownloadBtn.classList.add('active');
                selectedCount.style.display = 'inline';
            } else {
                // Download selected photos
                if (selectedPhotos.size > 0) {
                    downloadSelectedPhotos();
                }
                // Reset selection mode
                selectDownloadBtn.textContent = 'Select Photos to Download';
                selectDownloadBtn.classList.remove('active');
                selectedCount.style.display = 'none';
                selectedPhotos.clear();
            }

            renderPhotos();
            updateSelectedCount();
        });
    }

    function setupLightbox() {
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
        lightboxNext.addEventListener('click', () => navigateLightbox(1));
        downloadCurrentBtn.addEventListener('click', () => downloadPhoto(currentIndex));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    navigateLightbox(-1);
                    break;
                case 'ArrowRight':
                    navigateLightbox(1);
                    break;
            }
        });
    }

    function openLightbox(index) {
        currentIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < currentImages.length) {
            currentIndex = newIndex;
            updateLightboxImage();
        }
    }

    function updateLightboxImage() {
        const image = currentImages[currentIndex];
        lightboxImg.src = image.full;
        lightboxImg.alt = image.title;

        // Update navigation visibility
        lightboxPrev.style.display = currentIndex > 0 ? 'block' : 'none';
        lightboxNext.style.display = currentIndex < currentImages.length - 1 ? 'block' : 'none';
    }

    function downloadPhoto(index) {
        const image = currentImages[index];
        const link = document.createElement('a');
        link.href = image.full;
        link.download = `${currentAlbum.clientInfo?.name || 'Photo'}_${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Track download analytics
        trackDownload('single', image.id);
    }

    function downloadAllPhotos() {
        currentImages.forEach((image, index) => {
            setTimeout(() => downloadPhoto(index), index * 100);
        });

        // Track download analytics
        trackDownload('all', currentImages.length);
    }

    function downloadSelectedPhotos() {
        Array.from(selectedPhotos).forEach((index, i) => {
            setTimeout(() => downloadPhoto(index), i * 100);
        });

        // Track download analytics
        trackDownload('selected', selectedPhotos.size);
    }

    function updateSelectedCount() {
        selectedCount.textContent = `${selectedPhotos.size} selected`;
    }

    function showError() {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
    }

    function trackDownload(type, count) {
        // Simple analytics tracking
        console.log(`Download: ${type}, Count: ${count}, Album: ${currentAlbum?.title}`);

        // Store in localStorage for analytics
        const analytics = JSON.parse(localStorage.getItem('clientGalleryAnalytics') || '{}');
        const albumKey = `client-${token}`;

        if (!analytics[albumKey]) {
            analytics[albumKey] = {
                title: currentAlbum.title,
                accesses: 0,
                downloads: []
            };
        }

        analytics[albumKey].downloads.push({
            type,
            count,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('clientGalleryAnalytics', JSON.stringify(analytics));
    }

    function trackAccess() {
        // Track gallery access
        const analytics = JSON.parse(localStorage.getItem('clientGalleryAnalytics') || '{}');
        const albumKey = `client-${token}`;

        if (!analytics[albumKey]) {
            analytics[albumKey] = {
                title: currentAlbum?.title || 'Unknown',
                accesses: 0,
                downloads: []
            };
        }

        analytics[albumKey].accesses++;
        analytics[albumKey].lastAccess = new Date().toISOString();

        localStorage.setItem('clientGalleryAnalytics', JSON.stringify(analytics));
    }

    // Initialize
    loadClientGallery().then(() => {
        trackAccess();
    });
});