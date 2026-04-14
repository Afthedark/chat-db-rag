/**
 * LoadingBlocker Component
 * Blocks UI interactions while AI is generating a response
 */

export const LoadingBlocker = () => ({
    isBlocking: false,
    message: 'Esperando respuesta de Mama Chicken IA...',
    
    block(message = null) {
        this.isBlocking = true;
        if (message) this.message = message;
        document.body.style.overflow = 'hidden';
    },
    
    unblock() {
        this.isBlocking = false;
        this.message = 'Esperando respuesta de Mama Chicken IA...';
        document.body.style.overflow = '';
    }
});

export default LoadingBlocker;
