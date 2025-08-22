#!/bin/bash

# Generate secure secrets for Classora.in
# This script generates secure secrets for NextAuth and other services

echo "🔐 Generating secure secrets for Classora.in..."

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Generate database password
DB_PASSWORD=$(openssl rand -base64 16)

# Generate email password
EMAIL_PASSWORD=$(openssl rand -base64 16)

echo ""
echo "✅ Generated secrets:"
echo ""
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "EMAIL_PASSWORD=$EMAIL_PASSWORD"
echo ""
echo "📋 Add these to your GitHub repository secrets:"
echo ""
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings → Secrets and variables → Actions"
echo "3. Add the following secrets:"
echo ""
echo "   NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "   DATABASE_URL: mysql://classora_user:${DB_PASSWORD}@mysql:3306/classora_db"
echo "   EMAIL_PASSWORD: $EMAIL_PASSWORD"
echo "   VPS_PASSWORD: Mainong5567"
echo "   NEXTAUTH_URL: https://classora.in"
echo ""
echo "🔒 Keep these secrets secure and don't share them!"
echo ""
echo "📝 Update your VPS environment file:"
echo "   Edit /var/www/classora.in/current/.env"
echo "   Replace the placeholder values with the generated secrets"
