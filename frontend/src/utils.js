/**
 * Global UI Utilities & Theme Management
 * This file centralizes common logic for scalability and maintainability.
 */

const UIUtils = {
    /**
     * Get common SweetAlert2 configuration based on current theme
     */
    getSwalConfig() {
        const theme = localStorage.getItem('app-theme') || 'dark';
        const isDark = theme === 'dark';
        
        return {
            background: isDark ? '#171717' : '#ffffff',
            color: isDark ? '#ececec' : '#1d1d1f',
            confirmButtonColor: '#007aff',
            cancelButtonColor: '#ff3b30',
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            backdrop: `rgba(0,0,0,0.4)`,
            customClass: {
                popup: 'rounded-4 border border-secondary border-opacity-25 shadow-lg',
                input: 'swal-custom-input',
                confirmButton: 'px-4 py-2 fw-bold',
                cancelButton: 'px-4 py-2 fw-bold border-0 bg-opacity-25'
            },
            didOpen: () => {
                // Inyectar CSS dinámico para el input de Swal
                const style = document.createElement('style');
                style.id = 'swal-dynamic-styles';
                style.innerHTML = `
                    .swal-custom-input {
                        background-color: ${isDark ? '#2f2f2f' : '#f5f5f7'} !important;
                        color: ${isDark ? '#ececec' : '#1d1d1f'} !important;
                        border: 1px solid ${isDark ? '#3c3c3c' : '#d2d2d7'} !important;
                        border-radius: 12px !important;
                        box-shadow: none !important;
                        font-family: 'Inter', sans-serif !important;
                    }
                    .swal2-select {
                        background-color: ${isDark ? '#2f2f2f' : '#f5f5f7'} !important;
                        color: ${isDark ? '#ececec' : '#1d1d1f'} !important;
                        border: 1px solid ${isDark ? '#3c3c3c' : '#d2d2d7'} !important;
                        border-radius: 12px !important;
                    }
                `;
                document.head.appendChild(style);
            },
            didClose: () => {
                const style = document.getElementById('swal-dynamic-styles');
                if (style) style.remove();
            }
        };
    },

    /**
     * Show a standardized toast notification with HIGH CONTRAST
     */
    showToast(message, icon = 'info') {
        const theme = localStorage.getItem('app-theme') || 'dark';
        const isDark = theme === 'dark';
        
        // Colores deterministas para evitar fallos de contraste
        const bgColor = isDark ? '#171717' : '#ffffff';
        const txtColor = isDark ? '#ffffff' : '#000000'; // Negro puro en modo claro
        
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: icon,
            title: `<span style="color: ${txtColor}; font-weight: 600; font-family: 'Inter', sans-serif;">${message}</span>`,
            background: bgColor,
            customClass: {
                popup: 'shadow-lg border border-secondary border-opacity-25 rounded-4'
            }
        });
    },

    /**
     * Initialize the application theme and sync with Bootstrap
     */
    initTheme() {
        const savedTheme = localStorage.getItem('app-theme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        return savedTheme;
    },

    /**
     * Toggle theme and persist
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-bs-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', next);
        localStorage.setItem('app-theme', next);
        return next;
    }
};

window.UIUtils = UIUtils;
