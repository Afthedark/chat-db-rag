# Frontend — Chat DB RAG 🎨

Interfaz de usuario del sistema RAG de dos pasos. Arquitectura MPA (Multi-Page Application) construida con HTML5, CSS Variables, Alpine.js y el componente web **Deep Chat**.

---

## 📂 Estructura del Frontend

```text
/frontend
├── index.html          # Página principal del Chat RAG (Deep Chat)
├── rules.html          # Panel de administración de Reglas IA
├── databases.html      # Panel de administración de Conexiones SQL
├── style.css           # Sistema de diseño global (Design System)
├── deepchat.md         # Referencia técnica del componente Deep Chat
└── /src
    ├── chat.js         # Controlador Alpine.js del chat
    ├── rules.js        # Controlador Alpine.js de reglas
    ├── databases.js    # Controlador Alpine.js de bases de datos
    └── utils.js        # ⭐ Utilidades globales (temas, toasts, modales)
```

---

## 🎨 Design System (`style.css`)

El sistema de diseño está basado en **variables CSS** que responden dinámicamente al atributo `data-bs-theme` de Bootstrap 5.

### Tokens de Color

| Variable CSS | Dark Mode | Light Mode | Uso |
|---|---|---|---|
| `--bg-main` | `#171717` | `#ffffff` | Fondo principal |
| `--bg-panel` | `#171717` | `#fcfcfc` | Paneles y sidebar |
| `--bg-darker` | `#212121` | `#f3f4f6` | Celdas, inputs, cards |
| `--c-primary` | `#3b82f6` | `#007aff` | Botones, enlaces activos |
| `--c-text-1` | `#ececec` | `#1d1d1f` | Texto principal |
| `--c-text-2` | `#b4b4b4` | `#86868b` | Texto secundario |
| `--c-input-bg` | `#2f2f2f` | `#f5f5f7` | Fondo de inputs |
| `--c-input-border` | `#3c3c3c` | `#d2d2d7` | Bordes de inputs |
| `--c-border` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` | Divisores |

### Para agregar un color nuevo:

```css
/* En style.css */
[data-bs-theme='dark']  { --mi-nuevo-color: #valor-oscuro; }
[data-bs-theme='light'] { --mi-nuevo-color: #valor-claro; }
```

---

## 🔧 Utilidades Globales (`src/utils.js`)

Archivo central que evita duplicación de lógica en toda la app. **Siempre cargado antes que los controladores.**

### API pública de `UIUtils`

```javascript
// Inicializar tema (leer localStorage + sincronizar Bootstrap)
UIUtils.initTheme()  // → 'dark' | 'light'

// Alternar tema y persistir en localStorage
UIUtils.toggleTheme()  // → 'dark' | 'light'

// Obtener configuración base de SweetAlert2 según el tema actual
UIUtils.getSwalConfig()  // → objeto con background, color, customClass, etc.

// Mostrar un Toast de notificación elegante
UIUtils.showToast('Mensaje', 'success' | 'error' | 'info' | 'warning')
```

### Para usar en un nuevo controlador Alpine.js:

```javascript
// Al init del componente:
this.theme = UIUtils.initTheme();

// Para modales de confirmación:
const confirmed = await Swal.fire({
    title: '¿Seguro?',
    icon: 'warning',
    showCancelButton: true,
    ...UIUtils.getSwalConfig()  // ← Hereda colores del tema automáticamente
});
```

---

## 🤖 Componente Deep Chat (`src/chat.js`)

El chat usa el Web Component `<deep-chat>` de [deepchat.dev](https://deepchat.dev).

> **Regla importante:** Las propiedades de Deep Chat se asignan **directamente al elemento DOM** como objetos JavaScript, no como atributos HTML. Esto evita errores de serialización.

### Flujo de configuración

```javascript
// ✅ Correcto: asignación directa al elemento DOM
const chatEl = document.getElementById('rag-deep-chat');
chatEl.textInput      = { styles: { container: {...}, text: {...}, focus: {...} } };
chatEl.names          = { ai: { text: 'Asistente IA' }, user: { text: 'Tú' } };
chatEl.messageStyles  = { default: { shared: {...}, user: {...}, ai: {...} } };

// ❌ Incorrecto: atributo HTML con binding de Alpine.js
// :text-input='getDeepChatConfig().textInput'  <-- No funciona bien
```

### Estructura de `getDeepChatConfig()`

La función centraliza **toda la configuración visual** del chat y retorna el objeto adaptado al tema activo. Para modificar colores del input, burbujas o botón de envío, editar solo esta función.

```
getDeepChatConfig()
├── textInput         → Estilos del campo de texto (container, text, focus, placeholder)
├── names             → Etiquetas de los participantes ("Asistente IA", "Tú")
├── messageStyles     → Burbujas del chat (shared, user, ai)
├── submitButtonStyles → Botón de enviar (colores + hover)
└── auxiliaryStyle    → CSS raw para el Shadow DOM interno de Deep Chat
```

### Para cambiar el placeholder del input:

```javascript
// En getDeepChatConfig() → textInput → placeholder
placeholder: {
    text: 'Tu nuevo texto aquí...',
    style: { color: '#9ca3af', fontStyle: 'italic' }
}
```

---

## 🌗 Sistema de Temas (Light / Dark)

El tema se controla mediante el atributo `data-bs-theme` en el `<html>` y se persiste en `localStorage` con la clave `app-theme`.

### Paleta Oscura (Qwen-style)
- Fondo principal: `#171717` (gris carbón profundo)
- Acento: `#3b82f6` (azul eléctrico)
- Texto: `#ececec`

### Paleta Clara (Apple-style)
- Fondo principal: `#ffffff` (blanco puro)
- Acento: `#007aff` (azul Apple)
- Texto: `#1d1d1f`

### Para agregar soporte de temas a una nueva página admin:

1. En el `init()` del controlador Alpine.js:
```javascript
initTheme() {
    this.theme = localStorage.getItem('app-theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', this.theme);
},
```

2. En el HTML, usar variables CSS en lugar de colores fijos:
```html
<!-- ❌ Evitar -->
<div class="bg-dark text-light">

<!-- ✅ Preferir -->
<div style="background: var(--bg-panel); color: var(--c-text-1);">
```

---

## 📄 Páginas Admin (`rules.html` / `databases.html`)

Ambas páginas son **independientes** del chat y cargan sus propios controladores Alpine.js. Al agregar una nueva sección admin, seguir este patrón:

1. Crear `mi-seccion.html` con la estructura de sidebar y main panel.
2. Crear `src/mi-seccion.js` con `window.miSeccionApp = function() { return {...} }`.
3. Añadir el enlace de navegación en la `<nav>` de todos los `.html` existentes.
4. Registrar la ruta en el backend (`backend/routes/`).

---

## 🛠️ Dependencias (CDN)

| Librería | Versión | Uso |
|---|---|---|
| Bootstrap 5 | 5.3.3 | Layout, utilities, modales |
| Bootstrap Icons | 1.11.3 | Iconografía |
| Alpine.js | 3.13.3 | Reactividad declarativa |
| Axios | latest | Cliente HTTP |
| SweetAlert2 | 11 | Modales y Toasts |
| Deep Chat | latest | Componente de chat |
| PrismJS | 1.29.0 | Resaltado de SQL |
| Google Fonts (Inter) | — | Tipografía principal |

---

## 🚫 Reglas de Mantenimiento

1. **No usar colores hex directos en HTML/CSS** → Siempre usar variables CSS del design system.
2. **No duplicar lógica de temas/toasts** → Usar `UIUtils` desde `utils.js`.
3. **No agregar `data-bs-theme` fijo en `<html>`** → Se gestiona dinámicamente via JS.
4. **No usar clases `bg-dark`, `text-light` en elementos reutilizables** → Bloquean el modo claro.
5. **Toda propiedad de Deep Chat** → Asignarla via JS en `applyDeepChatTheme()`, no como atributo HTML.
