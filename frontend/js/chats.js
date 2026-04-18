/**
 * Chat Management Module
 * Handles chat sessions with persistence
 */

const chats = {
    chatsList: [],
    currentChatId: null,

    /**
     * Initialize chats module
     */
    init() {
        this.loadChats();
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // BUG 4 FIX: The 'New Chat' button has data-bs-toggle in HTML which already opens the modal.
        // We intercept the click to run our validation logic (MEJORA 2) and populate the select,
        // preventing the modal from opening when there are no connections available.
        const newChatBtn = document.getElementById('btn-new-chat');
        if (newChatBtn) {
            // Remove Bootstrap's default toggle by overriding with our handler
            newChatBtn.removeAttribute('data-bs-toggle');
            newChatBtn.removeAttribute('data-bs-target');
            newChatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNewChatModal();
            });
        }
    },

    /**
     * Load chats from API
     */
    async loadChats() {
        try {
            const response = await api.chats.list();
            if (response.data.success) {
                this.chatsList = response.data.chats;
                this.renderChatsList();
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    },

    /**
     * Render chats list in sidebar
     */
    renderChatsList() {
        const container = document.getElementById('chats-list');
        const countBadge = document.getElementById('chats-count');
        
        // Update count badge
        if (countBadge) {
            countBadge.textContent = this.chatsList.length;
        }
        
        if (!container) return;

        if (this.chatsList.length === 0) {
            container.innerHTML = '<small class="text-muted d-block text-center py-3">No hay chats. ¡Crea uno para comenzar!</small>';
            return;
        }

        container.innerHTML = this.chatsList.map(chat => `
            <div class="chat-item ${this.currentChatId === chat.id ? 'active' : ''}"
                 onclick="chats.selectChat(${chat.id})"
                 title="${chat.title}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="overflow-hidden flex-grow-1">
                        <div class="chat-title">${chat.title}</div>
                        <div class="chat-db">${chat.database_name || 'Sin base de datos'}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-delete" onclick="event.stopPropagation(); chats.delete(${chat.id})" title="Eliminar chat">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Show modal to create new chat
     */
    showNewChatModal() {
        // MEJORA 2 FIX: Guard here and stop if no connections, so modal never opens empty
        if (typeof connections === 'undefined' || connections.connectionsList.length === 0) {
            app.showToast('Por favor guarda una conexión a base de datos primero', 'warning');
            return;
        }

        // Populate connection select
        const select = document.getElementById('new-chat-connection');
        if (select) {
            select.innerHTML = connections.connectionsList.map(c =>
                `<option value="${c.id}">${c.name} (${c.database_name})</option>`
            ).join('');
        }

        // BUG 4 FIX: Only one instance is created here, not triggered by data-bs-toggle too
        const modal = new bootstrap.Modal(document.getElementById('newChatModal'));
        modal.show();

        // Load real Ollama models and setup provider switch listener
        this._setupModalProviderListener();
        this._loadModalOllamaModels();
    },

    /**
     * Setup the provider change listener inside the modal
     */
    _setupModalProviderListener() {
        const providerSelect = document.getElementById('new-chat-provider');
        if (!providerSelect) return;
        
        // Reset to Ollama as default
        providerSelect.value = 'ollama';
        
        // Remove existing listeners by cloning
        const fresh = providerSelect.cloneNode(true);
        providerSelect.parentNode.replaceChild(fresh, providerSelect);
        
        // Add change listener
        fresh.addEventListener('change', (e) => this._handleModalProviderChange(e.target.value));
        
        // Fire immediately to show correct panel
        this._handleModalProviderChange(fresh.value);
    },

    /**
     * Toggle provider panels inside the modal
     * @param {string} provider - 'ollama' | 'gemini' | 'openrouter'
     */
    _handleModalProviderChange(provider) {
        console.log('[Chats] Provider changed to:', provider);
        
        const ollamaPanel = document.getElementById('new-chat-ollama-container');
        const geminiPanel = document.getElementById('new-chat-gemini-container');
        const openrouterPanel = document.getElementById('new-chat-openrouter-container');
        
        console.log('[Chats] Panels found:', { ollama: !!ollamaPanel, gemini: !!geminiPanel, openrouter: !!openrouterPanel });
        
        if (!ollamaPanel || !geminiPanel || !openrouterPanel) {
            console.error('[Chats] Some panels not found in DOM');
            return;
        }

        // Hide all panels first
        ollamaPanel.classList.add('d-none');
        geminiPanel.classList.add('d-none');
        openrouterPanel.classList.add('d-none');

        if (provider === 'gemini') {
            console.log('[Chats] Showing Gemini panel');
            geminiPanel.classList.remove('d-none');
        } else if (provider === 'openrouter') {
            console.log('[Chats] Showing OpenRouter panel');
            openrouterPanel.classList.remove('d-none');
        } else {
            console.log('[Chats] Showing Ollama panel');
            ollamaPanel.classList.remove('d-none');
        }
    },

    /**
     * Load available Ollama models from the backend API into the modal selector
     */
    async _loadModalOllamaModels() {
        const select = document.getElementById('new-chat-ollama-model');
        if (!select) return;
        try {
            const response = await api.models.getOllamaModels();
            if (response.data.success && response.data.models.length > 0) {
                select.innerHTML = response.data.models
                    .map(m => `<option value="${m}">${m}</option>`)
                    .join('');
            } else {
                // Fallback to defaults with all local models
                select.innerHTML = this._getLocalModelsOptions();
            }
        } catch {
            // Network error: use defaults with all local models
            select.innerHTML = this._getLocalModelsOptions();
        }
    },

    /**
     * Get HTML options for all local Ollama models
     */
    _getLocalModelsOptions() {
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
        return models.map(m => `<option value="${m}">${m}</option>`).join('');
    },

    /**
     * Create a new chat
     */
    async createChat() {
        const connectionId = document.getElementById('new-chat-connection').value;
        const title = document.getElementById('new-chat-title').value;
        const provider = document.getElementById('new-chat-provider').value;

        // Read model and API key based on selected provider
        let modelName, apiKey;
        if (provider === 'ollama') {
            modelName = document.getElementById('new-chat-ollama-model').value || 'llama3.1:8b';
            apiKey = null;
        } else if (provider === 'gemini') {
            modelName = document.getElementById('new-chat-gemini-model').value || 'gemini-2.5-flash';
            apiKey = document.getElementById('new-chat-gemini-key').value.trim() || null;
        } else if (provider === 'openrouter') {
            // OpenRouter: model and API key are configured in backend/.env
            modelName = null; // Backend uses OPENROUTER_DEFAULT_MODEL
            apiKey = null;    // Backend uses OPENROUTER_API_KEY
        }

        if (!connectionId) {
            app.showToast('Please select a database connection', 'warning');
            return;
        }

        app.showLoading('Creating chat...');

        try {
            const response = await api.chats.create({
                connection_id: parseInt(connectionId),
                title: title || undefined,
                provider,
                model_name: modelName,
                api_key: apiKey || undefined
            });

            if (response.data.success) {
                app.showToast('Chat creado exitosamente', 'success');
                
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newChatModal'));
                if (modal) modal.hide();
                
                // Reload chats and select the new one
                await this.loadChats();
                await this.selectChat(response.data.id);
                
                // Enable chat input after creating chat
                if (typeof chat !== 'undefined') {
                    chat.enableInput();
                }
            } else {
                app.showToast(response.data.error || 'Error al crear el chat', 'error');
            }
        } catch (error) {
            console.error('Create chat error:', error);
            app.showToast('Error al crear el chat', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Select and load a chat
     */
    async selectChat(id) {
        // If chat is already selected, show feedback and exit
        if (id === this.currentChatId) {
            app.showToast('Este chat ya está seleccionado', 'info');
            // Visual feedback on the chat item
            this.flashChatItem(id);
            return;
        }

        app.showLoading('Loading chat...');

        try {
            // Get chat details first
            const chatData = this.chatsList.find(c => c.id === id);
            if (!chatData) {
                app.showToast('Chat no encontrado', 'error');
                return;
            }
            
            // Auto-connect to the chat's connection if not already connected
            if (typeof connections !== 'undefined' && connections.getCurrentId() !== chatData.connection_id) {
                console.log('Auto-connecting to connection:', chatData.connection_id);
                await connections.connect(chatData.connection_id);
            }
            
            // Get chat messages
            const response = await api.chats.getMessages(id);
            if (response.data.success) {
                this.currentChatId = id;
                
                // Update UI
                this.renderChatsList();
                
                // Load messages into chat UI
                if (typeof chat !== 'undefined') {
                    chat.loadMessages(response.data.messages);
                }
                
                // Store current chat in session
                document.getElementById('current-chat-title').textContent = chatData.title;
                document.getElementById('current-chat-db').textContent = chatData.database_name || 'No database';
                
                // Update model info in current chat section
                const modelEl = document.getElementById('current-chat-model');
                if (modelEl && chatData.config) {
                    const provider = chatData.config.provider || 'Desconocido';
                    const modelName = chatData.config.model_name || '';
                    modelEl.textContent = modelName ? `${provider} - ${modelName}` : provider;
                }
                
                // Update provider badge in header
                this.updateProviderBadge(chatData.config);
                
                // Enable chat input after selecting chat
                if (typeof chat !== 'undefined') {
                    chat.enableInput();
                }
                
                app.showToast('Chat cargado', 'success');
            }
        } catch (error) {
            console.error('Load chat error:', error);
            app.showToast('Error al cargar el chat', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Delete a chat
     */
    async delete(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este chat?')) {
            return;
        }

        try {
            const response = await api.chats.delete(id);
            if (response.data.success) {
                app.showToast('Chat eliminado', 'success');
                if (this.currentChatId === id) {
                    this.currentChatId = null;
                    // BUG 3 FIX: chat.clearMessages() doesn't exist; clear the container directly
                    if (typeof chat !== 'undefined' && chat.messagesContainer) {
                        chat.messagesContainer.innerHTML = '';
                        chat.disableInput();
                    }
                    // Reset current chat info in sidebar
                    const titleEl = document.getElementById('current-chat-title');
                    const dbEl = document.getElementById('current-chat-db');
                    if (titleEl) titleEl.textContent = 'Ningún chat seleccionado';
                    if (dbEl) dbEl.textContent = 'Crea o selecciona un chat para comenzar';
                    
                    // Reset provider badge
                    this.updateProviderBadge(null);
                }
                await this.loadChats();
            } else {
                app.showToast(response.data.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Delete chat error:', error);
            app.showToast('Error al eliminar el chat', 'error');
        }
    },

    /**
     * Get current chat ID
     */
    getCurrentId() {
        return this.currentChatId;
    },

    /**
     * Update the provider badge in the header based on chat config
     * @param {Object} config - Chat configuration with provider info
     */
    updateProviderBadge(config) {
        const badge = document.getElementById('provider-badge');
        if (!badge) return;

        if (!config || !config.provider) {
            badge.textContent = 'Selecciona un chat';
            badge.className = 'badge bg-secondary ms-2';
            return;
        }

        const provider = config.provider;
        let providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
        let badgeClass = 'badge ms-2';

        // Set badge color based on provider
        switch (provider) {
            case 'ollama':
                badgeClass += ' bg-info';
                break;
            case 'gemini':
                badgeClass += ' bg-warning text-dark';
                // Add model name if available
                if (config.model_name) {
                    providerLabel = config.model_name;
                }
                break;
            case 'openrouter':
                badgeClass += ' bg-success';
                break;
            default:
                badgeClass += ' bg-secondary';
        }

        badge.textContent = providerLabel;
        badge.className = badgeClass;
    },

    /**
     * Flash effect on chat item when already selected
     * @param {number} id - Chat ID
     */
    flashChatItem(id) {
        // Find the chat item element
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            // Check if this is the clicked item by looking at the onclick attribute
            if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`selectChat(${id})`)) {
                // Add flash class
                item.classList.add('chat-item-flash');
                // Remove flash class after animation completes
                setTimeout(() => {
                    item.classList.remove('chat-item-flash');
                }, 600);
            }
        });
    },

    /**
     * Send message in current chat
     */
    async sendMessage(message) {
        if (!this.currentChatId) {
            app.showToast('Please select a chat first', 'warning');
            return;
        }

        app.showLoading('Generating response...');

        try {
            const response = await api.chats.send(this.currentChatId, {
                message,
                api_key: null // Add if using Gemini
            });

            if (response.data.success) {
                // Reload messages to show the new exchange
                const messagesResponse = await api.chats.getMessages(this.currentChatId);
                if (messagesResponse.data.success && typeof chat !== 'undefined') {
                    chat.loadMessages(messagesResponse.data.messages);
                }
            } else {
                app.showToast(response.data.error || 'Failed to get response', 'error');
            }
        } catch (error) {
            console.error('Send message error:', error);
            app.showToast('Failed to send message', 'error');
        } finally {
            app.hideLoading();
        }
    }
};
