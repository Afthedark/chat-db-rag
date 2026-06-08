/**
 * Panel de Cocina - Modulo de Adaptacion Predictiva
 * Maneja accesos rapidos personalizados para la cocina y su configuracion.
 */

const kitchenPanel = {
    shortcuts: [],
    modalElement: null,
    bootstrapModal: null,

    // Categorias predefinidas y sus estilos de boton
    categories: {
        '🍗 Área Broaster': 'btn-outline-orange',
        '🍔 Plancha y Horno': 'btn-outline-primary',
        '🧪 Líquidos y Salsas': 'btn-outline-success',
        'Otros': 'btn-outline-secondary'
    },

    // Valores por defecto
    defaultShortcuts: [
        { id: 'presas-miercoles', label: '🕒 Presas: Miércoles Anterior', prompt: 'Proyecta las puestas de presas broaster por hora para hoy basado en el mismo día de la semana pasada', category: '🍗 Área Broaster' },
        { id: 'alas-sabado', label: '🕒 Alas: Sábado Anterior', prompt: 'Proyecta las puestas de alas por hora para hoy basado en el mismo día de la semana pasada', category: '🍗 Área Broaster' },
        { id: 'sanduchitas-ayer', label: '🕒 Sanguchitas: Ayer', prompt: 'Proyecta las puestas de sanduchitas por hora para hoy basado en el comportamiento de ayer', category: '🍔 Plancha y Horno' },
        { id: 'pollo-horno-ayer', label: '🕒 Pollo al Horno: Ayer', prompt: 'Proyecta las puestas de pollo al horno por hora para hoy basado en el comportamiento de ayer', category: '🍔 Plancha y Horno' },
        { id: 'bebidas-litros-ayer', label: '🥤 Gaseosas/Bebidas en Litros', prompt: 'Consolidado de bebidas y llajua en litros vendidas el día de ayer', category: '🧪 Líquidos y Salsas' },
        { id: 'salsas-litros-hoy', label: '🌶️ Salsas y Líquidos: Hoy', prompt: 'Reporte de líquidos y salsas en litros vendidos el día de hoy', category: '🧪 Líquidos y Salsas' }
    ],

    /**
     * Inicializar modulo
     */
    init() {
        this.loadShortcuts();
        this.renderButtons();

        // Configurar modal
        this.modalElement = document.getElementById('kitchenConfigModal');
        if (this.modalElement && typeof bootstrap !== 'undefined') {
            this.bootstrapModal = new bootstrap.Modal(this.modalElement);
        }

        // Event listener para configurar
        const btnConfig = document.getElementById('btn-config-kitchen');
        if (btnConfig) {
            btnConfig.addEventListener('click', () => this.showConfigModal());
        }

        // Event listeners para colapsar/expandir panel de cocina
        this.bindCollapseEvents();

        console.log('Kitchen module initialized successfully');
    },

    /**
     * Cargar accesos directos desde localStorage o defaults
     */
    loadShortcuts() {
        const stored = localStorage.getItem('kitchenShortcuts');
        if (stored) {
            try {
                this.shortcuts = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse kitchen shortcuts from localStorage, using defaults', e);
                this.shortcuts = [...this.defaultShortcuts];
            }
        } else {
            this.shortcuts = [...this.defaultShortcuts];
            this.saveShortcutsToStorage();
        }
    },

    /**
     * Guardar en localStorage
     */
    saveShortcutsToStorage() {
        localStorage.setItem('kitchenShortcuts', JSON.stringify(this.shortcuts));
    },

    /**
     * Renderizar botones en la grilla del panel lateral derecho
     */
    renderButtons() {
        const container = document.getElementById('kitchen-buttons-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.shortcuts.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-4">No hay accesos rápidos configurados</div>';
            return;
        }

        // Agrupar por categorias
        const grouped = {};
        this.shortcuts.forEach(s => {
            const cat = s.category || 'Otros';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(s);
        });

        // Generar HTML con estructura de columnas (apiladas verticalmente en col-12)
        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            const btnClass = this.categories[category] || 'btn-outline-secondary';
            html += `
                <div class="col-12 mb-2">
                    <div class="card h-100 shadow-sm border border-secondary border-opacity-10">
                        <div class="card-header bg-light py-2 px-3 border-bottom-0">
                            <h6 class="mb-0 fw-bold text-secondary" style="font-size: 0.9rem;">${this.escapeHtml(category)}</h6>
                        </div>
                        <div class="card-body d-flex flex-column gap-2 p-2">
            `;
            
            items.forEach(item => {
                html += `
                    <button type="button" class="btn ${btnClass} text-start w-100 py-2 px-2 btn-kitchen-shortcut" 
                            data-prompt="${this.escapeHtml(item.prompt)}" style="font-size: 0.85rem;">
                        ${this.escapeHtml(item.label)}
                    </button>
                `;
            });
            
            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Añadir manejadores de clic
        container.querySelectorAll('.btn-kitchen-shortcut').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.currentTarget.dataset.prompt;
                this.executePrompt(prompt);
            });
        });
    },

    /**
     * Inyectar prompt en el chat y enviar
     */
    executePrompt(prompt) {
        if (!prompt) return;

        const messageInput = document.getElementById('message-input');
        if (messageInput && typeof chat !== 'undefined') {
            // Verificar si el input esta deshabilitado (sin conexion activa)
            if (messageInput.disabled) {
                if (typeof app !== 'undefined') {
                    app.showToast('Por favor selecciona o crea un chat primero', 'warning');
                }
                return;
            }

            messageInput.value = prompt;
            messageInput.focus();
            
            // Gatillar envio de mensaje directamente
            chat.sendMessage();
        }
    },

    /**
     * Mostrar modal de configuracion
     */
    showConfigModal() {
        const listContainer = document.getElementById('kitchen-config-list');
        if (!listContainer) return;

        this.renderConfigList();

        if (this.bootstrapModal) {
            this.bootstrapModal.show();
        }
    },

    /**
     * Renderizar lista editable en el modal
     */
    renderConfigList() {
        const listContainer = document.getElementById('kitchen-config-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (this.shortcuts.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-muted p-3">No hay accesos rápidos configurados. Agrega uno nuevo abajo.</div>';
            return;
        }

        this.shortcuts.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'card bg-light border p-3 mb-2 position-relative';
            card.dataset.index = index;

            // Selector de categorias
            let categoryOptions = '';
            for (const cat of Object.keys(this.categories)) {
                categoryOptions += `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`;
            }

            card.innerHTML = `
                <button type="button" class="btn btn-sm btn-link text-danger position-absolute top-0 end-0 m-2" 
                        onclick="kitchenPanel.deleteShortcut(${index})" title="Eliminar acceso rápido">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <div class="row g-2">
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-semibold" style="font-size:0.8rem">Etiqueta del Botón</label>
                        <input type="text" class="form-control form-control-sm config-shortcut-label" value="${this.escapeHtml(item.label)}">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-semibold" style="font-size:0.8rem">Categoría / Área</label>
                        <select class="form-select form-select-sm config-shortcut-category">
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold" style="font-size:0.8rem">Prompt Inyectado al Chat</label>
                        <textarea class="form-control form-control-sm config-shortcut-prompt" rows="2">${this.escapeHtml(item.prompt)}</textarea>
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });
    },

    /**
     * Agregar un nuevo acceso directo vacio a la lista del modal
     */
    addNewShortCut() {
        this.shortcuts.push({
            id: 'shortcut-' + Date.now(),
            label: 'Nuevo Acceso',
            prompt: 'Proyecta...',
            category: '🍗 Área Broaster'
        });
        this.renderConfigList();
        
        // Scroll to bottom of list
        const listContainer = document.getElementById('kitchen-config-list');
        if (listContainer) {
            listContainer.scrollTop = listContainer.scrollHeight;
        }
    },

    /**
     * Eliminar acceso directo por indice
     */
    deleteShortcut(index) {
        if (confirm('¿Estás seguro de que deseas eliminar este acceso rápido?')) {
            this.shortcuts.splice(index, 1);
            this.renderConfigList();
        }
    },

    /**
     * Guardar configuracion del modal a localStorage
     */
    saveConfig() {
        const listContainer = document.getElementById('kitchen-config-list');
        if (!listContainer) return;

        const cards = listContainer.querySelectorAll('.card');
        const newShortcuts = [];

        cards.forEach(card => {
            const index = card.dataset.index;
            const labelInput = card.querySelector('.config-shortcut-label');
            const categorySelect = card.querySelector('.config-shortcut-category');
            const promptInput = card.querySelector('.config-shortcut-prompt');

            if (labelInput && promptInput && categorySelect) {
                newShortcuts.push({
                    id: this.shortcuts[index]?.id || 'shortcut-' + Date.now(),
                    label: labelInput.value.trim() || 'Acceso',
                    prompt: promptInput.value.trim() || 'Consulta...',
                    category: categorySelect.value
                });
            }
        });

        this.shortcuts = newShortcuts;
        this.saveShortcutsToStorage();
        this.renderButtons();

        if (this.bootstrapModal) {
            this.bootstrapModal.hide();
        }

        if (typeof app !== 'undefined') {
            app.showToast('Configuración de cocina guardada con éxito', 'success');
        }
    },

    /**
     * Configurar eventos y estado de colapsado para el panel de cocina
     */
    bindCollapseEvents() {
        const workspace = document.getElementById('chat-workspace');
        const btnToggleHeader = document.getElementById('btn-toggle-kitchen');
        const btnCollapseKitchen = document.getElementById('btn-collapse-kitchen');

        if (!workspace) return;

        // Cargar estado guardado (por defecto expandido)
        const isCollapsed = localStorage.getItem('kitchen-collapsed') === 'true';
        if (isCollapsed) {
            workspace.classList.add('kitchen-collapsed');
            if (btnToggleHeader) {
                btnToggleHeader.classList.remove('btn-outline-warning');
                btnToggleHeader.classList.add('btn-warning');
            }
        }

        const toggleKitchen = () => {
            const willCollapse = !workspace.classList.contains('kitchen-collapsed');
            if (willCollapse) {
                workspace.classList.add('kitchen-collapsed');
                localStorage.setItem('kitchen-collapsed', 'true');
                if (btnToggleHeader) {
                    btnToggleHeader.classList.remove('btn-outline-warning');
                    btnToggleHeader.classList.add('btn-warning');
                }
            } else {
                workspace.classList.remove('kitchen-collapsed');
                localStorage.setItem('kitchen-collapsed', 'false');
                if (btnToggleHeader) {
                    btnToggleHeader.classList.remove('btn-warning');
                    btnToggleHeader.classList.add('btn-outline-warning');
                }
            }
        };

        if (btnToggleHeader) {
            btnToggleHeader.addEventListener('click', toggleKitchen);
        }

        if (btnCollapseKitchen) {
            btnCollapseKitchen.addEventListener('click', toggleKitchen);
        }
    },

    /**
     * Escapar caracteres HTML para evitar XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Auto-inicializar cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    kitchenPanel.init();
});
