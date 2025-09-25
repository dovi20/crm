# Deployment Instructions

This document explains how to deploy the Inventory Management System to your Ubuntu server.

## Prerequisites

- Ubuntu server with nginx installed
- Node.js and npm installed
- PM2 installed globally (`npm install -g pm2`)
- SSL certificate (Let's Encrypt recommended)

## Files Overview

- `nginx.conf` - Nginx configuration for the application
- `deploy.sh` - Main application deployment script
- `deploy-nginx.sh` - Nginx configuration deployment script

## Step 1: Initial Server Setup

1. **Install required packages:**
   ```bash
   sudo apt update
   sudo apt install nginx nodejs npm certbot python3-certbot-nginx
   npm install -g pm2
   ```

2. **Create application directory:**
   ```bash
   sudo mkdir -p /var/www/crm
   sudo chown -R $USER:$USER /var/www/crm
   ```

## Step 2: Deploy Application

1. **Clone your repository:**
   ```bash
   cd /var/www/crm
   git clone <your-repository-url> .
   ```

2. **Install dependencies and build:**
   ```bash
   npm ci --production
   npm run build
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Step 3: Configure Nginx

1. **Copy nginx configuration:**
   ```bash
   sudo cp /var/www/crm/nginx.conf /etc/nginx/sites-available/crm.pamonim.online
   ```

2. **Create symlink:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/crm.pamonim.online /etc/nginx/sites-enabled/
   ```

3. **Remove default site (optional):**
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

4. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

5. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

## Step 4: SSL Certificate (Let's Encrypt)

1. **Install SSL certificate:**
   ```bash
   sudo certbot --nginx -d crm.pamonim.online
   ```

2. **Auto-renewal:**
   ```bash
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

## Step 5: Firewall Configuration

1. **Enable firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 'Nginx Full'
   sudo ufw allow ssh
   ```

## Troubleshooting

### Nginx Configuration Error
If you get an error like "unknown directive ssl_private_key", make sure you're using the correct nginx configuration from this repository.

### Application Not Loading
1. Check PM2 status: `pm2 status`
2. Check PM2 logs: `pm2 logs inventory-crm`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify the application is running on port 3000: `curl http://localhost:3000`

### SSL Issues
1. Check certificate: `sudo certbot certificates`
2. Renew certificate: `sudo certbot renew`
3. Check nginx SSL configuration

## Monitoring

- **Application logs:** `pm2 logs inventory-crm`
- **Nginx access logs:** `sudo tail -f /var/log/nginx/access.log`
- **Nginx error logs:** `sudo tail -f /var/log/nginx/error.log`
- **System logs:** `sudo journalctl -u nginx.service -f`

## Security Notes

- The nginx configuration includes security headers
- SSL/TLS is configured with modern ciphers
- Static files are cached for optimal performance
- Firewall is configured to allow only necessary ports

## Production Checklist

- [ ] SSL certificate installed and valid
- [ ] Firewall configured
- [ ] Nginx configuration tested and working
- [ ] Application running on PM2
- [ ] Backups configured
- [ ] Monitoring in place
- [ ] Domain pointing to server IP