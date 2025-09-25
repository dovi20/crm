module.exports = {
  apps: [{
    name: 'inventory-crm',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/crm',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/inventory-crm-error.log',
    out_file: '/var/log/pm2/inventory-crm-out.log',
    log_file: '/var/log/pm2/inventory-crm-combined.log',
    time: true
  }]
}