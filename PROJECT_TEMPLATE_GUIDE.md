# Project Template Guide - Create Exact Copy with Different Name

## 🚀 Quick Start Script

### **Step 1: Create the Template Script**
Create a file called `create-project-copy.sh` with the following content:

```bash
#!/bin/bash

# Project Template Copy Script
# Usage: ./create-project-copy.sh "new-project-name" "new-domain.com"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <project-name> <domain>"
    echo "Example: $0 'myapp' 'myapp.com'"
    exit 1
fi

PROJECT_NAME=$1
DOMAIN=$2
PROJECT_DIR="${PROJECT_NAME}.in"

echo "🚀 Creating project copy: $PROJECT_NAME"
echo "🌐 Domain: $DOMAIN"
echo "📁 Directory: $PROJECT_DIR"

# Create new directory
mkdir -p "../$PROJECT_DIR"
cd "../$PROJECT_DIR"

# Copy all files from original project
cp -r ../classora.in/* .
cp -r ../classora.in/.* . 2>/dev/null || true

# Remove git history and node_modules
rm -rf .git
rm -rf node_modules
rm -rf .next

# Update package.json
sed -i.bak "s/classora.in/$PROJECT_NAME/g" package.json
sed -i.bak "s/classora/$PROJECT_NAME/g" package.json
rm package.json.bak

# Update next.config.js
sed -i.bak "s/classora.in/$DOMAIN/g" next.config.js
rm next.config.js.bak

# Update docker-compose.yml
sed -i.bak "s/classora-app/${PROJECT_NAME}-app/g" docker-compose.yml
sed -i.bak "s/classora-mysql/${PROJECT_NAME}-mysql/g" docker-compose.yml
sed -i.bak "s/classora-nginx/${PROJECT_NAME}-nginx/g" docker-compose.yml
sed -i.bak "s/classora_db/${PROJECT_NAME}_db/g" docker-compose.yml
sed -i.bak "s/classora_user/${PROJECT_NAME}_user/g" docker-compose.yml
sed -i.bak "s/classora_password/${PROJECT_NAME}_password/g" docker-compose.yml
sed -i.bak "s/classora-network/${PROJECT_NAME}-network/g" docker-compose.yml
sed -i.bak "s/classora.in/$DOMAIN/g" docker-compose.yml
rm docker-compose.yml.bak

# Update nginx configuration
sed -i.bak "s/classora-app/${PROJECT_NAME}-app/g" nginx/nginx.conf
sed -i.bak "s/classora.in/$DOMAIN/g" nginx/nginx.conf
rm nginx/nginx.conf.bak

# Update environment template
sed -i.bak "s/classora_user/${PROJECT_NAME}_user/g" env.example
sed -i.bak "s/classora_password/${PROJECT_NAME}_password/g" env.example
sed -i.bak "s/classora_db/${PROJECT_NAME}_db/g" env.example
sed -i.bak "s/classora.in/$DOMAIN/g" env.example
sed -i.bak "s/noreply@classora.in/noreply@$DOMAIN/g" env.example
rm env.example.bak

# Update GitHub Actions workflow
sed -i.bak "s/classora/${PROJECT_NAME}/g" .github/workflows/deploy.yml
rm .github/workflows/deploy.yml.bak

# Update documentation
sed -i.bak "s/classora.in/$DOMAIN/g" DOCKER_DEPLOYMENT_GUIDE.md
sed -i.bak "s/classora/${PROJECT_NAME}/g" DOCKER_DEPLOYMENT_GUIDE.md
rm DOCKER_DEPLOYMENT_GUIDE.md.bak

# Update README.md if it exists
if [ -f README.md ]; then
    sed -i.bak "s/classora.in/$DOMAIN/g" README.md
    sed -i.bak "s/classora/${PROJECT_NAME}/g" README.md
    rm README.md.bak
fi

# Initialize new git repository
git init
git add .
git commit -m "Initial commit: $PROJECT_NAME project"

echo "✅ Project copy created successfully!"
echo "📁 Location: ../$PROJECT_DIR"
echo "🌐 Domain: $DOMAIN"
echo ""
echo "Next steps:"
echo "1. cd ../$PROJECT_DIR"
echo "2. npm install"
echo "3. Update .env file with your settings"
echo "4. Push to your new GitHub repository"
```

