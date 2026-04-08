window.chatApp = function() {
    return {
        // --- UI STATE ---
        isSidebarOpen: false,
        isLoading: false,
        currentChatId: null,
        
        // --- DATA ---
        chats: [],
        messages: [],
        activeDatabases: [],
        
        // --- FORM ---
        question: '',
        selectedDatabaseId: '',
        systemInfo: { aiProvider: '...', model: '...' },

        async init() {
            console.log('🚀 Chat RAG Model Initialized (Deep Chat Integration)');
            
            await this.loadActiveDatabases();
            await this.loadChats();
            await this.loadSystemInfo();
            this.setupDeepChat();
            
            const lastChat = localStorage.getItem('last_chat_id');
            if (lastChat) {
                await this.loadMessages(parseInt(lastChat));
            }
        },

        setupDeepChat() {
            const chatEl = document.getElementById('rag-deep-chat');
            if (!chatEl) return;

            chatEl.connect = {
                handler: (body, signals) => {
                    const question = body.messages[body.messages.length - 1].text;
                    this.sendToAPI(question, signals);
                }
            };

            // Capture internal events if needed
            chatEl.onMessage = (body) => {
                if (!body.isHistory && body.message.role === 'user') {
                    this.isLoading = true;
                }
            };
        },

        async sendToAPI(question, signals) {
            if (!this.selectedDatabaseId) {
                this.showToast('Selecciona una base de datos primero', 'warning');
                signals.onResponse({ error: 'DB no seleccionada' });
                this.isLoading = false;
                return;
            }

            const payload = {
                question: question,
                targetDbId: parseInt(this.selectedDatabaseId),
                historyId: this.currentChatId
            };

            try {
                const res = await axios.post('/api/chat', payload);
                if (res.data.success) {
                    this.currentChatId = res.data.historyId;
                    localStorage.setItem('last_chat_id', this.currentChatId);
                    
                    if (res.data.sqlExecuted) {
                        let htmlContent = this.formatMessage(res.data.reply);
                        htmlContent += `
                            <div class="mt-3">
                                <details class="sql-details rounded-3 border border-secondary border-opacity-50 overflow-hidden" style="background: rgba(0,0,0,0.3)">
                                    <summary class="p-2 small cursor-pointer d-flex align-items-center user-select-none" style="background: rgba(0,0,0,0.5)">
                                        <i class="bi bi-code-square me-2 text-info"></i>
                                        <span class="text-muted flex-grow-1">SQL Generado</span>
                                    </summary>
                                    <div class="p-3">
                                        <pre class="m-0" style="white-space: pre-wrap; color: #3B82F6; font-size: 0.85rem;"><code>${res.data.sqlExecuted}</code></pre>
                                    </div>
                                </details>
                            </div>`;
                        signals.onResponse({ html: htmlContent });
                    } else {
                        signals.onResponse({ text: res.data.reply });
                    }
                    
                    // Actualizar silenciosamente el historial de recuadros laterales
                    this.loadChats();
                }
            } catch (error) {
                console.error('API Error:', error.response?.data || error.message);
                const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Error procesando consulta';
                this.showToast(errMsg, 'error');
                signals.onResponse({ error: errMsg });
            } finally {
                this.isLoading = false;
            }
        },

        async loadActiveDatabases() {
            try {
                const res = await axios.get('/api/databases');
                if (res.data.success) {
                    this.activeDatabases = res.data.data.filter(db => db.isActive);
                }
            } catch (error) {
                console.error('Error loading databases:', error);
            }
        },

        async loadSystemInfo() {
            try {
                const res = await axios.get('/api/system/info');
                if (res.data.success) {
                    this.systemInfo = res.data;
                }
            } catch (error) {
                console.error('Error loading system info:', error);
            }
        },

        async loadChats() {
            try {
                const res = await axios.get('/api/chat');
                if (res.data.success) {
                    this.chats = res.data.data;
                }
            } catch (error) {
                console.error('Error loading history:', error);
            }
        },

        async newChat() {
            this.currentChatId = null;
            this.messages = [];
            this.selectedDatabaseId = '';
            localStorage.removeItem('last_chat_id');
            const chatEl = document.getElementById('rag-deep-chat');
            if (chatEl) chatEl.clearMessages(true);
            this.showToast('Nueva sesión iniciada', 'success');
        },

        async loadMessages(chatId, updateUI = true) {
            try {
                this.currentChatId = chatId;
                localStorage.setItem('last_chat_id', chatId);
                const res = await axios.get(`/api/chat/${chatId}/messages`);
                if (res.data.success) {
                    this.messages = res.data.data;
                    
                    // Recover DB context
                    const lastAssistant = [...this.messages].reverse().find(m => m.role === 'assistant' && m.databaseUsed);
                    if (lastAssistant) {
                        const dbObj = this.activeDatabases.find(d => d.name === lastAssistant.databaseUsed);
                        if (dbObj) this.selectedDatabaseId = dbObj.id;
                    }

                    const chatEl = document.getElementById('rag-deep-chat');
                    if (updateUI && chatEl) {
                        const history = this.messages.map(m => {
                            let content = { role: m.role === 'user' ? 'user' : 'ai' };
                            if (m.role === 'assistant') {
                                let html = this.formatMessage(m.content);
                                if (m.sqlExecuted) {
                                    html += `<div class="mt-2 small opacity-75 border-top border-secondary pt-2 text-info">SQL ejecutado: <code>${m.sqlExecuted}</code></div>`;
                                }
                                content.html = html;
                            } else {
                                content.text = m.content;
                            }
                            return content;
                        });
                        
                        chatEl.clearMessages(true); // Limpia los mensajes en pantalla antes de poblar
                        chatEl.history = history;
                    }
                }
            } catch (error) {
                console.error('Error loading context:', error);
            }
        },

        getSelectedDbName() {
            const db = this.activeDatabases.find(d => d.id == this.selectedDatabaseId);
            return db ? db.name : 'Desconocida';
        },

        formatMessage(content) {
            if (typeof marked !== 'undefined') {
                return marked.parse(content);
            }
            return content;
        },

        async deleteChat(id) {
            if (typeof Swal === 'undefined') return;

            const confirmed = await Swal.fire({
                title: '¿Confirmas borrar?',
                text: "No podrás recuperar este historial.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, borrar',
                cancelButtonText: 'Cancelar',
                background: '#161b22',
                color: '#fff'
            });

            if (!confirmed.isConfirmed) return;

            try {
                const res = await axios.delete(`/api/chat/${id}`);
                if (res.data.success) {
                    if (this.currentChatId === id) {
                        this.newChat();
                    }
                    await this.loadChats();
                    this.showToast('Historial eliminado', 'success');
                }
            } catch (error) {
                console.error('Error al borrar chat:', error);
                this.showToast('Error al borrar historial', 'error');
            }
        },

        showToast(message, icon = 'info') {
            if (typeof Swal !== 'undefined') {
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
}
