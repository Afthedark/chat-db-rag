function trainingApp() {
    return {
        // UI State
        isSidebarOpen: false,
        isDark: true,
        isGenerating: false,
        isTesting: false,
        isSaving: false,
        isLoading: false,

        // Data
        databases: [],
        selectedDb: '',
        selectedDbSchemaGroup: '',
        description: '',
        sqlQuery: '',
        examples: [],

        // Test Results
        testResults: null,
        testRowCount: 0,
        testFields: [],

        // Editing
        editingId: null,

        async init() {
            this.isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
            await this.loadDatabases();
            await this.loadExamples();
        },

        toggleTheme() {
            this.isDark = !this.isDark;
            const theme = this.isDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', theme);
            localStorage.setItem('theme', theme);
        },

        async loadDatabases() {
            try {
                const response = await fetch('/api/databases');
                const data = await response.json();
                if (data.success) {
                    this.databases = data.data.filter(db => db.isActive);
                }
            } catch (error) {
                console.error('Error cargando bases de datos:', error);
                this.showToast('Error cargando bases de datos', 'error');
            }
        },

        onDatabaseChange() {
            // NUEVO: Obtener schemaGroup de la BD seleccionada
            const selectedDb = this.databases.find(db => db.id == this.selectedDb);
            this.selectedDbSchemaGroup = selectedDb?.schemaGroup || 'default';
            this.loadExamples();
            this.clearForm();
        },

        clearForm() {
            this.description = '';
            this.sqlQuery = '';
            this.testResults = null;
            this.testRowCount = 0;
            this.testFields = [];
            this.editingId = null;
        },

        async generateSQL() {
            if (!this.selectedDb || !this.description) {
                this.showToast('Selecciona una base de datos y escribe una descripción', 'warning');
                return;
            }

            this.isGenerating = true;
            try {
                const response = await fetch('/api/query-memory/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        description: this.description,
                        databaseId: parseInt(this.selectedDb)
                    })
                });

                const data = await response.json();
                if (data.success) {
                    this.sqlQuery = data.sql;
                    this.showToast('SQL generado correctamente', 'success');
                } else {
                    throw new Error(data.message || 'Error generando SQL');
                }
            } catch (error) {
                console.error('Error generando SQL:', error);
                this.showToast('Error: ' + error.message, 'error');
            } finally {
                this.isGenerating = false;
            }
        },

        async testSQL() {
            if (!this.selectedDb || !this.sqlQuery) {
                this.showToast('Selecciona una base de datos y escribe un SQL', 'warning');
                return;
            }

            this.isTesting = true;
            try {
                const response = await fetch('/api/query-memory/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sqlQuery: this.sqlQuery,
                        databaseId: parseInt(this.selectedDb)
                    })
                });

                const data = await response.json();
                if (data.success) {
                    this.testResults = data.previewRows;
                    this.testRowCount = data.rowCount;
                    this.testFields = data.fields;
                    this.showToast(`SQL ejecutado: ${data.rowCount} filas`, 'success');
                } else {
                    throw new Error(data.message || 'Error ejecutando SQL');
                }
            } catch (error) {
                console.error('Error probando SQL:', error);
                this.showToast('Error: ' + error.message, 'error');
                this.testResults = null;
            } finally {
                this.isTesting = false;
            }
        },

        async saveExample() {
            if (!this.selectedDb || !this.description || !this.sqlQuery) {
                this.showToast('Completa todos los campos', 'warning');
                return;
            }

            this.isSaving = true;
            try {
                const response = await fetch('/api/query-memory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        questionText: this.description,
                        sqlQuery: this.sqlQuery,
                        databaseId: parseInt(this.selectedDb),
                        testFirst: true
                    })
                });

                const data = await response.json();
                if (data.success) {
                    this.showToast(data.message, 'success');
                    this.clearForm();
                    await this.loadExamples();
                } else {
                    throw new Error(data.message || 'Error guardando ejemplo');
                }
            } catch (error) {
                console.error('Error guardando ejemplo:', error);
                this.showToast('Error: ' + error.message, 'error');
            } finally {
                this.isSaving = false;
            }
        },

        async loadExamples() {
            if (!this.selectedDb) {
                this.examples = [];
                return;
            }

            this.isLoading = true;
            try {
                const response = await fetch(`/api/query-memory?databaseId=${this.selectedDb}&limit=50`);
                const data = await response.json();
                if (data.success) {
                    this.examples = data.data;
                }
            } catch (error) {
                console.error('Error cargando ejemplos:', error);
                this.showToast('Error cargando ejemplos', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        loadExample(example) {
            this.description = example.questionText;
            this.sqlQuery = example.sqlQuery;
            this.editingId = example.id;
            this.testResults = null;
            this.showToast('Ejemplo cargado para edición', 'info');
        },

        async deleteExample(id) {
            const result = await Swal.fire({
                title: '¿Eliminar ejemplo?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                background: this.isDark ? '#1a1d21' : '#fff',
                color: this.isDark ? '#fff' : '#000'
            });

            if (!result.isConfirmed) return;

            try {
                const response = await fetch(`/api/query-memory/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                if (data.success) {
                    this.showToast('Ejemplo eliminado', 'success');
                    await this.loadExamples();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error eliminando ejemplo:', error);
                this.showToast('Error: ' + error.message, 'error');
            }
        },

        showToast(message, type = 'info') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: this.isDark ? '#1a1d21' : '#fff',
                color: this.isDark ? '#fff' : '#000'
            });

            const icons = {
                success: 'success',
                error: 'error',
                warning: 'warning',
                info: 'info'
            };

            Toast.fire({
                icon: icons[type] || 'info',
                title: message
            });
        }
    };
}
