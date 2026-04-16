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

        console.log('Chat with MySQL initialized with persistence');
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
            success: { bg: 'bg-success', icon: 'fa-check-circle', title: 'Success' },
            error: { bg: 'bg-danger', icon: 'fa-exclamation-circle', title: 'Error' },
            warning: { bg: 'bg-warning', icon: 'fa-exclamation-triangle', title: 'Warning' },
            info: { bg: 'bg-info', icon: 'fa-info-circle', title: 'Info' }
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
