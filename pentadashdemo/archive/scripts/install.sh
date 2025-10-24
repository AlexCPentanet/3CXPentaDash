#!/bin/bash
###############################################################################
# Pentanet 3CX Internal Dashboard - Automated Installation Script
# For Debian GNU/Linux 12 (bookworm) with 3CX V20 Update 7
#
# This script installs the dashboard directly on the 3CX server without
# conflicting with existing 3CX components, ports, or database.
#
# Installation Location: /opt/pentanet-dashboard
# Database: SQLite (lightweight, non-conflicting)
# Web Port: Auto-detected available port (default: 8443)
# API Port: Auto-detected available port (default: 8444)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/pentanet-dashboard"
DATA_DIR="/var/lib/pentanet-dashboard"
LOG_DIR="/var/log/pentanet-dashboard"
NGINX_CONF="/var/lib/3cxpbx/Bin/nginx/conf/snippets/pentanet-dashboard.conf"
SERVICE_NAME="pentanet-dashboard"
INSTALL_LOG="/tmp/pentanet-dashboard-install-$(date +%Y%m%d_%H%M%S).log"

# System info from 3CX
TCX_FQDN="pentanet.3cx.com.au"
TCX_EXTERNAL_IP="175.45.85.203"
TCX_INTERNAL_IP="10.71.80.223"
TCX_VERSION="20.0.7.1057"

# Functions
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║     Pentanet 3CX Internal Dashboard - Installation Wizard     ║"
    echo "║                     Version 2.0.0                              ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$INSTALL_LOG"
}

print_error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$INSTALL_LOG"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$INSTALL_LOG"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1" | tee -a "$INSTALL_LOG"
}

print_step() {
    echo -e "${CYAN}▶${NC} $1" | tee -a "$INSTALL_LOG"
}

# Progress bar
show_progress() {
    local duration=$1
    local message=$2
    echo -n "$message "
    for ((i=0; i<duration; i++)); do
        echo -n "."
        sleep 1
    done
    echo " Done"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root or with sudo"
        exit 1
    fi
    print_success "Running with root privileges"
}

# Detect OS
detect_os() {
    if [ ! -f /etc/os-release ]; then
        print_error "Cannot detect operating system"
        exit 1
    fi

    . /etc/os-release

    if [ "$ID" != "debian" ]; then
        print_warning "This script is designed for Debian. Detected: $PRETTY_NAME"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    print_success "Detected OS: $PRETTY_NAME"
}

# Pre-installation checks
pre_install_checks() {
    print_step "Running pre-installation checks..."

    # Check if 3CX is installed
    if [ ! -d "/var/lib/3cxpbx" ]; then
        print_error "3CX installation not found at /var/lib/3cxpbx"
        exit 1
    fi
    print_success "3CX installation detected"

    # Check 3CX version
    if [ -f "/var/lib/3cxpbx/Instance1/Data/System.ini" ]; then
        TCX_VERSION=$(grep -oP 'VERSION = \K.*' /var/lib/3cxpbx/Instance1/Data/System.ini || echo "Unknown")
        print_info "3CX Version: $TCX_VERSION"
    fi

    # Check available disk space (need at least 2GB)
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then
        print_error "Insufficient disk space. Need at least 2GB free"
        exit 1
    fi
    print_success "Sufficient disk space available"

    # Check memory (need at least 1GB free)
    FREE_MEM=$(free -m | grep "^Mem:" | awk '{print $7}')
    if [ "$FREE_MEM" -lt 1024 ]; then
        print_warning "Low free memory: ${FREE_MEM}MB. Dashboard may impact performance"
    else
        print_success "Sufficient memory available: ${FREE_MEM}MB"
    fi
}

# Backup prompt
backup_prompt() {
    print_header
    echo -e "${YELLOW}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  IMPORTANT NOTICE  ⚠️                     ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo "Before proceeding with installation, it is STRONGLY RECOMMENDED to:"
    echo
    echo "  1. Take a VM snapshot of this server"
    echo "  2. Run a full 3CX backup via the Management Console"
    echo "  3. Download the backup file to a safe location"
    echo
    echo "This installation will:"
    echo "  ✓ Install Node.js packages"
    echo "  ✓ Create new nginx virtual host (non-conflicting)"
    echo "  ✓ Create systemd services"
    echo "  ⚠ May require brief nginx reload (< 1 second interruption)"
    echo
    echo -e "${RED}The installation is automated but requires your confirmation.${NC}"
    echo

    read -p "Have you completed a snapshot and backup download? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled by user"
        echo "Please complete backups and run the installer again."
        exit 0
    fi

    print_success "Backup confirmation received"
}

