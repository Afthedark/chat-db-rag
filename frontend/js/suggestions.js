/**
 * Suggestions Module
 * Floating bubble with suggested questions for the chat
 */

const suggestions = {
    bubble: null,
    panel: null,
    closeBtn: null,
    panelBody: null,
    pulseInterval: null,
    pulseCount: 0,
    maxPulses: 3,
    
    /**
     * Suggested questions organized by category
     */
    questions: {
        "Ventas y Totales": [
            "¿Cuál fue el total de ventas de marzo 2026?",
            "¿Cuánto vendimos ayer?",
            "Dime el monto total vendido en abril",
            "¿Cuánto facturamos esta semana?",
            "Total de ingresos del día de hoy",
            "¿Cuál es el monto acumulado de ventas del mes?",
            "Facturación total del primer trimestre 2026",
            "¿Cuánto se vendió ayer en total?",
            "Monto total de pedidos del 15 de abril",
            "Promedio de ventas diarias en marzo"
        ],
        "Productos más vendidos": [
            "Dime los 5 productos más vendidos hoy",
            "Top 10 de productos más vendidos esta semana",
            "Dime los 10 productos más vendidos en marzo y cuánto vendió cada uno",
            "¿Qué productos tuvieron más ventas esta semana?",
            "Ranking de productos por cantidad vendida en abril",
            "Los 20 ítems más populares del mes pasado",
            "¿Cuáles son los productos estrella de esta semana?",
            "Lista de productos ordenados por ventas (mayor a menor)",
            "Top productos del día con sus cantidades"
        ],
        "Consultas por Producto": [
            "¿Cuánto vendimos de Broaster Mixto en marzo?",
            "Ventas del producto 'Combo Familiar' esta semana",
            "¿Cuántos sandwiches de pollo se vendieron ayer?",
            "Total vendido de bebidas Coca Cola 1L",
            "¿Cuántas Alitas 6pz se vendieron en abril?",
            "Monto total de ventas del producto 'PROMO 2 Presas'",
            "Unidades vendidas de 'Extra Papa Grande'"
        ],
        "Por Categoría": [
            "¿Cuántas bebidas vendimos hoy?",
            "Top 5 bebidas más vendidas esta semana",
            "¿Cuántos combos se vendieron ayer?",
            "Ventas de promociones 3x2 en abril",
            "¿Cuántos extras de papa se vendieron?",
            "¿Cuántos productos bañados vendimos?",
            "Top productos bañados del mes",
            "¿Cuántos pedidos para llevar tuvimos?",
            "Productos PLL más vendidos"
        ],
        "Por Tiempo": [
            "Ventas de los últimos 7 días",
            "¿Cómo fueron las ventas esta semana día por día?",
            "Comparación de ventas semana vs semana anterior",
            "¿Qué día de la semana vendemos más?",
            "Ventas por mes en 2026",
            "¿Cuál fue el mejor mes de ventas?",
            "¿A qué hora vendemos más?",
            "Ventas por turno: mañana vs tarde"
        ],
        "Clientes y Empleados": [
            "¿Cuántos clientes únicos tuvimos hoy?",
            "Número de clientes nuevos esta semana",
            "¿Cuánto vendió cada empleado hoy?",
            "Ranking de ventas por cajero esta semana",
            "¿Quién atendió más pedidos ayer?",
            "Ventas por caja número 1"
        ],
        /*
        "Inventario": [
            "¿Qué productos tienen bajo stock?",
            "Lista de ítems con menos de 10 unidades",
            "¿Qué productos entraron al almacén hoy?",
            "Salidas de inventario de la semana"
        ],
        */
        "Estructura de Datos": [
            "¿Qué tablas hay en la base de datos?",
            "Muéstrame la estructura de la tabla pedidos",
            "¿Qué columnas tiene la tabla items?"
        ]
    },

    /**
     * Initialize the suggestions module
     */
    init() {
        this.bubble = document.getElementById('suggestions-bubble');
        this.panel = document.getElementById('suggestions-panel');
        this.closeBtn = document.getElementById('close-suggestions');
        this.panelBody = this.panel?.querySelector('.suggestions-panel-body');
        
        if (!this.bubble || !this.panel || !this.panelBody) {
            console.error('Suggestions: Required DOM elements not found');
            return;
        }
        
        this.renderQuestions();
        this.bindEvents();
        this.startPulseAnimation();
        
        console.log('Suggestions module initialized');
    },

    /**
     * Render all questions in the panel
     */
    renderQuestions() {
        let html = '';
        let totalQuestions = 0;
        
        for (const [category, questions] of Object.entries(this.questions)) {
            totalQuestions += questions.length;
            const categoryId = category.toLowerCase().replace(/\s+/g, '-');
            
            html += `
                <div class="suggestion-category">
                    <div class="suggestion-category-header" data-category="${categoryId}">
                        <span class="suggestion-category-title">${category}</span>
                        <div>
                            <span class="suggestion-category-count">${questions.length}</span>
                            <i class="fas fa-chevron-down ms-2"></i>
                        </div>
                    </div>
                    <div class="suggestion-category-items" id="category-${categoryId}">
                        ${questions.map((q, idx) => `
                            <div class="suggestion-item" data-question="${this.escapeHtml(q)}">
                                <i class="fas fa-comment-dots"></i>
                                ${this.escapeHtml(q)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        this.panelBody.innerHTML = html;
        
        // Update badge count
        const badge = this.bubble.querySelector('.suggestions-bubble-badge');
        if (badge) {
            badge.textContent = totalQuestions;
        }
        
        // Bind category toggle events
        this.panelBody.querySelectorAll('.suggestion-category-header').forEach(header => {
            header.addEventListener('click', (e) => this.toggleCategory(e.currentTarget));
        });
        
        // Bind question click events
        this.panelBody.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => this.selectQuestion(e.currentTarget.dataset.question));
        });
    },

    /**
     * Toggle category expansion
     */
    toggleCategory(header) {
        const categoryId = header.dataset.category;
        const items = document.getElementById(`category-${categoryId}`);
        const isCollapsed = items.classList.contains('d-none');
        
        if (isCollapsed) {
            items.classList.remove('d-none');
            header.classList.remove('collapsed');
        } else {
            items.classList.add('d-none');
            header.classList.add('collapsed');
        }
    },

    /**
     * Select a question and insert it into chat
     */
    selectQuestion(question) {
        // Insert into chat input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.value = question;
            messageInput.focus();
        }
        
        // Close panel
        this.hidePanel();
        
        // Optional: Auto-send after a short delay
        // setTimeout(() => {
        //     const sendBtn = document.getElementById('btn-send');
        //     if (sendBtn && !sendBtn.disabled) {
        //         sendBtn.click();
        //     }
        // }, 500);
        
        console.log('Selected suggestion:', question);
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle panel on bubble click
        this.bubble.addEventListener('click', () => this.togglePanel());
        
        // Close panel on close button click
        this.closeBtn.addEventListener('click', () => this.hidePanel());
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.panel.classList.contains('d-none')) return;
            
            const isClickInside = this.panel.contains(e.target) || this.bubble.contains(e.target);
            if (!isClickInside) {
                this.hidePanel();
            }
        });
        
        // Stop pulse when user interacts
        this.bubble.addEventListener('mouseenter', () => this.stopPulseAnimation());
    },

    /**
     * Toggle panel visibility
     */
    togglePanel() {
        if (this.panel.classList.contains('d-none')) {
            this.showPanel();
        } else {
            this.hidePanel();
        }
    },

    /**
     * Show the suggestions panel
     */
    showPanel() {
        this.panel.classList.remove('d-none');
        this.stopPulseAnimation();
        
        // Mark as seen in localStorage
        localStorage.setItem('suggestionsSeen', 'true');
        
        // Expand first category by default
        const firstCategory = this.panelBody.querySelector('.suggestion-category-header');
        if (firstCategory) {
            const categoryId = firstCategory.dataset.category;
            const items = document.getElementById(`category-${categoryId}`);
            if (items && items.classList.contains('d-none')) {
                this.toggleCategory(firstCategory);
            }
        }
    },

    /**
     * Hide the suggestions panel
     */
    hidePanel() {
        this.panel.classList.add('d-none');
    },

    /**
     * Start the pulse animation
     */
    startPulseAnimation() {
        // Check if user has already seen the suggestions
        if (localStorage.getItem('suggestionsSeen') === 'true') {
            return;
        }
        
        // Initial delay before starting pulse
        setTimeout(() => {
            this.pulseInterval = setInterval(() => {
                if (this.pulseCount >= this.maxPulses) {
                    this.stopPulseAnimation();
                    return;
                }
                
                this.bubble.classList.add('pulse');
                setTimeout(() => {
                    this.bubble.classList.remove('pulse');
                }, 1000);
                
                this.pulseCount++;
            }, 15000); // Pulse every 15 seconds
        }, 5000); // Start after 5 seconds
    },

    /**
     * Stop the pulse animation
     */
    stopPulseAnimation() {
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }
        this.bubble.classList.remove('pulse');
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    suggestions.init();
});
