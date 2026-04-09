# Chat DB RAG (Two-Pass System) 🤖📊

Este proyecto es un asistente empresarial impulsado por IA diseñado para consultar bases de datos relacionales (MySQL) a través de lenguaje natural utilizando una arquitectura **RAG de dos pasos (Two-Pass RAG)**.

El sistema se conecta a múltiples bases de datos de forma dinámica, captura una pregunta del usuario, genera y valida el código SQL en un primer paso, recupera los datos de manera estructurada, y finalmente interpreta (segundo paso) estos resultados devolviendo una respuesta de negocio conversacional y amigable al usuario.

![Dashboard Preview](https://via.placeholder.com/900x450.png?text=Dashboard+Administrativo+RAG)

## 📋 Características Principales

*   **Arquitectura MPA (Multi-Page Architecture):** Reconstrucción robusta con páginas dedicadas para Chat, Administración de Reglas y Conexiones.
*   **Deep Chat Integration:** Interfaz de chat moderna y fluida utilizando el componente `deep-chat`, con soporte nativo para renders de Markdown y SQL.
*   **Sistema de Temas Dual (Light/Dark Mode):** Estética premium inspirada en Qwen/Charcoal (Oscuro) y Apple Slate (Claro), totalmente gestionable por el usuario.
*   **Two-Pass RAG Architecture:** Un modelo IA genera el código SQL y un segundo lo interpreta para mayor precisión.
*   **Conexiones Dinámicas:** Configura y administra distintas bases de datos objetivo desde el frontend sin tocar código. Soporta puertos personalizados.
*   **Agnóstico de IA:** Soporte para LLMs locales (Ollama) o modelos de terceros mediante el SDK oficial de OpenAI (compatible con OpenRouter).
*   **Frontend Modular & Centralizado:** Uso de `Alpine.js` para reactividad ligera y `utils.js` para un sistema de diseño y utilidades unificado (toasts, temas, modales).
*   **Control de Reglas de IA (Admin):** Agrega y enciende directrices (Prompts dinámicos, Schemas, Few-Shots) al vuelo desde el dashboard dedicado.

## 🛡️ Estricta Seguridad SQL

Para salvaguardar las bases de datos transaccionales donde se consultan los datos, el proyecto incluye un validador multicapa (`sqlValidator.js`) antes de ejecutar la petición:

*   Solo se admiten comandos estructurados que empiezan con `SELECT`, `SHOW`, `DESCRIBE` o referencias `WITH`.
*   Existe una capa de denegación absoluta para comandos destructivos o de escritura como `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`.
*   Se previene la inyección de consultas divididas (`multi-statements`) para evitar sub-rutinas disfrazadas al final de la lectura.
*   **Se recomienda de igual manera utilizar únicamente usuarios con privilegios `READ ONLY` a nivel MySql para las conexiones objetivo.**

---

## 🛠️ Stack Tecnológico

*   **Backend:** Node.js v18+, Express.js.
*   **IA SDK:** OpenAI SDK (para OpenRouter) y Axios (para Ollama local).
*   **ORMs & Data:** Sequelize (MySQL base de memoria), mysql2 (Connection Pooling dinámico a BDs objetivo).
*   **Frontend:** HTML5, CSS Variables, Alpine.js, Bootstrap 5, PrismJS (SQL Syntax).

---

## 🚀 Instalación y Despliegue Local

### 1. Requisitos Previos
* Node.js v18.x o superior (recomendado para usar `--watch`).
* Servidor MySQL ejecutivo (XAMPP / Standalone / Docker).
* (Opcional) Ollama instalado localmente con tu modelo base.

### 2. Base de Datos de Memoria (Inicialización)
Inicia tu gestor SQL preferido y crea la base de datos principal de configuración:
```sql
CREATE DATABASE ai_memory_db;
```

### 3. Configuración
Visualiza el archivo `backend/.env` y ajusta según tu entorno (asegúrate de configurar correctamente el puerto de MySQL memory db):

```env
PORT=3000

# IA Provider: 'openrouter' o 'ollama'
AI_PROVIDER=ollama 
OPENROUTER_API_KEY=tu_llave_aqui
OLLAMA_URL=http://localhost:11434/api/chat

# DB Memoria (Sequelize)
MEM_DB_HOST=localhost
MEM_DB_PORT=3301  # Cambiar según tu puerto MySQL
MEM_DB_USER=root
MEM_DB_PASS=
MEM_DB_NAME=ai_memory_db
```

### 4. Instalando e Iniciando
Abre tu terminal dentro de `chat-db-rag/backend`:

```bash
# 1. Instalar dependencias
npm install

# 2. Correr el Seed para insertar las reglas lógicas iniciales
npm run seed

# 3. Arrancar en modo DESARROLLO (Auto-restart al cambiar archivos)
npm run dev
```

### 5. Utilización y Rutas
Accede desde tu navegador: 👉 [http://localhost:3000](http://localhost:3000)

*   **Chat RAG (`/`)**: Interfaz principal de chateo inteligente.
*   **Administración de Reglas (`/admin/rules`)**: Gestión de prompts de sistema y esquemas DDL.
*   **Gestión de Bases de Datos (`/admin/databases`)**: Configuración de pools de conexión.

---

## 📂 Estructura del Código (MPA Modular)

```text
/chat-db-rag
├── /backend
│   ├── /config          # Sequelize db config.
│   ├── /controllers     # Lógica CRUD separada por responsabilidad.
│   ├── /middleware      # Manejo de errores y ruteo central.
│   ├── /models          # Modelos de Sequelize.
│   ├── /routes          # Rutas API y Rutas de Servido HTML (MPA).
│   ├── /services        # AI Service, SQL Validator y DB Connection Manager.
│   └── server.js        # Entry point.
├── /frontend
│   ├── index.html       # Página de Chat Principal (Deep Chat).
│   ├── rules.html       # Panel de Reglas AI.
│   ├── databases.html   # Panel de Conexiones DB.
│   ├── style.css        # Estilos Globales (Qwen/Apple inspired).
│   └── /src             # Lógica modular Alpine.js
│       ├── chat.js      # Controller Chat.
│       ├── rules.js     # Controller Reglas.
│       ├── databases.js # Controller Bases de Datos.
│       └── utils.js     # Sistema de Temas y Utilidades Globales.
└── README.md
```
