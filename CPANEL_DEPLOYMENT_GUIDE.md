# cPanel Deployment Guide - Classora.in

## Prerequisites
- cPanel hosting account with Node.js support
- SSH access (recommended) or File Manager access
- Domain/subdomain configured
- Database (MySQL/PostgreSQL) created

## Step 1: Prepare Your Local Build

### 1.1 Build the Production Version
```bash
# In your local project directory
npm run build
```

### 1.2 Create Deployment Package
```bash
# Create a deployment folder
mkdir classora-deployment
cd classora-deployment

# Copy necessary files
cp -r .next ./
cp -r app ./
cp -r components ./
cp -r lib ./
cp -r prisma ./
cp -r public ./
cp -r hooks ./
cp package.json ./
cp package-lock.json ./
cp next.config.js ./
cp tailwind.config.js ./
cp postcss.config.js ./
cp tsconfig.json ./
cp .gitignore ./
```

## Step 2: Database Setup

### 2.1 Create Database in cPanel
1. Log into cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `classora_production`)
4. Create a database user
5. Add user to database with all privileges
6. Note down: database name, username, password, and host

### 2.2 Update Database Schema
```bash
# Connect to your server via SSH or use cPanel Terminal
cd /home/username/public_html/classora
npx prisma migrate deploy
npx prisma generate
```

## Step 3: Upload Files to cPanel

### Method A: Using File Manager (Easiest)
1. **Access File Manager**
   - Log into cPanel
   - Click **File Manager**
   - Navigate to `public_html`

2. **Create Project Directory**
   - Create a new folder called `classora`
   - Upload all files from your deployment package

3. **Upload Files**
   - Select all files from your local `classora-deployment` folder
   - Upload them to the `classora` directory in cPanel

### Method B: Using SSH (Recommended)
```bash
# Connect to your server via SSH
ssh username@your-domain.com

# Navigate to public_html
cd public_html

# Create project directory
mkdir classora
cd classora

# Upload files using SCP (from your local machine)
scp -r classora-deployment/* username@your-domain.com:public_html/classora/
```

## Step 4: Install Dependencies

### 4.1 Via SSH (Recommended)
```bash
# Connect to your server
ssh username@your-domain.com

# Navigate to project directory
cd public_html/classora

# Install dependencies
npm install --production
```

### 4.2 Via cPanel Terminal
1. Go to **Terminal** in cPanel
2. Navigate to your project directory
3. Run `npm install --production`

## Step 5: Environment Configuration

### 5.1 Create Environment File
```bash
# In your project directory
nano .env
```

### 5.2 Add Environment Variables
```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost/database_name"
# OR for PostgreSQL
DATABASE_URL="postgresql://username:password@localhost/database_name"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secure-secret-key-here"
NEXTAUTH_URL="https://your-domain.com/classora"

# Optional: Email Configuration
SMTP_HOST="mail.your-domain.com"
SMTP_PORT="587"
SMTP_USER="noreply@your-domain.com"
SMTP_PASS="your-email-password"
```

## Step 6: Configure Node.js App

### 6.1 Create Node.js App in cPanel
1. Go to **Node.js** in cPanel
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `/home/username/public_html/classora`
   - **Application URL**: `https://your-domain.com/classora`
   - **Application startup file**: `server.js`

### 6.2 Create Custom Server File
Create `server.js` in your project root:
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
```

### 6.3 Update package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "lint": "next lint"
  }
}
```

## Step 7: Database Migration

### 7.1 Run Migrations
```bash
# Via SSH or Terminal
cd /home/username/public_html/classora
npx prisma migrate deploy
npx prisma generate
```

### 7.2 Seed Database (Optional)
```bash
npx prisma db seed
```

## Step 8: Start the Application

### 8.1 Via cPanel Node.js
1. Go to **Node.js** in cPanel
2. Find your application
3. Click **Restart** or **Start**

### 8.2 Via SSH
```bash
# Navigate to project directory
cd /home/username/public_html/classora

# Start the application
npm start
```

## Step 9: Configure Domain/Subdomain

### 9.1 Create Subdomain (Recommended)
1. Go to **Subdomains** in cPanel
2. Create subdomain: `classora.your-domain.com`
3. Point to: `/public_html/classora`

### 9.2 Or Use Subdirectory
- Access via: `https://your-domain.com/classora`

## Step 10: SSL Certificate

### 10.1 Enable SSL
1. Go to **SSL/TLS** in cPanel
2. Install SSL certificate for your domain/subdomain
3. Force HTTPS redirect

## Step 11: Post-Deployment Setup

### 11.1 Access Admin Panel
1. Visit: `https://your-domain.com/classora/admin`
2. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `admin@123456`
3. **IMPORTANT**: Change admin password immediately

### 11.2 Configure System Settings
1. Go to **Settings** in admin panel
2. Configure:
   - Site name and branding
   - Email SMTP settings
   - File upload limits
   - Company information

### 11.3 Test Functionality
- [ ] User registration/login
- [ ] Admin panel access
- [ ] Email notifications
- [ ] File uploads
- [ ] Database operations

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check database connection
npx prisma db push
```

#### 2. Port Issues
- Ensure Node.js app is configured with correct port
- Check if port 3000 is available

#### 3. File Permissions
```bash
# Set correct permissions
chmod 755 /home/username/public_html/classora
chmod 644 /home/username/public_html/classora/.env
```

#### 4. Build Errors
```bash
# Rebuild the application
npm run build
```

#### 5. Dependencies Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

### 1. Enable Caching
- Configure browser caching in cPanel
- Enable Gzip compression

### 2. Database Optimization
- Regular database backups
- Monitor database performance

### 3. Monitoring
- Set up error logging
- Monitor application performance
- Regular security updates

## Security Checklist

- [ ] Changed default admin password
- [ ] Enabled SSL/HTTPS
- [ ] Configured secure environment variables
- [ ] Set up regular backups
- [ ] Enabled firewall rules
- [ ] Updated dependencies regularly

## Support

If you encounter issues:
1. Check cPanel error logs
2. Review Node.js application logs
3. Verify environment variables
4. Test database connectivity
5. Contact hosting provider support

---

**Last Updated**: August 17, 2025
**Version**: 1.0.0
**Compatible with**: cPanel with Node.js support
