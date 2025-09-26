/**
 * Page Transitions Module
 * Handles smooth transitions between pages and states
 */

class PageTransitions {
    constructor() {
        this.isTransitioning = false;
        this.init();
    }

    init() {
        // Initialize page with transition effect
        this.initPageLoad();

        // Handle internal navigation links
        this.setupInternalLinks();
    }

    initPageLoad() {
        // Add transition class to main content areas
        const mainContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.sidebar');

        if (mainContent) {
            mainContent.classList.add('page-transition');
        }

        if (sidebar) {
            sidebar.classList.add('page-transition');
        }

        // Trigger loaded state after DOM is ready
        requestAnimationFrame(() => {
            if (mainContent) {
                mainContent.classList.add('loaded');
            }
            if (sidebar) {
                sidebar.classList.add('loaded');
            }
        });
    }

    setupInternalLinks() {
        // Get all internal navigation links
        const internalLinks = document.querySelectorAll('a[href^="/"]:not([href^="//"]), a[href^="."]:not([target="_blank"]), .nav-link, .timeline-item');

        internalLinks.forEach(link => {
            // Skip if already has event listener
            if (link.dataset.transitionBound) return;

            link.addEventListener('click', (e) => this.handleLinkClick(e, link));
            link.dataset.transitionBound = 'true';
        });
    }

    handleLinkClick(e, link) {
        // Skip if transitioning or external link
        if (this.isTransitioning) {
            e.preventDefault();
            return;
        }

        const href = link.getAttribute('href');

        // Skip if same page or anchor link
        if (!href || href === '#' || href === window.location.pathname || href.startsWith('#')) {
            return;
        }

        // Skip for lightbox triggers or external links
        if (link.classList.contains('lightbox-trigger') ||
            link.hasAttribute('target') ||
            href.startsWith('http') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')) {
            return;
        }

        e.preventDefault();
        this.navigateToPage(href);
    }

    async navigateToPage(href) {
        if (this.isTransitioning) return;

        this.isTransitioning = true;

        // Add exit classes
        const mainContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.sidebar');

        if (mainContent) {
            mainContent.classList.add('page-exit', 'exiting');
        }

        if (sidebar) {
            sidebar.classList.add('page-exit', 'exiting');
        }

        // Wait for exit transition
        await this.sleep(400);

        // Navigate to new page
        window.location.href = href;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Animate content changes (for dynamic content)
    animateContentChange(element, newContent, callback = null) {
        if (!element) return;

        // Fade out
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';

        setTimeout(() => {
            // Update content
            if (typeof newContent === 'string') {
                element.innerHTML = newContent;
            } else if (callback) {
                callback();
            }

            // Fade in
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 200);
    }

    // Stagger animation for multiple elements
    staggerAnimation(elements, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('loaded');
            }, index * delay);
        });
    }
}

// Initialize page transitions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pageTransitions = new PageTransitions();
});

// Re-initialize after dynamic content loads
window.reinitPageTransitions = () => {
    if (window.pageTransitions) {
        window.pageTransitions.setupInternalLinks();
    }
};