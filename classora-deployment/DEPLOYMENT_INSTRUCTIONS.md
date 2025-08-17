# Quick cPanel Deployment Instructions

## 1. Upload Files
- Upload all files from this folder to your cPanel File Manager
- Place them in: `/public_html/classora/`

## 2. Create Database
- Go to cPanel > MySQL Databases
- Create database and user
- Note down connection details

## 3. Configure Environment
- Rename `.env.template` to `.env`
- Update with your actual database and domain details

## 4. Install Dependencies
- Via SSH: `cd /home/username/public_html/classora && npm install --production`
- Or via cPanel Terminal

## 5. Setup Node.js App
- Go to cPanel > Node.js
- Create application pointing to your directory
- Startup file: `server.js`

## 6. Run Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

## 7. Start Application
- Restart your Node.js application in cPanel

## 8. Access Admin Panel
- Visit: `https://your-domain.com/classora/admin`
- Login: admin@example.com / admin@123456
- **IMPORTANT**: Change password immediately!

For detailed instructions, see: CPANEL_DEPLOYMENT_GUIDE.md