# Find available ports
find_available_port() {
    local start_port=$1
    local port=$start_port

    while netstat -tuln | grep -q ":$port "; do
        port=$((port + 1))
    done

    echo $port
}

# Detect and recommend ports
detect_ports() {
    print_step "Detecting available ports..."

    # Show currently used ports
    print_info "Currently used ports by 3CX:"
    print_info "  SIP: 5060, SIPS: 5061, Tunnel: 5090"
    print_info "  Media: 9000-10999"
    print_info "  HTTP: 5000, HTTPS: 5001"

    # Find available ports
    WEB_PORT=$(find_available_port 8443)
    API_PORT=$(find_available_port 8444)

    print_success "Recommended available ports:"
    print_info "  Dashboard HTTPS: $WEB_PORT"
    print_info "  API Backend: $API_PORT"

    # Confirm ports
    read -p "Use these ports? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "Enter Dashboard HTTPS port: " WEB_PORT
        read -p "Enter API Backend port: " API_PORT
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."

    # Update package list
    apt-get update >> "$INSTALL_LOG" 2>&1

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_info "Installing Node.js 20.x LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >> "$INSTALL_LOG" 2>&1
        apt-get install -y nodejs >> "$INSTALL_LOG" 2>&1
        print_success "Node.js installed: $(node --version)"
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js already installed: $NODE_VERSION"
    fi

    # Install other dependencies
    print_info "Installing additional packages..."
    apt-get install -y sqlite3 netstat-nat >> "$INSTALL_LOG" 2>&1

    # Verify installations
    if command -v node &> /dev/null && command -v npm &> /dev/null && command -v sqlite3 &> /dev/null; then
        print_success "All dependencies installed successfully"
    else
        print_error "Failed to install required dependencies"
        exit 1
    fi
}

# Create directories
create_directories() {
    print_step "Creating installation directories..."

    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$DATA_DIR/database"
    mkdir -p "$DATA_DIR/reports"
    mkdir -p "$DATA_DIR/uploads"

    print_success "Directories created"
}

# Copy application files
copy_files() {
    print_step "Copying application files..."

    # Get script directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

    # Copy files
    rsync -av --exclude='install.sh' --exclude='.git' --exclude='node_modules' \
        "$SOURCE_DIR/" "$INSTALL_DIR/" >> "$INSTALL_LOG" 2>&1

    print_success "Application files copied"
}

# Install Node.js packages
install_node_packages() {
    print_step "Installing Node.js packages..."

    cd "$INSTALL_DIR/server"

    # Create package.json if not exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        exit 1
    fi

    npm install --production >> "$INSTALL_LOG" 2>&1

    if [ $? -eq 0 ]; then
        print_success "Node.js packages installed"
    else
        print_error "Failed to install Node.js packages"
        exit 1
    fi
}

# Generate secure secrets
generate_secrets() {
    print_step "Generating secure secrets..."

    JWT_SECRET=$(openssl rand -hex 64)
    SESSION_SECRET=$(openssl rand -hex 64)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

    print_success "Secrets generated"
}

# Create configuration
create_config() {
    print_step "Creating configuration files..."

    # Create .env file
    cat > "$INSTALL_DIR/server/.env" << EOF
# Pentanet Dashboard Configuration
# Generated: $(date)

# Server Configuration
NODE_ENV=production
PORT=$API_PORT
WEB_PORT=$WEB_PORT

# Security
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# Database
DB_PATH=$DATA_DIR/database/dashboard.db

# 3CX Configuration
TCX_FQDN=$TCX_FQDN
TCX_PORT=5001
TCX_EXTERNAL_IP=$TCX_EXTERNAL_IP
TCX_INTERNAL_IP=$TCX_INTERNAL_IP
TCX_VERSION=$TCX_VERSION

# Paths
DATA_DIR=$DATA_DIR
LOG_DIR=$LOG_DIR
REPORTS_DIR=$DATA_DIR/reports
UPLOADS_DIR=$DATA_DIR/uploads
RECORDINGS_DIR=/var/lib/3cxpbx/Instance1/Data/Recordings

# Recording Storage (SMB)
RECORDINGS_SMB=smb://10.71.80.203
RECORDINGS_DOMAIN=PENTANET
RECORDINGS_USER=svc.callrecordings
RECORDINGS_SHARE=CallRecordings

# Email (configure in admin panel)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Default Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_EMAIL=stephen@pentanet.com.au

# Session Configuration
SESSION_TIMEOUT=3600000
REQUIRE_2FA=false

# IP Whitelisting (comma-separated, empty = allow all)
IP_WHITELIST=

# Logging
LOG_LEVEL=info
EOF

    chmod 600 "$INSTALL_DIR/server/.env"

    print_success "Configuration created"
}

