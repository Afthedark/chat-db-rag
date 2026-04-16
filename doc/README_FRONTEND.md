# Chat-With-MySQL - Frontend Documentation

Interfaz de usuario para el asistente de MySQL con persistencia. Frontend vanilla JavaScript con Bootstrap 5.

---

## Tabla de Contenidos
1. [Tecnologías](#tecnologías)
2. [Estructura](#estructura)
3. [Arquitectura](#arquitectura)
4. [Módulos](#módulos)
5. [Flujo de Datos](#flujo-de-datos)
6. [API Client](#api-client)
7. [Eventos](#eventos)
8. [Solución de Problemas](#solución-de-problemas)

---

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Bootstrap | 5.3.2 | UI Framework |
| Font Awesome | 6.4.2 | Iconos |
| Axios | 1.6.0 | HTTP Client |
| Vanilla JS | ES6+ | Lógica de la aplicación |

---

## Estructura

```
frontend/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos personalizados
└── js/
    ├── api.js              # Cliente API (Axios)
    ├── app.js              # Inicialización y utilidades
    ├── chat.js             # UI del chat y mensajes
    ├── chats.js            # Gestión de chats persistentes
    ├── connections.js      # Gestión de conexiones a BD
    └── database.js         # Configuración LLM (sidebar)
```

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│              index.html                 │
│  ┌─────────────────────────────────┐    │
│  │           Sidebar               │    │
│  │  - Connections (connections.js) │    │
│  │  - Chats (chats.js)             │    │
│  │  - LLM Provider (database.js)   │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │         Main Content            │    │
│  │  - Chat Messages (chat.js)      │    │
│  │  - Input Area                   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                   │
                   │ HTTP/JSON
                   ▼
┌─────────────────────────────────────────┐
│           Backend Flask                 │
│         (localhost:5000)                │
└─────────────────────────────────────────┘
```

---

## Módulos

### 1. `api.js` - Cliente API

Cliente Axios configurado para comunicarse con el backend.

```javascript
// Base URL configuration
const API_BASE_URL = 'http://localhost:5000';

// API endpoints organized by resource
api.connections.list()      // GET /api/connections
api.connections.create()    // POST /api/connections
api.chats.list()            // GET /api/chats
api.chats.create()          // POST /api/chats
api.chats.send()            // POST /api/chats/{id}/send
api.models.getOllamaModels() // GET /api/models/ollama
```

**Configuración CORS:**
El backend debe tener configurado `CORS_ORIGINS` con `http://localhost:3000`.

---

### 2. `app.js` - Aplicación Principal

Punto de entrada y utilidades globales.

**Funciones principales:**
- `app.showToast(message, type)` - Mostrar notificaciones
- `app.showLoading(text)` - Mostrar modal de carga
- `app.hideLoading()` - Ocultar modal de carga
- `app.init()` - Inicializar todos los módulos

**Inicialización:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
```

---

### 3. `connections.js` - Gestión de Conexiones

Maneja las conexiones guardadas a bases de datos MySQL.

**Estado:**
```javascript
connections.connectionsList = [];  // Lista de conexiones
connections.currentConnectionId = null;  // Conexión activa
```

**Métodos principales:**
- `connections.loadConnections()` - Cargar desde API
- `connections.renderConnectionsList()` - Renderizar en sidebar
- `connections.connect(id)` - Conectar a una BD
- `connections.save()` - Guardar nueva conexión
- `connections.test()` - Probar conexión

**Eventos:**
- Click en conexión guardada → `connections.connect(id)`
- Click en "Save Connection" → `connections.save()`
- Click en "Test Connection" → `connections.test()`

---

### 4. `chats.js` - Gestión de Chats

Maneja la creación y selección de chats persistentes.

**Estado:**
```javascript
chats.chatsList = [];        // Lista de chats
chats.currentChatId = null;  // Chat activo
```

**Métodos principales:**
- `chats.loadChats()` - Cargar chats del usuario
- `chats.showNewChatModal()` - Mostrar modal nuevo chat
- `chats.createChat()` - Crear chat con configuración
- `chats.selectChat(id)` - Seleccionar y cargar chat
- `chats.sendMessage(message)` - Enviar mensaje al chat

**Modal de Nuevo Chat:**
- Selección de conexión (dropdown)
- Título opcional
- Proveedor LLM (Ollama/Gemini)
- Modelo específico
- API Key (para Gemini)

**Modelos Ollama disponibles:**
```javascript
[
    'llama3.2:3b',
    'phi4-mini-reasoning:3.8b',
    'deepseek-r1:14b',
    'qwen3.5:9b',
    'llama3.1:8b',
    'gemma4:e4b'
]
```

---

### 5. `chat.js` - UI del Chat

Maneja la interfaz de mensajes y el input.

**Estado:**
```javascript
chat.messagesContainer = null;
chat.messageInput = null;
chat.sendButton = null;
chat.isInputEnabled = false;
```

**Métodos principales:**
- `chat.loadMessages(messages)` - Cargar mensajes históricos
- `chat.addMessage(content, type)` - Agregar mensaje al UI
- `chat.enableInput()` - Habilitar input
- `chat.disableInput()` - Deshabilitar input
- `chat.sendMessage()` - Enviar mensaje

**Tipos de mensajes:**
- `user` - Mensaje del usuario (derecha, azul)
- `assistant` - Respuesta de la IA (izquierda, gris)
- `sql` - Bloque de código SQL (con syntax highlighting)

---

### 6. `database.js` - Configuración LLM

Maneja la selección de proveedor LLM en el sidebar.

**Funcionalidad:**
- Cambiar entre Ollama y Gemini
- Seleccionar modelo específico
- Mostrar/ocultar campos según proveedor
- Cargar modelos Ollama disponibles

**Eventos:**
- Cambio de proveedor → `database.handleProviderChange()`
- Cambio de modelo → Actualiza badge en header

---

## Flujo de Datos

### Crear un nuevo chat:

```
1. Usuario click "New Chat"
   ↓
2. chats.showNewChatModal()
   - Valida que existan conexiones
   - Carga conexiones en dropdown
   - Muestra modal
   ↓
3. Usuario completa formulario
   ↓
4. chats.createChat()
   - POST /api/chats
   - Cierra modal
   - Recarga lista de chats
   - Selecciona nuevo chat
   ↓
5. chats.selectChat(id)
   - GET /api/chats/{id}/messages
   - Auto-conecta a la BD
   - chat.loadMessages()
   - chat.enableInput()
```

### Enviar mensaje:

```
1. Usuario escribe y presiona Enter
   ↓
2. chat.sendMessage()
   - Agrega mensaje al UI
   - Limpia input
   ↓
3. chats.sendMessage(message)
   - POST /api/chats/{id}/send
   - Muestra loading
   ↓
4. Backend procesa:
   - Genera SQL
   - Ejecuta en BD
   - Genera respuesta
   ↓
5. Frontend recibe respuesta
   - chat.loadMessages() con historial actualizado
```

---

## API Client

### Configuración

```javascript
// api.js
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
    timeout: 120000,  // 2 minutos para consultas complejas
    headers: {
        'Content-Type': 'application/json'
    }
});
```

### Endpoints

**Conexiones:**
```javascript
api.connections.list()              // GET /api/connections
api.connections.create(data)        // POST /api/connections
api.connections.get(id)             // GET /api/connections/{id}
api.connections.update(id, data)    // PUT /api/connections/{id}
api.connections.delete(id)          // DELETE /api/connections/{id}
api.connections.test(id)            // POST /api/connections/{id}/test
api.connections.connect(id)         // POST /api/connections/{id}/connect
```

**Chats:**
```javascript
api.chats.list()                    // GET /api/chats
api.chats.create(data)              // POST /api/chats
api.chats.get(id)                   // GET /api/chats/{id}
api.chats.update(id, data)          // PUT /api/chats/{id}
api.chats.delete(id)                // DELETE /api/chats/{id}
api.chats.getMessages(id)           // GET /api/chats/{id}/messages
api.chats.send(id, data)            // POST /api/chats/{id}/send
```

**Modelos:**
```javascript
api.models.getOllamaModels()        // GET /api/models/ollama
```

---

## Eventos

### Eventos Globales

```javascript
// Inicialización
document.addEventListener('DOMContentLoaded', app.init);

// Tecla Enter en input de mensaje
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') chat.sendMessage();
});
```

### Eventos del Modal

```javascript
// Cambio de proveedor en modal
new-chat-provider.addEventListener('change', (e) => {
    chats._handleModalProviderChange(e.target.value);
});

// Crear chat
btn-create-chat.addEventListener('click', () => {
    chats.createChat();
});
```

---

## Solución de Problemas

### Error: "Cannot read property 'classList' of null"

**Causa:** Elemento DOM no existe cuando se ejecuta el código.

**Solución:**
```javascript
// Siempre verificar existencia
const element = document.getElementById('id');
if (element) {
    element.classList.add('class');
}
```

### Error: "Failed to fetch" o "Network Error"

**Causa:** Backend no está corriendo o problema CORS.

**Solución:**
1. Verificar que backend esté en `localhost:5000`
2. Verificar configuración CORS en backend
3. Verificar que no haya bloqueo de navegador

### Error: "No chats yet" persiste después de crear chat

**Causa:** Lista no se actualiza correctamente.

**Solución:**
```javascript
// Forzar recarga
chats.loadChats();
```

### Modelos Ollama no aparecen en selector

**Causa:** API de Ollama no responde.

**Solución:**
1. Verificar que Ollama esté corriendo: `ollama serve`
2. El frontend usa lista de respaldo si la API falla
3. Verificar en consola del navegador errores de red

### Chat input no se habilita

**Causa:** No hay conexión activa o chat seleccionado.

**Solución:**
1. Verificar que haya una conexión guardada
2. Crear y seleccionar un chat
3. El input se habilita automáticamente al seleccionar chat

---

## Desarrollo

### Agregar nuevo modelo Ollama

Editar `chats.js` y `database.js`:

```javascript
// En _getLocalModelsOptions() y loadOllamaModels()
const models = [
    'llama3.2:3b',
    'nuevo-modelo',  // Agregar aquí
    // ...
];
```

### Agregar nuevo proveedor LLM

1. Agregar opción en `index.html`:
```html
<option value="nuevo">Nuevo Proveedor</option>
```

2. Agregar manejo en `chats.js`:
```javascript
_handleModalProviderChange(provider) {
    if (provider === 'nuevo') {
        // Mostrar panel específico
    }
}
```

3. Agregar en `database.js`:
```javascript
handleProviderChange(provider) {
    if (provider === 'nuevo') {
        // Actualizar UI
    }
}
```

---

**Frontend desarrollado con:** Vanilla JS + Bootstrap 5 + Font Awesome
