/**
 * Photo Detail Page
 * Handles individual photo viewing with metadata and navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only run on photo detail page
    if (!document.querySelector('.photo-container')) return;

    // Elements
    const photoImage = document.getElementById('photo-image');
    const photoTitle = document.getElementById('photo-title');
    const photoInfo = document.getElementById('photo-info');
    const albumBreadcrumb = document.getElementById('album-breadcrumb');
    const photoBreadcrumb = document.getElementById('photo-breadcrumb');
    const prevPhotoBtn = document.getElementById('prev-photo');
    const nextPhotoBtn = document.getElementById('next-photo');
    const albumLink = document.getElementById('album-link');
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('album');
    const photoId = urlParams.get('id');

    if (!albumId || !photoId) {
        window.location.href = 'index.html';
        return;
    }

    // Load photo data
    async function loadPhotoData() {
        try {
            showLoading(true);
            const response = await fetch('/data/albums.json');
            const data = await response.json();

            const album = data[albumId];
            if (!album) {
                throw new Error('Album not found');
            }

            const photo = album.images.find(img => img.id === photoId);
            if (!photo) {
                throw new Error('Photo not found');
            }

            const photoIndex = album.images.findIndex(img => img.id === photoId);

            return {
                photo,
                album,
                photoIndex,
                albumImages: album.images
            };
        } catch (error) {
            console.error('Error loading photo:', error);
            showError('Failed to load photo');
            return null;
        } finally {
            showLoading(false);
        }
    }

    // Render photo detail
    async function renderPhotoDetail() {
        const result = await loadPhotoData();
        if (!result) return;

        const { photo, album, photoIndex, albumImages } = result;

        // Update page metadata
        document.title = `${photo.title} - ${album.title} - Photography Portfolio`;

        // Update Open Graph tags
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');

        if (ogImage) ogImage.content = window.location.origin + '/' + photo.full;
        if (ogUrl) ogUrl.content = window.location.href;
        if (twitterImage) twitterImage.content = window.location.origin + '/' + photo.full;

        // Update breadcrumbs
        albumBreadcrumb.textContent = album.title;
        albumBreadcrumb.href = `album.html?id=${encodeURIComponent(albumId)}`;
        photoBreadcrumb.textContent = photo.title;

        // Update main image
        photoImage.src = photo.full;
        photoImage.alt = photo.accessibility?.altText || photo.title;
        photoTitle.textContent = photo.title;

        // Update download link
        downloadBtn.href = photo.full;
        downloadBtn.download = `${photo.title}.jpg`;

        // Build metadata HTML
        renderPhotoMetadata(photo);

        // Setup navigation
        setupNavigation(albumId, albumImages, photoIndex);

        // Setup sharing
        setupSharing(photo, album);

        // Setup fullscreen
        setupFullscreen();
    }

    function renderPhotoMetadata(photo) {
        let metadataHTML = '';

        if (photo.technical) {
            metadataHTML += `
                <div class="image-meta">
                    <div class="meta-group">
                        <span class="meta-label">Camera</span>
                        <span class="meta-value">${photo.technical.camera || 'Unknown'}</span>
                    </div>
                    <div class="meta-group">
                        <span class="meta-label">Lens</span>
                        <span class="meta-value">${photo.technical.lens || 'Unknown'}</span>
                    </div>
                    <div class="meta-group">
                        <span class="meta-label">Settings</span>
                        <span class="meta-value">${photo.technical.settings || 'N/A'}</span>
                    </div>
                    <div class="meta-group">
                        <span class="meta-label">Date Taken</span>
                        <span class="meta-value">${new Date(photo.date).toLocaleDateString()}</span>
                    </div>
            `;

            if (photo.technical.dimensions) {
                metadataHTML += `
                    <div class="meta-group">
                        <span class="meta-label">Dimensions</span>
                        <span class="meta-value">${photo.technical.dimensions.width} × ${photo.technical.dimensions.height}</span>
                    </div>
                `;
            }

            metadataHTML += '</div>';
        }

        // Add tags if available
        if (photo.tags && photo.tags.length > 0) {
            metadataHTML += `
                <div class="image-tags">
                    ${photo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            `;
        }

        photoInfo.innerHTML = metadataHTML;
    }

    function setupNavigation(albumId, albumImages, currentIndex) {
        // Setup album link
        albumLink.href = `album.html?id=${encodeURIComponent(albumId)}`;

        // Setup prev/next buttons
        if (currentIndex > 0) {
            const prevPhoto = albumImages[currentIndex - 1];
            prevPhotoBtn.href = `photo.html?album=${encodeURIComponent(albumId)}&id=${encodeURIComponent(prevPhoto.id)}`;
            prevPhotoBtn.style.display = 'block';
        } else {
            prevPhotoBtn.style.display = 'none';
        }

        if (currentIndex < albumImages.length - 1) {
            const nextPhoto = albumImages[currentIndex + 1];
            nextPhotoBtn.href = `photo.html?album=${encodeURIComponent(albumId)}&id=${encodeURIComponent(nextPhoto.id)}`;
            nextPhotoBtn.style.display = 'block';
        } else {
            nextPhotoBtn.style.display = 'none';
        }
    }

    function setupSharing(photo, album) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: `${photo.title} - ${album.title}`,
                text: `Check out this photo from my ${album.title} collection`,
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('Photo URL copied to clipboard!');
                }
            } catch (error) {
                console.error('Error sharing:', error);
                // Fallback: copy to clipboard
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('Photo URL copied to clipboard!');
                } catch (clipboardError) {
                    console.error('Clipboard error:', clipboardError);
                }
            }
        });
    }

    function setupFullscreen() {
        fullscreenBtn.addEventListener('click', () => {
            if (photoImage.requestFullscreen) {
                photoImage.requestFullscreen();
            } else if (photoImage.webkitRequestFullscreen) {
                photoImage.webkitRequestFullscreen();
            } else if (photoImage.msRequestFullscreen) {
                photoImage.msRequestFullscreen();
            }
        });
    }

    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
        document.querySelector('.photo-detail').style.display = show ? 'none' : 'grid';
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h2>Error</h2>
            <p>${message}</p>
            <a href="index.html">Return to Gallery</a>
        `;
        document.querySelector('.photo-container').appendChild(errorDiv);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowLeft':
                if (prevPhotoBtn.style.display !== 'none') {
                    window.location.href = prevPhotoBtn.href;
                }
                break;
            case 'ArrowRight':
                if (nextPhotoBtn.style.display !== 'none') {
                    window.location.href = nextPhotoBtn.href;
                }
                break;
            case 'Escape':
                window.location.href = albumLink.href;
                break;
        }
    });

    // Initialize
    renderPhotoDetail();
});