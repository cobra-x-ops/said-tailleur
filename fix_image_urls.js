const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const BASE_URL = 'http://localhost:3030/uploads/';

async function fixImagePaths() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const products = await Product.find();
        console.log(`📦 Found ${products.length} products\n`);

        let fixedCount = 0;

        for (const product of products) {
            let needsUpdate = false;

            // Fix images array
            if (product.images && product.images.length > 0) {
                const updatedImages = product.images.map(img => {
                    // Skip if already a full URL or default image
                    if (img.startsWith('http') || img === 'default-product.jpg') {
                        return img;
                    }
                    // Add the base URL
                    return BASE_URL + img;
                });

                if (JSON.stringify(updatedImages) !== JSON.stringify(product.images)) {
                    product.images = updatedImages;
                    needsUpdate = true;
                }
            }

            // Fix mainImage
            if (product.mainImage && !product.mainImage.startsWith('http')) {
                product.mainImage = BASE_URL + product.mainImage;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await product.save();
                console.log(`✅ ${product.title}`);
                console.log(`   Images: ${JSON.stringify(product.images)}`);
                console.log(`   Main: ${product.mainImage}\n`);
                fixedCount++;
            } else {
                console.log(`⏩ ${product.title} (already has full URLs)\n`);
            }
        }

        console.log('='.repeat(70));
        console.log(`📊 Summary:`);
        console.log(`   - Total products: ${products.length}`);
        console.log(`   - Fixed: ${fixedCount}`);
        console.log(`   - Already correct: ${products.length - fixedCount}`);

        await mongoose.disconnect();
        console.log('\n✅ All image paths have been updated to full URLs!');
        console.log('🌐 Images should now be visible on the shop page.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixImagePaths();
