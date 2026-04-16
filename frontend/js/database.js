/**
 * Database Connection Handler
 * Manages database connection UI and state
 */

const database = {
    isConnected: false,
    connectionInfo: null,

    /**
     * Initialize database module
     */
    init() {
        this.bindEvents();
        this.loadOllamaModels();
        this.checkConnectionStatus();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Connect button (legacy, may not exist in new UI)
        const btnConnect = document.getElementById('btn-connect');
        if (btnConnect) {
            btnConnect.addEventListener('click', () => this.connect());
        }

        // Clear chat button (legacy, may not exist in new UI)
        const btnClear = document.getElementById('btn-clear-chat');
        if (btnClear) {
            btnClear.addEventListener('click', () => chat.clearHistory());
        }

        // Provider selection
        const providerSelect = document.getElementById('llm-provider');
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.handleProviderChange(e.target.value);
            });
        }
    },

    /**
     * Handle LLM provider change
     * @param {string} provider - Selected provider
     */
    handleProviderChange(provider) {
        const ollamaContainer = document.getElementById('ollama-models-container');
        const geminiContainer = document.getElementById('gemini-key-container');
        const providerBadge = document.getElementById('provider-badge');

        if (provider === 'ollama') {
            ollamaContainer.classList.remove('d-none');
            geminiContainer.classList.add('d-none');
            providerBadge.textContent = 'Ollama';
            providerBadge.className = 'badge bg-info ms-2';
        } else {
            ollamaContainer.classList.add('d-none');
            geminiContainer.classList.remove('d-none');
            // Update badge with selected Gemini model name
            const geminiModelEl = document.getElementById('sidebar-gemini-model');
            const modelLabel = geminiModelEl ? geminiModelEl.value : 'Gemini';
            providerBadge.textContent = modelLabel;
            providerBadge.className = 'badge bg-warning text-dark ms-2';

            // Keep badge in sync when Gemini model changes
            if (geminiModelEl && !geminiModelEl.dataset.listenerAdded) {
                geminiModelEl.addEventListener('change', (e) => {
                    if (document.getElementById('llm-provider').value === 'gemini') {
                        providerBadge.textContent = e.target.value;
                    }
                });
                geminiModelEl.dataset.listenerAdded = 'true';
            }
        }
    },

    /**
     * Load available Ollama models
     */
    async loadOllamaModels() {
        try {
            const response = await api.models.getOllamaModels();
            if (response.data.success) {
                const select = document.getElementById('ollama-model');
                select.innerHTML = '';
                
                response.data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load Ollama models:', error);
            // Set default options with all local models if API fails
            const select = document.getElementById('ollama-model');
            const models = [
                'llama3.2:3b',
                'phi4-mini-reasoning:3.8b',
                'gemini-3-flash-preview:cloud',
                'glm-5:cloud',
                'minimax-m2-7:cloud',
                'deepseek-r1:14b',
                'qwen3.5:9b',
                'llama3.1:8b',
                'gemma4:e4b'
            ];
            select.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
        }
    },

    /**
     * Check current connection status
     */
    async checkConnectionStatus() {
        try {
            const response = await api.database.getStatus();
            if (response.data.success && response.data.connected) {
                this.isConnected = true;
                this.connectionInfo = response.data.info;
                this.updateConnectionUI(true);
                // MEJORA 1 FIX: defer enableInput so chat module finishes initializing first
                setTimeout(() => {
                    if (typeof chat !== 'undefined') chat.enableInput();
                }, 0);
            }
        } catch (error) {
            console.log('No active database connection');
        }
    },

    /**
     * Connect to database
     */
    async connect() {
        const host = document.getElementById('db-host').value || 'localhost';
        const port = document.getElementById('db-port').value || '3306';
        const user = document.getElementById('db-user').value;
        const password = document.getElementById('db-password').value;
        const dbName = document.getElementById('db-name').value;

        // Validate inputs
        if (!user || !password || !dbName) {
            app.showToast('Please fill in all database fields', 'warning');
            return;
        }

        app.showLoading('Connecting to database...');

        try {
            const response = await api.database.connect({
                host,
                port,
                user,
                password,
                database: dbName
            });

            if (response.data.success) {
                this.isConnected = true;
                this.connectionInfo = {
                    host,
                    port,
                    user,
                    database: dbName
                };
                this.updateConnectionUI(true);
                chat.enableInput();
                app.showToast('Connected to database successfully', 'success');
                
                // Load chat history after connection
                chat.loadHistory();
            } else {
                app.showToast(response.data.error || 'Connection failed', 'error');
            }
        } catch (error) {
            console.error('Connection error:', error);
            const errorMsg = error.response?.data?.error || 'Failed to connect to database';
            app.showToast(errorMsg, 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Disconnect from database
     */
    async disconnect() {
        try {
            await api.database.disconnect();
            this.isConnected = false;
            this.connectionInfo = null;
            this.updateConnectionUI(false);
            chat.disableInput();
            app.showToast('Disconnected from database', 'info');
        } catch (error) {
            console.error('Disconnect error:', error);
            app.showToast('Error disconnecting from database', 'error');
        }
    },

    /**
     * Update connection UI
     * @param {boolean} connected - Whether connected
     */
    updateConnectionUI(connected) {
        const form = document.getElementById('connection-form');
        const status = document.getElementById('connection-status');
        const connectedDb = document.getElementById('connected-db');
        const connectBtn = document.getElementById('btn-connect');

        // Legacy UI elements may not exist in new UI
        if (!form || !status || !connectedDb || !connectBtn) {
            return;
        }

        if (connected) {
            form.classList.add('d-none');
            status.classList.remove('d-none');
            connectedDb.textContent = `${this.connectionInfo.database} @ ${this.connectionInfo.host}:${this.connectionInfo.port}`;
            
            // Change connect button to disconnect
            connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
            connectBtn.classList.remove('btn-primary');
            connectBtn.classList.add('btn-danger');
            connectBtn.onclick = () => this.disconnect();
        } else {
            form.classList.remove('d-none');
            status.classList.add('d-none');
            
            // Reset connect button
            connectBtn.innerHTML = '<i class="fas fa-link"></i> Connect';
            connectBtn.classList.remove('btn-danger');
            connectBtn.classList.add('btn-primary');
            connectBtn.onclick = () => this.connect();
        }
    },

    /**
     * Get current database schema
     */
    async getSchema() {
        if (!this.isConnected) {
            app.showToast('Not connected to database', 'warning');
            return null;
        }

        try {
            const response = await api.database.getSchema();
            if (response.data.success) {
                return response.data.schema;
            }
        } catch (error) {
            console.error('Failed to get schema:', error);
            app.showToast('Failed to get database schema', 'error');
        }
        return null;
    },

    /**
     * Execute SQL query
     * @param {string} sql - SQL query
     */
    async executeQuery(sql) {
        if (!this.isConnected) {
            app.showToast('Not connected to database', 'warning');
            return null;
        }

        try {
            const response = await api.database.executeQuery(sql);
            if (response.data.success) {
                return response.data.results;
            }
        } catch (error) {
            console.error('Query execution error:', error);
            app.showToast('Failed to execute query', 'error');
        }
        return null;
    }
};
