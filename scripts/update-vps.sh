#!/bin/bash

# VPS connection details
VPS_HOST="173.249.24.112"
VPS_USER="root"
VPS_PASSWORD="Mainong5567"
DEPLOY_PATH="/var/www/classora.in"

echo "🔄 Updating VPS with latest changes..."

# Copy the generated favicon files
echo "📁 Copying favicon files..."
scp -o StrictHostKeyChecking=no public/favicon-16x16.png root@$VPS_HOST:$DEPLOY_PATH/current/public/
scp -o StrictHostKeyChecking=no public/favicon-32x32.png root@$VPS_HOST:$DEPLOY_PATH/current/public/
scp -o StrictHostKeyChecking=no public/favicon-48x48.png root@$VPS_HOST:$DEPLOY_PATH/current/public/
scp -o StrictHostKeyChecking=no public/apple-touch-icon.png root@$VPS_HOST:$DEPLOY_PATH/current/public/
scp -o StrictHostKeyChecking=no public/android-chrome-192x192.png root@$VPS_HOST:$DEPLOY_PATH/current/public/
scp -o StrictHostKeyChecking=no public/android-chrome-512x512.png root@$VPS_HOST:$DEPLOY_PATH/current/public/

# Copy the updated configuration files
echo "⚙️ Copying configuration files..."
scp -o StrictHostKeyChecking=no app/layout.tsx root@$VPS_HOST:$DEPLOY_PATH/current/app/
scp -o StrictHostKeyChecking=no next.config.js root@$VPS_HOST:$DEPLOY_PATH/current/
scp -o StrictHostKeyChecking=no nginx/nginx.conf root@$VPS_HOST:$DEPLOY_PATH/current/nginx/

# Rebuild the application
echo "🔨 Rebuilding application..."
ssh -o StrictHostKeyChecking=no root@$VPS_HOST "cd $DEPLOY_PATH/current && npm run build"

# Restart the services
echo "🔄 Restarting services..."
ssh -o StrictHostKeyChecking=no root@$VPS_HOST "cd $DEPLOY_PATH/current && docker-compose down && docker-compose up -d"

echo "✅ VPS update completed!"
echo "🌐 Check the website at: https://classora.in"
