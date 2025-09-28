/**
 * Albums Timeline Component
 * Creates a chronological timeline of albums in the sidebar
 */

document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.querySelector('.timeline-content');

    if (!timelineContainer) {
        return; // Timeline component not present on this page
    }

    // Show timeline skeleton
    function showTimelineSkeleton() {
        timelineContainer.innerHTML = `
            <div class="timeline-skeleton">
                ${Array.from({length: 6}, () => `
                    <div class="timeline-skeleton-item">
                        <div class="timeline-skeleton-date"></div>
                        <div class="timeline-skeleton-content">
                            <div class="timeline-skeleton-title"></div>
                            <div class="timeline-skeleton-meta"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Fetch albums and create timeline
    async function loadTimeline() {
        try {
            // Show skeleton while loading
            showTimelineSkeleton();

            const response = await fetch('/data/albums.json');
            const data = await response.json();

            // Convert albums to timeline format and sort by most recent photo date
            const timelineItems = Object.entries(data)
                .filter(([key, album]) => key !== 'example') // Filter out example album only
                .map(([key, album]) => {
                    // Use album date if provided, otherwise find most recent photo date
                    let displayDate = album.date || '1900-01-01';
                    if (!album.date && album.images && album.images.length > 0) {
                        displayDate = album.images.reduce((latest, img) => {
                            return img.date > latest ? img.date : latest;
                        }, '1900-01-01');
                    }

                    return {
                        key: key,
                        title: album.title,
                        date: displayDate,
                        imageCount: album.images ? album.images.length : 0,
                        description: album.description,
                        isDsi: key === 'dsi-memories'
                    };
                })
                .sort((a, b) => {
                    // DSi memories always goes to bottom
                    if (a.isDsi) return 1;
                    if (b.isDsi) return -1;
                    return new Date(b.date) - new Date(a.date);
                });

            // Clear existing timeline
            timelineContainer.innerHTML = '';

            // Create timeline items
            timelineItems.forEach(item => {
                const timelineItem = createTimelineItem(item);
                timelineContainer.appendChild(timelineItem);
            });

        } catch (error) {
            console.error('Error loading timeline:', error);
            timelineContainer.innerHTML = '<p class="timeline-error">Unable to load timeline</p>';
        }
    }

    function createTimelineItem(item) {
        const timelineItem = document.createElement('a');
        timelineItem.className = 'timeline-item';

        // Special handling for DSi album - link to dedicated page
        if (item.key === 'DSi Early Work') {
            timelineItem.href = 'dsi.html';
        } else {
            timelineItem.href = `album.html?id=${encodeURIComponent(item.key)}`;
        }

        // Format date
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });

        timelineItem.innerHTML = `
            <div class="timeline-date">${formattedDate}</div>
            <div class="timeline-details">
                <div class="timeline-title">${item.title}</div>
                <div class="timeline-meta">
                    <span class="timeline-count">${item.imageCount}</span>
                </div>
            </div>
        `;

        return timelineItem;
    }

    // Initialize timeline
    loadTimeline();
});