#!/bin/bash

# cPanel Deployment Script for Classora.in
# This script prepares your application for cPanel deployment

echo "🚀 Preparing Classora.in for cPanel deployment..."

# Create deployment directory
echo "📁 Creating deployment directory..."
rm -rf classora-deployment
mkdir classora-deployment
cd classora-deployment

# Copy necessary files and directories
echo "📋 Copying application files..."
cp -r ../.next ./
cp -r ../app ./
cp -r ../components ./
cp -r ../lib ./
cp -r ../prisma ./
cp -r ../public ./
cp -r ../hooks ./
cp ../package.json ./
cp ../package-lock.json ./
cp ../next.config.js ./
cp ../tailwind.config.js ./
cp ../postcss.config.js ./
cp ../tsconfig.json ./
cp ../server.js ./
cp ../.gitignore ./

# Create .env template
echo "🔧 Creating environment file template..."
cat > .env.template << EOF
# Database Configuration
DATABASE_URL="mysql://username:password@localhost/database_name"
# OR for PostgreSQL
# DATABASE_URL="postgresql://username:password@localhost/database_name"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secure-secret-key-here"
NEXTAUTH_URL="https://your-domain.com/classora"

# Optional: Email Configuration
SMTP_HOST="mail.your-domain.com"
SMTP_PORT="587"
SMTP_USER="noreply@your-domain.com"
SMTP_PASS="your-email-password"
EOF

# Create deployment instructions
echo "📖 Creating deployment instructions..."
cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# Quick cPanel Deployment Instructions

## 1. Upload Files
- Upload all files from this folder to your cPanel File Manager
- Place them in: \`/public_html/classora/\`

## 2. Create Database
- Go to cPanel > MySQL Databases
- Create database and user
- Note down connection details

## 3. Configure Environment
- Rename \`.env.template\` to \`.env\`
- Update with your actual database and domain details

## 4. Install Dependencies
- Via SSH: \`cd /home/username/public_html/classora && npm install --production\`
- Or via cPanel Terminal

## 5. Setup Node.js App
- Go to cPanel > Node.js
- Create application pointing to your directory
- Startup file: \`server.js\`

## 6. Run Database Migration
\`\`\`bash
npx prisma migrate deploy
npx prisma generate
\`\`\`

## 7. Start Application
- Restart your Node.js application in cPanel

## 8. Access Admin Panel
- Visit: \`https://your-domain.com/classora/admin\`
- Login: admin@example.com / admin@123456
- **IMPORTANT**: Change password immediately!

For detailed instructions, see: CPANEL_DEPLOYMENT_GUIDE.md
EOF

echo "✅ Deployment package created successfully!"
echo ""
echo "📦 Files ready for upload:"
echo "   - All application files are in: classora-deployment/"
echo "   - Environment template: .env.template"
echo "   - Quick instructions: DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "📋 Next steps:"
echo "   1. Upload files to cPanel File Manager"
echo "   2. Follow the deployment instructions"
echo "   3. Configure your environment variables"
echo "   4. Start your Node.js application"
echo ""
echo "📚 For detailed instructions, see: CPANEL_DEPLOYMENT_GUIDE.md"
