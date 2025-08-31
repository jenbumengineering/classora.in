# Manual VPS Update Guide

## Connect to VPS
```bash
ssh root@173.249.24.112
# Password: Mainong5567
```

## Navigate to deployment directory
```bash
cd /var/www/classora.in/current
```

## Copy favicon files from local machine
From your local machine, run these commands:

```bash
# Copy favicon files
scp public/favicon-16x16.png root@173.249.24.112:/var/www/classora.in/current/public/
scp public/favicon-32x32.png root@173.249.24.112:/var/www/classora.in/current/public/
scp public/favicon-48x48.png root@173.249.24.112:/var/www/classora.in/current/public/
scp public/apple-touch-icon.png root@173.249.24.112:/var/www/classora.in/current/public/
scp public/android-chrome-192x192.png root@173.249.24.112:/var/www/classora.in/current/public/
scp public/android-chrome-512x512.png root@173.249.24.112:/var/www/classora.in/current/public/

# Copy configuration files
scp app/layout.tsx root@173.249.24.112:/var/www/classora.in/current/app/
scp next.config.js root@173.249.24.112:/var/www/classora.in/current/
scp nginx/nginx.conf root@173.249.24.112:/var/www/classora.in/current/nginx/
```

## On the VPS, rebuild and restart
```bash
# Rebuild the application
npm run build

# Restart Docker services
docker-compose down
docker-compose up -d
```

## Verify the changes
```bash
# Check if files exist
ls -la public/ | grep favicon
ls -la public/ | grep apple
ls -la public/ | grep android

# Test the website
curl -I https://classora.in/favicon-16x16.png
curl -I https://classora.in/site.webmanifest
```
