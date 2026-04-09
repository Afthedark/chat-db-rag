window.chatApp = function() {
    return {
        // --- UI STATE ---
        isSidebarOpen: false,
        isLoading: false,
        currentChatId: null,
        theme: 'dark', // 'light' or 'dark'
        
        // --- DATA ---
        chats: [],
        messages: [],
        activeDatabases: [],
        
        // --- FORM ---
        question: '',
        selectedDatabaseId: '',
        systemInfo: { aiProvider: '...', model: '...' },
        
        // --- CHART STATE ---
        chartInstance: null,
        chartType: 'bar',
        currentChartData: null,
        chartDataInfo: '',

        async init() {
            console.log('🚀 Chat RAG Model Initialized (Deep Chat Integration)');
            
            await this.loadActiveDatabases();
            await this.loadChats();
            await this.loadSystemInfo();
            
            // Cargar Tema desde Utils
            this.theme = UIUtils.initTheme();
            
            this.setupDeepChat();
            
            
            this.$watch('selectedDatabaseId', (val) => {
                console.log('🔄 DB Selection Changed:', val);
                this.$nextTick(() => {
                    this.applyDeepChatTheme();
                });
            });

            const lastChat = localStorage.getItem('last_chat_id');
            if (lastChat) {
                await this.loadMessages(parseInt(lastChat));
            }
        },

        toggleTheme() {
            this.theme = UIUtils.toggleTheme();
            this.$nextTick(() => this.applyDeepChatTheme());
        },

        getDeepChatConfig() {
            const isDark = this.theme === 'dark';

            // Colores del sistema de diseño
            const inputBg     = isDark ? '#2a2a2a' : '#f5f5f7';
            const inputText   = isDark ? '#ececec' : '#1d1d1f';
            const inputBorder = isDark ? '1px solid #3c3c3c' : '1px solid #d2d2d7';
            const focusBorder = isDark ? '2px solid #3b82f6' : '2px solid #007aff';
            const phColor     = isDark ? '#6b7280' : '#9ca3af';

            return {
                // ✅ Formato oficial Deep Chat: styles anidados
                textInput: this.selectedDatabaseId ? {
                    styles: {
                        container: {
                            backgroundColor: inputBg,
                            borderRadius: '20px',
                            border: inputBorder,
                            padding: '10px 16px',
                            transition: 'border 0.2s ease'
                        },
                        text: {
                            color: inputText,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.95rem'
                        },
                        focus: {
                            border: focusBorder
                        }
                    },
                    placeholder: {
                        text: 'Consulta sobre tus datos...',
                        style: {
                            color: phColor,
                            fontStyle: 'italic'
                        }
                    }
                } : {
                    disabled: true,
                    styles: {
                        container: {
                            backgroundColor: isDark ? '#1f1f1f' : '#f3f4f6',
                            borderRadius: '20px',
                            border: isDark ? '1px solid #3c3c3c' : '1px solid #e5e7eb'
                        }
                    },
                    placeholder: {
                        text: '\u26a0\ufe0f Primero selecciona una base de datos',
                        style: {
                            color: isDark ? '#ef4444' : '#dc2626',
                            fontStyle: 'italic'
                        }
                    }
                },

                // Nombres en español
                names: {
                    ai:   { text: 'Asistente IA', style: { color: isDark ? '#60a5fa' : '#007aff', fontWeight: '600' } },
                    user: { text: 'T\u00fa',           style: { color: isDark ? '#8b949e' : '#6b7280' } }
                },

                // Estilos de burbuja
                messageStyles: {
                    default: {
                        shared: {
                            bubble: {
                                backgroundColor: 'transparent',
                                color: inputText,
                                margin: '16px 0',
                                maxWidth: '85%',
                                lineHeight: '1.65',
                                fontFamily: "'Inter', sans-serif"
                            }
                        },
                        user: {
                            bubble: {
                                backgroundColor: isDark ? '#2f2f2f' : '#f0f0f0',
                                padding: '10px 16px',
                                borderRadius: '18px 18px 4px 18px'
                            }
                        },
                        ai: {
                            bubble: {
                                borderRadius: '4px 18px 18px 18px'
                            }
                        }
                    }
                },

                // Botón de envío
                submitButtonStyles: {
                    submit: {
                        container: {
                            default: {
                                backgroundColor: isDark ? '#3b82f6' : '#007aff',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px'
                            },
                            hover: {
                                backgroundColor: isDark ? '#2563eb' : '#0062cc'
                            }
                        }
                    }
                },

                // CSS interno del shadow DOM
                auxiliaryStyle: `
                    .deep-chat-container {
                        background: var(--bg-main) !important;
                        max-width: 860px !important;
                        margin: 0 auto !important;
                        height: 100% !important;
                    }
                    .deep-chat-messages { padding: 2rem 1.5rem !important; }
                    pre {
                        background: ${isDark ? '#1e1e1e' : '#f8f8f8'} !important;
                        border-radius: 12px !important;
                        border: 1px solid ${isDark ? '#3c3c3c' : '#e5e7eb'} !important;
                        padding: 1.25rem 1.5rem !important;
                        margin: 1rem 0 !important;
                        overflow-x: auto !important;
                    }
                    code {
                        color: ${isDark ? '#60a5fa' : '#007aff'} !important;
                        font-size: 0.88rem !important;
                        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                    }
                    ::-webkit-scrollbar { width: 4px; }
                    ::-webkit-scrollbar-thumb {
                        background: ${isDark ? '#3c3c3c' : '#d2d2d7'};
                        border-radius: 10px;
                    }
                `
            };
        },

        setupDeepChat() {
            const chatEl = document.getElementById('rag-deep-chat');
            if (!chatEl) return;

            // Conexión al backend
            chatEl.connect = {
                handler: (body, signals) => {
                    const question = body.messages[body.messages.length - 1].text;
                    this.sendToAPI(question, signals);
                }
            };

            // Eventos internos
            chatEl.onMessage = (body) => {
                if (!body.isHistory && body.message.role === 'user') {
                    this.isLoading = true;
                }
            };

            // Aplicar estilos iniciales del tema
            this.applyDeepChatTheme();
        },

        // Asigna propiedades de Deep Chat directamente al DOM (método correcto, evita serializar JS)
        applyDeepChatTheme() {
            const chatEl = document.getElementById('rag-deep-chat');
            if (!chatEl) return;

            const cfg = this.getDeepChatConfig();
            chatEl.textInput         = cfg.textInput;
            chatEl.names             = cfg.names;
            chatEl.messageStyles     = cfg.messageStyles;
            chatEl.submitButtonStyles = cfg.submitButtonStyles;
            chatEl.auxiliaryStyle    = cfg.auxiliaryStyle;
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
                    const isNewChat = !this.currentChatId;
                    this.currentChatId = res.data.historyId;
                    localStorage.setItem('last_chat_id', this.currentChatId);
                    
                    if (res.data.sqlExecuted) {
                        let htmlContent = this.formatMessage(res.data.reply);
                        
                        // Botón de Generar Gráfico (solo si hay datos)
                        if (res.data.chartData && res.data.chartData.length > 0) {
                            const chartDataEncoded = encodeURIComponent(JSON.stringify(res.data.chartData));
                            htmlContent += `
                                <div class="mt-2 mb-2">
                                    <button onclick="window.openChartModal('${chartDataEncoded}')" 
                                        class="btn btn-sm btn-outline-primary">
                                        <i class="bi bi-bar-chart-line me-1"></i> Generar Gráfico
                                    </button>
                                    <span class="text-secondary small ms-2">(${res.data.chartData.length} registros)</span>
                                </div>`;
                        }
                        
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
                    
                    // Actualización optimista: Si es un nuevo chat, lo añadimos al inicio de la lista
                    if (isNewChat) {
                        this.chats.unshift({
                            id: this.currentChatId,
                            title: question.substring(0, 30) + (question.length > 30 ? '...' : ''),
                            databaseId: parseInt(this.selectedDatabaseId)
                        });
                    }
                    
                    // Actualizar el historial completo en segundo plano
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
            console.log('✨ Starting New Chat flow...');
            this.currentChatId = null;
            this.messages = [];
            this.selectedDatabaseId = '';
            this.isLoading = false;
            
            localStorage.removeItem('last_chat_id');
            const chatEl = document.getElementById('rag-deep-chat');
            if (chatEl) {
                chatEl.clearMessages(true);
                chatEl.history = []; // Asegurar limpieza total del componente
            }
            
            // Disparar modal de selección
            await this.promptDatabaseSelection();
        },

        async promptDatabaseSelection() {
            if (this.activeDatabases.length === 0) {
                await this.loadActiveDatabases();
            }

            const dbOptions = {};
            this.activeDatabases.forEach(db => {
                dbOptions[db.id] = db.name;
            });

            const { value: dbId } = await Swal.fire({
                title: 'Selecciona Base de Datos',
                input: 'select',
                inputOptions: dbOptions,
                inputPlaceholder: 'Elige el target...',
                showCancelButton: true,
                confirmButtonText: 'Conectar',
                cancelButtonText: 'Cancelar',
                ...UIUtils.getSwalConfig(),
                inputValidator: (value) => {
                    if (!value) return 'Debes seleccionar una base de datos';
                }
            });

            if (dbId) {
                // Forzar que sea string para consistencia con x-model si es necesario, 
                // aunque Alpine suele manejar ambos.
                this.selectedDatabaseId = dbId.toString();
                this.showToast(`Conectado a ${dbOptions[dbId]}`, 'success');
                
                // Pequeño delay para que el input se habilite suavemente
                setTimeout(() => {
                    const chatEl = document.getElementById('rag-deep-chat');
                    if (chatEl) chatEl.focus();
                }, 100);
            }
        },

        async loadMessages(chatId, updateUI = true) {
            try {
                this.currentChatId = chatId;
                localStorage.setItem('last_chat_id', chatId);
                const res = await axios.get(`/api/chat/${chatId}/messages`);
                if (res.data.success) {
                    this.messages = res.data.data;
                    
                    // Recover DB context
                    const chatObj = this.chats.find(c => c.id == chatId);
                    if (chatObj && chatObj.databaseId) {
                        this.selectedDatabaseId = chatObj.databaseId.toString();
                    } else {
                        // Fallback: Scan messages for DB name (backward compatibility)
                        const lastAssistant = [...this.messages].reverse().find(m => m.role === 'assistant' && m.databaseUsed);
                        if (lastAssistant) {
                            const dbObj = this.activeDatabases.find(d => d.name === lastAssistant.databaseUsed);
                            if (dbObj) this.selectedDatabaseId = dbObj.id.toString();
                        }
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
            const confirmed = await Swal.fire({
                title: '¿Confirmas borrar?',
                text: "No podrás recuperar este historial.",
                icon: 'warning',
                showCancelButton: true,
                ...UIUtils.getSwalConfig()
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
            UIUtils.showToast(message, icon);
        },

        // --- CHART FUNCTIONS ---
        
        openChartModal(encodedData) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(encodedData));
                this.currentChartData = decodedData;
                this.chartType = 'bar';
                this.renderChart();
                
                const modal = new bootstrap.Modal(document.getElementById('chartModal'));
                modal.show();
            } catch (error) {
                console.error('Error abriendo gráfico:', error);
                this.showToast('Error al procesar datos para el gráfico', 'error');
            }
        },

        changeChartType(type) {
            this.chartType = type;
            this.renderChart();
        },

        renderChart() {
            if (!this.currentChartData || this.currentChartData.length === 0) return;
            
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            
            // Destruir instancia anterior si existe
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            
            const data = this.currentChartData;
            const keys = Object.keys(data[0]);
            
            // Detectar columnas numéricas y categóricas
            const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val);
            const numericKeys = keys.filter(k => isNumeric(data[0][k]));
            const categoricalKeys = keys.filter(k => !isNumeric(data[0][k]));
            
            // Usar primera columna categórica como labels, o la primera numérica si no hay
            const labelKey = categoricalKeys.length > 0 ? categoricalKeys[0] : keys[0];
            const labels = data.map(row => row[labelKey]);
            
            // Para pie/doughnut, solo usar la primera columna numérica
            const datasets = this.chartType === 'pie' || this.chartType === 'doughnut'
                ? [{
                    label: numericKeys[0] || 'Valor',
                    data: data.map(row => parseFloat(row[numericKeys[0]] || 0)),
                    backgroundColor: this.generateColors(data.length)
                  }]
                : numericKeys.map((key, index) => ({
                    label: key,
                    data: data.map(row => parseFloat(row[key] || 0)),
                    backgroundColor: this.getChartColor(index, 0.7),
                    borderColor: this.getChartColor(index, 1),
                    borderWidth: 1
                  }));
            
            // Configuración del tema oscuro/claro
            const isDark = this.theme === 'dark';
            const textColor = isDark ? '#ececec' : '#1d1d1f';
            const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            
            this.chartInstance = new Chart(ctx, {
                type: this.chartType,
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: textColor }
                        },
                        title: {
                            display: true,
                            text: `Visualización de ${data.length} registros`,
                            color: textColor
                        }
                    },
                    scales: this.chartType === 'pie' || this.chartType === 'doughnut' ? {} : {
                        x: {
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        },
                        y: {
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        }
                    }
                }
            });
            
            this.chartDataInfo = `Mostrando ${data.length} registros con ${numericKeys.length} métricas`;
        },

        getChartColor(index, alpha) {
            const colors = [
                `rgba(59, 130, 246, ${alpha})`,   // Blue
                `rgba(16, 185, 129, ${alpha})`,   // Green
                `rgba(245, 158, 11, ${alpha})`,   // Yellow
                `rgba(239, 68, 68, ${alpha})`,    // Red
                `rgba(139, 92, 246, ${alpha})`,   // Purple
                `rgba(236, 72, 153, ${alpha})`,   // Pink
                `rgba(6, 182, 212, ${alpha})`,    // Cyan
                `rgba(249, 115, 22, ${alpha})`    // Orange
            ];
            return colors[index % colors.length];
        },

        generateColors(count) {
            const colors = [];
            for (let i = 0; i < count; i++) {
                colors.push(this.getChartColor(i, 0.7));
            }
            return colors;
        },

        downloadChart() {
            if (!this.chartInstance) return;
            
            const link = document.createElement('a');
            link.download = `grafico-${new Date().toISOString().split('T')[0]}.png`;
            link.href = this.chartInstance.toBase64Image();
            link.click();
        }
    }
}

// Global function for chart modal (called from HTML)
window.openChartModal = function(encodedData) {
    // Get the Alpine.js instance and call the method
    const chatEl = document.querySelector('[x-data="chatApp()"]');
    if (chatEl && chatEl._x_dataStack) {
        const app = chatEl._x_dataStack[0];
        app.openChartModal(encodedData);
    }
};
