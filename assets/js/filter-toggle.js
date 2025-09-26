/**
 * Filter Toggle Component
 * Handles collapsible filter buttons for both desktop and mobile
 */

document.addEventListener('DOMContentLoaded', () => {
    // Desktop filter toggle
    const desktopToggle = document.getElementById('filter-toggle');
    const desktopFilterButtons = document.getElementById('filter-buttons');

    // Mobile filter toggle
    const mobileToggle = document.getElementById('mobile-filter-toggle');
    const mobileFilterButtons = document.getElementById('mobile-filter-buttons');

    // Load saved state from localStorage
    const isExpanded = localStorage.getItem('filtersExpanded') === 'true';

    // Initialize desktop filters
    if (desktopToggle && desktopFilterButtons) {
        updateToggleState(desktopToggle, desktopFilterButtons, isExpanded);

        desktopToggle.addEventListener('click', () => {
            const currentlyExpanded = desktopFilterButtons.classList.contains('expanded');
            const newState = !currentlyExpanded;

            updateToggleState(desktopToggle, desktopFilterButtons, newState);
            localStorage.setItem('filtersExpanded', newState.toString());
        });
    }

    // Initialize mobile filters
    if (mobileToggle && mobileFilterButtons) {
        updateToggleState(mobileToggle, mobileFilterButtons, isExpanded);

        mobileToggle.addEventListener('click', () => {
            const currentlyExpanded = mobileFilterButtons.classList.contains('expanded');
            const newState = !currentlyExpanded;

            updateToggleState(mobileToggle, mobileFilterButtons, newState);
            localStorage.setItem('filtersExpanded', newState.toString());
        });
    }

    function updateToggleState(toggleButton, filterContainer, expanded) {
        if (expanded) {
            toggleButton.classList.add('expanded');
            filterContainer.classList.add('expanded');
        } else {
            toggleButton.classList.remove('expanded');
            filterContainer.classList.remove('expanded');
        }
    }
});