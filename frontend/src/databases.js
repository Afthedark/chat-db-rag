/** 
 * Modular Databases Admin Controller for MPA 
 * Using Alpine.js 
 */

window.databasesApp = function() {
    return {
        // --- UI STATE ---
        isSidebarOpen: false,
        isLoading: false,
        isEditingDb: false,
        connectionTests: {}, // { id: 'testing' | 'success' | 'error' }
        
        // --- DATA ---
        databases: [],
        
        // --- FORM OBJECT ---
        dbForm: {
            id: null,
            name: '',
            host: '',
            port: 3306,
            user: '',
            password: '',
            database: '',
            description: '',
            isActive: true
        },

        async init() {
            console.log('📦 DB Connections Manager Initialized');
            await this.loadDatabases();
        },

        async loadDatabases() {
            this.isLoading = true;
            try {
                const res = await axios.get('/api/databases');
                if (res.data.success) {
                    this.databases = res.data.data;
                }
            } catch (error) {
                this.showToast('No se pudieron recuperar las conexiones de BD', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        openDbModal() {
            this.isEditingDb = false;
            this.dbForm = { id: null, name: '', host: '', port: 3306, user: '', password: '', database: '', description: '', isActive: true };
            const m = new bootstrap.Modal(document.getElementById('dbModal'));
            m.show();
        },

        editDatabase(db) {
            this.isEditingDb = true;
            // Clear password for security during edit
            this.dbForm = { ...db, password: '' };
            const m = new bootstrap.Modal(document.getElementById('dbModal'));
            m.show();
        },

        async saveDatabase() {
            try {
                const method = this.isEditingDb ? 'put' : 'post';
                const url = this.isEditingDb ? `/api/databases/${this.dbForm.id}` : '/api/databases';
                
                const res = await axios[method](url, this.dbForm);
                if (res.data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('dbModal')).hide();
                    await this.loadDatabases();
                    this.showToast(this.isEditingDb ? 'Parámetros actualizados' : 'Nueva conexión vinculada', 'success');
                }
            } catch (error) {
                const msg = error.response?.data?.error || 'Error en la conexión SQL';
                this.showToast(msg, 'error');
            }
        },

        async toggleDatabase(db) {
            try {
                const updated = { ...db, isActive: !db.isActive };
                const res = await axios.put(`/api/databases/${db.id}`, updated);
                if (res.data.success) {
                    await this.loadDatabases();
                    this.showToast('Actualizado', 'success');
                }
            } catch (error) {
                this.showToast('Error al alternar estado', 'error');
            }
        },

        async deleteDatabase(id) {
            const confirmed = await Swal.fire({
                title: '¿Confirmas eliminación?',
                text: "Debes estar seguro, esto desvinculará la BD de la IA.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, desvincular ahora',
                background: '#161b22',
                color: '#fff'
            });

            if (!confirmed.isConfirmed) return;

            try {
                const res = await axios.delete(`/api/databases/${id}`);
                if (res.data.success) {
                    await this.loadDatabases();
                    this.showToast('Base de Datos desvinculada', 'success');
                }
            } catch (error) {
                this.showToast('Error al borrar conexión', 'error');
            }
        },

        async testConnection(id) {
            this.connectionTests[id] = 'testing';
            try {
                const res = await axios.post(`/api/databases/${id}/test`);
                if (res.data.success) {
                    this.connectionTests[id] = 'success';
                    this.showToast(res.data.message || `Conexión exitosa a ${res.data.database}`, 'success');
                } else {
                    this.connectionTests[id] = 'error';
                    this.showToast('Falla en el handshake SQL', 'error');
                }
            } catch (error) {
                const msg = error.response?.data?.message || error.response?.data?.error || 'Imposible conectar al host';
                this.connectionTests[id] = 'error';
                this.showToast(msg, 'error');
            }
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
