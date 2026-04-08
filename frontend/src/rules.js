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
            category: 'PROMPT_SISTEMA',
            content: '',
            isActive: true
        },

        async init() {
            console.log('🛡️ Rules Admin Panel Initialized');
            await this.loadRules();
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
            this.ruleForm = { id: null, key: '', category: 'PROMPT_SISTEMA', content: '', isActive: true };
            const m = new bootstrap.Modal(document.getElementById('ruleModal'));
            m.show();
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
                background: '#161b22',
                color: '#fff'
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
                background: '#161b22',
                color: '#fff'
            });
        }
    }
}
