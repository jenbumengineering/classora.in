#!/bin/bash

# VPS Setup Script for Classora.in CI/CD
# Run this script on your VPS to prepare it for automated deployments

set -e

echo "🚀 Setting up VPS for Classora.in CI/CD deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
print_status "Installing required packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    logwatch \
    docker.io \
    docker-compose \
    nodejs \
    npm

# Start and enable Docker
print_status "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Create deployment user
print_status "Creating deployment user..."
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p /var/www/classora.in
chown deploy:deploy /var/www/classora.in

# Create www-data user if it doesn't exist
if ! id "www-data" &>/dev/null; then
    useradd -r -s /bin/false www-data
fi

# Configure firewall
print_status "Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 25/tcp   # SMTP
ufw allow 587/tcp  # SMTP Submission
ufw allow 465/tcp  # SMTPS
ufw allow 110/tcp  # POP3
ufw allow 143/tcp  # IMAP
ufw allow 993/tcp  # IMAPS
ufw allow 995/tcp  # POP3S
ufw allow 10000/tcp # Webmin
ufw --force enable

# Configure fail2ban
print_status "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/classora.in << EOF
server {
    listen 80;
    server_name classora.in www.classora.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name classora.in www.classora.in;
    
    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/classora.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/classora.in/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy to Docker containers
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/classora.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Create SSL certificate with Let's Encrypt
print_status "Setting up SSL certificate..."
if certbot --nginx -d classora.in -d www.classora.in --non-interactive --agree-tos --email admin@classora.in; then
    print_success "SSL certificate installed successfully"
else
    print_warning "SSL certificate installation failed. You can run it manually later:"
    echo "certbot --nginx -d classora.in -d www.classora.in"
fi

# Create deployment script
print_status "Creating deployment script..."
cat > /var/www/classora.in/deploy.sh << 'EOF'
#!/bin/bash

# Deployment script for Classora.in
set -e

DEPLOY_PATH="/var/www/classora.in"
CURRENT_DIR="$DEPLOY_PATH/current"

echo "Starting deployment..."

# Stop current services
if [ -f "$CURRENT_DIR/docker-compose.yml" ]; then
    cd "$CURRENT_DIR"
    docker-compose down
fi

# Wait for services to stop
sleep 5

# Start new services
if [ -f "$CURRENT_DIR/docker-compose.yml" ]; then
    cd "$CURRENT_DIR"
    docker-compose up -d
    
    # Wait for services to start
    sleep 10
    
    # Check if services are running
    docker-compose ps
    
    echo "Deployment completed successfully!"
else
    echo "No docker-compose.yml found in current directory"
    exit 1
fi
EOF

chmod +x /var/www/classora.in/deploy.sh
chown deploy:deploy /var/www/classora.in/deploy.sh

# Create backup script
print_status "Creating backup script..."
cat > /var/www/classora.in/backup.sh << 'EOF'
#!/bin/bash

# Backup script for Classora.in
set -e

BACKUP_DIR="/var/backups/classora.in"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Creating backup..."

# Backup database
docker exec classora-mysql mysqldump -u root -proot_password_change_this classora_db > "$BACKUP_DIR/database-$DATE.sql"

# Backup application files
tar -czf "$BACKUP_DIR/app-$DATE.tar.gz" -C /var/www/classora.in current

# Backup SSL certificates
tar -czf "$BACKUP_DIR/ssl-$DATE.tar.gz" /etc/letsencrypt/live/classora.in

# Keep only last 7 backups
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /var/www/classora.in/backup.sh
chown deploy:deploy /var/www/classora.in/backup.sh

# Create log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/classora << EOF
/var/www/classora.in/*/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Create monitoring script
print_status "Creating monitoring script..."
cat > /var/www/classora.in/monitor.sh << 'EOF'
#!/bin/bash

# Monitoring script for Classora.in
set -e

LOG_FILE="/var/log/classora-monitor.log"
ALERT_EMAIL="admin@classora.in"

# Check if services are running
check_services() {
    local services=("classora-app" "classora-mysql" "classora-nginx")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "^$service$"; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        echo "$(date): Failed services: ${failed_services[*]}" >> "$LOG_FILE"
        # Send alert email here
        return 1
    fi
    
    return 0
}

# Check disk space
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 80 ]; then
        echo "$(date): Disk usage is ${usage}%" >> "$LOG_FILE"
        # Send alert email here
        return 1
    fi
    
    return 0
}

# Check memory usage
check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$usage" -gt 80 ]; then
        echo "$(date): Memory usage is ${usage}%" >> "$LOG_FILE"
        # Send alert email here
        return 1
    fi
    
    return 0
}

# Main monitoring
check_services
check_disk_space
check_memory

echo "$(date): All checks passed" >> "$LOG_FILE"
EOF

chmod +x /var/www/classora.in/monitor.sh
chown deploy:deploy /var/www/classora.in/monitor.sh

# Add monitoring to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/classora.in/monitor.sh") | crontab -

# Create systemd service for the application
print_status "Creating systemd service..."
cat > /etc/systemd/system/classora.service << EOF
[Unit]
Description=Classora.in Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/classora.in/current
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable classora.service

# Set up automatic SSL renewal
print_status "Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Create environment template
print_status "Creating environment template..."
cat > /var/www/classora.in/.env.template << EOF
# Database Configuration
DATABASE_URL=mysql://classora_user:classora_password_change_this@mysql:3306/classora_db

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://classora.in

# Email Configuration
EMAIL_PASSWORD=your_email_password_here

# Environment
NODE_ENV=production
EOF

chown deploy:deploy /var/www/classora.in/.env.template

# Create README for deployment
print_status "Creating deployment README..."
cat > /var/www/classora.in/README.md << 'EOF'
# Classora.in VPS Deployment

This directory contains the deployed Classora.in application.

## Directory Structure
- `current/` - Symlink to the current deployment
- `deployment-YYYYMMDD-HHMMSS/` - Individual deployment directories
- `backup-YYYYMMDD-HHMMSS/` - Backup directories
- `deploy.sh` - Deployment script
- `backup.sh` - Backup script
- `monitor.sh` - Monitoring script

## Manual Deployment
```bash
cd /var/www/classora.in
./deploy.sh
```

## Manual Backup
```bash
cd /var/www/classora.in
./backup.sh
```

## Monitoring
The monitoring script runs every 5 minutes and checks:
- Service status
- Disk space
- Memory usage

## SSL Certificate Renewal
SSL certificates are automatically renewed via cron job.

## Logs
- Application logs: `current/logs/`
- System logs: `/var/log/`
- Nginx logs: `/var/log/nginx/`

## Services
- Application: http://localhost:3000
- Nginx: Port 80/443
- MySQL: Port 3306
- Mail Server: Ports 25, 587, 465, 110, 143, 993, 995
- Webmin: Port 10000
EOF

chown deploy:deploy /var/www/classora.in/README.md

print_success "VPS setup completed successfully!"
print_status "Next steps:"
echo "1. Add GitHub secrets for CI/CD:"
echo "   - VPS_PASSWORD: Mainong5567"
echo "   - DATABASE_URL: mysql://classora_user:classora_password_change_this@mysql:3306/classora_db"
echo "   - NEXTAUTH_SECRET: (generate a secure secret)"
echo "   - NEXTAUTH_URL: https://classora.in"
echo "   - EMAIL_PASSWORD: (your email password)"
echo ""
echo "2. Push your code to GitHub main/master branch"
echo ""
echo "3. The CI/CD pipeline will automatically deploy to this VPS"
echo ""
echo "4. Access your application at: https://classora.in"
echo ""
echo "5. Access Webmin at: https://173.249.24.112:10000"

print_warning "Security reminders:"
echo "- Change default passwords"
echo "- Set up proper firewall rules"
echo "- Configure backup procedures"
echo "- Monitor system logs"
echo "- Set up DKIM and DMARC for email"

print_success "VPS is ready for CI/CD deployment!"
