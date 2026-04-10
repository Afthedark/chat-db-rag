# Chat DB RAG - CSS Architecture

## Estructura de Archivos CSS

Este proyecto utiliza una arquitectura CSS separada para mejorar la organización, mantenibilidad y escalabilidad.

```
styles/
├── base.css      # Estilos base, tema y layout desktop
├── mobile.css    # Media queries y estilos móvil
└── README.md     # Este archivo
```

## Convenciones

### base.css
- **Propósito**: Estilos que aplican a **todas** las pantallas
- **Contenido**:
  - Variables CSS (:root, data-bs-theme)
  - Estilos base (body, tipografía)
  - Layout desktop (sidebar, main-panel)
  - Componentes base (botones, tablas, cards)
  - Animaciones
  - Estilos Deep Chat
- **No debe contener**: Media queries

### mobile.css
- **Propósito**: Estilos específicos para dispositivos móviles
- **Contenido**:
  - Media queries (`@media (max-width: 768px)`)
  - Overrides de estilos base para móvil
  - Layout móvil del sidebar
  - Ajustes de componentes para pantallas pequeñas
- **Debe cargarse DESPUÉS** de base.css

## Breakpoints

| Breakpoint | Descripción | Archivo |
|------------|-------------|---------|
| `< 768px` | Móvil | `mobile.css` |
| `769px - 991px` | Tablet | `mobile.css` (sección tablet) |
| `992px+` | Desktop | `base.css` |
| `1200px+` | Large Desktop | `mobile.css` (sección large) |

## Uso en HTML

```html
<!-- Cargar base.css PRIMERO -->
<link href="/styles/base.css" rel="stylesheet">

<!-- Cargar mobile.css DESPUÉS (sobrescribe cuando aplica) -->
<link href="/styles/mobile.css" rel="stylesheet">
```

## Jerarquía de z-index

```
z-index: 1060  → mobile-header
z-index: 1050  → sidebar (cuando está abierto)
z-index: 1040  → sidebar-overlay
z-index: 1030  → main content
```

## Guía de Contribución

### Agregar un nuevo componente

1. **Si es un componente base** (aplica a todas las pantallas):
   - Agregar a `base.css`
   - Definir estilos base sin media queries

2. **Si necesita ajustes en móvil**:
   - Agregar el componente base en `base.css`
   - Agregar overrides en `mobile.css` dentro de `@media (max-width: 768px)`

### Ejemplo

```css
/* base.css */
.my-component {
    padding: 2rem;
    font-size: 1rem;
}

/* mobile.css */
@media (max-width: 768px) {
    .my-component {
        padding: 1rem;
        font-size: 0.875rem;
    }
}
```

## Variables CSS

Las variables están definidas en `base.css` y son consistentes entre temas:

### Background Hierarchy
| Variable | Descripción |
|----------|-------------|
| `--bg-main` | Fondo principal (más profundo) |
| `--bg-panel` | Fondo de paneles/sidebar |
| `--bg-darker` | Fondo más oscuro (inputs, cards) |
| `--bg-elevated` | Fondo elevado (hover states) |

### Colors
| Variable | Descripción |
|----------|-------------|
| `--c-primary` | Color primario (azul vibrante) |
| `--c-primary-hover` | Hover del primario |
| `--c-primary-glow` | Glow/sombra del primario |
| `--c-text-1` | Texto principal (alto contraste) |
| `--c-text-2` | Texto secundario |
| `--c-text-3` | Texto terciario/muted |
| `--c-border` | Bordes y divisores |
| `--c-border-hover` | Bordes en hover |

### Semantic Colors
| Variable | Descripción |
|----------|-------------|
| `--c-success` | Verde éxito |
| `--c-warning` | Amarillo advertencia |
| `--c-error` | Rojo error |
| `--c-info` | Cyan información |

### Shadows
| Variable | Descripción |
|----------|-------------|
| `--shadow-sm` | Sombra pequeña |
| `--shadow-md` | Sombra media |
| `--shadow-lg` | Sombra grande |
| `--shadow-glow` | Glow del color primario |

## Transiciones y Animaciones

- **Velocidad estándar**: `0.25s` (definido en `--transition-speed`)
- **Easing suave**: `cubic-bezier(0.4, 0, 0.2, 1)` (`--transition-smooth`)
- **Easing bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (`--transition-bounce`)
- **Fade in**: `0.4s ease-out`

### Clases de Animación Disponibles

| Clase | Efecto |
|-------|--------|
| `.fade-in` | Entrada fade + slide up |
| `.slide-in` | Entrada slide desde izquierda |
| `.bounce` | Rebote vertical |
| `.pulse` | Pulso de opacidad |
| `.stagger-item` | Animación escalonada para listas |
| `.btn-scale` | Escala suave en botones |
| `.focus-ring` | Ring de foco animado |

## Notas de Mantenimiento

1. **Nunca uses `!important`** a menos que sea absolutamente necesario
2. **Mantén la especificidad baja** para facilitar overrides
3. **Usa variables CSS** para colores y valores repetidos
4. **Testea en múltiples tamaños** al agregar nuevos estilos
5. **Documenta cambios significativos** en este README

## Historial de Cambios

### 2024-XX-XX - Theme Enhancement
- **Paleta de colores mejorada**:
  - Dark theme: Fondos más profundos (#0a0a0a), acentos más vibrantes
  - Light theme: Fondos más suaves (#fafafa), mejor contraste
  - Colores semánticos añadidos (success, warning, error, info)
  - Sistema de sombras mejorado con glow effects
- **Animaciones añadidas**:
  - Transiciones suaves en todos los componentes interactivos
  - Efecto shimmer mejorado para loading states
  - Animaciones escalonadas para listas
  - Focus rings animados
- **Tipografía mejorada**:
  - Jerarquía de headings definida
  - Font smoothing para mejor legibilidad
  - Espaciado consistente
- **Scrollbar styling** personalizado

### 2024-XX-XX
- Separación inicial de `style.css` en `base.css` y `mobile.css`
- Creación de esta documentación
