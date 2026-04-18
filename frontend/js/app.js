/**
 * Main Application Module
 * Initializes all components and provides utility functions
 */

const app = {
    loadingModal: null,
    toast: null,

    /**
     * Initialize the application
     */
    init() {
        // Initialize Bootstrap components
        this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        this.toast = new bootstrap.Toast(document.getElementById('toast'));

        // Initialize modules
        if (typeof database !== 'undefined') database.init();
        if (typeof connections !== 'undefined') connections.init();
        if (typeof chats !== 'undefined') chats.init();
        if (typeof chat !== 'undefined') chat.init();
        
        // Initialize mobile sidebar
        this.initMobileSidebar();

        console.log('Chat with MySQL initialized with persistence');
    },
    
    /**
     * Initialize mobile sidebar toggle functionality
     */
    initMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (!sidebar || !sidebarToggle) {
            console.log('Mobile sidebar elements not found');
            return;
        }
        
        console.log('Mobile sidebar initialized');
        
        // Open sidebar - Support both click and touch
        const openSidebar = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            console.log('Opening sidebar');
            sidebar.classList.add('show');
            if (sidebarOverlay) sidebarOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        };
        
        sidebarToggle.addEventListener('click', openSidebar);
        sidebarToggle.addEventListener('touchstart', openSidebar, { passive: false });
        
        // Close sidebar functions
        const closeSidebar = () => {
            sidebar.classList.remove('show');
            if (sidebarOverlay) sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        };
        
        // Close button
        if (sidebarClose) {
            sidebarClose.addEventListener('click', closeSidebar);
            sidebarClose.addEventListener('touchstart', closeSidebar, { passive: false });
        }
        
        // Overlay click/touch
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeSidebar);
            sidebarOverlay.addEventListener('touchstart', closeSidebar, { passive: false });
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                closeSidebar();
            }
        });
    },

    /**
     * Show loading modal
     * @param {string} text - Loading text to display
     */
    showLoading(text = 'Processing...') {
        document.getElementById('loading-text').textContent = text;
        this.loadingModal.show();
    },

    /**
     * Hide loading modal
     */
    hideLoading() {
        this.loadingModal.hide();
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     */
    showToast(message, type = 'info') {
        const toastElement = document.getElementById('toast');
        const toastBody = document.getElementById('toast-message');
        const toastHeader = toastElement.querySelector('.toast-header');
        const toastTitle = toastHeader.querySelector('strong');
        const toastIcon = toastHeader.querySelector('i');

        // Set message
        toastBody.textContent = message;

        // Set styles based on type
        const styles = {
            success: { bg: 'bg-success', icon: 'fa-check-circle', title: 'Éxito' },
            error: { bg: 'bg-danger', icon: 'fa-exclamation-circle', title: 'Error' },
            warning: { bg: 'bg-warning', icon: 'fa-exclamation-triangle', title: 'Advertencia' },
            info: { bg: 'bg-info', icon: 'fa-info-circle', title: 'Información' }
        };

        const style = styles[type] || styles.info;

        // Update header styling
        toastHeader.className = `toast-header text-white ${style.bg}`;
        toastIcon.className = `fas ${style.icon} me-2`;
        toastTitle.textContent = style.title;

        // Show toast
        this.toast.show();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
