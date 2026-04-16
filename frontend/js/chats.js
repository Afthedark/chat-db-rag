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
        if (!container) return;

        if (this.chatsList.length === 0) {
            container.innerHTML = '<small class="text-muted">No chats yet. Create one to start!</small>';
            return;
        }

        container.innerHTML = this.chatsList.map(chat => `
            <div class="chat-item mb-2 p-2 border rounded cursor-pointer ${this.currentChatId === chat.id ? 'border-primary bg-light' : ''}"
                 onclick="chats.selectChat(${chat.id})">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="overflow-hidden">
                        <strong class="d-block text-truncate">${chat.title}</strong>
                        <small class="text-muted">${chat.database_name || 'No DB'}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); chats.delete(${chat.id})" title="Delete">
                        <i class="fas fa-times"></i>
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
    },

    /**
     * Create a new chat
     */
    async createChat() {
        const connectionId = document.getElementById('new-chat-connection').value;
        const title = document.getElementById('new-chat-title').value;
        const provider = document.getElementById('new-chat-provider').value;
        // MEJORA 4 FIX: 'gemini-1.0-pro' is deprecated; use 'gemini-pro' or let backend decide
        const modelName = provider === 'ollama'
            ? document.getElementById('new-chat-ollama-model').value
            : 'gemini-pro';

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
                model_name: modelName
            });

            if (response.data.success) {
                app.showToast('Chat created successfully', 'success');
                
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newChatModal'));
                if (modal) modal.hide();
                
                // Reload chats and select the new one
                await this.loadChats();
                await this.selectChat(response.data.id);
            } else {
                app.showToast(response.data.error || 'Failed to create chat', 'error');
            }
        } catch (error) {
            console.error('Create chat error:', error);
            app.showToast('Failed to create chat', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Select and load a chat
     */
    async selectChat(id) {
        app.showLoading('Loading chat...');

        try {
            // Get chat details first
            const chatData = this.chatsList.find(c => c.id === id);
            if (!chatData) {
                app.showToast('Chat not found', 'error');
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
                
                app.showToast('Chat loaded', 'success');
            }
        } catch (error) {
            console.error('Load chat error:', error);
            app.showToast('Failed to load chat', 'error');
        } finally {
            app.hideLoading();
        }
    },

    /**
     * Delete a chat
     */
    async delete(id) {
        if (!confirm('Are you sure you want to delete this chat?')) {
            return;
        }

        try {
            const response = await api.chats.delete(id);
            if (response.data.success) {
                app.showToast('Chat deleted', 'success');
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
                    if (titleEl) titleEl.textContent = 'No chat selected';
                    if (dbEl) dbEl.textContent = 'Select or create a chat';
                }
                await this.loadChats();
            } else {
                app.showToast(response.data.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            console.error('Delete chat error:', error);
            app.showToast('Failed to delete chat', 'error');
        }
    },

    /**
     * Get current chat ID
     */
    getCurrentId() {
        return this.currentChatId;
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
