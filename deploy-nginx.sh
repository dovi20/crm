#!/bin/bash

# Nginx Configuration Deployment Script
# This script deploys the nginx configuration for the CRM application

echo "🚀 Deploying Nginx configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
DOMAIN="crm.pamonim.online"
APP_DIR="/var/www/crm"

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run this script as root (sudo)"
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    error "Nginx is not installed. Please install nginx first: sudo apt update && sudo apt install nginx"
fi

# Create sites-available directory if it doesn't exist
sudo mkdir -p "$NGINX_SITES_AVAILABLE"

# Copy nginx configuration
echo "Copying nginx configuration..."
sudo cp "$APP_DIR/nginx.conf" "$NGINX_SITES_AVAILABLE/$DOMAIN"

# Remove old symlink if exists
if [ -L "$NGINX_SITES_ENABLED/$DOMAIN" ]; then
    echo "Removing old nginx site configuration..."
    sudo rm "$NGINX_SITES_ENABLED/$DOMAIN"
fi

# Create symlink
echo "Creating nginx site symlink..."
sudo ln -s "$NGINX_SITES_AVAILABLE/$DOMAIN" "$NGINX_SITES_ENABLED/"

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    success "Nginx configuration test passed"
else
    error "Nginx configuration test failed. Please check the configuration file."
fi

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    success "Nginx reloaded successfully"
else
    error "Failed to reload nginx. Check systemctl status nginx.service"
fi

# Check nginx status
echo "Checking nginx status..."
sudo systemctl status nginx --no-pager -l

success "Nginx configuration deployed successfully!"
echo "Your application should now be available at: https://$DOMAIN"

# Optional: Enable firewall if ufw is available
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    sudo ufw allow 'Nginx Full'
    success "Firewall configured for Nginx"
fi