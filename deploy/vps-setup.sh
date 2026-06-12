#!/usr/bin/env bash

# ---------------------------------------------------------------
# Symbio Tech – Production deployment script (Ubuntu VPS)
# ---------------------------------------------------------------
# What it does:
#   1. Installs system packages (nginx, ufw, certbot, node, python, etc.)
#   2. Clones the repository (expects you to run this inside the target folder)
#   3. Builds Frontend (Next.js) and prepares static output
#   4. Sets up Python virtual‑env for the AI service
#   5. Installs Node dependencies for backend & registers it with PM2
#   6. Creates systemd unit files for FastAPI and Express
#   7. Configures Nginx as a reverse‑proxy and enables HTTPS via Let’s Encrypt
#   8. Starts all services and prints a short status report
# ---------------------------------------------------------------

set -e

# -------------------- 0️⃣ Configurable variables --------------------
# EDIT THESE BEFORE RUNNING
DOMAIN="yourdomain.com"          # <-- replace with your real domain (A‑record must point to this server)
REPO_URL="https://github.com/your-org/symbio-tech.git"  # <-- your repo URL
PROJECT_ROOT="$HOME/symbio"      # where the code will live

# Ports used internally (do NOT expose directly to Internet)
AI_PORT=8000
BACKEND_PORT=5000
# ---------------------------------------------------------------

echo "=== Updating system and installing prerequisites ==="
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl gnupg2 nginx ufw certbot python3-certbot-nginx build-essential libssl-dev libffi-dev python3-dev

# Node LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# ---------------------------------------------------------------
# Create a firewall allowing only needed ports
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# ---------------------------------------------------------------
# Clone the repo (or pull latest if it already exists)
if [ -d "$PROJECT_ROOT" ]; then
  echo "Project directory exists – pulling latest..."
  cd "$PROJECT_ROOT"
  git pull
else
  echo "Cloning repository..."
  git clone "$REPO_URL" "$PROJECT_ROOT"
  cd "$PROJECT_ROOT"
fi

# ---------------------------------------------------------------
# ----------- 1️⃣ Frontend – build static site --------------------
cd frontend
npm ci
npm run build   # creates .next/.output or ./out depending on next.config.js
# Export as static files (Next.js 13+ supports `output: "export"`)
# If you use `next export`, the folder will be `out/`
# Ensure the folder exists
if [ -d ".next/output" ]; then
  STATIC_DIR=".next/output"
elif [ -d "out" ]; then
  STATIC_DIR="out"
else
  echo "Unable to locate built static files – please verify your Next.js config."
  exit 1
fi
cd ..

# ---------------------------------------------------------------
# ----------- 2️⃣ Backend – install deps & PM2 ----------------------
cd backend
npm ci
# Install PM2 globally (used for keeping the Node process alive)
sudo npm install -g pm2
pm2 start src/index.js --name backend --watch
pm2 save
cd ..

# ---------------------------------------------------------------
# ----------- 3️⃣ AI Service – Python virtual‑env ------------------
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# ---------------------------------------------------------------
# ----------- 4️⃣ Systemd units for FastAPI & Express -------------
# AI Service (FastAPI)
sudo tee /etc/systemd/system/ai-service.service > /dev/null <<EOF
[Unit]
Description=Symbio AI Service (FastAPI)
After=network.target

[Service]
User=$USER
WorkingDirectory=$PROJECT_ROOT/ai-service
EnvironmentFile=$PROJECT_ROOT/.env
ExecStart=$PROJECT_ROOT/ai-service/.venv/bin/uvicorn main:app --host 0.0.0.0 --port $AI_PORT
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Backend (Express) – we will run it via PM2, but also expose a systemd wrapper for safety
sudo tee /etc/systemd/system/backend.service > /dev/null <<EOF
[Unit]
Description=Symbio Backend (Express) – managed by PM2
After=network.target

[Service]
User=$USER
WorkingDirectory=$PROJECT_ROOT/backend
EnvironmentFile=$PROJECT_ROOT/.env
ExecStart=/usr/local/bin/pm2 resurrect && /usr/local/bin/pm2 start src/index.js --name backend --watch
ExecReload=/usr/local/bin/pm2 reload all
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ai-service.service backend.service
sudo systemctl start ai-service.service backend.service

# ---------------------------------------------------------------
# --------------------- 5️⃣ Nginx config -----------------------
sudo tee /etc/nginx/sites-available/symbio > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # ---- Frontend (static) ----
    root $PROJECT_ROOT/$STATIC_DIR;
    index index.html;
    try_files $uri $uri/ /index.html;

    # API routes → FastAPI (AI)
    location /api/ {
        proxy_pass http://127.0.0.1:$AI_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend routes → Express
    location /backend/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Optional – static assets caching
    location ~* \.(js|css|png|jpg|jpeg|svg|gif|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site and test config
sudo ln -sf /etc/nginx/sites-available/symbio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# ---------------------------------------------------------------
# ------------------- 6️⃣ Let’s Encrypt SSL --------------------
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# ---------------------------------------------------------------
# Final status report
echo "\n=== Deployment complete ==="
sudo systemctl status nginx | head -n 10
sudo systemctl status ai-service | head -n 10
sudo systemctl status backend | head -n 10

echo "\nVisit https://$DOMAIN to see the live site."
