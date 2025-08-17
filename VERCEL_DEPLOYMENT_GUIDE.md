# Vercel Deployment Guide - Classora.in

## 🚀 Quick Deployment Steps

### **Step 1: Sign Up for Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and connect your GitHub account
3. Authorize Vercel to access your repositories

### **Step 2: Import Your Project**
1. Click "New Project"
2. Select your repository: `jenbumengineering/classora.in`
3. Click "Import"

### **Step 3: Configure Environment Variables**
In the Vercel project settings, add these environment variables:

```
DATABASE_URL=mysql://lqncvkbl_administrator:your_password@your_host/lqncvkbl_classora_db
NEXTAUTH_SECRET=nJZS4TrWanLPLEgR7mFnZOv8Bmzr4SF5JTf4Ng46mH8=
NEXTAUTH_URL=https://classora.in
NODE_ENV=production
```

### **Step 4: Configure Domain**
1. Go to "Settings" → "Domains"
2. Add your domain: `classora.in`
3. Update your DNS settings to point to Vercel

### **Step 5: Deploy**
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at your domain!

## 🔧 Environment Variables Setup

### **Required Variables:**
- `DATABASE_URL`: Your MySQL connection string
- `NEXTAUTH_SECRET`: nJZS4TrWanLPLEgR7mFnZOv8Bmzr4SF5JTf4Ng46mH8=
- `NEXTAUTH_URL`: https://classora.in

### **Optional Variables:**
- `SMTP_HOST`: Email server host
- `SMTP_PORT`: Email server port
- `SMTP_USER`: Email username
- `SMTP_PASS`: Email password

## 🌐 Domain Configuration

### **DNS Settings:**
Update your domain's DNS to point to Vercel:
- **Type**: A
- **Name**: @
- **Value**: 76.76.19.19

- **Type**: CNAME
- **Name**: www
- **Value**: cname.vercel-dns.com

## 📋 Database Connection

### **External Database Setup:**
Since you're using an external MySQL database:
1. Make sure your database is accessible from Vercel
2. Update the `DATABASE_URL` with the correct connection string
3. Test the connection

### **Database URL Format:**
```
mysql://username:password@host:port/database_name
```

## 🔐 Security Setup

### **Admin Credentials:**
After deployment, immediately change the default admin password:
- Email: `admin@example.com`
- Password: `admin@123456`

## 🚀 Deployment Benefits

### **What Vercel Provides:**
- ✅ **No memory restrictions**
- ✅ **Automatic deployments**
- ✅ **Free SSL certificates**
- ✅ **Global CDN**
- ✅ **Optimized for Next.js**
- ✅ **Automatic scaling**

## 📞 Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Contact Vercel support if needed

## 🎉 Success!

Once deployed, your application will be:
- **Fast**: Global CDN and edge functions
- **Secure**: Automatic SSL certificates
- **Scalable**: Automatic scaling
- **Reliable**: 99.9% uptime guarantee
