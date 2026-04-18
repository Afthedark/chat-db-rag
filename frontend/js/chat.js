/**
 * Chat UI Handler
 * Manages chat messages, history, and UI updates
 */

const chat = {
    messagesContainer: null,
    messageInput: null,
    sendButton: null,
    welcomeScreen: null,
    isProcessing: false,

    /**
     * Initialize chat module
     */
    init() {
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('btn-send');
        this.welcomeScreen = document.getElementById('welcome-screen');

        // Check if elements exist
        if (!this.messagesContainer || !this.messageInput || !this.sendButton) {
            console.error('Chat: Required DOM elements not found');
            return;
        }

        // Bind events
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Initially disable input and show welcome screen
        this.disableInput();
        this.showWelcomeScreen();

        // Note: messages are loaded when a chat is selected via chats.selectChat()
        // Do NOT load legacy history here
        
        console.log('Chat module initialized');
    },

    /**
     * Show welcome screen (when no chat selected)
     */
    showWelcomeScreen() {
        if (this.welcomeScreen) {
            this.welcomeScreen.classList.remove('d-none');
        }
        if (this.messagesContainer) {
            this.messagesContainer.classList.add('d-none');
        }
        console.log('Welcome screen shown');
    },

    /**
     * Hide welcome screen (when chat selected)
     */
    hideWelcomeScreen() {
        if (this.welcomeScreen) {
            this.welcomeScreen.classList.add('d-none');
        }
        if (this.messagesContainer) {
            this.messagesContainer.classList.remove('d-none');
        }
        console.log('Welcome screen hidden');
    },

    /**
     * Load chat history from server
     */
    async loadHistory() {
        try {
            const response = await api.chat.getHistory();
            if (response.data.success) {
                this.messagesContainer.innerHTML = '';
                response.data.history.forEach(msg => {
                    this.addMessage(msg.role, msg.content, false);
                });
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            // Add default greeting if history fails to load
            this.addMessage('assistant', "Hello! I'm a MySQL assistant. Ask me anything about your database.", false);
        }
    },

    /**
     * Load messages from a persisted chat
     * @param {Array} messages - Array of message objects
     */
    loadMessages(messages) {
        this.messagesContainer.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            this.addMessage('assistant', "Hello! I'm a MySQL assistant. Ask me anything about your database.", false);
            return;
        }
        
        messages.forEach(msg => {
            if (msg.is_sql && msg.sql_query) {
                this.addAIResponse(msg.content, msg.sql_query, msg.sql_results);
            } else {
                this.addMessage(msg.role, msg.content, false);
            }
        });
        
        this.scrollToBottom();
    },

    /**
     * Send a message
     */
    async sendMessage() {
        if (this.isProcessing) return;

        const message = this.messageInput.value.trim();
        if (!message) return;

        // Check if there is an active persistent chat first
        const activeChatId = (typeof chats !== 'undefined') ? chats.getCurrentId() : null;

        // Check if database is connected (either via persistent chat or legacy)
        if (!activeChatId && (typeof database === 'undefined' || !database.isConnected)) {
            app.showToast('Please select a chat or connect to a database first', 'warning');
            return;
        }

        // Add user message to UI
        this.addMessage('user', message, true);
        this.messageInput.value = '';

        // Show loading
        this.setProcessing(true);
        app.showLoading('Generating response...');

        try {
            // BUG 5 FIX: use the persistent chat route when a chat is selected
            if (activeChatId) {
                const apiKey = document.getElementById('gemini-api-key')?.value || null;
                const response = await api.chats.send(activeChatId, {
                    message,
                    api_key: apiKey || null
                });

                if (response.data.success) {
                    const data = response.data;
                    if (data.type === 'sql') {
                        this.addAIResponse(data.message, data.sql, data.sql_results);
                    } else {
                        this.addMessage('assistant', data.message, true);
                    }
                } else {
                    this.addMessage('assistant', `Error: ${response.data.error}`, true, true);
                }
            } else {
                // Fallback: legacy route (no persistent chat selected)
                const provider = document.getElementById('llm-provider').value;
                const modelName = provider === 'ollama'
                    ? document.getElementById('ollama-model').value
                    : 'gemini-pro';
                const apiKey = provider === 'gemini'
                    ? document.getElementById('gemini-api-key').value
                    : null;

                const response = await api.chat.sendMessage({
                    message,
                    provider,
                    model_name: modelName,
                    api_key: apiKey || undefined
                });

                if (response.data.success) {
                    const data = response.data;
                    if (data.type === 'sql') {
                        this.addAIResponse(data.message, data.sql, data.sql_results);
                    } else {
                        this.addMessage('assistant', data.message, true);
                    }
                } else {
                    this.addMessage('assistant', `Error: ${response.data.error}`, true, true);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMsg = error.response?.data?.error || 'Failed to get response. Please try again.';
            this.addMessage('assistant', `Error: ${errorMsg}`, true, true);
        } finally {
            this.setProcessing(false);
            app.hideLoading();
            this.scrollToBottom();
        }
    },

    /**
     * Add a message to the chat
     * @param {string} role - 'user' or 'assistant'
     * @param {string} content - Message content
     * @param {boolean} animate - Whether to animate the message
     * @param {boolean} isError - Whether this is an error message
     */
    addMessage(role, content, animate = true, isError = false) {
        const messageDiv = document.createElement('div');
        // BUG 2 FIX: normalize 'assistant' role to use 'message-ai' class defined in CSS
        const roleClass = role === 'assistant' ? 'ai' : role;
        messageDiv.className = `message message-${roleClass}`;
        
        if (isError) {
            messageDiv.classList.add('message-error');
        }

        const header = document.createElement('div');
        header.className = 'message-header';
        header.innerHTML = role === 'user' 
            ? '<i class="fas fa-user"></i> Tú' 
            : '<i class="fas fa-robot"></i> Asistente';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(content);

        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);

        this.messagesContainer.appendChild(messageDiv);

        if (animate) {
            this.scrollToBottom();
        }
    },

    /**
     * Add AI response with SQL details
     * @param {string} message - Natural language response
     * @param {string} sql - SQL query
     * @param {string} results - SQL results
     */
    addAIResponse(message, sql, results) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-ai';

        const header = document.createElement('div');
        header.className = 'message-header';
        header.innerHTML = '<i class="fas fa-robot"></i> Asistente';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(message);

        // SQL query container
        const sqlContainer = document.createElement('div');
        sqlContainer.className = 'sql-query-container';

        const sqlHeader = document.createElement('div');
        sqlHeader.className = 'sql-query-header';
        sqlHeader.innerHTML = '<i class="fas fa-code"></i> Ver consulta SQL';
        sqlHeader.style.cursor = 'pointer';

        const sqlCode = document.createElement('pre');
        sqlCode.className = 'sql-query-code d-none';
        sqlCode.textContent = sql;

        sqlHeader.addEventListener('click', () => {
            sqlCode.classList.toggle('d-none');
            sqlHeader.innerHTML = sqlCode.classList.contains('d-none')
                ? '<i class="fas fa-code"></i> Ver consulta SQL'
                : '<i class="fas fa-code"></i> Ocultar consulta SQL';
        });

        sqlContainer.appendChild(sqlHeader);
        sqlContainer.appendChild(sqlCode);

        // SQL results (if available and different from message)
        if (results && results !== message) {
            const resultsDiv = document.createElement('div');
            resultsDiv.className = 'sql-results d-none';
            resultsDiv.innerHTML = `<strong>Resultados:</strong><br>${this.formatMessage(results)}`;
            sqlContainer.appendChild(resultsDiv);

            sqlHeader.addEventListener('click', () => {
                resultsDiv.classList.toggle('d-none');
            });
        }

        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(sqlContainer);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    },

    /**
     * Format message content (convert newlines to <br>, etc.)
     * @param {string} content - Raw message content
     * @returns {string} - Formatted HTML
     */
    formatMessage(content) {
        if (!content) return '';

        // BUG 6 FIX: extract code blocks BEFORE escaping HTML, then re-insert them
        const codeBlocks = [];
        let formatted = content;

        // Step 1: Extract fenced code blocks (```lang\n...```) and replace with placeholders
        formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            const index = codeBlocks.length;
            codeBlocks.push({ lang, code });
            return `%%CODEBLOCK_${index}%%`;
        });

        // Step 2: Extract inline code (`code`) and replace with placeholders
        const inlineCodes = [];
        formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
            const index = inlineCodes.length;
            inlineCodes.push(code);
            return `%%INLINE_${index}%%`;
        });

        // Step 3: Escape HTML in the remaining plain text
        formatted = formatted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Step 4: Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br>');

        // Step 5: Re-insert inline codes as <code> elements
        formatted = formatted.replace(/%%INLINE_(\d+)%%/g, (match, i) => {
            const escaped = inlineCodes[i]
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<code>${escaped}</code>`;
        });

        // Step 6: Re-insert fenced code blocks as <pre> elements
        formatted = formatted.replace(/%%CODEBLOCK_(\d+)%%/g, (match, i) => {
            const { code } = codeBlocks[i];
            const escaped = code
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre class="sql-query-code">${escaped}</pre>`;
        });

        return formatted;
    },

    /**
     * Clear chat history
     */
    async clearHistory() {
        try {
            await api.chat.clearHistory();
            this.messagesContainer.innerHTML = '';
            this.addMessage('assistant', "Hello! I'm a MySQL assistant. Ask me anything about your database.", false);
            app.showToast('Chat history cleared', 'success');
        } catch (error) {
            console.error('Failed to clear history:', error);
            app.showToast('Failed to clear chat history', 'error');
        }
    },

    /**
     * Set processing state
     * @param {boolean} processing - Whether a message is being processed
     */
    setProcessing(processing) {
        this.isProcessing = processing;
        this.updateInputState();
    },

    /**
     * Update input state based on connection and processing status
     */
    updateInputState() {
        const isConnected = (typeof connections !== 'undefined' && connections.getCurrentId()) || 
                           (typeof database !== 'undefined' && database.isConnected);
        
        console.log('Chat updateInputState - isConnected:', isConnected, 'isProcessing:', this.isProcessing);
        
        if (this.isProcessing) {
            this.sendButton.disabled = true;
            this.messageInput.disabled = true;
        } else if (isConnected) {
            this.sendButton.disabled = false;
            this.messageInput.disabled = false;
            this.messageInput.placeholder = 'Type your question about the database...';
        } else {
            this.sendButton.disabled = true;
            this.messageInput.disabled = true;
            this.messageInput.placeholder = 'Connect to a database first to start chatting';
        }
    },

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    },

    /**
     * Enable chat input
     */
    enableInput() {
        console.log('Chat enableInput called');
        
        // Verify elements exist
        if (!this.messageInput || !this.sendButton) {
            console.error('Chat enableInput: DOM elements not found');
            return;
        }
        
        // Hide welcome screen and show messages
        this.hideWelcomeScreen();
        
        // Force enable by removing disabled attribute and property
        this.messageInput.removeAttribute('disabled');
        this.sendButton.removeAttribute('disabled');
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        
        // Update placeholder
        this.messageInput.placeholder = 'Escribe tu pregunta sobre la base de datos...';
        
        // Update status message
        const statusMsg = document.getElementById('chat-status-message');
        if (statusMsg) {
            statusMsg.innerHTML = '<i class="fas fa-check-circle text-success"></i> Listo para chatear';
        }
        
        // Focus input
        this.messageInput.focus();
        
        console.log('Chat input enabled successfully');
    },

    /**
     * Disable chat input
     */
    disableInput() {
        console.log('Chat disableInput called');
        
        // Verify elements exist
        if (!this.messageInput || !this.sendButton) {
            console.error('Chat disableInput: DOM elements not found');
            return;
        }
        
        // Show welcome screen and hide messages
        this.showWelcomeScreen();
        
        // Force disable
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        this.messageInput.placeholder = 'Selecciona un chat para comenzar';
        
        // Update status message
        const statusMsg = document.getElementById('chat-status-message');
        if (statusMsg) {
            statusMsg.innerHTML = '<i class="fas fa-info-circle"></i> Crea o selecciona un chat para comenzar';
        }
        
        console.log('Chat input disabled');
    }
};
