/**
 * Admin Panel JavaScript
 * Handles authentication, album management, and photo uploads
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE: '/api',
        SESSION_KEY: 'admin_session',
        SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
        R2_BASE_URL: 'https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev'
    };

    // State
    let state = {
        authenticated: false,
        albums: {},
        selectedFiles: [],
        currentAlbumKey: null
    };

    // DOM Elements
    const elements = {
        loginScreen: document.getElementById('login-screen'),
        adminPanel: document.getElementById('admin-panel'),
        loginForm: document.getElementById('login-form'),
        loginError: document.getElementById('login-error'),
        logoutBtn: document.getElementById('logout-btn'),
        albumsList: document.getElementById('albums-list'),
        createAlbumBtn: document.getElementById('create-album-btn'),
        albumModal: document.getElementById('album-modal'),
        albumForm: document.getElementById('album-form'),
        editAlbumModal: document.getElementById('edit-album-modal'),
        confirmModal: document.getElementById('confirm-modal'),
        uploadForm: document.getElementById('upload-form'),
        uploadAlbumSelect: document.getElementById('upload-album'),
        dropzone: document.getElementById('dropzone'),
        photoInput: document.getElementById('photo-input'),
        selectedFilesContainer: document.getElementById('selected-files'),
        filePreview: document.getElementById('file-preview'),
        fileCount: document.getElementById('file-count'),
        uploadBtn: document.getElementById('upload-btn'),
        uploadProgress: document.getElementById('upload-progress'),
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        uploadLog: document.getElementById('upload-log'),
        storageStatus: document.getElementById('storage-status'),
        toastContainer: document.getElementById('toast-container')
    };

    // ==================== Utility Functions ====================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function generateAlbumKey(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    // ==================== Authentication ====================

    function checkSession() {
        const session = localStorage.getItem(CONFIG.SESSION_KEY);
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (sessionData.expires > Date.now()) {
                    state.authenticated = true;
                    showAdminPanel();
                    return true;
                }
            } catch (e) {
                console.error('Invalid session data');
            }
        }
        showLoginScreen();
        return false;
    }

    function createSession(token) {
        const sessionData = {
            token: token,
            expires: Date.now() + CONFIG.SESSION_DURATION
        };
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(sessionData));
        state.authenticated = true;
    }

    function clearSession() {
        localStorage.removeItem(CONFIG.SESSION_KEY);
        state.authenticated = false;
    }

    function showLoginScreen() {
        elements.loginScreen.style.display = 'flex';
        elements.adminPanel.style.display = 'none';
    }

    function showAdminPanel() {
        elements.loginScreen.style.display = 'none';
        elements.adminPanel.style.display = 'block';
        loadAlbums();
        checkStorageStatus();
    }

    async function handleLogin(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${CONFIG.API_BASE}/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                const data = await response.json();
                createSession(data.token);
                showAdminPanel();
                showToast('Logged in successfully', 'success');
            } else {
                elements.loginError.textContent = 'Invalid password';
                elements.loginError.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            elements.loginError.textContent = 'Connection error. Please try again.';
            elements.loginError.style.display = 'block';
        }
    }

    function handleLogout() {
        clearSession();
        showLoginScreen();
        showToast('Logged out', 'info');
    }

    function getAuthHeader() {
        const session = localStorage.getItem(CONFIG.SESSION_KEY);
        if (session) {
            const sessionData = JSON.parse(session);
            return { 'Authorization': `Bearer ${sessionData.token}` };
        }
        return {};
    }

    // ==================== Tab Navigation ====================

    function setupTabNavigation() {
        const navBtns = document.querySelectorAll('.admin-nav-btn');
        const tabs = document.querySelectorAll('.admin-tab');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;

                navBtns.forEach(b => b.classList.remove('active'));
                tabs.forEach(t => t.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });
    }

    // ==================== Albums Management ====================

    async function loadAlbums() {
        try {
            const response = await fetch('https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json');
            state.albums = await response.json();
            renderAlbumsList();
            populateAlbumSelect();
        } catch (error) {
            console.error('Error loading albums:', error);
            showToast('Failed to load albums', 'error');
        }
    }

    function renderAlbumsList() {
        const albumKeys = Object.keys(state.albums);

        if (albumKeys.length === 0) {
            elements.albumsList.innerHTML = `
                <div class="loading-placeholder">
                    <p>No albums found. Create your first album!</p>
                </div>
            `;
            return;
        }

        elements.albumsList.innerHTML = albumKeys.map(key => {
            const album = state.albums[key];
            const photoCount = album.images ? album.images.length : 0;
            const coverUrl = album.images && album.images.length > 0
                ? album.images[0].thumbnail
                : null;

            return `
                <div class="album-card" data-album-key="${key}">
                    <div class="album-card-cover ${!coverUrl ? 'no-cover' : ''}"
                         style="${coverUrl ? `background-image: url('${coverUrl}')` : ''}">
                        ${!coverUrl ? '+' : ''}
                        ${album.isPrivate ? '<span class="album-card-private">Private</span>' : ''}
                    </div>
                    <div class="album-card-content">
                        <h3 class="album-card-title">${album.title}</h3>
                        <p class="album-card-meta">
                            ${photoCount} photo${photoCount !== 1 ? 's' : ''}
                            ${album.date ? ` - ${formatDate(album.date)}` : ''}
                        </p>
                        <div class="album-card-actions">
                            <button class="btn btn-secondary btn-small edit-album-btn" data-album-key="${key}">
                                Edit
                            </button>
                            <button class="btn btn-outline btn-small manage-photos-btn" data-album-key="${key}">
                                Photos
                            </button>
                            <button class="btn btn-danger btn-small delete-album-btn" data-album-key="${key}">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        document.querySelectorAll('.edit-album-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditAlbumModal(btn.dataset.albumKey));
        });

        document.querySelectorAll('.manage-photos-btn').forEach(btn => {
            btn.addEventListener('click', () => openManagePhotosModal(btn.dataset.albumKey));
        });

        document.querySelectorAll('.delete-album-btn').forEach(btn => {
            btn.addEventListener('click', () => confirmDeleteAlbum(btn.dataset.albumKey));
        });
    }

    function populateAlbumSelect() {
        const options = Object.keys(state.albums).map(key => {
            const album = state.albums[key];
            return `<option value="${key}">${album.title}</option>`;
        });

        elements.uploadAlbumSelect.innerHTML = `
            <option value="">-- Choose an album --</option>
            ${options.join('')}
        `;
    }

    function openCreateAlbumModal() {
        document.getElementById('modal-title').textContent = 'Create New Album';
        document.getElementById('album-id').value = '';
        elements.albumForm.reset();
        document.getElementById('album-date').value = new Date().toISOString().split('T')[0];
        elements.albumModal.style.display = 'flex';
    }

    function openEditAlbumModal(albumKey) {
        const album = state.albums[albumKey];
        if (!album) return;

        document.getElementById('modal-title').textContent = 'Edit Album';
        document.getElementById('album-id').value = albumKey;
        document.getElementById('album-title').value = album.title || '';
        document.getElementById('album-description').value = album.description || '';
        document.getElementById('album-date').value = album.date || '';
        document.getElementById('album-private').checked = album.isPrivate || false;

        elements.albumModal.style.display = 'flex';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    async function handleAlbumSubmit(e) {
        e.preventDefault();

        const albumId = document.getElementById('album-id').value;
        const title = document.getElementById('album-title').value;
        const description = document.getElementById('album-description').value;
        const date = document.getElementById('album-date').value;
        const isPrivate = document.getElementById('album-private').checked;

        const isNew = !albumId;
        const key = isNew ? generateAlbumKey(title) : albumId;

        const albumData = {
            title,
            description,
            date,
            isPrivate,
            cover: isNew ? `${key}/cover.jpg` : (state.albums[key]?.cover || `${key}/cover.jpg`),
            images: isNew ? [] : (state.albums[key]?.images || [])
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE}/albums`, {
                method: isNew ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ key, album: albumData })
            });

            if (response.ok) {
                state.albums[key] = albumData;
                renderAlbumsList();
                populateAlbumSelect();
                closeModal(elements.albumModal);
                showToast(isNew ? 'Album created' : 'Album updated', 'success');
            } else {
                throw new Error('Failed to save album');
            }
        } catch (error) {
            console.error('Error saving album:', error);
            showToast('Failed to save album', 'error');
        }
    }

    function confirmDeleteAlbum(albumKey) {
        const album = state.albums[albumKey];
        if (!album) return;

        document.getElementById('confirm-message').textContent =
            `Are you sure you want to delete "${album.title}"? This will also delete all ${album.images?.length || 0} photos.`;

        state.currentAlbumKey = albumKey;
        elements.confirmModal.style.display = 'flex';

        document.getElementById('confirm-action-btn').onclick = () => deleteAlbum(albumKey);
    }

    async function deleteAlbum(albumKey) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/albums/${albumKey}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (response.ok) {
                delete state.albums[albumKey];
                renderAlbumsList();
                populateAlbumSelect();
                closeModal(elements.confirmModal);
                showToast('Album deleted', 'success');
            } else {
                throw new Error('Failed to delete album');
            }
        } catch (error) {
            console.error('Error deleting album:', error);
            showToast('Failed to delete album', 'error');
        }
    }

    // ==================== Photo Management ====================

    function openManagePhotosModal(albumKey) {
        const album = state.albums[albumKey];
        if (!album) return;

        state.currentAlbumKey = albumKey;
        document.getElementById('edit-album-title').textContent = `Photos in "${album.title}"`;

        const content = document.getElementById('edit-album-content');

        if (!album.images || album.images.length === 0) {
            content.innerHTML = `
                <div class="loading-placeholder">
                    <p>No photos in this album yet.</p>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="album-photos-grid">
                    ${album.images.map((photo, index) => `
                        <div class="album-photo-item" data-index="${index}">
                            <img src="${photo.thumbnail}" alt="${photo.title}">
                            <div class="photo-overlay">
                                <button class="delete-photo" data-photo-id="${photo.id}" title="Delete photo">X</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add delete handlers
            content.querySelectorAll('.delete-photo').forEach(btn => {
                btn.addEventListener('click', () => confirmDeletePhoto(albumKey, btn.dataset.photoId));
            });
        }

        elements.editAlbumModal.style.display = 'flex';
    }

    function confirmDeletePhoto(albumKey, photoId) {
        const album = state.albums[albumKey];
        const photo = album.images.find(p => p.id === photoId);
        if (!photo) return;

        document.getElementById('confirm-message').textContent =
            `Are you sure you want to delete "${photo.title}"?`;

        elements.confirmModal.style.display = 'flex';
        document.getElementById('confirm-action-btn').onclick = () => deletePhoto(albumKey, photoId);
    }

    async function deletePhoto(albumKey, photoId) {
        try {
            // URL-encode album key and photo ID to handle spaces, commas, etc.
            const encodedAlbum = encodeURIComponent(albumKey);
            const encodedPhotoId = encodeURIComponent(photoId);
            const response = await fetch(`${CONFIG.API_BASE}/photos/${encodedAlbum}/${encodedPhotoId}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (response.ok) {
                // Update local state
                state.albums[albumKey].images = state.albums[albumKey].images.filter(p => p.id !== photoId);
                renderAlbumsList();
                openManagePhotosModal(albumKey); // Refresh the modal
                closeModal(elements.confirmModal);
                showToast('Photo deleted', 'success');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || `HTTP ${response.status}`;
                console.error('Delete photo failed:', response.status, errorData);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            showToast(`Failed to delete photo: ${error.message}`, 'error');
        }
    }

    // ==================== File Upload ====================

    function setupDropzone() {
        const dropzone = elements.dropzone;
        const input = elements.photoInput;

        // Click to browse
        dropzone.addEventListener('click', () => input.click());

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'));
        });

        dropzone.addEventListener('drop', handleDrop);
        input.addEventListener('change', handleFileSelect);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const files = e.dataTransfer.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (imageFiles.length !== files.length) {
            showToast('Some files were skipped (not images)', 'warning');
        }

        state.selectedFiles = [...state.selectedFiles, ...imageFiles];
        updateFilePreview();
    }

    function updateFilePreview() {
        const files = state.selectedFiles;

        if (files.length === 0) {
            elements.selectedFilesContainer.style.display = 'none';
            elements.uploadBtn.disabled = true;
            return;
        }

        elements.selectedFilesContainer.style.display = 'block';
        elements.fileCount.textContent = files.length;
        elements.uploadBtn.disabled = !elements.uploadAlbumSelect.value;

        elements.filePreview.innerHTML = files.map((file, index) => {
            const url = URL.createObjectURL(file);
            return `
                <div class="file-preview-item" data-index="${index}">
                    <img src="${url}" alt="${file.name}">
                    <button class="remove-file" data-index="${index}">X</button>
                    <div class="file-name">${file.name}</div>
                </div>
            `;
        }).join('');

        // Add remove handlers
        elements.filePreview.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(parseInt(btn.dataset.index));
            });
        });
    }

    function removeFile(index) {
        state.selectedFiles.splice(index, 1);
        updateFilePreview();
    }

    async function handleUpload(e) {
        e.preventDefault();

        const albumKey = elements.uploadAlbumSelect.value;
        const skipAI = document.getElementById('skip-ai').checked;

        if (!albumKey) {
            showToast('Please select an album', 'error');
            return;
        }

        if (state.selectedFiles.length === 0) {
            showToast('Please select at least one photo', 'error');
            return;
        }

        // Show progress
        elements.uploadProgress.style.display = 'block';
        elements.uploadBtn.disabled = true;
        elements.uploadLog.innerHTML = '';

        const totalFiles = state.selectedFiles.length;
        let uploadedCount = 0;
        let errorCount = 0;

        for (const file of state.selectedFiles) {
            try {
                logUpload(`Uploading ${file.name}...`, 'info');

                const formData = new FormData();
                formData.append('photo', file);
                formData.append('album', albumKey);
                formData.append('skipAI', skipAI.toString());

                const response = await fetch(`${CONFIG.API_BASE}/upload`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    uploadedCount++;
                    logUpload(`Uploaded: ${file.name}`, 'success');

                    // Update local album data
                    if (result.photo) {
                        if (!state.albums[albumKey].images) {
                            state.albums[albumKey].images = [];
                        }
                        state.albums[albumKey].images.push(result.photo);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                errorCount++;
                logUpload(`Failed: ${file.name} - ${error.message}`, 'error');
            }

            // Update progress
            const progress = ((uploadedCount + errorCount) / totalFiles) * 100;
            elements.progressFill.style.width = `${progress}%`;
            elements.progressText.textContent = `${uploadedCount + errorCount} of ${totalFiles} processed`;
        }

        // Complete
        elements.progressText.textContent = `Complete: ${uploadedCount} uploaded, ${errorCount} failed`;
        showToast(`Uploaded ${uploadedCount} of ${totalFiles} photos`, uploadedCount === totalFiles ? 'success' : 'warning');

        // Reset state
        state.selectedFiles = [];
        updateFilePreview();
        elements.uploadBtn.disabled = false;
        renderAlbumsList();
    }

    function logUpload(message, type) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = message;
        elements.uploadLog.appendChild(entry);
        elements.uploadLog.scrollTop = elements.uploadLog.scrollHeight;
    }

    // ==================== Settings ====================

    async function checkStorageStatus() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/status`, {
                headers: getAuthHeader()
            });

            if (response.ok) {
                const data = await response.json();
                elements.storageStatus.innerHTML = `
                    <span class="status-connected">Connected to R2</span>
                    <span>Bucket: ${data.bucket || 'photography-portfolio'}</span>
                `;
            } else {
                throw new Error('Not connected');
            }
        } catch (error) {
            elements.storageStatus.innerHTML = `
                <span class="status-error">Not connected</span>
                <p>API endpoint not available. Ensure the Cloudflare Worker is deployed.</p>
            `;
        }
    }

    function setupSettings() {
        document.getElementById('clear-cache-btn').addEventListener('click', () => {
            localStorage.removeItem('albums_cache');
            showToast('Cache cleared', 'success');
            loadAlbums();
        });

        document.getElementById('sync-data-btn').addEventListener('click', async () => {
            try {
                const response = await fetch(`${CONFIG.API_BASE}/sync`, {
                    method: 'POST',
                    headers: getAuthHeader()
                });

                if (response.ok) {
                    showToast('Data synced successfully', 'success');
                    loadAlbums();
                } else {
                    throw new Error('Sync failed');
                }
            } catch (error) {
                showToast('Failed to sync data', 'error');
            }
        });
    }

    // ==================== Modal Handlers ====================

    function setupModals() {
        // Close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) closeModal(modal);
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'flex') closeModal(modal);
                });
            }
        });
    }

    // ==================== Gallery Order Management ====================

    let galleryPhotos = [];
    let orderModified = false;

    async function loadGalleryOrder() {
        try {
            const response = await fetch('https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json');
            const albums = await response.json();

            // Flatten all images from non-private albums
            galleryPhotos = [];
            Object.entries(albums).forEach(([albumKey, album]) => {
                if (album.isPrivate) return;

                album.images.forEach((img, idx) => {
                    galleryPhotos.push({
                        ...img,
                        albumKey: albumKey,
                        albumTitle: album.title,
                        originalIndex: idx
                    });
                });
            });

            // Sort by existing order field (if present), then by date
            galleryPhotos.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                if (a.order !== undefined) return -1;
                if (b.order !== undefined) return 1;
                return new Date(b.date) - new Date(a.date);
            });

            renderGalleryOrder();
        } catch (error) {
            console.error('Error loading gallery order:', error);
            showToast('Failed to load gallery photos', 'error');
        }
    }

    function renderGalleryOrder() {
        const grid = document.getElementById('gallery-order-grid');
        if (!grid) return;

        if (galleryPhotos.length === 0) {
            grid.innerHTML = `
                <div class="loading-placeholder">
                    <p>No photos found in public albums.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = galleryPhotos.map((photo, index) => `
            <div class="gallery-order-item"
                 draggable="true"
                 data-photo-id="${photo.id}"
                 data-album-key="${photo.albumKey}"
                 data-index="${index}">
                <img src="${photo.thumbnail}" alt="${photo.title}" loading="lazy">
                <div class="gallery-order-item-drag-handle">⋮⋮</div>
                <button class="gallery-order-item-top-btn" data-index="${index}" title="Move to top">
                    ↑
                </button>
                <div class="gallery-order-item-info">
                    <div class="gallery-order-item-album">${photo.albumTitle}</div>
                    <div class="gallery-order-item-order">Position: ${index + 1}</div>
                </div>
            </div>
        `).join('');

        setupDragAndDrop();
        setupMoveToTop();
    }

    function setupDragAndDrop() {
        const items = document.querySelectorAll('.gallery-order-item');
        let draggedElement = null;
        let draggedIndex = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                draggedIndex = parseInt(item.dataset.index);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                items.forEach(i => i.classList.remove('drag-over'));
                draggedElement = null;
                draggedIndex = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (draggedElement && draggedElement !== item) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');

                if (draggedElement && draggedElement !== item) {
                    const dropIndex = parseInt(item.dataset.index);

                    // Reorder the galleryPhotos array
                    const draggedPhoto = galleryPhotos[draggedIndex];
                    galleryPhotos.splice(draggedIndex, 1);
                    galleryPhotos.splice(dropIndex, 0, draggedPhoto);

                    // Mark as modified
                    orderModified = true;
                    document.getElementById('save-order-btn').disabled = false;

                    // Re-render
                    renderGalleryOrder();
                }
            });
        });
    }

    function setupMoveToTop() {
        const topButtons = document.querySelectorAll('.gallery-order-item-top-btn');

        topButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);

                if (index === 0) return; // Already at top

                // Remove photo from current position and add to top
                const photo = galleryPhotos.splice(index, 1)[0];
                galleryPhotos.unshift(photo);

                // Mark as modified
                orderModified = true;
                document.getElementById('save-order-btn').disabled = false;

                // Re-render
                renderGalleryOrder();

                // Scroll to top to show the moved photo
                document.getElementById('gallery-order-grid').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    async function saveGalleryOrder() {
        if (!orderModified) return;

        const saveBtn = document.getElementById('save-order-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            // Assign order values to each photo
            const orderUpdates = galleryPhotos.map((photo, index) => ({
                albumKey: photo.albumKey,
                photoId: photo.id,
                order: index
            }));

            const response = await fetch(`${CONFIG.API_BASE}/gallery-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ orderUpdates })
            });

            if (response.ok) {
                orderModified = false;
                showToast('Gallery order saved successfully', 'success');
                saveBtn.textContent = 'Save Order';
            } else {
                throw new Error('Failed to save order');
            }
        } catch (error) {
            console.error('Error saving gallery order:', error);
            showToast('Failed to save gallery order', 'error');
            saveBtn.textContent = 'Save Order';
            saveBtn.disabled = false;
        }
    }

    async function resetGalleryOrder() {
        if (!confirm('Reset all photos to date order? This will clear any custom ordering.')) {
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE}/gallery-order/reset`, {
                method: 'POST',
                headers: getAuthHeader()
            });

            if (response.ok) {
                orderModified = false;
                document.getElementById('save-order-btn').disabled = true;
                showToast('Gallery order reset to date order', 'success');
                await loadGalleryOrder();
            } else {
                throw new Error('Failed to reset order');
            }
        } catch (error) {
            console.error('Error resetting gallery order:', error);
            showToast('Failed to reset gallery order', 'error');
        }
    }

    // ==================== Initialization ====================

    function init() {
        // Setup event listeners
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.logoutBtn.addEventListener('click', handleLogout);
        elements.createAlbumBtn.addEventListener('click', openCreateAlbumModal);
        elements.albumForm.addEventListener('submit', handleAlbumSubmit);
        elements.uploadForm.addEventListener('submit', handleUpload);
        elements.uploadAlbumSelect.addEventListener('change', () => {
            elements.uploadBtn.disabled = !elements.uploadAlbumSelect.value || state.selectedFiles.length === 0;
        });

        setupTabNavigation();
        setupDropzone();
        setupModals();
        setupSettings();

        // Gallery order event listeners
        const saveOrderBtn = document.getElementById('save-order-btn');
        const resetOrderBtn = document.getElementById('reset-order-btn');
        if (saveOrderBtn) saveOrderBtn.addEventListener('click', saveGalleryOrder);
        if (resetOrderBtn) resetOrderBtn.addEventListener('click', resetGalleryOrder);

        // Load gallery order when tab is clicked
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            if (btn.dataset.tab === 'gallery-order') {
                btn.addEventListener('click', () => {
                    if (galleryPhotos.length === 0) {
                        loadGalleryOrder();
                    }
                });
            }
        });

        // Check session
        checkSession();
    }

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
