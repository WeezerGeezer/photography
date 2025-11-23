/**
 * Albums Timeline Component
 * Creates a chronological timeline of albums in the sidebar, grouped by year
 */

document.addEventListener('DOMContentLoaded', () => {
    const timelineContainers = document.querySelectorAll('.timeline-content');

    if (timelineContainers.length === 0) {
        return; // Timeline component not present on this page
    }

    // Track expanded state for each year (shared across all timelines)
    const expandedYears = new Set();

    // Show timeline skeleton in all containers
    function showTimelineSkeleton() {
        const skeletonHTML = `
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
        timelineContainers.forEach(container => {
            container.innerHTML = skeletonHTML;
        });
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
                        description: album.description
                    };
                })
                .sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });

            // Group albums by year
            const albumsByYear = {};
            timelineItems.forEach(item => {
                const year = new Date(item.date).getFullYear();
                if (!albumsByYear[year]) {
                    albumsByYear[year] = [];
                }
                albumsByYear[year].push(item);
            });

            // Get sorted years (most recent first)
            const sortedYears = Object.keys(albumsByYear).sort((a, b) => b - a);

            // Populate each timeline container
            timelineContainers.forEach(container => {
                // Clear existing timeline
                container.innerHTML = '';

                // Create year groups
                sortedYears.forEach((year, index) => {
                    const yearGroup = createYearGroup(year, albumsByYear[year], index === 0);
                    container.appendChild(yearGroup);
                });
            });

        } catch (error) {
            console.error('Error loading timeline:', error);
            timelineContainers.forEach(container => {
                container.innerHTML = '<p class="timeline-error">Unable to load timeline</p>';
            });
        }
    }

    function createYearGroup(year, albums, expandByDefault = false) {
        const yearGroup = document.createElement('div');
        yearGroup.className = 'timeline-year-group';

        // Create year header with toggle
        const yearHeader = document.createElement('button');
        yearHeader.className = 'timeline-year-header';
        if (expandByDefault) {
            yearHeader.classList.add('expanded');
            expandedYears.add(year);
        }
        yearHeader.innerHTML = `
            <span class="timeline-year-arrow">&#9656;</span>
            <span class="timeline-year-label">${year}</span>
            <span class="timeline-year-count">${albums.length}</span>
        `;

        // Create albums container
        const albumsContainer = document.createElement('div');
        albumsContainer.className = 'timeline-year-albums';
        if (expandByDefault) {
            albumsContainer.classList.add('expanded');
        }

        // Add album items
        albums.forEach(item => {
            const albumItem = createTimelineItem(item);
            albumsContainer.appendChild(albumItem);
        });

        // Toggle expand/collapse on click
        yearHeader.addEventListener('click', () => {
            const isExpanded = yearHeader.classList.contains('expanded');

            if (isExpanded) {
                yearHeader.classList.remove('expanded');
                albumsContainer.classList.remove('expanded');
                expandedYears.delete(year);
            } else {
                yearHeader.classList.add('expanded');
                albumsContainer.classList.add('expanded');
                expandedYears.add(year);
            }
        });

        yearGroup.appendChild(yearHeader);
        yearGroup.appendChild(albumsContainer);

        return yearGroup;
    }

    function createTimelineItem(item) {
        const timelineItem = document.createElement('a');
        timelineItem.className = 'timeline-item';

        timelineItem.href = `album.html?id=${encodeURIComponent(item.key)}`;

        // Format date (month only since year is in header)
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short'
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