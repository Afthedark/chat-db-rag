/**
 * Theme Manager
 * Handles dark/light mode switching with system preference detection
 * and localStorage persistence
 */

const themeManager = {
    STORAGE_KEY: 'chat-db-theme',
    currentTheme: 'light',
    
    /**
     * Initialize theme manager
     */
    init() {
        this.loadTheme();
        this.bindEvents();
        this.createToggleButton();
        console.log('Theme manager initialized');
    },
    
    /**
     * Load theme from localStorage or system preference
     */
    loadTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        
        if (savedTheme) {
            this.setTheme(savedTheme, false);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light', false);
        }
    },
    
    /**
     * Set theme (light/dark)
     * @param {string} theme - 'light' or 'dark'
     * @param {boolean} save - Whether to save to localStorage
     */
    setTheme(theme, save = true) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error('Invalid theme:', theme);
            return;
        }
        
        this.currentTheme = theme;
        
        // Apply theme to document
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Update toggle button icon
        this.updateToggleIcon();
        
        // Save to localStorage
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme } 
        }));
        
        console.log('Theme set to:', theme);
    },
    
    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Add animation class
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.classList.add('theme-transitioning');
            setTimeout(() => {
                toggleBtn.classList.remove('theme-transitioning');
            }, 300);
        }
    },
    
    /**
     * Get current theme
     * @returns {string} 'light' or 'dark'
     */
    getTheme() {
        return this.currentTheme;
    },
    
    /**
     * Create and insert toggle button
     */
    createToggleButton() {
        // Find header actions container
        const headerActions = document.querySelector('.chat-header-actions');
        if (!headerActions) {
            console.warn('Header actions container not found');
            return;
        }
        
        // Check if button already exists
        if (document.getElementById('theme-toggle')) {
            this.updateToggleIcon();
            return;
        }
        
        // Create button
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Cambiar tema');
        button.setAttribute('title', 'Cambiar entre modo claro y oscuro');
        button.innerHTML = '<i class="fas fa-moon"></i>';
        
        // Insert at the beginning of header actions
        headerActions.insertBefore(button, headerActions.firstChild);
        
        // Bind click event
        button.addEventListener('click', () => this.toggle());
        
        // Update icon
        this.updateToggleIcon();
    },
    
    /**
     * Update toggle button icon based on current theme
     */
    updateToggleIcon() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;
        
        const icon = toggleBtn.querySelector('i');
        if (!icon) return;
        
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            toggleBtn.setAttribute('title', 'Cambiar a modo claro');
        } else {
            icon.className = 'fas fa-moon';
            toggleBtn.setAttribute('title', 'Cambiar a modo oscuro');
        }
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
        
        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                const newTheme = e.newValue || 'light';
                if (newTheme !== this.currentTheme) {
                    this.setTheme(newTheme, false);
                }
            }
        });
    },
    
    /**
     * Reset to system preference
     */
    resetToSystem() {
        localStorage.removeItem(this.STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light', false);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
});

// Expose to global scope for debugging
window.themeManager = themeManager;
