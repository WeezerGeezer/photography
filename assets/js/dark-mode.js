/**
 * Dark Mode Toggle
 * Handles theme switching with localStorage persistence
 */

class DarkMode {
    constructor() {
        this.init();
    }

    init() {
        // Check for saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // Setup toggle buttons
        this.setupToggleButtons();
    }

    setupToggleButtons() {
        // Create theme toggle buttons for both sidebar and mobile
        this.createSidebarToggle();
        this.createMobileToggle();
    }

    createSidebarToggle() {
        const sidebar = document.querySelector('.sidebar-nav');
        if (!sidebar) return;

        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        toggleButton.innerHTML = `
            <span class="theme-icon">🌙</span>
            <span class="theme-text">Dark Mode</span>
        `;
        toggleButton.setAttribute('aria-label', 'Toggle dark mode');

        // Insert after navigation
        sidebar.parentNode.insertBefore(toggleButton, sidebar.nextSibling);

        toggleButton.addEventListener('click', () => this.toggleTheme());

        this.sidebarToggle = toggleButton;
        this.updateToggleButton();
    }

    createMobileToggle() {
        const mobileNav = document.querySelector('.mobile-nav-links');
        if (!mobileNav) return;

        const toggleItem = document.createElement('li');
        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle mobile-nav-link';
        toggleButton.innerHTML = `
            <span class="theme-icon">🌙</span>
            <span class="theme-text">Dark Mode</span>
        `;
        toggleButton.setAttribute('aria-label', 'Toggle dark mode');

        toggleItem.appendChild(toggleButton);
        mobileNav.appendChild(toggleItem);

        toggleButton.addEventListener('click', () => this.toggleTheme());

        this.mobileToggle = toggleButton;
        this.updateToggleButton();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateToggleButton();

        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme }
        }));
    }

    updateToggleButton() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = currentTheme === 'dark';

        // Update sidebar toggle
        if (this.sidebarToggle) {
            const icon = this.sidebarToggle.querySelector('.theme-icon');
            const text = this.sidebarToggle.querySelector('.theme-text');

            if (icon) icon.textContent = isDark ? '☀️' : '🌙';
            if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }

        // Update mobile toggle
        if (this.mobileToggle) {
            const icon = this.mobileToggle.querySelector('.theme-icon');
            const text = this.mobileToggle.querySelector('.theme-text');

            if (icon) icon.textContent = isDark ? '☀️' : '🌙';
            if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.darkMode = new DarkMode();
});

// Reinitialize if needed (for dynamic content)
window.reinitDarkMode = () => {
    if (window.darkMode) {
        window.darkMode.setupToggleButtons();
    }
};