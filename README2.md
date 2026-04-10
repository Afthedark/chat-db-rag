# Chat DB RAG - Sistema de Consulta SQL con IA

Sistema de Two-Pass RAG (Retrieval-Augmented Generation) para convertir preguntas en lenguaje natural a consultas SQL ejecutables. Soporta múltiples bases de datos MySQL con gestión de conexiones, ejemplos few-shot y ahora integración MCP (Model Context Protocol).

## Características Principales

- **Two-Pass RAG Architecture**: Clasificación de intención + Generación SQL + Interpretación de resultados
- **Múltiples Conexiones de BD**: Gestión de múltiples bases de datos MySQL
- **Reglas de Contexto**: Sistema de reglas para mejorar la generación de SQL
- **Ejemplos Few-Shot**: Curación de ejemplos SQL para mejorar precisión
- **Seguridad**: Solo consultas SELECT/SHOW, validación de SQL, prevención de inyección
- **MCP Integration**: Interfaz MCP para VS Code, Claude Desktop y otros clientes
- **Interfaz Responsive**: Diseño adaptable para desktop y móvil con temas claro/oscuro

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Web Browser │  │  VS Code     │  │Claude Desktop│           │
│  │  (Alpine.js) │  │  (MCP)       │  │   (MCP)      │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │ HTTP            │ MCP Protocol    │ MCP Protocol
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API REST  │  MCP Server  │  Services  │  Models        │    │
│  │  - Chat    │  - Tools     │  - AI      │  - Sequelize   │    │
│  │  - Rules   │  - Handlers  │  - DB      │  - SQLite/MySQL│    │
│  │  - DB      │              │  - Prompt  │                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │
          │ MySQL Connections
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              BASES DE DATOS EXTERNAS (MySQL)                     │
│         (pv_mchicken, etc. - Configurables)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Tecnologías

### Frontend
- **Alpine.js**: Framework reactivo ligero
- **Bootstrap 5 + MDB**: Componentes UI y Material Design
- **Deep Chat**: Componente de chat con soporte para renderizado de charts
- **Chart.js**: Visualización de datos
- **CSS Modular**: Separación en base.css y mobile.css

### Backend
- **Node.js + Express**: Servidor API
- **Sequelize**: ORM para SQLite (memoria) y MySQL
- **MySQL2**: Driver MySQL con soporte para prepared statements
- **OpenAI SDK**: Integración con Ollama y OpenRouter
- **MCP SDK**: Model Context Protocol server

### AI/LLM
- **Ollama** (default): Modelos locales (qwen2.5-coder:14b)
- **OpenRouter**: API para modelos en la nube

## Estructura del Proyecto

```
chat-db-rag/
├── backend/
│   ├── config/
│   │   └── database.js           # Configuración Sequelize
│   ├── controllers/
│   │   ├── chatController.js     # Lógica de chat y Two-Pass RAG
│   │   ├── databaseController.js # Gestión de conexiones BD
│   │   └── rulesController.js    # Gestión de reglas de contexto
│   ├── mcp/                      # 🆕 MCP Server
│   │   ├── server.js             # Servidor MCP principal
│   │   ├── stdio-server.js       # Entry point stdio
│   │   ├── tools/
│   │   │   ├── definitions.js    # Definiciones de 9 herramientas MCP
│   │   │   └── index.js          # Registro y ejecución
│   │   └── handlers/
│   │       ├── connection.js     # Manejo de conexiones
│   │       ├── query.js          # Ejecución de queries
│   │       └── schema.js         # Inspección de esquema
│   ├── middleware/
│   │   └── errorHandler.js       # Manejo de errores
│   ├── models/
│   │   ├── Chat.js               # Modelo de chats
│   │   ├── ContextRule.js        # Reglas de contexto
│   │   ├── DatabaseConnection.js # Conexiones de BD
│   │   ├── Message.js            # Mensajes
│   │   └── index.js              # Inicialización Sequelize
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   ├── databaseRoutes.js
│   │   └── rulesRoutes.js
│   ├── seeds/
│   │   └── initialRules.js       # Reglas iniciales
│   ├── services/
│   │   ├── aiService.js          # Servicio de IA (Ollama/OpenRouter)
│   │   ├── dbManager.js          # Gestión de pools MySQL
│   │   ├── promptBuilder.js      # Construcción de prompts
│   │   └── sqlValidator.js       # Validación de SQL
│   ├── package.json
│   └── server.js                 # Entry point Express
├── frontend/
│   ├── src/
│   │   ├── chat.js               # Lógica del chat
│   │   ├── databases.js          # Gestión de conexiones
│   │   ├── rules.js              # Gestión de reglas
│   │   └── utils.js              # Utilidades
│   ├── styles/                   # 🆕 CSS Modular
│   │   ├── base.css              # Estilos base y tema
│   │   └── mobile.css            # Media queries móvil
│   ├── index.html                # Chat principal
│   ├── databases.html            # Admin conexiones
│   ├── rules.html                # Admin reglas
│   └── style.css                 # Estilos legacy
├── .vscode/
│   └── mcp.json                  # 🆕 Configuración VS Code MCP
├── MCP_SETUP.md                  # 🆕 Guía MCP
├── MCP_TOOLS_REFERENCE.md        # 🆕 Referencia herramientas MCP
└── README2.md                    # Este archivo
```

## Instalación

### Requisitos
- Node.js 18+
- MySQL 5.7+ (para bases de datos externas)
- Ollama (opcional, para AI local)

### Pasos

1. **Clonar e instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
# Crear backend/.env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b

