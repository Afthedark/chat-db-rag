# Chat-DB-RAG — Guía de instalación en Ubuntu Linux

Asistente de base de datos MySQL con IA (RAG). Hace consultas SQL en lenguaje natural
usando modelos locales con Ollama o la API de Google Gemini.

> Probado en **Ubuntu 22.04 LTS** y **Ubuntu 24.04 LTS**

---

## Tabla de Contenidos

1. [Requisitos del sistema](#1-requisitos-del-sistema)
2. [Instalar dependencias en Ubuntu](#2-instalar-dependencias-en-ubuntu)
3. [Clonar e instalar el proyecto](#3-clonar-e-instalar-el-proyecto)
4. [Configurar MySQL de persistencia](#4-configurar-mysql-de-persistencia)
5. [Instalar Ollama y modelos (opcional)](#5-instalar-ollama-y-modelos-opcional)
6. [Configurar el archivo .env](#6-configurar-el-archivo-env)
7. [Ejecutar el proyecto](#7-ejecutar-el-proyecto)
8. [Script de inicio automático](#8-script-de-inicio-automático)
9. [Servicios Systemd (producción)](#9-servicios-systemd-producción)
10. [GPU Nvidia — Acelerar Ollama](#10-gpu-nvidia--acelerar-ollama)
11. [Solución de Problemas](#11-solución-de-problemas)

---

## 1. Requisitos del sistema

| Componente | Mínimo | Recomendado |
|---|---|---|
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 / 24.04 LTS |
| Python | 3.10 | 3.11 o 3.12 |
| RAM | 8 GB | 16 GB |
| GPU (Ollama) | Ninguna (usa CPU) | NVIDIA con 8+ GB VRAM |
| MySQL | 5.7 | 8.0 |

---

## 2. Instalar dependencias en Ubuntu

```bash
sudo apt update && sudo apt upgrade -y

# Python y herramientas
sudo apt install -y python3 python3-venv python3-pip python3-dev

# MySQL
sudo apt install -y mysql-server mysql-client

# Herramientas adicionales
sudo apt install -y git curl build-essential libssl-dev
```

### Verificar versiones instaladas

```bash
python3 --version      # debe ser 3.10+
mysql --version        # debe ser 5.7+ o 8.0+
git --version
```

### Iniciar y habilitar MySQL

```bash
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar seguridad de MySQL (crear contraseña root, etc.)
sudo mysql_secure_installation
```

---

## 3. Clonar e instalar el proyecto

```bash
# Clonar el repositorio
cd ~
git clone <url-del-repositorio> chat-db-rag
cd chat-db-rag

# Crear entorno virtual Python
python3 -m venv env
source env/bin/activate

# Instalar dependencias del backend
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Verificar instalación

```bash
pip list | grep -E "flask|sqlalchemy|google-genai|requests"
```

---

## 4. Configurar MySQL de persistencia

Esta base de datos guarda las conexiones, chats y mensajes del propio sistema.
**Es diferente** a la base de datos de tu negocio.

```bash
sudo mysql -u root -p
```

```sql
-- Crear base de datos del sistema
CREATE DATABASE chat_db_rag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario dedicado
CREATE USER 'chat_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON chat_db_rag.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### Verificar conexión

```bash
mysql -u chat_user -p chat_db_rag -e "SELECT 'Conexión exitosa';"
```

---

## 5. Instalar Ollama y modelos (opcional)

Ollama permite correr modelos de IA localmente. Si usarás solo **Gemini API**, puedes
omitir este paso.

### Instalar Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Ollama se instala como servicio systemd automáticamente. Verificar:

```bash
systemctl status ollama
ollama --version
```

### Descargar modelos recomendados

```bash
# Recomendado para esta aplicación (buena calidad/velocidad)
ollama pull llama3.1:8b

# Alternativa ligera (más rápido, menos preciso con prompts complejos)
ollama pull llama3.2:3b
```

### Verificar modelos disponibles

```bash
ollama list
```

---

## 6. Configurar el archivo `.env`

```bash
cd ~/chat-db-rag/backend
cp .env.example .env
nano .env
```

### Contenido completo del `.env`

```ini
# ==============================================================================
# PROJECT DATABASE — Base de datos de persistencia del sistema
# ==============================================================================
DB_DRIVER=mysql+mysqlconnector
DB_USER=chat_user
DB_PASSWORD=tu_password_seguro
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db_rag

# ==============================================================================
# ENCRYPTION KEY — Para encriptar contraseñas de conexiones guardadas
# Genera una con: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# ==============================================================================
ENCRYPTION_KEY=pega-aqui-tu-clave-generada

# ==============================================================================
# FLASK CONFIGURATION
# ==============================================================================
SECRET_KEY=pega-aqui-tu-clave-secreta-flask
FLASK_DEBUG=False
FLASK_PORT=5000

# ==============================================================================
# OLLAMA — Configuración de rendimiento
# Ajusta OLLAMA_CONTEXT_LIMIT según tu GPU:
#   llama3.2:3b → 5120 (GPU < 8GB)  o  6144 (GPU 8-12GB)
#   llama3.1:8b → 4096 (recomendado estable)
# ==============================================================================
OLLAMA_TIMEOUT=120
OLLAMA_MAX_RETRIES=3
OLLAMA_RETRY_DELAY=2
OLLAMA_CONTEXT_LIMIT=6144
MAX_CHAT_HISTORY=5

# ==============================================================================
# GOOGLE GEMINI API — Opcional pero recomendado (1-3s de respuesta)
# Obtén tu clave gratis en: https://aistudio.google.com/apikey
# ==============================================================================
GEMINI_API_KEY_ID_1=

# ==============================================================================
# CORS — Orígenes permitidos para el frontend
# ==============================================================================
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Generar claves seguras

```bash
# ENCRYPTION_KEY
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# SECRET_KEY para Flask
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 7. Ejecutar el proyecto

Necesitas tres terminales (o usa el script de la sección 8):

### Terminal 1 — Backend (Flask API)

```bash
cd ~/chat-db-rag
source env/bin/activate
cd backend
python3 app.py
```

Salida esperada:
```
Database tables initialized successfully!
Starting Chat with MySQL API server...
API available at: http://localhost:5000
```

### Terminal 2 — Frontend (servidor estático)

```bash
cd ~/chat-db-rag/frontend
python3 -m http.server 3000
```

### Terminal 3 — Ollama (solo si usas modelos locales)

```bash
# Ollama ya debería estar corriendo como servicio.
# Si no, inícialo manualmente:
ollama serve
```

### Abrir la aplicación

```
http://localhost:3000
```

---

## 8. Script de inicio automático

Crea el script `~/chat-db-rag/start.sh`:

```bash
nano ~/chat-db-rag/start.sh
```

```bash
#!/bin/bash
# ==============================================================================
# Chat-DB-RAG — Script de inicio para Ubuntu
# ==============================================================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$HOME/chat-db-rag"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Chat-DB-RAG — Iniciando servicios   ${NC}"
echo -e "${BLUE}========================================${NC}"

# Activar entorno virtual
source "$PROJECT_DIR/env/bin/activate"

# Iniciar Ollama si está instalado y no está corriendo
if command -v ollama &> /dev/null; then
    if ! pgrep -x "ollama" > /dev/null; then
        echo -e "${YELLOW}► Iniciando Ollama...${NC}"
        ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
        OLLAMA_PID=$!
        sleep 3
        echo -e "${GREEN}  ✓ Ollama iniciado (PID: $OLLAMA_PID)${NC}"
    else
        echo -e "${GREEN}  ✓ Ollama ya está en ejecución${NC}"
    fi
fi

# Iniciar Backend
echo -e "${YELLOW}► Iniciando Backend (Flask)...${NC}"
cd "$PROJECT_DIR/backend"
python3 app.py > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2
echo -e "${GREEN}  ✓ Backend iniciado (PID: $BACKEND_PID) → http://localhost:5000${NC}"

# Iniciar Frontend
echo -e "${YELLOW}► Iniciando Frontend...${NC}"
cd "$PROJECT_DIR/frontend"
python3 -m http.server 3000 > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 1
echo -e "${GREEN}  ✓ Frontend iniciado (PID: $FRONTEND_PID) → http://localhost:3000${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Todos los servicios están listos  ${NC}"
echo -e "${GREEN}  Abre: http://localhost:3000          ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Logs disponibles en: $LOG_DIR/"
echo -e "Presiona ${RED}Ctrl+C${NC} para detener todos los servicios."

# Limpieza al salir
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servicios...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    [ -n "$OLLAMA_PID" ] && kill $OLLAMA_PID 2>/dev/null
    echo -e "${GREEN}✓ Servicios detenidos.${NC}"
    exit 0
}

trap cleanup INT TERM
wait
```

Hazlo ejecutable y ejecútalo:

```bash
chmod +x ~/chat-db-rag/start.sh
~/chat-db-rag/start.sh
```

---

## 9. Servicios Systemd (producción)

Para que el sistema arranque automáticamente con Ubuntu.

> Reemplaza `TU_USUARIO` con tu nombre de usuario de Ubuntu.

### Servicio Backend

```bash
sudo nano /etc/systemd/system/chat-db-rag-backend.service
```

```ini
[Unit]
Description=Chat-DB-RAG Backend (Flask API)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=TU_USUARIO
Group=TU_USUARIO
WorkingDirectory=/home/TU_USUARIO/chat-db-rag/backend
Environment=PATH=/home/TU_USUARIO/chat-db-rag/env/bin:/usr/bin:/bin
ExecStart=/home/TU_USUARIO/chat-db-rag/env/bin/python3 app.py
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Servicio Frontend

```bash
sudo nano /etc/systemd/system/chat-db-rag-frontend.service
```

```ini
[Unit]
Description=Chat-DB-RAG Frontend (HTTP Server)
After=network.target chat-db-rag-backend.service

[Service]
Type=simple
User=TU_USUARIO
Group=TU_USUARIO
WorkingDirectory=/home/TU_USUARIO/chat-db-rag/frontend
ExecStart=/home/TU_USUARIO/chat-db-rag/env/bin/python3 -m http.server 3000
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Activar y gestionar los servicios

```bash
# Recargar configuración
sudo systemctl daemon-reload

# Habilitar inicio automático al arrancar Ubuntu
sudo systemctl enable chat-db-rag-backend
sudo systemctl enable chat-db-rag-frontend

# Iniciar ahora
sudo systemctl start chat-db-rag-backend
sudo systemctl start chat-db-rag-frontend

# Verificar estado
sudo systemctl status chat-db-rag-backend
sudo systemctl status chat-db-rag-frontend

# Ver logs en tiempo real
sudo journalctl -u chat-db-rag-backend -f
sudo journalctl -u chat-db-rag-frontend -f

# Reiniciar después de cambios en .env o código
sudo systemctl restart chat-db-rag-backend
```

---

## 10. GPU Nvidia — Acelerar Ollama

Si tienes una GPU Nvidia, Ollama la detecta automáticamente. Para verificar y maximizar el rendimiento:

### Verificar drivers Nvidia

```bash
nvidia-smi
```

Si no está instalado:

```bash
# Ubuntu 22.04 / 24.04
sudo ubuntu-drivers autoinstall
sudo reboot
```

### Verificar que Ollama usa GPU

```bash
# Con un modelo cargado, ejecuta:
nvidia-smi

# Debes ver el proceso ollama en la columna "Processes"
# y la columna "GPU-Util" > 0%
```

### Forzar GPU si Ollama usa CPU

```bash
# Reiniciar el servicio Ollama para detección de GPU
sudo systemctl restart ollama
sleep 3

# Cargar un modelo y verificar
ollama run llama3.1:8b "hola"
nvidia-smi  # verificar uso de GPU
```

### Configurar `OLLAMA_CONTEXT_LIMIT` según tu GPU

| GPU | VRAM | llama3.2:3b | llama3.1:8b |
|---|---|---|---|
| GTX 1060 / 1070 | 6-8 GB | 4096 | No recomendado |
| RTX 3060 / 3070 | 8-12 GB | 6144 | 4096 |
| RTX 3080 / 4070 | 10-12 GB | 8192 | 6144 |
| RTX 4080 / 4090 | 16-24 GB | 16384 | 8192 |

---

## 11. Solución de Problemas

### ❌ `python3: command not found`

```bash
sudo apt install python3 python3-venv python3-pip
```

---

### ❌ `ModuleNotFoundError: No module named 'mysql'`

```bash
source ~/chat-db-rag/env/bin/activate
pip install mysql-connector-python
```

---

### ❌ `Access denied for user 'chat_user'@'localhost'`

```bash
sudo mysql -u root
```
```sql
ALTER USER 'chat_user'@'localhost' IDENTIFIED BY 'nuevo_password';
FLUSH PRIVILEGES;
EXIT;
```

Actualiza `DB_PASSWORD` en `backend/.env` y reinicia el backend.

---

### ❌ `Address already in use` (puerto ocupado)

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5000
sudo lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O un solo comando:
sudo fuser -k 5000/tcp
sudo fuser -k 3000/tcp
```

---

### ❌ Ollama tarda demasiado o da timeout

```bash
# 1. Verificar si usa GPU o CPU
nvidia-smi

# 2. Reiniciar Ollama para forzar detección de GPU
sudo systemctl restart ollama

# 3. Reducir el contexto en backend/.env
nano ~/chat-db-rag/backend/.env
# Cambiar: OLLAMA_CONTEXT_LIMIT=4096

# 4. O usar Gemini API (más rápido, sin GPU necesaria)
# Agregar en .env: GEMINI_API_KEY_ID_1=tu-clave
```

---

### ❌ `FutureWarning: google.generativeai` al iniciar

El proyecto ya usa el SDK nuevo `google-genai`. Si persiste:

```bash
source ~/chat-db-rag/env/bin/activate
pip uninstall google-generativeai -y
pip install google-genai --upgrade
```

---

### ❌ UFW bloquea las conexiones

```bash
# Abrir puertos necesarios
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw status
```

---

### 📋 Ver logs del backend

```bash
# Si usas el script start.sh
tail -f ~/chat-db-rag/logs/backend.log

# Si usas systemd
sudo journalctl -u chat-db-rag-backend -f --since "10 min ago"
```

---

## Referencia rápida de comandos

```bash
# Iniciar todo (con script)
~/chat-db-rag/start.sh

# Activar entorno virtual
source ~/chat-db-rag/env/bin/activate

# Actualizar dependencias tras cambios en requirements.txt
cd ~/chat-db-rag/backend && pip install -r requirements.txt

# Ver modelos Ollama instalados
ollama list

# Descargar un modelo nuevo
ollama pull llama3.1:8b

# Reiniciar servicios systemd
sudo systemctl restart chat-db-rag-backend
sudo systemctl restart chat-db-rag-frontend
```

---

**Desarrollado con:** Python 3 · Flask · SQLAlchemy · Ollama · Google Gemini · Vanilla JS · Bootstrap 5

> Para más información sobre el sistema de IA, consulta [`README_IA.md`](./README_IA.md)
