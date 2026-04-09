/** 
 * Modular Rules Admin Controller for MPA 
 * Using Alpine.js 
 */

window.rulesApp = function() {
    return {
        // --- UI STATE ---
        isSidebarOpen: false,
        isLoading: false,
        categoryFilter: '',
        isEditingRule: false,
        
        // --- DATA ---
        rules: [],
        
        // --- FORM OBJECT ---
        ruleForm: {
            id: null,
            key: '',
            category: 'ESTRUCTURA_DB',
            content: '',
            isActive: true
        },
        
        // --- SIMPLE CATEGORY (2 options) ---
        simpleCategoryType: 'ESQUEMA', // 'ESQUEMA' or 'INSTRUCCIONES'
        
        theme: 'dark',

        async init() {
            this.initTheme();
            console.log('🛡️ Rules Admin Panel Initialized');
            await this.loadRules();
        },

        initTheme() {
            this.theme = localStorage.getItem('app-theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            document.documentElement.setAttribute('data-bs-theme', this.theme);
        },

        async loadRules() {
            this.isLoading = true;
            try {
                const res = await axios.get('/api/rules');
                if (res.data.success) {
                    this.rules = res.data.data;
                }
            } catch (error) {
                this.showToast('Error cargando las reglas de la IA', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        filteredRules() {
            if (!this.categoryFilter) return this.rules;
            // Mapeo de filtros simples a categorías del backend
            if (this.categoryFilter === 'ESQUEMA') {
                return this.rules.filter(r => r.category === 'ESTRUCTURA_DB');
            }
            if (this.categoryFilter === 'INSTRUCCIONES') {
                return this.rules.filter(r => ['PROMPT_SISTEMA', 'EJEMPLO_SQL', 'PROMPT_NEGOCIO'].includes(r.category));
            }
            return this.rules.filter(r => r.category === this.categoryFilter);
        },

        openRuleModal() {
            this.isEditingRule = false;
            this.simpleCategoryType = 'ESQUEMA';
            this.ruleForm = { id: null, key: '', category: 'ESTRUCTURA_DB', content: '', isActive: true };
            const m = new bootstrap.Modal(document.getElementById('ruleModal'));
            m.show();
        },

        updateCategoryFromSimpleType() {
            // Mapea el tipo simple a la categoría del backend
            if (this.simpleCategoryType === 'ESQUEMA') {
                this.ruleForm.category = 'ESTRUCTURA_DB';
            } else {
                this.ruleForm.category = 'PROMPT_SISTEMA';
            }
        },

        getSimpleCategoryLabel(backendCategory) {
            // Mapea categorías del backend a etiqueta simple
            if (backendCategory === 'ESTRUCTURA_DB') return 'Esquema';
            if (['PROMPT_SISTEMA', 'EJEMPLO_SQL', 'PROMPT_NEGOCIO'].includes(backendCategory)) {
                return 'Instrucciones';
            }
            return backendCategory;
        },

        getSimpleCategoryBadgeClass(backendCategory) {
            // Mapea a clases de badge simplificadas
            if (backendCategory === 'ESTRUCTURA_DB') {
                return 'badge rounded-pill shadow-sm bg-primary';
            }
            if (['PROMPT_SISTEMA', 'EJEMPLO_SQL', 'PROMPT_NEGOCIO'].includes(backendCategory)) {
                return 'badge rounded-pill shadow-sm bg-success';
            }
            return 'badge rounded-pill shadow-sm bg-secondary';
        },

        getContentLabel() {
            // Label dinámico según tipo seleccionado
            if (this.isEditingRule) {
                return this.getSimpleCategoryLabel(this.ruleForm.category) === 'Esquema' 
                    ? 'DDL / Esquema SQL' 
                    : 'Instrucciones / Prompts / Ejemplos';
            }
            return this.simpleCategoryType === 'ESQUEMA' 
                ? 'DDL / Esquema SQL' 
                : 'Instrucciones / Prompts / Ejemplos';
        },

        getContentPlaceholder() {
            // Placeholder dinámico según tipo seleccionado
            if (this.isEditingRule) {
                return this.getSimpleCategoryLabel(this.ruleForm.category) === 'Esquema'
                    ? `-- Define aquí las tablas, columnas y relaciones
CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE
);`
                    : `-- Prompt del sistema, ejemplos few-shot o instrucciones de formato
Eres un analista de ventas. Cuando pregunten por totales, siempre incluye el período de tiempo.

Ejemplo:
Pregunta: ¿Cuántas ventas hubo hoy?
SQL: SELECT COUNT(*) FROM ventas WHERE DATE(fecha) = CURDATE();`;
            }
            return this.simpleCategoryType === 'ESQUEMA'
                ? `-- Define aquí las tablas, columnas y relaciones
CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE
);`
                : `-- Prompt del sistema, ejemplos few-shot o instrucciones de formato
Eres un analista de ventas. Cuando pregunten por totales, siempre incluye el período de tiempo.

Ejemplo:
Pregunta: ¿Cuántas ventas hubo hoy?
SQL: SELECT COUNT(*) FROM ventas WHERE DATE(fecha) = CURDATE();`;
        },

        editRule(rule) {
            this.isEditingRule = true;
            this.ruleForm = { ...rule };
            const m = new bootstrap.Modal(document.getElementById('ruleModal'));
            m.show();
        },

        async saveRule() {
            try {
                const method = this.isEditingRule ? 'put' : 'post';
                const url = this.isEditingRule ? `/api/rules/${this.ruleForm.id}` : '/api/rules';
                
                const res = await axios[method](url, this.ruleForm);
                if (res.data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('ruleModal')).hide();
                    await this.loadRules();
                    this.showToast(this.isEditingRule ? 'Regla actualizada' : 'Regla creada con éxito', 'success');
                }
            } catch (error) {
                const msg = error.response?.data?.error || error.response?.data?.message || 'No se pudo guardar la regla';
                this.showToast(msg, 'error');
            }
        },

        async toggleRule(rule) {
            try {
                // Pre-update with current inverse state
                const res = await axios.put(`/api/rules/${rule.id}`, {
                    ...rule,
                    isActive: !rule.isActive
                });
                
                if (res.data.success) {
                    await this.loadRules();
                    this.showToast('Estado de regla actualizado', 'success');
                }
            } catch (error) {
                const msg = error.response?.data?.error || 'Error al cambiar estado';
                this.showToast(msg, 'error');
            }
        },

        async deleteRule(id) {
            const confirmed = await Swal.fire({
                title: '¿Eliminar Regla?',
                text: "Esta acción es irreversible y afectará la generación de la IA.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, borrar definitivamente',
                background: this.theme === 'dark' ? '#161b22' : '#ffffff',
                color: this.theme === 'dark' ? '#fff' : '#1e293b'
            });

            if (!confirmed.isConfirmed) return;

            try {
                const res = await axios.delete(`/api/rules/${id}`);
                if (res.data.success) {
                    await this.loadRules();
                    this.showToast('Regla eliminada correctamente', 'success');
                }
            } catch (error) {
                this.showToast('No se pudo borrar la regla', 'error');
            }
        },

        getCategoryBadgeClass(cat) {
            const maps = {
                'PROMPT_SISTEMA': 'bg-info text-dark',
                'ESTRUCTURA_DB': 'bg-warning text-dark',
                'EJEMPLO_SQL': 'bg-success',
                'PROMPT_NEGOCIO': 'bg-danger'
            };
            return maps[cat] || 'bg-secondary';
        },

        showToast(message, icon = 'info') {
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: icon,
                title: message,
                background: this.theme === 'dark' ? '#161b22' : '#ffffff',
                color: this.theme === 'dark' ? '#fff' : '#1e293b'
            });
        }
    }
}
