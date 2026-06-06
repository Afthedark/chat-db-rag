# 🚀 Chat-DB-RAG

Asistente inteligente de base de datos MySQL con persistencia y RAG (Retrieval-Augmented Generation). Permite interactuar con bases de datos relacionales en lenguaje natural, gestionar conexiones persistentes, y acceder a proyecciones avanzadas de cocina.

---

## 📋 Tabla de Contenidos
1. [¿Qué hace?](#-qué-hace)
2. [Características Clave](#-características-clave)
3. [Guía de Inicio Rápido](#-guía-de-inicio-rápido)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Documentación Detallada](#-documentación-detallada)

---

## 🔍 ¿Qué hace?

Este asistente traduce consultas en lenguaje natural a consultas SQL ejecutables sobre una base de datos MySQL, retornando respuestas estructuradas en español natural. 

* **Pregunta**: *"¿Cuáles fueron las alitas más vendidas ayer?"*
* **SQL Generado**: `SELECT i.descripcion, SUM(lp.cantidad) AS total FROM pedidos p JOIN lin_pedidos lp ON p.pedido_id = lp.pedido_id JOIN items i ON lp.item_id = i.item_id WHERE DATE(p.fecha) = SUBDATE(CURDATE(), 1) AND i.descripcion LIKE '%Alita%' GROUP BY i.descripcion ORDER BY total DESC;`
* **Respuesta**: *"Las alitas más vendidas ayer fueron las 'Alitas BBQ' con 45 porciones despachadas."*

---

## ✨ Características Clave

* **Soporte Multi-Proveedor LLM**: Modelos locales con **Ollama** (Llama 3, DeepSeek, Phi) o APIs en la nube con **Google Gemini** y **OpenRouter**.
* **Panel de Cocina Inteligente**: Proyección de puestas de pollo por hora y consolidación de líquidos en litros.
* **Formato Rico (Markdown)**: Renderizado premium de tablas, listas, blockquotes y títulos con `marked.js` adaptado a temas claro/oscuro.
* **Persistencia Segura**: Guardado de múltiples conexiones de usuario (contraseñas cifradas con Fernet) y chats persistentes en una base de datos de administración.

---

## ⚡ Guía de Inicio Rápido

### Prerrequisitos
* Python 3.11+ y MySQL Server.
* [Ollama](https://ollama.com) (opcional, para modelos locales).

### 1. Clonar y Configurar Base de Datos
Crea una base de datos MySQL vacía llamada `chat_db_rag` para persistencia:
```sql
CREATE DATABASE chat_db_rag;
```

### 2. Configurar el Backend
Crea un archivo `backend/.env` basándote en la siguiente plantilla básica:
```env
# Conexión a Base de Datos de Persistencia
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db_rag

# Cifrado de Contraseñas (Generar con Fernet)
ENCRYPTION_KEY=tu_clave_fernet_aqui
SECRET_KEY=tu_flask_secret_key

# Proveedores de LLM (Opcional)
GEMINI_API_KEY_ID_1=tu_api_key_de_gemini
OPENROUTER_API_KEY=tu_api_key_de_openrouter
```

### 3. Instalar y Ejecutar

#### Backend (Servidor API)
```powershell
cd backend
python -m venv env
# Activar entorno: env\Scripts\activate
pip install -r requirements.txt
python app.py
```
*Corre en `http://localhost:5000`*

#### Frontend (Cliente Web)
```powershell
cd frontend
python -m http.server 3000
```
*Abre tu navegador en `http://localhost:3000`*

---

## 📁 Estructura del Proyecto

* **[backend/](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/backend)**: Servidor Flask RAG, ORM SQLAlchemy, encriptación, conexión a modelos y motor SQL.
* **[frontend/](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/frontend)**: Interfaz responsiva HTML5/JS Vanilla. Incluye el Panel de Cocina y renderizado de Markdown.
* **[doc/](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/doc)**: Manuales de arquitectura y guías operativas.

---

## 📖 Documentación Detallada

Para guías avanzadas de configuración y desarrollo, consulta:

1. **[Guía del Backend y API](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/doc/README_BACKEND.md)**: Estructura del servidor Flask, rutas de API y manejo de la BD.
2. **[Guía del Frontend](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/doc/README_FRONTEND.md)**: Modulación en JS, hojas de estilos, y personalización del Panel de Cocina.
3. **[Guía de IA, RAG y Consultas (Unificado)](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/doc/README_IA.md)**:
   * **Parte A**: Funcionamiento del motor RAG, prompts, límites de contexto y proveedores.
   * **Parte B**: Regla de oro para consultas, tipos de preguntas válidas, entrenamiento del modelo y diccionario de sinónimos.
4. **[Guía de Despliegue en Linux](file:///c:/Users/developer/Documents/proyects/ferca/chat-db-rag/doc/README_LINUX.md)**: Configuración en servidores Ubuntu con Systemd, Nginx y Gunicorn.
