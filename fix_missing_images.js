const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Mapping of product titles to their actual image files
const imageMapping = {
    'Veste en Cuir Bleu': 'blue cuire jacket.png',
    'Chaussures Sapatos Noires': 'chosure noire sapatos.png',
    'Costume Beige Premium': 'costume bieg.png',
    'Costume Bleu Classique': 'costume blue.png',
    'Costume Bleu Nuit': 'costume bleu foncé.png',
    'Veste Marron Casual': 'jacket brown.png',
    'Jean Denim Brut': 'jeans_dark.jpg'
};

async function fixMissingImages() {
    try {
        const sourcePath = path.join(__dirname, 'frontend', 'product info');
        const targetPath = path.join(__dirname, 'uploads');

        // Ensure uploads directory exists
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }

        console.log('📂 Source folder:', sourcePath);
        console.log('📂 Target folder:', targetPath);
        console.log('\n🔄 Copying images from frontend/product info to uploads...\n');

        // Copy all images from source to target
        const files = fs.readdirSync(sourcePath);
        let copiedCount = 0;

        for (const file of files) {
            if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                const sourceFile = path.join(sourcePath, file);
                const targetFile = path.join(targetPath, file);

                try {
                    fs.copyFileSync(sourceFile, targetFile);
                    console.log(`✅ Copied: ${file}`);
                    copiedCount++;
                } catch (err) {
                    console.error(`❌ Failed to copy ${file}:`, err.message);
                }
            }
        }

        console.log(`\n📊 Copied ${copiedCount} images to uploads folder\n`);

        // Connect to MongoDB and update product images
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Update products with correct image paths
        const allProducts = await Product.find();
        console.log(`📦 Found ${allProducts.length} products in database\n`);

        let updatedCount = 0;

        for (const product of allProducts) {
            const imageName = imageMapping[product.title];

            if (imageName) {
                // Update the product with the correct image
                product.images = [imageName];
                product.mainImage = imageName;
                await product.save();
                console.log(`✅ Updated: ${product.title} -> ${imageName}`);
                updatedCount++;
            } else {
                console.log(`⚠️  No image mapping found for: ${product.title}`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   - Images copied: ${copiedCount}`);
        console.log(`   - Products updated: ${updatedCount}`);
        console.log(`   - Products without mapping: ${allProducts.length - updatedCount}`);

        await mongoose.disconnect();
        console.log('\n✅ Done! Images have been restored.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

fixMissingImages();
