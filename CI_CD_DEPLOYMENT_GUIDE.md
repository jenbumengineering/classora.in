# Classora.in CI/CD Deployment Guide

This guide will help you set up automated CI/CD deployment from GitHub to your VPS using GitHub Actions.

## 🚀 Quick Start

### 1. Initial VPS Setup

First, upload and set up your VPS:

```bash
# Make scripts executable
chmod +x scripts/setup-vps.sh scripts/upload-to-vps.sh

# Upload project to VPS and set up initial deployment
./scripts/upload-to-vps.sh
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_PASSWORD` | `Mainong5567` | VPS root password |
| `DATABASE_URL` | `mysql://classora_user:classora_password_change_this@mysql:3306/classora_db` | Database connection string |
| `NEXTAUTH_SECRET` | `your_secure_secret_here` | NextAuth secret (generate with: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://classora.in` | Your domain URL |
| `EMAIL_PASSWORD` | `your_email_password` | Email server password |

### 3. Push to GitHub

Push your code to the main/master branch to trigger the first deployment:

```bash
git add .
git commit -m "Initial CI/CD setup"
git push origin main
```

## 📋 Prerequisites

### Local Development Machine
- Git
- Node.js 18+
- npm or yarn
- sshpass (for initial setup)

### VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- Root access
- Static IP address
- Domain name pointing to the VPS

## 🔧 Detailed Setup

### Step 1: VPS Preparation

The `scripts/setup-vps.sh` script will:

1. **Install Required Packages**
   - Docker and Docker Compose
   - Nginx web server
   - Certbot for SSL certificates
   - UFW firewall
   - Fail2ban for security
   - Node.js and npm

2. **Configure Services**
   - Nginx with SSL support
   - Firewall rules
   - Fail2ban protection
   - Automatic SSL renewal

3. **Create Directory Structure**
   ```
   /var/www/classora.in/
   ├── current/                 # Symlink to current deployment
   ├── deployment-YYYYMMDD-HHMMSS/  # Individual deployments
   ├── backup-YYYYMMDD-HHMMSS/      # Backup directories
   ├── deploy.sh              # Deployment script
   ├── backup.sh              # Backup script
   ├── monitor.sh             # Monitoring script
   └── README.md              # Deployment documentation
   ```

### Step 2: Initial Deployment

The `scripts/upload-to-vps.sh` script will:

1. **Create Deployment Package**
   - Exclude unnecessary files (.git, node_modules, .next, etc.)
   - Compress project files

2. **Upload to VPS**
   - Transfer files via SCP
   - Extract and organize deployment

3. **Setup Services**
   - Install dependencies
   - Generate Prisma client
   - Build application
   - Start Docker services

### Step 3: GitHub Actions Configuration

The `.github/workflows/deploy.yml` workflow:

1. **Test Stage**
   - Runs on every push and pull request
   - Installs dependencies
   - Runs tests with MySQL service
   - Validates build process

2. **Deploy Stage**
   - Runs only on main/master branch
   - Creates deployment package
   - Uploads to VPS
   - Deploys with zero-downtime
   - Performs health checks

## 🔄 CI/CD Pipeline Flow

```mermaid
graph TD
    A[Push to main/master] --> B[Run Tests]
    B --> C{Tests Pass?}
    C -->|No| D[Fail Build]
    C -->|Yes| E[Build Application]
    E --> F[Create Deployment Package]
    F --> G[Upload to VPS]
    G --> H[Backup Current Deployment]
    H --> I[Extract New Deployment]
    I --> J[Install Dependencies]
    J --> K[Generate Prisma Client]
    K --> L[Build Application]
    L --> M[Update Current Symlink]
    M --> N[Restart Services]
    N --> O[Health Check]
    O --> P{Health Check Pass?}
    P -->|No| Q[Rollback]
    P -->|Yes| R[Cleanup Old Deployments]
    R --> S[Deployment Complete]
```

## 🛠️ Manual Deployment

If you need to deploy manually:

```bash
# SSH to VPS
ssh root@173.249.24.112

# Navigate to deployment directory
cd /var/www/classora.in

# Run deployment script
./deploy.sh

# Check service status
docker-compose ps
```

## 📊 Monitoring and Maintenance

### Automatic Monitoring
- **Service Health**: Checks every 5 minutes
- **Disk Space**: Monitors usage
- **Memory Usage**: Tracks consumption
- **Log Monitoring**: Automatic log rotation

### Manual Monitoring
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Monitor system resources
htop

# Check disk space
df -h

# View application logs
tail -f /var/www/classora.in/current/logs/*.log
```

### Backup Procedures
```bash
# Manual backup
cd /var/www/classora.in
./backup.sh

# Backup includes:
# - Database dump
# - Application files
# - SSL certificates
# - Configuration files
```

## 🔒 Security Configuration

### Firewall Rules
- SSH (22)
- HTTP (80)
- HTTPS (443)
- Mail ports (25, 587, 465, 110, 143, 993, 995)
- Webmin (10000)

### SSL Certificates
- Automatic renewal via Let's Encrypt
- Renewal cron job: `0 12 * * * /usr/bin/certbot renew --quiet`

### Access Control
- Fail2ban protection
- IP-based restrictions for Webmin
- Secure file permissions

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check GitHub Actions logs
# Verify VPS connectivity
ssh root@173.249.24.112

# Check deployment directory
ls -la /var/www/classora.in/

# View recent logs
tail -f /var/log/nginx/error.log
```

#### 2. Services Not Starting
```bash
# Check Docker status
systemctl status docker

# Check service logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew

# Check Nginx configuration
nginx -t
```

#### 4. Database Connection Issues
```bash
# Check MySQL status
docker exec classora-mysql mysqladmin ping

# Check database logs
docker logs classora-mysql

# Verify connection string
echo $DATABASE_URL
```

### Useful Commands

```bash
# View all running containers
docker ps

# Check service status
systemctl status nginx
systemctl status docker
systemctl status fail2ban

# View recent deployments
ls -la /var/www/classora.in/deployment-*

# Check disk usage
du -sh /var/www/classora.in/*

# Monitor real-time logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 📈 Performance Optimization

### Docker Optimization
- Use multi-stage builds
- Optimize image layers
- Implement proper caching

### Nginx Optimization
- Enable gzip compression
- Configure caching headers
- Optimize SSL settings

### Database Optimization
- Regular maintenance
- Proper indexing
- Query optimization

## 🔄 Rollback Procedures

### Automatic Rollback
The CI/CD pipeline includes automatic rollback on health check failure.

### Manual Rollback
```bash
# SSH to VPS
ssh root@173.249.24.112

# Navigate to deployment directory
cd /var/www/classora.in

# List available deployments
ls -la deployment-*

# Rollback to previous deployment
rm current
ln -s deployment-YYYYMMDD-HHMMSS current

# Restart services
cd current
docker-compose down
docker-compose up -d
```

## 📞 Support and Maintenance

### Regular Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update system packages
3. **Quarterly**: Review security settings
4. **Annually**: Audit backup procedures

### Emergency Contacts
- **VPS Provider**: Contact your hosting provider
- **Domain Provider**: Contact your domain registrar
- **SSL Issues**: Let's Encrypt support

### Documentation
- Keep deployment logs
- Document configuration changes
- Maintain backup verification procedures

## 🎯 Next Steps

After initial setup:

1. **Customize Configuration**
   - Update environment variables
   - Configure email settings
   - Set up monitoring alerts

2. **Security Hardening**
   - Change default passwords
   - Set up SSH key authentication
   - Configure firewall rules

3. **Performance Tuning**
   - Optimize database queries
   - Configure caching
   - Monitor resource usage

4. **Backup Strategy**
   - Set up automated backups
   - Test restore procedures
   - Configure off-site storage

This CI/CD setup provides a robust, automated deployment pipeline for your Classora.in application with proper monitoring, security, and backup procedures.
