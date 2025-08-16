#!/usr/bin/env node

/**
 * Favicon Generation Script
 * 
 * This script helps you generate favicon files from your logo.
 * You'll need to have ImageMagick installed for this to work.
 * 
 * Usage:
 * 1. Place your logo.png file in the public/ directory
 * 2. Run: node scripts/generate-favicon.js
 * 3. The script will generate all necessary favicon files
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'logo.png');

console.log('🎨 Favicon Generation Script');
console.log('============================\n');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.log('❌ logo.png not found in public/ directory');
  console.log('📝 Please place your logo.png file in the public/ directory first');
  console.log('📁 Expected location: public/logo.png');
  process.exit(1);
}

console.log('✅ Found logo.png');
console.log('🔄 Generating favicon files...\n');

// Generate favicon files using ImageMagick
const commands = [
  // ICO file (multiple sizes)
  `convert ${logoPath} -resize 16x16 public/favicon-16x16.png`,
  `convert ${logoPath} -resize 32x32 public/favicon-32x32.png`,
  `convert ${logoPath} -resize 48x48 public/favicon-48x48.png`,
  
  // Apple touch icon
  `convert ${logoPath} -resize 180x180 public/apple-touch-icon.png`,
  
  // Android icons
  `convert ${logoPath} -resize 192x192 public/android-chrome-192x192.png`,
  `convert ${logoPath} -resize 512x512 public/android-chrome-512x512.png`,
  
  // Create ICO file with multiple sizes
  `convert ${logoPath} -resize 16x16 ${logoPath} -resize 32x32 ${logoPath} -resize 48x48 public/favicon.ico`,
];

let completed = 0;
const total = commands.length;

commands.forEach((command, index) => {
  exec(command, (error, stdout, stderr) => {
    completed++;
    
    if (error) {
      console.log(`❌ Error generating favicon ${index + 1}: ${error.message}`);
    } else {
      console.log(`✅ Generated favicon ${index + 1}/${total}`);
    }
    
    if (completed === total) {
      console.log('\n🎉 Favicon generation complete!');
      console.log('\n📋 Generated files:');
      console.log('  - favicon.ico');
      console.log('  - favicon-16x16.png');
      console.log('  - favicon-32x32.png');
      console.log('  - favicon-48x48.png');
      console.log('  - apple-touch-icon.png');
      console.log('  - android-chrome-192x192.png');
      console.log('  - android-chrome-512x512.png');
      console.log('\n🚀 Your favicon is now ready!');
      console.log('💡 Restart your development server to see the changes.');
    }
  });
});
