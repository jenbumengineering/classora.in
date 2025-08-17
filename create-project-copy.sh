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
