const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'frontend', 'product info');
const targetPath = path.join(__dirname, 'uploads');

console.log('📂 Copying images from frontend/product info to uploads...\n');

// Ensure uploads directory exists
if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    console.log('✅ Created uploads directory\n');
}

// Copy all image files
const files = fs.readdirSync(sourcePath);
let copiedCount = 0;
let errorCount = 0;

files.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);

        try {
            fs.copyFileSync(sourceFile, targetFile);
            const stats = fs.statSync(targetFile);
            console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
            copiedCount++;
        } catch (err) {
            console.error(`❌ Failed: ${file} - ${err.message}`);
            errorCount++;
        }
    }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Successfully copied: ${copiedCount} images`);
if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
}

console.log(`\n📁 Images are now in: ${targetPath}`);
console.log(`\nNext step: Run the database update script to assign images to products`);
