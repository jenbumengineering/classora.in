# Docker Deployment Guide - Classora.in

## 🚀 Quick Setup

### **Prerequisites**
- VPS with Docker and Docker Compose installed
- Domain pointing to your VPS
- GitHub repository with this project

## 📋 VPS Setup

### **Step 1: Install Docker on VPS**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### **Step 2: Create Project Directory**
```bash
# Create project directory
mkdir -p /vps-projects/classora
cd /vps-projects/classora

# Clone your repository
git clone https://github.com/jenbumengineering/classora.in.git .
```

### **Step 3: Set Up Environment Variables**
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Update these values:**
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your domain (https://classora.in)
- Database passwords (change from defaults)

### **Step 4: Set Up SSH Keys for GitHub Actions**
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Copy private key (you'll need this for GitHub secrets)
cat ~/.ssh/id_rsa
```

## 🔧 GitHub Setup

### **Step 1: Add GitHub Secrets**
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `VPS_HOST`: Your VPS IP address
- `VPS_USERNAME`: Your VPS username
- `VPS_SSH_KEY`: Your private SSH key (the entire content)

### **Step 2: Test Deployment**
Push a change to the main branch to trigger automatic deployment.

## 🐳 Docker Commands

### **Manual Deployment**
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### **Database Management**
```bash
# Access MySQL container
docker exec -it classora-mysql mysql -u classora_user -p classora_db

# Backup database
docker exec classora-mysql mysqldump -u classora_user -p classora_db > backup.sql

# Restore database
docker exec -i classora-mysql mysql -u classora_user -p classora_db < backup.sql
```

## 🔐 Security

### **Change Default Passwords**
1. **MySQL Root Password**: Update in docker-compose.yml
2. **MySQL User Password**: Update in docker-compose.yml and .env
3. **NEXTAUTH_SECRET**: Generate new secret

### **SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d classora.in -d www.classora.in
```

## 📊 Monitoring

### **Check Container Status**
```bash
# View running containers
docker ps

# View container logs
docker logs classora-app
docker logs classora-mysql
docker logs classora-nginx
```

### **Resource Usage**
```bash
# Monitor resource usage
docker stats
```

## 🔄 CI/CD Workflow

1. **Push code** to main branch
2. **GitHub Actions** automatically triggers
3. **SSH to VPS** and pull latest code
4. **Rebuild Docker containers**
5. **Deploy new version**
6. **Clean up old images**

## 🚨 Troubleshooting

### **Container Won't Start**
```bash
# Check logs
docker-compose logs

# Check if ports are in use
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3306
```

### **Database Connection Issues**
```bash
# Check MySQL container
docker exec -it classora-mysql mysql -u root -p

# Check network connectivity
docker network ls
docker network inspect classora_classora-network
```

### **Nginx Issues**
```bash
# Check Nginx configuration
docker exec classora-nginx nginx -t

# View Nginx logs
docker logs classora-nginx
```

## 🎉 Success!

Your application will be available at:
- **HTTP**: http://classora.in
- **HTTPS**: https://classora.in (after SSL setup)

**Admin Access:**
- Email: `admin@example.com`
- Password: `admin@123456`
- **⚠️ Change this immediately!**
