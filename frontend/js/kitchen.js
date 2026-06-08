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
        // 🍗 Área Broaster
        { id: 'presas-promedio', label: '🕒 Presas: Promedio Histórico (3 Semanas)', prompt: 'Proyecta las puestas de presas broaster por hora para hoy basado en el promedio ponderado de los últimos 3 mismos días de la semana anterior', category: '🍗 Área Broaster' },
        { id: 'presas-semana-pasada', label: '🕒 Presas: Semana Pasada', prompt: 'Proyecta las puestas de presas broaster por hora para hoy basado en el mismo día de la semana pasada', category: '🍗 Área Broaster' },
        { id: 'presas-ayer', label: '🕒 Presas: Ayer', prompt: 'Proyecta las puestas de presas broaster por hora para hoy basado en el comportamiento de ayer', category: '🍗 Área Broaster' },
        { id: 'alas-promedio', label: '🕒 Alas: Promedio Histórico (3 Semanas)', prompt: 'Proyecta las puestas de alas por hora para hoy basado en el promedio ponderado de los últimos 3 mismos días de la semana anterior', category: '🍗 Área Broaster' },
        { id: 'alas-semana-pasada', label: '🕒 Alas: Semana Pasada', prompt: 'Proyecta las puestas de alas por hora para hoy basado en el mismo día de la semana pasada', category: '🍗 Área Broaster' },
        { id: 'alas-ayer', label: '🕒 Alas: Ayer', prompt: 'Proyecta las puestas de alas por hora para hoy basado en el comportamiento de ayer', category: '🍗 Área Broaster' },
        
        // 🍔 Plancha y Horno
        { id: 'sanduchitas-promedio', label: '🕒 Sanguchitas: Promedio (3 Semanas)', prompt: 'Proyecta las puestas de sanduchitas por hora para hoy basado en el promedio ponderado de los últimos 3 mismos días de la semana anterior', category: '🍔 Plancha y Horno' },
        { id: 'sanduchitas-semana-pasada', label: '🕒 Sanguchitas: Semana Pasada', prompt: 'Proyecta las puestas de sanduchitas por hora para hoy basado en el mismo día de la semana pasada', category: '🍔 Plancha y Horno' },
        { id: 'sanduchitas-ayer', label: '🕒 Sanguchitas: Ayer', prompt: 'Proyecta las puestas de sanduchitas por hora para hoy basado en el comportamiento de ayer', category: '🍔 Plancha y Horno' },
        { id: 'horno-promedio', label: '🕒 Pollo Horno: Promedio (3 Semanas)', prompt: 'Proyecta las puestas de pollo al horno por hora para hoy basado en el promedio ponderado de los últimos 3 mismos días de la semana anterior', category: '🍔 Plancha y Horno' },
        { id: 'horno-semana-pasada', label: '🕒 Pollo Horno: Semana Pasada', prompt: 'Proyecta las puestas de pollo al horno por hora para hoy basado en el mismo día de la semana pasada', category: '🍔 Plancha y Horno' },
        { id: 'horno-ayer', label: '🕒 Pollo Horno: Ayer', prompt: 'Proyecta las puestas de pollo al horno por hora para hoy basado en el comportamiento de ayer', category: '🍔 Plancha y Horno' },
        
        // 🧪 Líquidos y Salsas
        { id: 'llajua-promedio', label: '🌶️ Llajua en Litros: Promedio (3 Semanas)', prompt: 'Proyecta el consumo de llajua en litros por hora para hoy basado en el promedio ponderado de los últimos 3 mismos días de la semana anterior', category: '🧪 Líquidos y Salsas' },
        { id: 'llajua-semana-pasada', label: '🌶️ Llajua en Litros: Semana Pasada', prompt: 'Proyecta el consumo de llajua en litros por hora para hoy basado en el mismo día de la semana pasada', category: '🧪 Líquidos y Salsas' },
        { id: 'bebidas-promedio', label: '🥤 Bebidas en Litros: Promedio (3 Semanas)', prompt: 'Proyecta el consumo de gaseosas y bebidas en litros por hora para hoy basado en el promedio ponderado de los últimos 3 mismos días de la semana anterior', category: '🧪 Líquidos y Salsas' },
        { id: 'bebidas-semana-pasada', label: '🥤 Bebidas en Litros: Semana Pasada', prompt: 'Proyecta el consumo de gaseosas y bebidas en litros por hora para hoy basado en el mismo día de la semana pasada', category: '🧪 Líquidos y Salsas' },
        { id: 'bebidas-litros-ayer', label: '🥤 Consolidado Bebidas/Llajua: Ayer', prompt: 'Consolidado de bebidas y llajua en litros vendidas el día de ayer', category: '🧪 Líquidos y Salsas' },
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

        // Iniciar intervalo para refrescar la fila horaria activa cada minuto
        setInterval(() => {
            if (this.projectionData && document.getElementById('kds-table-container') && !document.getElementById('kds-table-container').classList.contains('d-none')) {
                this.renderKdsTable();
            }
        }, 60000);

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
                // Migración automática si detecta los 6 accesos directos anteriores
                if (this.shortcuts.length <= 6 || this.shortcuts.some(s => s.id === 'presas-miercoles')) {
                    console.log('Actualizando accesos rápidos predeterminados...');
                    this.shortcuts = [...this.defaultShortcuts];
                    this.saveShortcutsToStorage();
                }
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
                            data-prompt="${this.escapeHtml(item.prompt)}" data-label="${this.escapeHtml(item.label)}" style="font-size: 0.85rem;">
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
                const label = e.currentTarget.dataset.label;
                this.activeLabel = label;
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
            app.showToast('Configuración de producción guardada con éxito', 'success');
        }
    },

    /**
     * Restablecer los accesos directos por defecto
     */
    resetDefaults() {
        if (confirm('¿Estás seguro de que deseas restablecer todos los accesos rápidos a los valores predeterminados? Perderás cualquier personalización.')) {
            this.shortcuts = [...this.defaultShortcuts];
            this.saveShortcutsToStorage();
            this.renderButtons();
            
            // Si el modal está abierto, volver a renderizar la lista del modal
            const listContainer = document.getElementById('kitchen-config-list');
            if (listContainer) {
                this.renderConfigList();
            }
            
            if (typeof app !== 'undefined') {
                app.showToast('Accesos rápidos restablecidos a los valores predeterminados', 'success');
            }
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
    },

    /**
     * Parser para extraer datos de proyecciones desde la respuesta de chat de la IA
     */
    parseProjectionData(messageText, sqlResults) {
        let dataFound = [];
        
        // 1. Intentar parsear de sqlResults (más preciso y directo)
        if (sqlResults && typeof sqlResults === 'string') {
            try {
                // Remover Decimal(), datetime(), etc., si existen en la representación de Python
                let cleanedResults = sqlResults
                    .replace(/Decimal\('([\d.]+)'\)/g, '$1')
                    .replace(/datetime\.datetime\([^)]+\)/g, '""');
                
                // Buscar pares de la forma ('11:00', 45) o ('11', 45) o [11, 45] o ("11:00", 45)
                const pairRegex = /(?:['"](\d{1,2}:?\d{0,2})['"]\s*,\s*([\d.]+))|(?:\(([\d.]+)\s*,\s*['"](\d{1,2}:?\d{0,2})['"]\))/g;
                let match;
                while ((match = pairRegex.exec(cleanedResults)) !== null) {
                    let hour = match[1] || match[4];
                    let val = parseFloat(match[2] || match[3]);
                    
                    // Formatear hora si es solo un número de hora (ej: "11" -> "11:00")
                    if (hour && !hour.includes(':')) {
                        hour = hour.padStart(2, '0') + ':00';
                    }
                    
                    if (hour && !isNaN(val)) {
                        dataFound.push({ hour, projected: Math.round(val) });
                    }
                }
            } catch (err) {
                console.error("Error parsing sql_results regex", err);
            }
        }
        
        // 2. Si no se encontró nada, intentar parsear la tabla de Markdown en el mensaje
        if (dataFound.length === 0 && messageText) {
            // Buscar líneas con formato de tabla: | 11:00 | 45 | o similares
            const mdRowRegex = /\|\s*(\d{1,2}:\d{2})\s*\|\s*([\d.,\sBs]+?)\s*\|/g;
            let match;
            while ((match = mdRowRegex.exec(messageText)) !== null) {
                let hour = match[1];
                let valStr = match[2].replace(/[^\d.]/g, ''); // Limpiar símbolos de moneda o texto
                let val = parseFloat(valStr);
                if (hour && !isNaN(val)) {
                    dataFound.push({ hour, projected: Math.round(val) });
                }
            }
            
            // Alternativo sin pipes (ej: lista o texto suelto)
            if (dataFound.length === 0) {
                const textRowRegex = /(?:^|\n)\s*(\d{1,2}:\d{2})\s*[:-]\s*([\d.]+)/g;
                while ((match = textRowRegex.exec(messageText)) !== null) {
                    let hour = match[1];
                    let val = parseFloat(match[2]);
                    if (hour && !isNaN(val)) {
                        dataFound.push({ hour, projected: Math.round(val) });
                    }
                }
            }
        }
        
        // Si encontramos datos válidos, cargar en el Monitor KDS
        if (dataFound.length > 0) {
            // Ordenar por hora
            dataFound.sort((a, b) => a.hour.localeCompare(b.hour));
            
            // Determinar insumo activo según el activeLabel
            let activeItem = "Insumo";
            if (this.activeLabel) {
                activeItem = this.activeLabel
                    .replace(/[🕒🌶️🥤🧪🍗🍔]/g, '')
                    .split(':')[0]
                    .trim();
            }
            
            this.loadKdsData(activeItem, dataFound);
            return true;
        }
        
        return false;
    },

    /**
     * Carga de datos del KDS al monitor y vista
     */
    loadKdsData(itemName, data) {
        this.currentInsumo = itemName;
        this.projectionData = data;
        
        // Cargar datos reales guardados en localStorage para esta fecha e insumo
        const todayStr = new Date().toISOString().split('T')[0];
        const storageKey = `kds_real_${todayStr}_${itemName}`;
        const storedReal = localStorage.getItem(storageKey);
        this.realProductionData = {};
        if (storedReal) {
            try {
                this.realProductionData = JSON.parse(storedReal);
            } catch (e) {
                console.error("Error loading real KDS data", e);
            }
        }
        
        // Rellenar con 0 para cualquier hora proyectada que no tenga producción real registrada
        this.projectionData.forEach(p => {
            if (this.realProductionData[p.hour] === undefined) {
                this.realProductionData[p.hour] = 0;
            }
        });
        
        // Mostrar los contenedores correctos en el KDS
        const emptyState = document.getElementById('kds-empty-state');
        if (emptyState) emptyState.classList.add('d-none');
        
        const summary = document.getElementById('kds-summary-container');
        if (summary) summary.classList.remove('d-none');
        
        const tableContainer = document.getElementById('kds-table-container');
        if (tableContainer) tableContainer.classList.remove('d-none');
        
        // Cambiar a la pestaña de planilla con efecto dinámico
        const tabBtn = document.getElementById('tab-planilla-btn');
        if (tabBtn) {
            tabBtn.click();
            // Mostrar badge de alerta de nueva carga
            const badge = document.getElementById('kds-alert-badge');
            if (badge) {
                badge.classList.remove('d-none');
                setTimeout(() => badge.classList.add('d-none'), 3000);
            }
        }
        
        // Renderizar la tabla y el resumen
        this.renderKdsTable();
        this.updateKdsSummary();
    },

    /**
     * Renderiza las filas en la tabla del KDS
     */
    renderKdsTable() {
        const tbody = document.getElementById('kds-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const now = new Date();
        const currentHourStr = now.getHours().toString().padStart(2, '0') + ':00';
        
        this.projectionData.forEach(p => {
            const hour = p.hour;
            const projected = p.projected;
            const real = this.realProductionData[hour] || 0;
            const deviation = real - projected;
            
            // Determinar si es la hora actual
            const isCurrent = hour === currentHourStr;
            const rowClass = isCurrent ? 'kds-active-row table-warning border-start border-warning border-3' : '';
            const activeBadge = isCurrent ? '<span class="badge bg-warning text-dark kds-pulse-badge mb-1">ACTUAL</span><br>' : '';
            
            // Badge de desviación
            let devBadgeClass = 'bg-secondary';
            let devPrefix = '';
            if (deviation > 0) {
                devBadgeClass = 'bg-success-subtle text-success border border-success border-opacity-25';
                devPrefix = '+';
            } else if (deviation < 0) {
                devBadgeClass = 'bg-danger-subtle text-danger border border-danger border-opacity-25';
            } else {
                devBadgeClass = 'bg-light text-muted border';
            }
            
            const tr = document.createElement('tr');
            tr.className = rowClass;
            tr.innerHTML = `
                <td>
                    ${activeBadge}
                    <strong class="text-dark">${hour}</strong>
                </td>
                <td class="text-center font-monospace fw-bold">${projected}</td>
                <td class="text-center">
                    <div class="input-group input-group-sm justify-content-center flex-nowrap" style="max-width: 90px; margin: 0 auto;">
                        <button class="btn btn-outline-secondary btn-xs px-1 py-0" type="button" onclick="kitchenPanel.adjustProduction('${hour}', -1)">-</button>
                        <input type="text" class="form-control form-control-sm text-center p-0 font-monospace fw-bold kds-input-real" 
                               value="${real}" onchange="kitchenPanel.setProductionDirect('${hour}', this.value)" style="height: 24px; font-size: 0.78rem;">
                        <button class="btn btn-outline-secondary btn-xs px-1 py-0" type="button" onclick="kitchenPanel.adjustProduction('${hour}', 1)">+</button>
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge ${devBadgeClass} px-2 py-1" style="font-size: 0.75rem;">
                        ${devPrefix}${deviation}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    /**
     * Ajuste de producción real (+/-)
     */
    adjustProduction(hour, delta) {
        if (!this.realProductionData) this.realProductionData = {};
        let current = this.realProductionData[hour] || 0;
        current = Math.max(0, current + delta);
        this.realProductionData[hour] = current;
        
        this.saveKdsDataToStorage();
        this.renderKdsTable();
        this.updateKdsSummary();
    },
    
    /**
     * Inserción directa de producción real
     */
    setProductionDirect(hour, value) {
        if (!this.realProductionData) this.realProductionData = {};
        let val = parseInt(value, 10);
        if (isNaN(val) || val < 0) val = 0;
        this.realProductionData[hour] = val;
        
        this.saveKdsDataToStorage();
        this.renderKdsTable();
        this.updateKdsSummary();
    },
    
    /**
     * Guardar en local storage
     */
    saveKdsDataToStorage() {
        if (!this.currentInsumo) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const storageKey = `kds_real_${todayStr}_${this.currentInsumo}`;
        localStorage.setItem(storageKey, JSON.stringify(this.realProductionData));
    },

    /**
     * Actualiza la barra de progreso y métricas generales del KDS
     */
    updateKdsSummary() {
        if (!this.projectionData) return;
        
        let totalProjected = 0;
        let totalReal = 0;
        
        this.projectionData.forEach(p => {
            totalProjected += p.projected;
            totalReal += (this.realProductionData[p.hour] || 0);
        });
        
        const deviation = totalReal - totalProjected;
        const devPrefix = deviation > 0 ? '+' : '';
        
        // Precisión comercial: 100 - (ABS(Desviación) / Proyectado) * 100
        let accuracy = 100;
        if (totalProjected > 0) {
            const devPct = (Math.abs(deviation) / totalProjected) * 100;
            accuracy = Math.max(0, Math.round(100 - devPct));
        } else if (totalReal > 0) {
            accuracy = 0;
        }
        
        const activeItemElem = document.getElementById('kds-active-item');
        if (activeItemElem) activeItemElem.textContent = `Insumo: ${this.currentInsumo}`;
        
        const projElem = document.getElementById('kds-total-projected');
        if (projElem) projElem.textContent = totalProjected;
        
        const realElem = document.getElementById('kds-total-real');
        if (realElem) realElem.textContent = totalReal;
        
        const devElem = document.getElementById('kds-total-deviation');
        if (devElem) {
            devElem.textContent = `${devPrefix}${deviation}`;
            if (deviation > 0) {
                devElem.className = 'fw-bold text-success';
            } else if (deviation < 0) {
                devElem.className = 'fw-bold text-danger';
            } else {
                devElem.className = 'fw-bold text-muted';
            }
        }
        
        // Precisión
        const effElem = document.getElementById('kds-efficiency-pct');
        if (effElem) effElem.textContent = `${accuracy}%`;
        
        const progressBar = document.getElementById('kds-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${accuracy}%`;
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
            if (accuracy >= 85) {
                progressBar.classList.add('bg-success');
                if (effElem) effElem.className = 'fw-bold text-success';
            } else if (accuracy >= 60) {
                progressBar.classList.add('bg-warning');
                if (effElem) effElem.className = 'fw-bold text-warning';
            } else {
                progressBar.classList.add('bg-danger');
                if (effElem) effElem.className = 'fw-bold text-danger';
            }
        }
    },
    
    /**
     * Limpiar los datos reales guardados
     */
    clearRealProduction() {
        if (confirm(`¿Estás seguro de que deseas limpiar el registro de producción real para ${this.currentInsumo}?`)) {
            if (this.projectionData) {
                this.projectionData.forEach(p => {
                    this.realProductionData[p.hour] = 0;
                });
            }
            this.saveKdsDataToStorage();
            this.renderKdsTable();
            this.updateKdsSummary();
            
            if (typeof app !== 'undefined') {
                app.showToast('Planilla de producción reiniciada', 'info');
            }
        }
    }
};

// Auto-inicializar cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    kitchenPanel.init();
});
