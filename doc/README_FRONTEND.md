# Chat-With-MySQL - Frontend Documentation

Interfaz de usuario para el asistente de MySQL con persistencia. Frontend vanilla JavaScript con Bootstrap 5, tema claro/oscuro, y diseño responsive.

---

## Tabla de Contenidos
1. [Tecnologías](#tecnologías)
2. [Estructura](#estructura)
3. [Arquitectura](#arquitectura)
4. [Módulos](#módulos)
5. [Flujo de Datos](#flujo-de-datos)
6. [Características](#características)
7. [API Client](#api-client)
8. [Eventos](#eventos)
9. [Solución de Problemas](#solución-de-problemas)

---

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Bootstrap | 5.3.2 | UI Framework |
| Font Awesome | 6.4.2 | Iconos |
| Axios | 1.6.0 | HTTP Client |
| Vanilla JS | ES6+ | Lógica de la aplicación |
| CSS Variables | - | Tema claro/oscuro |

---

## Estructura

```
frontend/
├── index.html              # Página principal
├── css/
│   ├── base.css            # Estilos base y variables
│   ├── desktop.css         # Estilos para escritorio
│   └── mobile.css          # Estilos responsive móvil
└── js/
    ├── api.js              # Cliente API (Axios)
    ├── app.js              # Inicialización y utilidades
    ├── chat.js             # UI del chat y mensajes
    ├── chats.js            # Gestión de chats persistentes
    ├── connections.js      # Gestión de conexiones a BD
    ├── database.js         # Configuración LLM (sidebar)
    ├── suggestions.js      # Burbuja de sugerencias
    └── theme.js            # Gestión de tema claro/oscuro
```

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│              index.html                 │
│  ┌─────────────────────────────────┐    │
│  │           Sidebar               │    │
│  │  - Quick Actions                │    │
│  │  - Chats (chats.js)             │    │
│  │  - Connections (connections.js) │    │
│  │  - Current Chat Info            │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │         Main Content            │    │
│  │  - Welcome Screen               │    │
│  │  - Chat Messages (chat.js)      │    │
│  │  - Input Area                   │    │
│  │  - Suggestions Bubble           │    │
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
- `app.openSidebar(e)` - Abrir menú lateral móvil
- `app.closeSidebar()` - Cerrar menú lateral móvil
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
- `connections.showNewConnectionModal()` - Mostrar modal nueva conexión

**Eventos:**
- Click en conexión guardada → `connections.connect(id)`
- Click en "Agregar Conexión" → `connections.showNewConnectionModal()`
- Click en "Guardar" (modal) → `connections.save()`
- Click en "Probar" (modal) → `connections.test()`

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
- `chats.flashChatItem(id)` - Efecto visual en item de chat
- `chats.updateProviderBadge(config)` - Actualizar badge de proveedor

**Modal de Nuevo Chat:**
- Selección de conexión (dropdown)
- Título opcional
- Proveedor LLM (Ollama/Gemini/OpenRouter)
- Modelo específico
- API Key (para Gemini)

**Optimizaciones:**
- Si se selecciona el mismo chat, muestra toast informativo sin recargar
- Efecto visual de "flash" en el item del chat
- Contador de chats en el header de la sección

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

Maneja la interfaz de mensajes, el input, y la pantalla de bienvenida.

**Estado:**
```javascript
chat.messagesContainer = null;
chat.messageInput = null;
chat.sendButton = null;
chat.welcomeScreen = null;
chat.isProcessing = false;
```

**Métodos principales:**
- `chat.loadMessages(messages)` - Cargar mensajes históricos
- `chat.addMessage(content, type)` - Agregar mensaje al UI
- `chat.addAIResponse(message, sql, results)` - Agregar respuesta con SQL
- `chat.enableInput()` - Habilitar input y mostrar chat
- `chat.disableInput()` - Deshabilitar input y mostrar bienvenida
- `chat.showWelcomeScreen()` - Mostrar pantalla de bienvenida
- `chat.hideWelcomeScreen()` - Ocultar pantalla de bienvenida
- `chat.sendMessage()` - Enviar mensaje
- `chat.formatMessage(content)` - Formatear mensaje con código

**Tipos de mensajes:**
- `user` - Mensaje del usuario (derecha, gradiente)
- `assistant` - Respuesta de la IA (izquierda, card)
- `sql` - Bloque de código SQL (colapsable)

---

### 6. `database.js` - Configuración LLM (Legacy)

**Nota:** La selección de proveedor LLM se ha movido al modal de "Nuevo Chat". Este módulo se mantiene por compatibilidad.

**Funcionalidad:**
- Carga inicial de modelos Ollama
- Verificación de estado de conexión

### 7. `suggestions.js` - Burbuja de Sugerencias

Maneja la burbuja flotante de preguntas sugeridas.

**Funcionalidad:**
- Burbuja flotante con animación de pulso
- Panel de sugerencias categorizadas
- 50+ preguntas de ejemplo organizadas por categoría
- Categorías: Consultas Básicas, Ventas, Productos, Clientes, Tiempo, Combinaciones

**Métodos principales:**
- `suggestions.init()` - Inicializar burbuja y panel
- `suggestions.togglePanel()` - Mostrar/ocultar panel
- `suggestions.useQuestion(question)` - Usar pregunta en el chat

### 8. `theme.js` - Gestión de Tema

Maneja el tema claro/oscuro de la aplicación.

**Funcionalidad:**
- Detección automática de preferencia del sistema
- Persistencia en localStorage
- Toggle en el header del chat

**Métodos principales:**
- `theme.init()` - Inicializar tema
- `theme.toggle()` - Cambiar entre claro/oscuro
- `theme.setTheme(themeName)` - Establecer tema específico

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

## Características

### Tema Claro/Oscuro
- Toggle en el header del chat
- Persistencia en localStorage
- Detección automática de preferencia del sistema

### Sidebar Mejorado
- **Secciones colapsables**: Chats, Conexiones, Info del Chat
- **Acciones rápidas**: Botón "Nuevo Chat" prominente
- **Contadores**: Badges con cantidad de chats y conexiones
- **Diseño optimizado**: Items compactos con hover effects
- **Responsive**: Sidebar drawer en móvil con ancho optimizado
- **Auto-cierre inteligente**: El sidebar se cierra automáticamente tras acciones clave en móvil (seleccionar chat, crear chat, conectar BD) para mejorar el flujo de trabajo.

### Pantalla de Bienvenida
- Se muestra cuando no hay chat seleccionado
- Instrucciones claras para el usuario
- Indicación de usar el menú lateral

### Burbuja de Sugerencias
- Burbuja flotante con animación de pulso
- 50+ preguntas de ejemplo categorizadas
- Panel deslizable con categorías

### Optimizaciones UX
- **Chat Selection**: Si se clickea el mismo chat, muestra toast sin recargar
- **Flash Effect**: Animación visual en el item del chat
- **Provider Badge**: Muestra el proveedor y modelo del chat activo
- **Auto-connect**: Conexión automática a la BD al seleccionar chat

### Responsive Design
- **Desktop**: Sidebar fijo de 250px
- **Tablet**: Sidebar drawer de 70% ancho
- **Mobile**: Sidebar drawer de 85% ancho (max 340px)
- Touch-friendly: Botones de 44px mínimo

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

### Tema no persiste entre sesiones

**Causa:** localStorage no está disponible o fue limpiado.

**Solución:**
```javascript
// Verificar en consola
localStorage.getItem('theme');

// Establecer manualmente
localStorage.setItem('theme', 'dark');
```

### Sidebar no abre en móvil

**Causa:** JavaScript no cargó o error en el event listener.

**Solución:**
1. Verificar que `app.js` se cargue correctamente
2. Revisar consola por errores de JavaScript
3. Verificar que el botón toggle tenga el ID correcto: `sidebar-toggle`

### Burbuja de sugerencias no aparece

**Causa:** El módulo `suggestions.js` no se cargó.

**Solución:**
1. Verificar que `suggestions.js` esté incluido en `index.html`
2. Verificar que no haya errores en la consola
3. Llamar manualmente: `suggestions.init()`

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

## Arquitectura CSS

El frontend utiliza una arquitectura CSS modular:

### `base.css`
- Variables CSS para tema claro/oscuro
- Estilos base y reset
- Componentes reutilizables
- Animaciones y transiciones

### `desktop.css`
- Layout para pantallas ≥992px
- Sidebar fijo
- Grid de Bootstrap

### `mobile.css`
- Layout para pantallas <992px
- Sidebar drawer
- Touch optimizations
- Media queries específicas

### Sistema de Animaciones Premium

La aplicación utiliza un sistema de transiciones suave para mantener una estética de alta calidad:

- **Button Loaders (`.btn-loading`)**: Para acciones rápidas (como probar conexión), se usa un spinner interno en el botón en lugar de bloquear toda la interfaz.
- **Cross-Fade Transitions**: El cambio entre la pantalla de bienvenida y el área de chat utiliza fundidos de opacidad (`.fade-in`, `.fade-out`).
- **Exit Animations**: Módulos como el panel de sugerencias tienen animaciones de salida (`slideDown`, `slideOutRight`) antes de removerse visualmente.
- **Feedback Visual (`.chat-item-flash`)**: Resaltado suave de elementos recién seleccionados o modificados.
- **Modales con Blur**: Uso de `backdrop-filter: blur()` en los fondos de los modales para centrar la atención.

### Variables CSS Principales
```css
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --bg-sidebar: #ffffff;
  --bg-chat: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --radius-md: 10px;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

**Frontend desarrollado con:** Vanilla JS + Bootstrap 5 + Font Awesome + CSS Variables
