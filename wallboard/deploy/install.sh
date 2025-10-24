#!/bin/bash

###############################################################################
# 3CX Wallboard Installation Script
# For Linux on-premise deployment
# Compatible with: Ubuntu 20.04+, Debian 10+, CentOS 8+
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/var/www/html/wallboard"
NGINX_CONF="/etc/nginx/sites-available/wallboard"
NGINX_ENABLED="/etc/nginx/sites-enabled/wallboard"
SERVICE_NAME="3cx-wallboard"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          3CX Wallboard Installation Script                ║"
    echo "║          Version 2.0.0 - Linux Deployment                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root or with sudo"
        exit 1
    fi
    print_success "Running with root privileges"
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
        print_info "Detected OS: $PRETTY_NAME"
    else
        print_error "Cannot detect operating system"
        exit 1
    fi
}

check_dependencies() {
    print_info "Checking dependencies..."

    # Check for nginx
    if ! command -v nginx &> /dev/null; then
        print_info "Nginx not found. Installing..."

        case $OS in
            ubuntu|debian)
                apt-get update
                apt-get install -y nginx
                ;;
            centos|rhel|fedora)
                yum install -y nginx
                ;;
            *)
                print_error "Unsupported OS for automatic nginx installation"
                exit 1
                ;;
        esac

        print_success "Nginx installed"
    else
        print_success "Nginx is installed"
    fi

    # Check for certbot (optional, for SSL)
    if ! command -v certbot &> /dev/null; then
        print_info "Certbot not found. You'll need to configure SSL manually."
    else
        print_success "Certbot is available for SSL setup"
    fi
}

backup_existing() {
    if [ -d "$INSTALL_DIR" ]; then
        BACKUP_DIR="/var/backups/wallboard_$(date +%Y%m%d_%H%M%S)"
        print_info "Backing up existing installation to $BACKUP_DIR"
        mkdir -p /var/backups
        mv "$INSTALL_DIR" "$BACKUP_DIR"
        print_success "Backup created"
    fi
}

create_directories() {
    print_info "Creating installation directory..."
    mkdir -p "$INSTALL_DIR"
    print_success "Directory created: $INSTALL_DIR"
}

copy_files() {
    print_info "Copying wallboard files..."

    # Get the script's directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

    # Copy files (excluding deploy directory and git files)
    rsync -av --exclude='deploy' --exclude='.git' --exclude='config.js' \
        "$SOURCE_DIR/" "$INSTALL_DIR/"

    print_success "Files copied"
}

setup_config() {
    print_info "Setting up configuration..."

    if [ ! -f "$INSTALL_DIR/config.js" ]; then
        if [ -f "$INSTALL_DIR/config.example.js" ]; then
            cp "$INSTALL_DIR/config.example.js" "$INSTALL_DIR/config.js"
            print_success "Configuration file created from template"
            print_info "Please edit $INSTALL_DIR/config.js with your 3CX details"
        else
            print_error "config.example.js not found"
            exit 1
        fi
    else
        print_success "Configuration file already exists"
    fi
}

set_permissions() {
    print_info "Setting file permissions..."

    # Set ownership to www-data (nginx user)
    chown -R www-data:www-data "$INSTALL_DIR"

    # Set directory permissions
    find "$INSTALL_DIR" -type d -exec chmod 755 {} \;

    # Set file permissions
    find "$INSTALL_DIR" -type f -exec chmod 644 {} \;

    print_success "Permissions set"
}

configure_nginx() {
    print_info "Configuring Nginx..."

    # Create nginx configuration
    cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

    root /var/www/html/wallboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Disable access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /config\.js$ {
        # Allow config.js but log access
        access_log /var/log/nginx/wallboard_config_access.log;
    }
}
EOF

    # Enable site
    if [ ! -L "$NGINX_ENABLED" ]; then
        ln -s "$NGINX_CONF" "$NGINX_ENABLED"
        print_success "Nginx site enabled"
    else
        print_success "Nginx site already enabled"
    fi

    # Test nginx configuration
    if nginx -t &> /dev/null; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
        nginx -t
        exit 1
    fi
}

restart_nginx() {
    print_info "Restarting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    print_success "Nginx restarted and enabled"
}

setup_ssl() {
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v certbot &> /dev/null; then
            read -p "Enter your domain name: " DOMAIN
            read -p "Enter your email address: " EMAIL

            print_info "Setting up SSL certificate..."
            certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

            print_success "SSL certificate installed"
        else
            print_error "Certbot is not installed. Please install it first."
        fi
    else
        print_info "Skipping SSL setup. You can configure it manually later."
    fi
}

create_systemd_service() {
    read -p "Do you want to create a systemd service for automatic updates? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Creating systemd service..."

        cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=3CX Wallboard Update Service
After=network.target nginx.service

[Service]
Type=oneshot
ExecStart=/bin/bash ${INSTALL_DIR}/deploy/update.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

        # Create timer for weekly updates
        cat > "/etc/systemd/system/${SERVICE_NAME}.timer" << EOF
[Unit]
Description=3CX Wallboard Weekly Update
Requires=${SERVICE_NAME}.service

[Timer]
OnCalendar=weekly
Persistent=true

[Install]
WantedBy=timers.target
EOF

        systemctl daemon-reload
        systemctl enable "${SERVICE_NAME}.timer"
        systemctl start "${SERVICE_NAME}.timer"

        print_success "Systemd service created and enabled"
    fi
}

configure_firewall() {
    if command -v ufw &> /dev/null; then
        read -p "Do you want to configure UFW firewall? (y/n): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Configuring firewall..."

            ufw allow 'Nginx Full'
            ufw --force enable

            print_success "Firewall configured"
        fi
    elif command -v firewall-cmd &> /dev/null; then
        read -p "Do you want to configure firewalld? (y/n): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Configuring firewall..."

            firewall-cmd --permanent --add-service=http
            firewall-cmd --permanent --add-service=https
            firewall-cmd --reload

            print_success "Firewall configured"
        fi
    fi
}

print_summary() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            Installation Completed Successfully!           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}Installation Directory:${NC} $INSTALL_DIR"
    echo -e "${BLUE}Nginx Configuration:${NC} $NGINX_CONF"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Edit configuration file:"
    echo "   nano $INSTALL_DIR/config.js"
    echo
    echo "2. Update your 3CX connection details:"
    echo "   - PBX FQDN"
    echo "   - Client ID"
    echo "   - Client Secret (API Key)"
    echo
    echo "3. Access the wallboard:"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "   http://$SERVER_IP/"
    echo
    echo "4. (Optional) Configure SSL certificate"
    echo "5. (Optional) Update server_name in nginx config with your domain"
    echo
    echo -e "${GREEN}For troubleshooting, check:${NC}"
    echo "  - Nginx logs: /var/log/nginx/error.log"
    echo "  - Browser console (F12)"
    echo "  - Configuration: $INSTALL_DIR/config.js"
    echo
}

# Main installation process
main() {
    print_header

    check_root
    detect_os
    check_dependencies
    backup_existing
    create_directories
    copy_files
    setup_config
    set_permissions
    configure_nginx
    restart_nginx
    setup_ssl
    create_systemd_service
    configure_firewall
    print_summary
}

# Run installation
main

exit 0
