# Logo and Favicon Setup Guide

## 📁 File Upload Locations

### **Favicon Files (Upload to `/public/` directory):**

1. **`favicon.ico`** - Main favicon (16x16, 32x32, 48x48 pixels)
2. **`favicon-16x16.png`** - 16x16 PNG favicon
3. **`favicon-32x32.png`** - 32x32 PNG favicon
4. **`apple-touch-icon.png`** - 180x180 PNG for iOS devices
5. **`android-chrome-192x192.png`** - 192x192 PNG for Android
6. **`android-chrome-512x512.png`** - 512x512 PNG for Android
7. **`safari-pinned-tab.svg`** - SVG for Safari pinned tabs

### **Logo Files (Upload to `/public/` directory):**

1. **`logo.png`** - Main logo (recommended: 200x60 pixels)
2. **`logo-dark.png`** - Dark version of logo
3. **`logo-light.png`** - Light version of logo
4. **`logo.svg`** - Vector version of logo (scalable)

## 🎨 Recommended Image Specifications

### **Favicon:**
- **Format**: ICO, PNG, SVG
- **Sizes**: 16x16, 32x32, 48x48, 180x180, 192x192, 512x512
- **Background**: Transparent or solid color
- **Colors**: Should work on both light and dark backgrounds

### **Logo:**
- **Format**: PNG, SVG (preferred)
- **Size**: 200x60 pixels (main logo)
- **Background**: Transparent
- **Colors**: Should have both light and dark versions

## 📝 How to Upload

1. **Prepare your images** according to the specifications above
2. **Upload them** to the `/public/` directory in your project
3. **Replace the existing files** with your custom ones
4. **Restart the development server** to see changes

## 🔧 Configuration

The favicon configuration is already set up in `app/layout.tsx`. The logo configuration needs to be updated in the components that use it.

## 📱 Browser Support

- **Chrome/Edge**: Uses favicon.ico and PNG versions
- **Firefox**: Uses favicon.ico and PNG versions
- **Safari**: Uses apple-touch-icon.png and safari-pinned-tab.svg
- **Android**: Uses android-chrome icons
- **iOS**: Uses apple-touch-icon.png

## 🚀 Next Steps

After uploading your files:

1. **Test the favicon** in different browsers
2. **Update logo references** in components
3. **Test on mobile devices** for proper display
4. **Verify PWA support** if needed

## 📋 File Checklist

- [ ] favicon.ico
- [ ] favicon-16x16.png
- [ ] favicon-32x32.png
- [ ] apple-touch-icon.png
- [ ] android-chrome-192x192.png
- [ ] android-chrome-512x512.png
- [ ] safari-pinned-tab.svg
- [ ] logo.png
- [ ] logo-dark.png
- [ ] logo-light.png
- [ ] logo.svg
