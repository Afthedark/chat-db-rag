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
     * Optimized based on business_context.py rules and actual database schema
     */
    questions: {
        "Ventas y Facturación": [
            "¿Cuánto vendimos hoy?",
            "¿Cuánto vendimos ayer?",
            "Total de ventas de esta semana",
            "¿Cuál fue el total de ventas del mes pasado?",
            "Facturación total del día de hoy",
            "¿Cuántos pedidos facturados tenemos hoy?",
            "Ventas no facturadas vs facturadas esta semana",
            "Promedio de ventas por día esta semana",
            "Comparación de ventas: hoy vs ayer",
            "¿Cuál fue el día con más ventas esta semana?"
        ],
        "Productos más vendidos": [
            "Top 5 productos más vendidos hoy",
            "Top 10 productos más vendidos esta semana",
            "¿Qué productos vendieron más ayer?",
            "Ranking de productos del mes por cantidad",
            "Los 10 ítems más populares de la semana",
            "Productos más vendidos con sus cantidades",
            "Top productos para llevar (PLL) esta semana",
            "Productos estrella del día"
        ],
        "Análisis por Horarios": [
            "¿Cuánta cantidad de Broaster se vendió por hora el día de hoy?",
            "¿Cuánta cantidad de Broaster se vendió por hora el día de ayer?",
            "¿Cuánto se vende de Broaster por hora?",
            "Tiempo promedio de atención por hora",
            "¿Qué productos se vendieron hoy entre las 10am y 2pm?",
            "Top productos vendidos ayer en la mañana (8am-12pm)",
            "¿Cuánto vendimos en el horario de cena (6pm-9pm)?",
            "Productos más vendidos al mediodía (12pm-2pm)",
            "¿Cuál es nuestra hora pico?",
            "Muéstrame el resumen de ventas hora por hora",
            "¿Cuánto vendemos en la mañana vs la tarde?",
            "Top 5 productos más vendidos en horario de almuerzo",
            "Comparación: días de semana vs fines de semana",
            "¿Qué día de la semana genera más dinero?",
            "Reporte de ventas nocturnas después de las 8 PM",
            "Ticket promedio por cada hora del día",
            "Ventas entre las 3pm y 5pm de ayer"
        ],
        "Por Categoría / Tipo": [
            "¿Cuántas bebidas vendimos hoy?",
            "Top 5 bebidas más vendidas esta semana",
            "¿Cuántos combos se vendieron hoy?",
            "Ventas de productos bañados esta semana",
            "¿Cuántos productos para llevar (PLL) vendimos?",
            "Top productos con extra papa",
            "¿Cuántos combos familiares vendimos?",
            "Ventas de promociones del día"
        ],
        "Análisis de Pedidos": [
            "¿Cuántos pedidos tuvimos hoy?",
            "¿Cuántos pedidos se anularon hoy?",
            "Monto total de anulaciones esta semana",
            "Promedio de ítems por pedido hoy",
            "¿Cuántos pedidos están pendientes?",
            "Pedidos por estado: concluidos, pendientes, anulados",
            "Ticket promedio del día"
        ],
        "Por Tiempo y Turno": [
            "Ventas por hora hoy",
            "¿A qué hora vendemos más?",
            "Ventas del turno mañana vs turno tarde",
            "Ventas de los últimos 7 días",
            "Comparación: esta semana vs semana pasada",
            "¿Qué día de la semana vendemos más?",
            "Ventas por día de esta semana",
            "Mejor horario de ventas del mes"
        ],
        
        "Búsquedas de Productos": [
            "¿Cuántas sanguchitas vendimos hoy?",
            "¿Cuántas sanguchitas vendimos en total (local y para llevar)?",
            "Top 5 productos más vendidos de todos los tiempos",
            "¿Cuánto vendimos de productos bañados?",
            "Ventas de Pollo al Horno",
            "¿Cuántas alitas vendimos por tamaño?",
            "Comparar ventas: Box Friends vs Box Wings",
            "¿Cuántas Pechuguitas 5 vendimos?",
            "¿Cuántos combos con Pepsi vendimos este mes?",
            "¿Cuántos productos con papas extra vendimos?"
        ],
        "Clientes y Atención": [
            "¿Cuántos clientes atendimos hoy?",
            "¿Cuántos clientes nuevos esta semana?",
            "Clientes recurrentes vs nuevos hoy",
            "¿Cuántos pedidos para llevar vs para mesa?",
            "Ticket promedio por cliente hoy"
        ],
        "Empleados y Cajas": [
            "¿Cuánto vendió cada empleado hoy?",
            "Ranking de ventas por cajero esta semana",
            "¿Quién atendió más pedidos hoy?",
            "Ventas por caja número 1",
            "Empleado con más ventas del día",
            "Pedidos atendidos por cada empleado"
        ],
        "Productos Específicos": [
            "Buscar productos que contengan 'pollo'",
            "Ventas de productos que contengan 'combo'",
            "Productos más vendidos que contengan 'papa'",
            "Buscar ventas de 'sanguchitas'",
            "Productos bañados más vendidos",
            "Ventas de productos con 'alitas'"
        ],
        "Estructura de Datos": [
            "¿Qué tablas hay en la base de datos?",
            "Muéstrame la estructura de la tabla pedidos",
            "¿Qué columnas tiene la tabla items?",
            "Muéstrame las tablas de clientes y empleados"
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
