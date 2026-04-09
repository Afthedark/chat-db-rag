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
        showFormatHelp: false,
        contentLabel: 'Contenido',
        contentPlaceholder: 'Escribe aquí las instrucciones del sistema...',
        
        // --- DATA ---
        rules: [],
        
        // --- FORM OBJECT ---
        ruleForm: {
            id: null,
            key: '',
            category: 'INSTRUCCIONES',
            content: '',
            isActive: true
        },
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
            return this.rules.filter(r => r.category === this.categoryFilter);
        },

        openRuleModal() {
            this.isEditingRule = false;
            this.ruleForm = { id: null, key: '', category: 'INSTRUCCIONES', content: '', isActive: true };
            this.updateContentSettings();
            const m = new bootstrap.Modal(document.getElementById('ruleModal'));
            m.show();
        },

        editRule(rule) {
            this.isEditingRule = true;
            this.ruleForm = { ...rule };
            this.updateContentSettings();
            const m = new bootstrap.Modal(document.getElementById('ruleModal'));
            m.show();
        },

        onCategoryChange() {
            this.updateContentSettings();
        },

        updateContentSettings() {
            if (this.ruleForm.category === 'EJEMPLOS_SQL') {
                this.showFormatHelp = true;
                this.contentLabel = 'Ejemplos SQL (Pregunta + SQL)';
                this.contentPlaceholder = `Pregunta: ¿Cuántas ventas hubo hoy?
SQL: SELECT COUNT(*) FROM ventas WHERE DATE(fecha) = CURDATE();

---

Pregunta: Top 5 productos más vendidos
SQL: SELECT p.nombre, SUM(dv.cantidad) as total 
FROM productos p 
JOIN detalle_ventas dv ON p.id = dv.producto_id 
GROUP BY p.id 
ORDER BY total DESC 
LIMIT 5;`;
            } else {
                this.showFormatHelp = false;
                this.contentLabel = 'Instrucciones del Sistema';
                this.contentPlaceholder = `Eres un experto en MySQL y analista de datos...

REGLAS DE SEGURIDAD:
- Solo genera consultas SELECT
- Nunca uses INSERT, UPDATE, DELETE

FORMATO DE RESPUESTA:
- Responde solo con SQL`;
            }
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
                'INSTRUCCIONES': 'bg-info text-dark',
                'EJEMPLOS_SQL': 'bg-success'
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