# Initialize database
init_database() {
    print_step "Initializing database..."

    cd "$INSTALL_DIR/server"

    # Run database initialization script
    node -e "
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('$DATA_DIR/database/dashboard.db');

    db.serialize(() => {
        // Users table with enhanced fields
        db.run(\`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                fullName TEXT,
                role TEXT NOT NULL DEFAULT 'viewer',
                departments TEXT,
                permissions TEXT,
                active INTEGER NOT NULL DEFAULT 1,
                require2FA INTEGER DEFAULT 0,
                twoFASecret TEXT,
                lastLogin DATETIME,
                loginAttempts INTEGER DEFAULT 0,
                lockedUntil DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        \`);

        // IP whitelist table
        db.run(\`
            CREATE TABLE IF NOT EXISTS ip_whitelist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ipAddress TEXT NOT NULL,
                description TEXT,
                createdBy INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(createdBy) REFERENCES users(id)
            )
        \`);

        console.log('Database initialized');
        db.close();
    });
    " >> "$INSTALL_LOG" 2>&1

    print_success "Database initialized"
}

# Configure nginx
configure_nginx() {
    print_step "Configuring nginx virtual host..."

    # Check if 3CX nginx is running
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx is not running"
        exit 1
    fi

    # Create nginx snippet configuration
    cat > "$NGINX_CONF" << EOF
# Pentanet Dashboard Configuration
# Auto-generated: $(date)

location /pentanet-dashboard {
    alias $INSTALL_DIR/public;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Caching for static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    try_files \$uri \$uri/ /pentanet-dashboard/index.html;
}

# API proxy
location /pentanet-api {
    proxy_pass http://127.0.0.1:$API_PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
}

# WebSocket for real-time updates
location /pentanet-ws {
    proxy_pass http://127.0.0.1:$API_PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
}
EOF

    chmod 644 "$NGINX_CONF"

    # Test nginx configuration
    if nginx -t >> "$INSTALL_LOG" 2>&1; then
        print_success "Nginx configuration created"
    else
        print_error "Nginx configuration test failed"
        cat "$INSTALL_LOG" | tail -20
        exit 1
    fi
}

# Create systemd service
create_systemd_service() {
    print_step "Creating systemd service..."

    cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=Pentanet 3CX Internal Dashboard
After=network.target nginx.service
Requires=nginx.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/server
EnvironmentFile=$INSTALL_DIR/server/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/dashboard.log
StandardError=append:$LOG_DIR/error.log

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

    chmod 644 "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload

    print_success "Systemd service created"
}

# Set permissions
set_permissions() {
    print_step "Setting file permissions..."

    chown -R root:root "$INSTALL_DIR"
    chown -R root:root "$DATA_DIR"
    chown -R root:root "$LOG_DIR"

    chmod 755 "$INSTALL_DIR"
    chmod 700 "$DATA_DIR"
    chmod 700 "$LOG_DIR"

    # Secure database
    chmod 600 "$DATA_DIR/database/dashboard.db" 2>/dev/null || true

    print_success "Permissions set"
}

# Start services
start_services() {
    print_step "Starting services..."

    # Start dashboard service
    systemctl enable "${SERVICE_NAME}.service" >> "$INSTALL_LOG" 2>&1
    systemctl start "${SERVICE_NAME}.service"

    if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
        print_success "Dashboard service started"
    else
        print_error "Failed to start dashboard service"
        journalctl -u "${SERVICE_NAME}.service" -n 50 >> "$INSTALL_LOG"
        exit 1
    fi

    # Reload nginx
    print_info "Reloading nginx (brief interruption possible)..."
    systemctl reload nginx

    if [ $? -eq 0 ]; then
        print_success "Nginx reloaded successfully"
    else
        print_error "Failed to reload nginx"
        exit 1
    fi
}

# Post-installation verification
post_install_verification() {
    print_step "Running post-installation verification..."

    local errors=0

    # Check if service is running
    if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
        print_success "Service is running"
    else
        print_error "Service is not running"
        errors=$((errors + 1))
    fi

    # Check if API responds
    sleep 3  # Give service time to start
    if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$API_PORT/health" | grep -q "200"; then
        print_success "API is responding"
    else
        print_warning "API health check failed (may need more time to start)"
    fi

    # Check database
    if [ -f "$DATA_DIR/database/dashboard.db" ]; then
        print_success "Database exists"
    else
        print_error "Database not found"
        errors=$((errors + 1))
    fi

    # Check nginx config
    if nginx -t >> "$INSTALL_LOG" 2>&1; then
        print_success "Nginx configuration valid"
    else
        print_error "Nginx configuration invalid"
        errors=$((errors + 1))
    fi

    # Check log files
    if [ -d "$LOG_DIR" ] && [ -w "$LOG_DIR" ]; then
        print_success "Log directory writable"
    else
        print_error "Log directory not writable"
        errors=$((errors + 1))
    fi

    # Check Node.js dependencies
    if [ -d "$INSTALL_DIR/server/node_modules" ]; then
        print_success "Node.js dependencies installed"
    else
        print_error "Node.js dependencies missing"
        errors=$((errors + 1))
    fi

    if [ $errors -eq 0 ]; then
        print_success "All verification checks passed!"
        return 0
    else
        print_warning "Verification completed with $errors error(s)"
        return 1
    fi
}

# Print installation summary
print_summary() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          Installation Completed Successfully! 🎉              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}System Information:${NC}"
    echo "  Installation Directory: $INSTALL_DIR"
    echo "  Data Directory: $DATA_DIR"
    echo "  Log Directory: $LOG_DIR"
    echo "  Database: $DATA_DIR/database/dashboard.db"
    echo
    echo -e "${CYAN}Service Configuration:${NC}"
    echo "  Service Name: $SERVICE_NAME"
    echo "  Status: $(systemctl is-active $SERVICE_NAME)"
    echo "  API Port: $API_PORT"
    echo "  Web Port: $WEB_PORT"
    echo
    echo -e "${CYAN}Access Information:${NC}"
    echo "  📊 Public Dashboard: https://$TCX_FQDN:5001/pentanet-dashboard"
    echo "  🔧 Admin Setup Wizard: https://$TCX_FQDN:5001/pentanet-dashboard/setup"
    echo "  👤 Admin Panel: https://$TCX_FQDN:5001/pentanet-dashboard/admin"
    echo
    echo -e "${YELLOW}Default Admin Credentials:${NC}"
    echo "  Username: admin"
    echo "  Password: $ADMIN_PASSWORD"
    echo "  Email: stephen@pentanet.com.au"
    echo
    echo -e "${RED}⚠️  IMPORTANT: Change the admin password immediately!${NC}"
    echo
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Open the Admin Setup Wizard (URL above)"
    echo "  2. Complete the configuration wizard"
    echo "  3. Configure 3CX API credentials"
    echo "  4. Set up email alerts (SMTP)"
    echo "  5. Configure IP whitelisting (optional)"
    echo "  6. Change admin password"
    echo
    echo -e "${CYAN}Service Management:${NC}"
    echo "  Start:   systemctl start $SERVICE_NAME"
    echo "  Stop:    systemctl stop $SERVICE_NAME"
    echo "  Restart: systemctl restart $SERVICE_NAME"
    echo "  Status:  systemctl status $SERVICE_NAME"
    echo "  Logs:    journalctl -u $SERVICE_NAME -f"
    echo
    echo -e "${CYAN}Installation Log:${NC}"
    echo "  Full log: $INSTALL_LOG"
    echo "  Download: curl -O file://$INSTALL_LOG"
    echo
    echo -e "${GREEN}Thank you for installing Pentanet 3CX Internal Dashboard!${NC}"
    echo
}

# Uninstall function
create_uninstall_script() {
    cat > "$INSTALL_DIR/uninstall.sh" << 'UNINSTALL_EOF'
#!/bin/bash
# Pentanet Dashboard Uninstall Script

set -e

echo "Uninstalling Pentanet Dashboard..."

# Stop service
systemctl stop pentanet-dashboard 2>/dev/null || true
systemctl disable pentanet-dashboard 2>/dev/null || true

# Remove service file
rm -f /etc/systemd/system/pentanet-dashboard.service
systemctl daemon-reload

# Remove nginx configuration
rm -f /var/lib/3cxpbx/Bin/nginx/conf/snippets/pentanet-dashboard.conf
nginx -t && systemctl reload nginx

# Ask about data removal
read -p "Remove data and database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf /var/lib/pentanet-dashboard
    echo "Data removed"
fi

# Remove installation directory
rm -rf /opt/pentanet-dashboard

# Remove logs
rm -rf /var/log/pentanet-dashboard

echo "✓ Pentanet Dashboard uninstalled successfully"
UNINSTALL_EOF

    chmod +x "$INSTALL_DIR/uninstall.sh"
}

# Main installation process
main() {
    print_header

    echo "Installation Log: $INSTALL_LOG" | tee "$INSTALL_LOG"
    echo

    check_root
    detect_os
    backup_prompt
    pre_install_checks
    detect_ports

    echo
    print_step "Starting installation process..."
    echo

    install_dependencies
    create_directories
    copy_files
    install_node_packages
    generate_secrets
    create_config
    init_database
    configure_nginx
    create_systemd_service
    set_permissions
    create_uninstall_script
    start_services

    echo
    print_step "Running verification..."
    echo

    post_install_verification

    print_summary
}

# Run installation
main "$@"

exit 0
