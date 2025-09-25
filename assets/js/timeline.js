/**
 * Albums Timeline Component
 * Creates a chronological timeline of albums in the sidebar
 */

document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.querySelector('.timeline-content');

    if (!timelineContainer) {
        return; // Timeline component not present on this page
    }

    // Fetch albums and create timeline
    async function loadTimeline() {
        try {
            const response = await fetch('/data/albums.json');
            const data = await response.json();

            // Convert albums to timeline format and sort by most recent photo date
            const timelineItems = Object.entries(data)
                .filter(([key, album]) => key !== 'example') // Filter out example album
                .map(([key, album]) => {
                    // Find the most recent photo date in this album
                    let mostRecentDate = '1900-01-01';
                    if (album.images && album.images.length > 0) {
                        mostRecentDate = album.images.reduce((latest, img) => {
                            return img.date > latest ? img.date : latest;
                        }, '1900-01-01');
                    }

                    return {
                        key: key,
                        title: album.title,
                        date: mostRecentDate,
                        imageCount: album.images ? album.images.length : 0,
                        description: album.description
                    };
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent first

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
        timelineItem.href = `album.html?album=${encodeURIComponent(item.key)}`;

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