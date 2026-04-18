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
        
        // Test connection button
        const testBtn = document.getElementById('btn-test-connection');
        if (testBtn) {
            console.log('Test button found, adding listener');
            testBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Test button clicked');
                this.testNewConnection();
            });
        } else {
            console.error('Test button NOT found');
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
        if (!container) return;

        if (this.connectionsList.length === 0) {
            container.innerHTML = '<small class="text-muted">No saved connections</small>';
            return;
        }

        container.innerHTML = this.connectionsList.map(conn => `
            <div class="connection-item mb-2 p-2 border rounded ${this.currentConnectionId === conn.id ? 'border-primary bg-light' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${conn.name}</strong>
                        <small class="d-block text-muted">${conn.database_name} @ ${conn.host}:${conn.port}</small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="connections.connect(${conn.id})" title="Connect">
                            <i class="fas fa-plug"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="connections.test(${conn.id})" title="Test">
                            <i class="fas fa-vial"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="connections.delete(${conn.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
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
    }
};
