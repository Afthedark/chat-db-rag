# Chat-With-MySQL
Asistente de MySQL: Accede a la información de tu base de datos usando lenguaje natural. No necesitas conocimientos de SQL. Solo haz preguntas y recibe respuestas claras.

<hr>

## Tabla de Contenidos
1. [¿Qué hace?](#qué-hace)
2. [Características](#características)
3. [¿Cómo funciona?](#cómo-funciona)
4. [Requisitos](#requisitos)
5. [Instalación](#instalación)
6. [Uso](#uso)

<hr>

## ¿Qué hace?
Este asistente revoluciona la interacción con bases de datos MySQL permitiendo hacer consultas en lenguaje natural. Los usuarios pueden preguntar en español (o cualquier idioma) sobre sus datos sin necesidad de conocer SQL.

**Ejemplo:**
- **Pregunta:** "¿Cuántos clientes tenemos en Madrid?"
- **Respuesta:** "Tienes 45 clientes en Madrid."
- **SQL usado:** `SELECT COUNT(*) FROM clientes WHERE ciudad = 'Madrid';`

## Características

### 🧠 Soporte Dual de LLM
- **Ollama (Local):** Usa modelos locales como Llama, Gemma, DeepSeek - ¡sin costos de API!
- **Google Gemini (API):** Usa la API de Google para respuestas avanzadas

### 💡 Preguntas Sugeridas
Al conectar la base de datos, la IA genera automáticamente preguntas sugeridas basadas en el esquema de tus tablas. ¡Perfecto para usuarios que no saben por dónde empezar!

### 🗣️ Interfaz en Español
Interfaz completamente en español, diseñada para usuarios comunes sin conocimientos técnicos.

### 🔒 Privacidad
Con Ollama, todos los datos permanecen en tu computadora. Nada se envía a la nube.

## ¿Cómo funciona?

```
Usuario (pregunta en español)
    ↓
IA analiza el esquema de la BD + tu pregunta
    ↓
Genera consulta SQL
    ↓
Ejecuta SQL en MySQL
    ↓
IA genera respuesta en lenguaje natural
    ↓
Usuario recibe respuesta clara + SQL usado
```

**Tecnologías utilizadas:**
- **Streamlit:** Interfaz web tipo chat
- **LangChain:** Conexión y extracción de esquema MySQL
- **Ollama/Gemini:** Modelos de lenguaje para generar SQL y respuestas

## Requisitos

- Python 3.11, 3.12, 3.13 o 3.14
- MySQL Server (local o remoto)
- Ollama (opcional, para usar modelos locales)
- API Key de Google Gemini (opcional, para usar Gemini)

## Instalación

### 1. Clonar o descargar el proyecto
```
Folder
├── src
│   └── app.py
├── design
│   └── Chat-with-SQL-Design.png
├── requirements.txt
├── .env
└── README.md
```

### 2. Crear entorno virtual
```powershell
# Crear entorno virtual
python -m venv env

# Activar entorno (Windows)
env\Scripts\activate
```

### 3. Instalar dependencias
```powershell
pip install -r requirements.txt
```

### 4. Configurar Ollama (opcional, para modelos locales)
Descarga e instala Ollama desde [ollama.com](https://ollama.com)

Descarga modelos que quieras usar:
```powershell
ollama pull llama3.1:8b
ollama pull gemma3
ollama pull deepseek-r1:14b
```

### 5. Configurar API Key de Gemini (opcional)
Si quieres usar Google Gemini, edita el archivo `.env`:
```
GEMINI_API_KEY=tu_api_key_aqui
```

## Uso

### 1. Iniciar Ollama (si usas modelos locales)
```powershell
ollama serve
```

### 2. Ejecutar la aplicación
```powershell
streamlit run src/app.py
```

### 3. Configurar en la interfaz
1. **Selecciona el proveedor de LLM:** Ollama (Local) o Gemini (API)
2. **Elige el modelo:** (si usas Ollama, selecciona de tus modelos instalados)
3. **Conecta tu base de datos MySQL:**
   - Host: localhost (o IP del servidor)
   - Port: 3306 (puerto por defecto de MySQL)
   - User: tu_usuario_mysql
   - Password: tu_contraseña_mysql
   - Database: nombre_de_tu_base_de_datos
4. **Haz clic en "Connect"**

### 4. ¡Empieza a preguntar!
Una vez conectado, verás preguntas sugeridas generadas automáticamente. Haz clic en cualquiera o escribe tu propia pregunta.

**Ejemplos de preguntas:**
- "¿Cuántos registros tenemos en total?"
- "Muéstrame los 5 productos más vendidos"
- "¿Quién es el cliente que más ha comprado?"
- "Lista todas las órdenes del mes pasado"
- "¿Cuál es el promedio de ventas por mes?"

---

**Nota:** La IA no almacena tus datos. Solo ve el esquema (estructura) de las tablas para generar SQL correcto.



