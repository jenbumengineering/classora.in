# 🎨 Quick Logo & Favicon Setup

## 📁 **Where to Upload Your Files:**

### **1. Upload to `/public/` directory:**

```
public/
├── logo.png              ← Your main logo (200x60px recommended)
├── logo-dark.png         ← Dark version of logo
├── logo-light.png        ← Light version of logo
├── logo.svg              ← Vector version (optional)
├── favicon.ico           ← Main favicon
├── favicon-16x16.png     ← 16x16 favicon
├── favicon-32x32.png     ← 32x32 favicon
├── apple-touch-icon.png  ← 180x180 for iOS
├── android-chrome-192x192.png
├── android-chrome-512x512.png
└── safari-pinned-tab.svg ← SVG for Safari
```

## 🚀 **Quick Steps:**

### **Option 1: Manual Upload**
1. **Prepare your logo** (PNG format, transparent background)
2. **Upload to `/public/`** directory
3. **Rename to `logo.png`**
4. **Restart dev server** (`npm run dev`)

### **Option 2: Auto-Generate Favicons**
1. **Upload your logo** as `public/logo.png`
2. **Install ImageMagick**: `brew install imagemagick` (Mac) or `apt-get install imagemagick` (Linux)
3. **Run script**: `node scripts/generate-favicon.js`
4. **Restart dev server**

## 🎯 **What's Already Configured:**

✅ **Favicon metadata** in `app/layout.tsx`  
✅ **Logo component** in `components/ui/Logo.tsx`  
✅ **Updated pages** to use new Logo component  
✅ **Web app manifest** for PWA support  

## 📱 **Logo Usage:**

The Logo component automatically:
- **Falls back** to icon if no logo image found
- **Supports different sizes**: `sm`, `md`, `lg`
- **Supports variants**: `icon`, `text`, `full`
- **Responsive** across all devices

## 🔧 **Customization:**

Edit `components/ui/Logo.tsx` to:
- Change logo path: `const logoSrc = '/your-logo.png'`
- Adjust sizes and styling
- Add dark/light variants

## ✅ **Done!**

Your custom logo and favicon will now appear throughout the application!
