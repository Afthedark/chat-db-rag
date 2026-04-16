# Chat-With-MySQL - Guía para Linux

Asistente de MySQL con persistencia para Linux. Accede a la información de tus bases de datos usando lenguaje natural.

---

## Tabla de Contenidos
1. [Requisitos](#requisitos)
2. [Instalación en distro Linux](#instalación-en-linux)
3. [Configuración](#configuración)
4. [Uso](#uso)
5. [Servicios Systemd](#servicios-systemd)
6. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos

### Software necesario:
- Python 3.11, 3.12, 3.13 o 3.14
- MySQL Server o MariaDB
- Ollama (opcional, para modelos locales)
- Navegador web moderno

### Instalación de dependencias del sistema:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip mysql-server
```

**Fedora/RHEL/CentOS:**
```bash
sudo dnf install python3 python3-virtualenv python3-pip mysql-server
```

**Arch Linux:**
```bash
sudo pacman -S python python-virtualenv python-pip mariadb
```

---

## Instalación en Linux

### 1. Clonar el proyecto

```bash
cd ~
git clone <url-del-repositorio> chat-db-rag
cd chat-db-rag
```

### 2. Crear entorno virtual

```bash
python3 -m venv env
source env/bin/activate
```

### 3. Instalar dependencias del backend

```bash
cd backend
pip install -r requirements.txt
```

### 4. Crear base de datos de persistencia

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE chat_db_rag;
CREATE USER 'chat_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON chat_db_rag.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Instalar Ollama (opcional)

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Descarga modelos:
```bash
ollama pull llama3.2:3b
ollama pull phi4-mini-reasoning:3.8b
ollama pull deepseek-r1:14b
ollama pull qwen3.5:9b
ollama pull llama3.1:8b
ollama pull gemma4:e4b
```

---

## Configuración

### Backend (.env)

Crea el archivo `backend/.env`:

```bash
cd backend
cp .env.example .env
nano .env
```

Contenido:
```env
# ------------------------------------------------------------------------------
# PROJECT DATABASE (MySQL for persistence)
# ------------------------------------------------------------------------------
DB_DRIVER=mysql+mysqlconnector
DB_USER=chat_user
DB_PASSWORD=tu_password_seguro
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db_rag

# ------------------------------------------------------------------------------
# ENCRYPTION KEY
# Generate with: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# ------------------------------------------------------------------------------
ENCRYPTION_KEY=tu-clave-generada-aqui

# ------------------------------------------------------------------------------
# FLASK CONFIGURATION
# ------------------------------------------------------------------------------
SECRET_KEY=tu-clave-secreta-flask
FLASK_DEBUG=True
FLASK_PORT=5000

# ------------------------------------------------------------------------------
# OLLAMA PERFORMANCE CONFIGURATION
# ------------------------------------------------------------------------------
OLLAMA_TIMEOUT=120
OLLAMA_MAX_RETRIES=3
OLLAMA_RETRY_DELAY=2
OLLAMA_CONTEXT_LIMIT=4096
MAX_CHAT_HISTORY=3

# ------------------------------------------------------------------------------
# GOOGLE GEMINI API (optional)
# ------------------------------------------------------------------------------
GEMINI_API_KEY_ID_1=

# ------------------------------------------------------------------------------
# CORS CONFIGURATION
# ------------------------------------------------------------------------------
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Generar claves:
```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Uso

### Método 1: Terminal manual

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Backend:**
```bash
cd ~/chat-db-rag
source env/bin/activate
cd backend
python3 app.py
```

**Terminal 3 - Frontend:**
```bash
cd ~/chat-db-rag/frontend
python3 -m http.server 3000
```

Abre: http://localhost:3000

### Método 2: Script de inicio

Crea `~/chat-db-rag/start.sh`:

```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

cd ~/chat-db-rag
source env/bin/activate

# Iniciar Ollama si está instalado
if command -v ollama &> /dev/null; then
    echo -e "${BLUE}Iniciando Ollama...${NC}"
    ollama serve &
    OLLAMA_PID=$!
    sleep 2
fi

# Iniciar Backend
echo -e "${BLUE}Iniciando Backend...${NC}"
cd backend
python3 app.py &
BACKEND_PID=$!

# Iniciar Frontend
echo -e "${BLUE}Iniciando Frontend...${NC}"
cd ../frontend
python3 -m http.server 3000 &
FRONTEND_PID=$!

echo -e "${GREEN}Servicios iniciados:${NC}"
echo -e "  - Frontend: http://localhost:3000"
echo -e "  - Backend: http://localhost:5000"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar señal de interrupción
trap "kill $BACKEND_PID $FRONTEND_PID $OLLAMA_PID 2>/dev/null; exit" INT
wait
```

Hazlo ejecutable:
```bash
chmod +x ~/chat-db-rag/start.sh
~/chat-db-rag/start.sh
```

---

## Servicios Systemd

Para ejecutar como servicios del sistema:

### Backend Service

Crea `/etc/systemd/system/chat-db-rag-backend.service`:

```ini
[Unit]
Description=Chat-DB-RAG Backend
After=network.target mysql.service

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/home/tu-usuario/chat-db-rag/backend
Environment=PATH=/home/tu-usuario/chat-db-rag/env/bin
ExecStart=/home/tu-usuario/chat-db-rag/env/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Frontend Service

Crea `/etc/systemd/system/chat-db-rag-frontend.service`:

```ini
[Unit]
Description=Chat-DB-RAG Frontend
After=network.target chat-db-rag-backend.service

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/home/tu-usuario/chat-db-rag/frontend
Environment=PATH=/home/tu-usuario/chat-db-rag/env/bin
ExecStart=/home/tu-usuario/chat-db-rag/env/bin/python -m http.server 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Activar servicios

```bash
sudo systemctl daemon-reload
sudo systemctl enable chat-db-rag-backend
sudo systemctl enable chat-db-rag-frontend
sudo systemctl start chat-db-rag-backend
sudo systemctl start chat-db-rag-frontend
```

Ver estado:
```bash
sudo systemctl status chat-db-rag-backend
sudo systemctl status chat-db-rag-frontend
```

---

## Solución de Problemas

### Error: "mysql: command not found"
```bash
# Ubuntu/Debian
sudo apt install mysql-client

# Fedora/RHEL
sudo dnf install mysql
```

### Error: "ModuleNotFoundError: No module named 'mysql'"
```bash
pip install mysql-connector-python
```

### Error: "Permission denied" al ejecutar script
```bash
chmod +x start.sh
```

### Error: "Address already in use"
```bash
# Buscar proceso usando el puerto
sudo lsof -i :5000
sudo lsof -i :3000

# Matar proceso
kill -9 <PID>
```

### Error: "Access denied for user"
Verifica credenciales en `backend/.env` y que el usuario tenga permisos:
```sql
GRANT ALL PRIVILEGES ON chat_db_rag.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;
```

### Ollama no responde
```bash
# Verificar estado
systemctl status ollama

# Reiniciar
sudo systemctl restart ollama

# O iniciar manualmente
ollama serve
```

### Problemas con puertos en firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 5000/tcp
sudo ufw allow 3000/tcp

# Firewalld (Fedora/RHEL)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

**Desarrollado para Linux con:** Flask + SQLAlchemy + Vanilla JS + Bootstrap 5
