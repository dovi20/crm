#!/bin/bash

# Inventory Management System - Auto Deployment Script
# Usage: ./deploy.sh

echo "🚀 Starting deployment process..."

# Set script to exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="inventory-crm"
APP_DIR="/var/www/crm"
BACKUP_DIR="/var/backups/crm"
LOG_FILE="/var/log/deploy.log"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as non-root user
if [ "$EUID" -eq 0 ]; then
    error "Please run this script as a non-root user with sudo privileges"
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    error "App directory $APP_DIR does not exist"
fi

cd "$APP_DIR"

log "Checking PM2 status..."
if pm2 list | grep -q "$APP_NAME"; then
    PM2_RUNNING=true
    log "PM2 process found: $APP_NAME"
else
    PM2_RUNNING=false
    warning "PM2 process not found: $APP_NAME"
fi

# Create backup
log "Creating backup..."
sudo mkdir -p "$BACKUP_DIR"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
sudo cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
log "Backup created: $BACKUP_DIR/$BACKUP_NAME"

# Pull latest changes
log "Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main

# Install dependencies
log "Installing dependencies..."
npm ci --production --silent

# Build the application
log "Building application..."
npm run build

# Restart PM2 if it was running
if [ "$PM2_RUNNING" = true ]; then
    log "Restarting PM2 process..."
    pm2 restart "$APP_NAME"
    sleep 3
    
    # Check if restart was successful
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log "✅ PM2 restart successful"
    else
        error "PM2 restart failed"
    fi
else
    log "Starting PM2 process..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# Health check
log "Performing health check..."
sleep 5

# Check if the application is responding
if curl -f -s http://localhost:3000 > /dev/null; then
    log "✅ Application is responding on port 3000"
else
    warning "Application might not be responding properly"
fi

# Clean up old backups (keep only last 5)
log "Cleaning up old backups..."
sudo find "$BACKUP_DIR" -name "backup-*" -type d | sort -r | tail -n +6 | sudo xargs rm -rf

# Show PM2 status
log "Current PM2 status:"
pm2 status

log "🎉 Deployment completed successfully!"
log "Application is available at: https://crm.pamonim.online"

# Show recent logs
echo ""
echo "Recent application logs:"
pm2 logs "$APP_NAME" --lines 10 --nostream