# O para OpenRouter:
# AI_PROVIDER=openrouter
# OPENROUTER_API_KEY=tu_api_key
# OPENROUTER_MODEL=qwen/qwen-2.5-coder-32b-instruct
```

3. **Iniciar el servidor:**
```bash
npm start
# o para desarrollo:
npm run dev
```

4. **Abrir el frontend:**
```
http://localhost:3000
```

## Uso

### Interfaz Web

1. **Configurar conexión de BD:**
   - Ir a `/admin/databases`
   - Agregar nueva conexión con host, puerto, usuario, contraseña
   - **Importante**: Agregar descripción del esquema para mejorar queries en lenguaje natural

2. **Agregar reglas de contexto:**
   - Ir a `/admin/rules`
   - Crear reglas en categoría `EJEMPLOS_SQL` con ejemplos de tu esquema

3. **Usar el chat:**
   - Seleccionar base de datos
   - Escribir preguntas en lenguaje natural
   - Ver SQL generado y resultados

### MCP (VS Code / Claude Desktop)

#### Configuración VS Code

El archivo `.vscode/mcp.json` ya está configurado:

```json
{
  "servers": {
    "chat-db-rag": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/backend/mcp/stdio-server.js"]
    }
  }
}
```

**Pasos:**
1. Recargar VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Iniciar servidor MCP: `Ctrl+Shift+P` → "MCP: Start Server" → "chat-db-rag"
3. Usar Copilot Chat con comandos como:
   - "List my database connections"
   - "Show tables in connection 1"
   - "How many orders today?"

#### Herramientas MCP Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `chatdb_list_connections` | Listar conexiones configuradas |
| `chatdb_test_connection` | Probar conectividad |
| `chatdb_query` | Ejecutar SQL (SELECT/SHOW) |
| `chatdb_natural_query` | Lenguaje natural a SQL |
| `chatdb_list_tables` | Listar tablas |
| `chatdb_describe_table` | Describir estructura de tabla |
| `chatdb_show_indexes` | Mostrar índices |
| `chatdb_get_table_stats` | Estadísticas de tabla |

Ver [MCP_SETUP.md](MCP_SETUP.md) y [MCP_TOOLS_REFERENCE.md](MCP_TOOLS_REFERENCE.md) para más detalles.

## Two-Pass RAG Architecture

El sistema utiliza una arquitectura de dos pasos:

### Pass 1: Generación SQL
```
Usuario: "Cuántas ventas hoy?"
    ↓
Classifier: Determina si requiere BD o es conversación general
    ↓
Prompt Builder: Construye prompt con reglas + esquema + ejemplos
    ↓
AI Service: Genera SQL usando Ollama/OpenRouter
    ↓
SQL Validator: Valida que sea SELECT/SHOW seguro
    ↓
DB Manager: Ejecuta query en MySQL
```

### Pass 2: Interpretación
```
Resultados SQL (JSON)
    ↓
Business Prompt Builder
    ↓
AI Service: Genera respuesta en lenguaje natural
    ↓
Usuario: "Hoy se han realizado 45 ventas por un total de $3,240.50"
```

## Configuración de Esquema para Mejores Resultados

Para que la IA genere SQL correcto, configura la descripción del esquema en cada conexión:

```sql
=== ESTRUCTURA DE BASE DE DATOS ===

TABLA: pedidos
- pedido_id (INT, PK) - ID único del pedido
- fecha (DATETIME) - Fecha y hora del pedido
- estado (CHAR 15) - 'PENDIENTE', 'CONCLUIDO', 'ANULADO'
- total (DECIMAL 14,2) - Total del pedido

TABLA: lin_pedidos
- lin_pedido_id (INT, PK) - ID de la línea
- pedido_id (INT, FK) - Referencia a pedidos
- item_id (INT, FK) - Referencia a items
- cantidad (DECIMAL 14,2) - Cantidad base
- cant_total (DECIMAL 14,2) - Cantidad total (prioritaria)
- precio_unitario (DECIMAL 14,2) - Precio por unidad

TABLA: items
- item_id (INT, PK) - ID del producto
- descripcion (CHAR 150) - Nombre del producto
- precio_venta (DECIMAL 14,2) - Precio de venta

REGLAS IMPORTANTES:
- Excluir pedidos ANULADOS: WHERE estado != 'ANULADO'
- Para cantidades usar: CASE WHEN cant_total > 0 THEN cant_total ELSE cantidad END
- Productos "Para Llevar" tienen llevar=1 o (PLL) en descripción
```

## Seguridad

- **SQL Injection**: Uso de prepared statements en mysql2
- **Validación**: Solo sentencias SELECT/SHOW permitidas
- **Rate Limiting**: Límite de 1000 filas por query
- **Credenciales**: Almacenadas en SQLite local, nunca expuestas en API

## Solución de Problemas

### La IA genera SQL incorrecto
1. Verificar que la descripción del esquema esté completa
2. Agregar ejemplos específicos en reglas de contexto
3. Revisar logs del backend para ver el prompt completo

### Error de conexión a MySQL
1. Verificar que el servidor MySQL esté accesible
2. Probar conexión desde el panel de administración
3. Revisar firewall y configuración de red

### MCP no funciona en VS Code
1. Verificar que Node.js esté en el PATH
2. Recargar ventana de VS Code
3. Revisar Output panel > GitHub Copilot

## Scripts Útiles

```bash
# Iniciar servidor
cd backend && npm start

# Modo desarrollo (auto-reload)
cd backend && npm run dev

# Seed de reglas iniciales
cd backend && npm run seed

# Testear MCP server
cd backend
npx @modelcontextprotocol/inspector node mcp/stdio-server.js
```

## Contribuir

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

MIT License

## Autor

Desarrollado para consultas SQL inteligentes con IA.
