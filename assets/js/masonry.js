/**
 * Simple Masonry Layout Implementation
 * Creates a Pinterest-style grid with varied image heights
 */

class MasonryLayout {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            itemSelector: '.gallery-item',
            columnWidth: 300,
            gutter: 16, // 1rem = 16px
            ...options
        };
        
        this.columns = [];
        this.columnCount = 0;
        this.resizeTimeout = null;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Masonry: Container not found');
            return;
        }
        
        console.log('Masonry: Initializing with container:', this.container);
        this.calculateColumns();
        this.bindEvents();
    }

    calculateColumns() {
        const containerWidth = this.container.offsetWidth;
        const availableWidth = containerWidth - (parseInt(getComputedStyle(this.container).paddingLeft) * 2);
        
        // Calculate how many columns can fit
        this.columnCount = Math.floor(availableWidth / (this.options.columnWidth + this.options.gutter));
        this.columnCount = Math.max(1, this.columnCount); // At least 1 column
        
        // Calculate actual column width to fill available space
        const totalGutterWidth = (this.columnCount - 1) * this.options.gutter;
        const actualColumnWidth = (availableWidth - totalGutterWidth) / this.columnCount;
        
        this.actualColumnWidth = actualColumnWidth;
        
        // Initialize column height trackers
        this.columns = new Array(this.columnCount).fill(0);
    }

    layout() {
        if (!this.container) return;
        
        this.calculateColumns();
        
        const items = this.container.querySelectorAll(this.options.itemSelector);
        console.log(`Masonry: Laying out ${items.length} items in ${this.columnCount} columns`);
        
        // Mark container as masonry initialized
        this.container.classList.add('masonry-initialized');
        
        // Reset container and columns
        this.columns = new Array(this.columnCount).fill(0);
        
        items.forEach((item, index) => {
            this.positionItem(item, index);
        });
        
        // Set container height to tallest column
        const maxHeight = Math.max(...this.columns);
        this.container.style.height = `${maxHeight}px`;
        console.log(`Masonry: Container height set to ${maxHeight}px`);
    }

    positionItem(item, index) {
        const img = item.querySelector('img');
        let itemWidth = this.actualColumnWidth;
        let columnsSpanned = 1;

        // Temporarily show the item to prevent cramming effect
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';

        // Check if image is landscape and screen is wide enough for double width
        if (img && this.columnCount >= 2 && window.innerWidth >= 769) {
            const isLandscape = img.naturalWidth > img.naturalHeight ||
                               (img.complete && img.offsetWidth > img.offsetHeight);

            if (isLandscape) {
                columnsSpanned = Math.min(2, this.columnCount); // Use 2 columns or max available
                itemWidth = (this.actualColumnWidth * columnsSpanned) + (this.options.gutter * (columnsSpanned - 1));
            }
        }

        // Find the best column position for items that span multiple columns
        let shortestColumnIndex = 0;
        if (columnsSpanned === 1) {
            shortestColumnIndex = this.columns.indexOf(Math.min(...this.columns));
        } else {
            // For multi-column items, find the position with the lowest maximum height
            let bestPosition = 0;
            let bestHeight = Infinity;

            for (let i = 0; i <= this.columnCount - columnsSpanned; i++) {
                const maxHeightInSpan = Math.max(...this.columns.slice(i, i + columnsSpanned));
                if (maxHeightInSpan < bestHeight) {
                    bestHeight = maxHeightInSpan;
                    bestPosition = i;
                }
            }
            shortestColumnIndex = bestPosition;
        }

        // Calculate position
        const x = shortestColumnIndex * (this.actualColumnWidth + this.options.gutter);
        const y = columnsSpanned === 1 ?
                  this.columns[shortestColumnIndex] :
                  Math.max(...this.columns.slice(shortestColumnIndex, shortestColumnIndex + columnsSpanned));

        // Position the item
        item.style.position = 'absolute';
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        item.style.width = `${itemWidth}px`;
        
        // Handle image sizing - give unloaded images a reasonable default first
        if (img) {
            if (img.complete && img.naturalWidth > 0) {
                // Image already loaded, calculate height from natural dimensions
                const aspectRatio = img.naturalHeight / img.naturalWidth;
                const calculatedHeight = itemWidth * aspectRatio;

                // Set a reasonable min/max height to prevent extreme ratios
                const minHeight = 150;
                const maxHeight = 600;
                const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));

                img.style.height = `${constrainedHeight}px`;
                img.style.objectFit = 'cover';

                this.updateColumnHeight(item, shortestColumnIndex, columnsSpanned);
            } else {
                // Set a reasonable default height immediately to prevent cramming
                img.style.height = '250px';
                img.style.objectFit = 'cover';

                // Initially position with default height
                this.updateColumnHeight(item, shortestColumnIndex, columnsSpanned);

                // Wait for image to load to get natural dimensions and reposition
                const handleImageLoad = () => {
                    // Calculate height based on natural aspect ratio
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const calculatedHeight = itemWidth * aspectRatio;

                    // Set a reasonable min/max height to prevent extreme ratios
                    const minHeight = 150;
                    const maxHeight = 600;
                    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));

                    img.style.height = `${constrainedHeight}px`;

                    // Re-layout the entire masonry to adjust for the size change
                    setTimeout(() => this.layout(), 50);
                };

                img.addEventListener('load', handleImageLoad, { once: true });

                // Fallback in case image fails to load
                img.addEventListener('error', () => {
                    img.style.height = '250px'; // Keep default height
                    setTimeout(() => this.layout(), 50);
                }, { once: true });
            }
        } else {
            this.updateColumnHeight(item, shortestColumnIndex, columnsSpanned);
        }
    }

    updateColumnHeight(item, columnIndex, columnsSpanned = 1) {
        // Get the actual height of the item
        const itemHeight = item.offsetHeight;

        // For multi-column items, find the current max height in the span and set all to that + item height
        const currentMaxInSpan = columnsSpanned === 1 ?
            this.columns[columnIndex] :
            Math.max(...this.columns.slice(columnIndex, columnIndex + columnsSpanned));

        const newHeight = currentMaxInSpan + itemHeight + this.options.gutter;

        // Update heights for all spanned columns
        for (let i = 0; i < columnsSpanned; i++) {
            if (columnIndex + i < this.columns.length) {
                this.columns[columnIndex + i] = newHeight;
            }
        }

        // Update container height
        const maxHeight = Math.max(...this.columns);
        this.container.style.height = `${maxHeight}px`;

        // Show the item with fade-in effect
        item.classList.add('loaded');
    }

    addItems(newItems) {
        newItems.forEach((item, index) => {
            this.positionItem(item, this.container.children.length + index);
        });
    }

    bindEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.layout();
            }, 250);
        });
    }

    destroy() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        // Reset styles
        const items = this.container.querySelectorAll(this.options.itemSelector);
        items.forEach(item => {
            item.style.position = '';
            item.style.left = '';
            item.style.top = '';
            item.style.width = '';
        });
        this.container.style.height = '';
    }
}

// Export for use in other scripts
window.MasonryLayout = MasonryLayout;
