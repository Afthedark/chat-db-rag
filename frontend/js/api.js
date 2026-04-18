/**
 * API Client for Chat with MySQL
 * Handles all HTTP requests to the Flask backend
 */

// Auto-detect API URL based on current hostname
// This allows the app to work when accessed from other devices on the same network
const API_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'localhost' 
    : window.location.hostname;
const API_BASE_URL = `http://${API_HOST}:5000/api`;

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true;

// API client object
const api = {
    /**
     * Database API endpoints
     */
    database: {
        /**
         * Connect to MySQL database
         * @param {Object} credentials - Database credentials
         * @returns {Promise} - Axios response
         */
        connect(credentials) {
            return axios.post('/database/connect', credentials);
        },

        /**
         * Test database connection
         * @param {Object} credentials - Database credentials
         * @returns {Promise} - Axios response
         */
        test(credentials) {
            return axios.post('/database/test', credentials);
        },

        /**
         * Get database schema
         * @returns {Promise} - Axios response
         */
        getSchema() {
            return axios.get('/database/schema');
        },

        /**
         * Execute SQL query
         * @param {string} sql - SQL query
         * @returns {Promise} - Axios response
         */
        executeQuery(sql) {
            return axios.post('/database/query', { sql });
        },

        /**
         * Get connection status
         * @returns {Promise} - Axios response
         */
        getStatus() {
            return axios.get('/database/status');
        },

        /**
         * Disconnect from database
         * @returns {Promise} - Axios response
         */
        disconnect() {
            return axios.post('/database/disconnect');
        }
    },

    /**
     * Chat API endpoints
     */
    chat: {
        /**
         * Get chat history
         * @returns {Promise} - Axios response
         */
        getHistory() {
            return axios.get('/chat/history');
        },

        /**
         * Send chat message
         * @param {Object} messageData - Message data
         * @returns {Promise} - Axios response
         */
        sendMessage(messageData) {
            return axios.post('/chat/message', messageData);
        },

        /**
         * Clear chat history
         * @returns {Promise} - Axios response
         */
        clearHistory() {
            return axios.post('/chat/clear');
        },

        /**
         * Check if message is casual
         * @param {string} message - Message to check
         * @returns {Promise} - Axios response
         */
        checkCasual(message) {
            return axios.post('/chat/check-casual', { message });
        }
    },

    /**
     * Models API endpoints
     */
    models: {
        /**
         * Get available LLM providers
         * @returns {Promise} - Axios response
         */
        getProviders() {
            return axios.get('/models/providers');
        },

        /**
         * Get available Ollama models
         * @returns {Promise} - Axios response
         */
        getOllamaModels() {
            return axios.get('/models/ollama');
        },

        /**
         * Get available Gemini models
         * @returns {Promise} - Axios response
         */
        getGeminiModels() {
            return axios.get('/models/gemini');
        },

        /**
         * Get models for specific provider
         * @param {string} provider - Provider name
         * @returns {Promise} - Axios response
         */
        getModelsForProvider(provider) {
            return axios.get(`/models/${provider}`);
        }
    },

    /**
     * Connections API endpoints (persisted connections)
     */
    connections: {
        /**
         * List all saved connections
         * @returns {Promise} - Axios response
         */
        list() {
            return axios.get('/connections');
        },

        /**
         * Create a new connection
         * @param {Object} data - Connection data
         * @returns {Promise} - Axios response
         */
        create(data) {
            return axios.post('/connections', data);
        },

        /**
         * Get a single connection
         * @param {number} id - Connection ID
         * @returns {Promise} - Axios response
         */
        get(id) {
            return axios.get(`/connections/${id}`);
        },

        /**
         * Update a connection
         * @param {number} id - Connection ID
         * @param {Object} data - Updated data
         * @returns {Promise} - Axios response
         */
        update(id, data) {
            return axios.put(`/connections/${id}`, data);
        },

        /**
         * Delete a connection
         * @param {number} id - Connection ID
         * @returns {Promise} - Axios response
         */
        delete(id) {
            return axios.delete(`/connections/${id}`);
        },

        /**
         * Test a saved connection
         * @param {number} id - Connection ID
         * @returns {Promise} - Axios response
         */
        test(id) {
            return axios.post(`/connections/${id}/test`);
        },

        /**
         * Connect to a saved connection
         * @param {number} id - Connection ID
         * @returns {Promise} - Axios response
         */
        connect(id) {
            return axios.post(`/connections/${id}/connect`);
        }
    },

    /**
     * Chats API endpoints (persisted chats)
     */
    chats: {
        /**
         * List all chats
         * @returns {Promise} - Axios response
         */
        list() {
            return axios.get('/chats');
        },

        /**
         * Create a new chat
         * @param {Object} data - Chat data
         * @returns {Promise} - Axios response
         */
        create(data) {
            return axios.post('/chats', data);
        },

        /**
         * Get a single chat
         * @param {number} id - Chat ID
         * @returns {Promise} - Axios response
         */
        get(id) {
            return axios.get(`/chats/${id}`);
        },

        /**
         * Update a chat
         * @param {number} id - Chat ID
         * @param {Object} data - Updated data
         * @returns {Promise} - Axios response
         */
        update(id, data) {
            return axios.put(`/chats/${id}`, data);
        },

        /**
         * Delete a chat
         * @param {number} id - Chat ID
         * @returns {Promise} - Axios response
         */
        delete(id) {
            return axios.delete(`/chats/${id}`);
        },

        /**
         * Get messages for a chat
         * @param {number} id - Chat ID
         * @returns {Promise} - Axios response
         */
        getMessages(id) {
            return axios.get(`/chats/${id}/messages`);
        },

        /**
         * Add a message to a chat
         * @param {number} id - Chat ID
         * @param {Object} data - Message data
         * @returns {Promise} - Axios response
         */
        addMessage(id, data) {
            return axios.post(`/chats/${id}/messages`, data);
        },

        /**
         * Send a message and get AI response
         * @param {number} id - Chat ID
         * @param {Object} data - Message data
         * @returns {Promise} - Axios response
         */
        send(id, data) {
            return axios.post(`/chats/${id}/send`, data);
        }
    }
};

// Error handling interceptor
axios.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);
        
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.error || 'Server error occurred';
            console.error('Error message:', message);
        } else if (error.request) {
            // Request was made but no response
            console.error('No response from server. Is the backend running?');
        } else {
            // Error in request setup
            console.error('Request error:', error.message);
        }
        
        return Promise.reject(error);
    }
);