### **Step 2: Make Script Executable**
```bash
chmod +x create-project-copy.sh
```

### **Step 3: Run the Script**
```bash
./create-project-copy.sh "myapp" "myapp.com"
```

## 📋 Manual Copy Process (Alternative)

If you prefer to do it manually, follow these steps:

### **Step 1: Create New Directory**
```bash
mkdir myapp.in
cd myapp.in
```

### **Step 2: Copy All Files**
```bash
cp -r ../classora.in/* .
cp -r ../classora.in/.* . 2>/dev/null || true
```

### **Step 3: Clean Up**
```bash
rm -rf .git
rm -rf node_modules
rm -rf .next
```

### **Step 4: Update Configuration Files**

#### **package.json**
```json
{
  "name": "myapp",
  "version": "1.0.0",
  "description": "MyApp - Educational Platform",
  "homepage": "https://myapp.com",
  // ... rest of the file
}
```

#### **next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'myapp.com'],
  },
  // ... rest of the config
}
```

#### **docker-compose.yml**
```yaml
services:
  myapp-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: myapp-app
    environment:
      - DATABASE_URL=mysql://myapp_user:myapp_password@mysql:3306/myapp_db
    # ... rest of the config
```

#### **nginx/nginx.conf**
```nginx
upstream myapp-app {
    server myapp-app:3000;
}

server {
    listen 80;
    server_name myapp.com www.myapp.com;
    # ... rest of the config
}
```

#### **env.example**
```env
DATABASE_URL=mysql://myapp_user:myapp_password@mysql:3306/myapp_db
NEXTAUTH_URL=https://myapp.com
SMTP_USER=noreply@myapp.com
# ... rest of the config
```

#### **.github/workflows/deploy.yml**
```yaml
script: |
  cd /vps-projects/myapp
  # ... rest of the script
```

## 🔧 Post-Copy Setup

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Set Up Environment**
```bash
cp env.example .env
# Edit .env with your specific values
```

### **Step 3: Initialize Git**
```bash
git init
git add .
git commit -m "Initial commit: MyApp project"
```

### **Step 4: Create GitHub Repository**
1. Go to GitHub and create a new repository
2. Push your code:
```bash
git remote add origin https://github.com/yourusername/myapp.git
git push -u origin main
```

### **Step 5: Set Up VPS**
Follow the `DOCKER_DEPLOYMENT_GUIDE.md` with your new project name.

## 📝 Important Notes

### **Files That Need Manual Updates:**
- **Database Schema**: Update table names if needed
- **Email Templates**: Update branding and domain references
- **Custom Components**: Update any hardcoded "classora" references
- **API Routes**: Check for domain-specific logic

### **Search and Replace Commands:**
```bash
# Replace all instances of "classora" with "myapp"
find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | xargs sed -i 's/classora/myapp/g'

# Replace all instances of "classora.in" with "myapp.com"
find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | xargs sed -i 's/classora\.in/myapp.com/g'
```

### **Database Considerations:**
- The database setup will create tables with your new project name
- Update any hardcoded database references in your code
- Consider if you need to migrate existing data

## 🎯 Template Features

This template includes:
- ✅ Next.js 14 with App Router
- ✅ Prisma ORM with MySQL
- ✅ NextAuth.js authentication
- ✅ Docker containerization
- ✅ Nginx reverse proxy
- ✅ GitHub Actions CI/CD
- ✅ Complete deployment documentation
- ✅ Email functionality
- ✅ Admin dashboard
- ✅ Student/Teacher management
- ✅ Assignment and quiz system
- ✅ Practice questions
- ✅ Calendar events
- ✅ Notifications system

## 🚀 Quick Commands

```bash
# Create new project
./create-project-copy.sh "myapp" "myapp.com"

# Navigate to new project
cd myapp.in

# Install dependencies
npm install

# Set up environment
cp env.example .env

# Initialize git
git init && git add . && git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/myapp.git
git push -u origin main
```

This template will give you a complete, production-ready educational platform that you can customize for any domain or project name!
