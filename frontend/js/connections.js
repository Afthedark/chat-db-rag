/**
 * Connection Management Module
 * Handles saved database connections with persistence
 */

const connections = {
    connectionsList: [],
    currentConnectionId: null,

    /**
     * Initialize connections module
     */
    init() {
        this.loadConnections();
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        console.log('Binding connection events...');
        
        // Save connection button
        const saveBtn = document.getElementById('btn-save-connection');
        if (saveBtn) {
            console.log('Save button found, adding listener');
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Save button clicked');
                this.saveConnection();
            });
        } else {
            console.error('Save button NOT found');
        }
        
        // Test connection button (sidebar - legacy)
        const testBtn = document.getElementById('btn-test-connection');
        if (testBtn) {
            console.log('Test button found, adding listener');
            testBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Test button clicked');
                this.testNewConnection();
            });
        }
        
        // Test connection button (modal)
        const testBtnModal = document.getElementById('btn-test-connection-modal');
        if (testBtnModal) {
            console.log('Test button (modal) found, adding listener');
            testBtnModal.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Test button (modal) clicked');
                this.testNewConnection();
            });
        }
    },

    /**
     * Load saved connections from API
     */
    async loadConnections() {
        try {
            const response = await api.connections.list();
            if (response.data.success) {
                this.connectionsList = response.data.connections;
                this.renderConnectionsList();
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
        }
    },

    /**
     * Render connections list in UI
     */
    renderConnectionsList() {
        const container = document.getElementById('saved-connections-list');
        const countBadge = document.getElementById('connections-count');
        
        // Update count badge
        if (countBadge) {
            countBadge.textContent = this.connectionsList.length;
        }
        
        if (!container) return;

        if (this.connectionsList.length === 0) {
            container.innerHTML = '<small class="text-muted d-block text-center py-3">No hay conexiones guardadas</small>';
            return;
        }

        container.innerHTML = this.connectionsList.map(conn => `
            <div class="connection-item ${this.currentConnectionId === conn.id ? 'active' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="overflow-hidden flex-grow-1">
                        <div class="connection-name">${conn.name}</div>
                        <div class="connection-details">${conn.database_name} @ ${conn.host}:${conn.port}</div>
                    </div>
                    <div class="btn-group btn-group-sm connection-actions">
                        <button class="btn btn-outline-primary" onclick="connections.connect(${conn.id})" title="Conectar">
                            <i class="fas fa-plug"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="connections.edit(${conn.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="connections.test(${conn.id})" title="Probar">
                            <i class="fas fa-vial"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="connections.delete(${conn.id})" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Show modal to create new connection
     */
    showNewConnectionModal() {
        // Clear form fields
        document.getElementById('conn-name').value = '';
        document.getElementById('db-host').value = 'localhost';
        document.getElementById('db-port').value = '3306';
        document.getElementById('db-user').value = '';
        document.getElementById('db-password').value = '';
        document.getElementById('db-name').value = '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('newConnectionModal'));
        modal.show();
    },

    /**
     * Get connection data from form
     */
    getFormData() {
        return {
            name: document.getElementById('conn-name').value.trim(),
            host: document.getElementById('db-host').value.trim() || 'localhost',
            port: parseInt(document.getElementById('db-port').value) || 3306,
            username: document.getElementById('db-user').value.trim(),
            password: document.getElementById('db-password').value,
            database_name: document.getElementById('db-name').value.trim()
        };
    },

    /**
     * Validate form data
     */
    validateForm(data) {
        if (!data.name) {
            app.showToast('Connection name is required', 'warning');
            return false;
        }
        if (!data.username) {
            app.showToast('Username is required', 'warning');
            return false;
        }
        if (!data.database_name) {
            app.showToast('Database name is required', 'warning');
            return false;
        }
        return true;
    },

    /**
     * Test a new connection before saving
     */
    async testNewConnection() {
        const data = this.getFormData();
        
        if (!this.validateForm(data)) {
            return;
        }

        app.showLoading('Testing connection...');

        try {
            // Use the database endpoint to test connection
            const response = await api.database.test({
                host: data.host,
                port: data.port,
                user: data.username,
                password: data.password,
                database: data.database_name
            });

            if (response.data.success) {
                app.showToast('Connection test successful! You can now save it.', 'success');
            } else {
                app.showToast(response.data.error || 'Connection test failed', 'error');
            }
        } catch (error) {
            console.error('Test connection error:', error);
            app.showToast('Connection test failed: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Save a new connection from form data
     */
    async saveConnection() {
        const data = this.getFormData();

        // Validate
        if (!this.validateForm(data)) {
            return;
        }

        app.showLoading('Saving connection...');

        try {
            const response = await api.connections.create(data);

            if (response.data.success) {
                app.showToast('Conexión guardada exitosamente', 'success');
                // Clear form fields
                document.getElementById('conn-name').value = '';
                document.getElementById('db-host').value = 'localhost';
                document.getElementById('db-port').value = '3306';
                document.getElementById('db-user').value = '';
                document.getElementById('db-password').value = '';
                document.getElementById('db-name').value = '';
                // Reload connections list
                await this.loadConnections();
            } else {
                app.showToast(response.data.error || 'Error al guardar la conexión', 'error');
            }
        } catch (error) {
            console.error('Save connection error:', error);
            app.showToast('Error al guardar la conexión', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Connect to a saved connection
     */
    async connect(id) {
        console.log('Connecting to database ID:', id);
        app.showLoading('Connecting to database...');

        try {
            const response = await api.connections.connect(id);
            console.log('Connection response:', response.data);
            
            if (response.data.success) {
                this.currentConnectionId = id;
                console.log('Connection successful, currentConnectionId set to:', id);
                
                this.renderConnectionsList(); // Update UI to show active connection
                app.showToast(`Connected to ${response.data.connection.name}`, 'success');
                
                // Update database module connection state
                if (typeof database !== 'undefined') {
                    database.isConnected = true;
                    database.connectionInfo = {
                        host: response.data.connection.host,
                        port: response.data.connection.port,
                        user: response.data.connection.username,
                        database: response.data.connection.database_name
                    };
                    console.log('Database module updated, isConnected:', database.isConnected);
                }
                
                // NOTE: Chat input is NOT enabled here anymore
                // Chat will be enabled only when a chat is selected/created
                console.log('Connection established, chat remains disabled until a chat is selected');
                
                // Refresh chats for this connection
                if (typeof chats !== 'undefined') {
                    chats.loadChats();
                }
            } else {
                console.error('Connection failed:', response.data.error);
                app.showToast(response.data.error || 'Conexión fallida', 'error');
            }
        } catch (error) {
            console.error('Connect error:', error);
            app.showToast('Error al conectar', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Test a saved connection
     */
    async test(id) {
        app.showLoading('Testing connection...');

        try {
            const response = await api.connections.test(id);
            if (response.data.success) {
                app.showToast('Connection test successful', 'success');
            } else {
                app.showToast(response.data.error || 'Connection test failed', 'error');
            }
        } catch (error) {
            console.error('Test error:', error);
            app.showToast('Connection test failed', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Delete a saved connection
     */
    async delete(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta conexión?')) {
            return;
        }

        try {
            const response = await api.connections.delete(id);
            if (response.data.success) {
                app.showToast('Conexión eliminada', 'success');
                // Remove from list if current
                if (this.currentConnectionId === id) {
                    this.currentConnectionId = null;
                }
                await this.loadConnections();
            } else {
                app.showToast(response.data.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            app.showToast('Error al eliminar la conexión', 'error');
        }
    },

    /**
     * Get current connection ID
     */
    getCurrentId() {
        return this.currentConnectionId;
    },

    /**
     * Get connection by ID
     */
    getById(id) {
        return this.connectionsList.find(c => c.id === id);
    },

    /**
     * Open edit modal with connection data
     */
    edit(id) {
        const conn = this.getById(id);
        if (!conn) {
            app.showToast('Conexión no encontrada', 'error');
            return;
        }

        // Populate form fields
        document.getElementById('edit-conn-id').value = conn.id;
        document.getElementById('edit-conn-name').value = conn.name;
        document.getElementById('edit-db-host').value = conn.host;
        document.getElementById('edit-db-port').value = conn.port;
        document.getElementById('edit-db-user').value = conn.username;
        document.getElementById('edit-db-password').value = ''; // Don't show existing password
        document.getElementById('edit-db-name').value = conn.database_name;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editConnectionModal'));
        modal.show();
    },

    /**
     * Get edit form data
     */
    getEditFormData() {
        return {
            id: parseInt(document.getElementById('edit-conn-id').value),
            name: document.getElementById('edit-conn-name').value.trim(),
            host: document.getElementById('edit-db-host').value.trim() || 'localhost',
            port: parseInt(document.getElementById('edit-db-port').value) || 3306,
            username: document.getElementById('edit-db-user').value.trim(),
            password: document.getElementById('edit-db-password').value,
            database_name: document.getElementById('edit-db-name').value.trim()
        };
    },

    /**
     * Test connection from edit form
     */
    async testEditConnection() {
        const data = this.getEditFormData();
        
        if (!this.validateForm(data)) {
            return;
        }

        app.showLoading('Probando conexión...');

        try {
            // Test with temporary credentials
            const response = await api.database.test({
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                database: data.database_name
            });

            if (response.data.success) {
                app.showToast('Conexión exitosa', 'success');
            } else {
                app.showToast(response.data.error || 'Conexión fallida', 'error');
            }
        } catch (error) {
            console.error('Test connection error:', error);
            app.showToast('Error al probar la conexión', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Save edited connection
     */
    async saveEditConnection() {
        const data = this.getEditFormData();
        
        if (!this.validateForm(data)) {
            return;
        }

        app.showLoading('Guardando cambios...');

        try {
            // Build update payload (only include password if provided)
            const payload = {
                name: data.name,
                host: data.host,
                port: data.port,
                username: data.username,
                database_name: data.database_name
            };
            
            // Only send password if user entered a new one
            if (data.password) {
                payload.password = data.password;
            }

            const response = await api.connections.update(data.id, payload);

            if (response.data.success) {
                app.showToast('Conexión actualizada', 'success');
                
                // Close modal
                const modalEl = document.getElementById('editConnectionModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) {
                    modal.hide();
                }
                
                // Reload connections list
                await this.loadConnections();
            } else {
                app.showToast(response.data.error || 'Error al actualizar la conexión', 'error');
            }
        } catch (error) {
            console.error('Update connection error:', error);
            app.showToast('Error al actualizar la conexión', 'error');
        } finally {
            app.hideLoading();
        }
    }
};
