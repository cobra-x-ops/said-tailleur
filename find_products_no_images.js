const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
require('dotenv').config();

async function findProductsWithNoImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find products with no images or default image
        const productsNoImages = await Product.find({
            $or: [
                { images: { $exists: false } },
                { images: { $size: 0 } },
                { images: ['default-product.jpg'] },
                { images: [] }
            ]
        }).select('title _id category images mainImage createdAt price');

        const results = {
            timestamp: new Date().toISOString(),
            totalProducts: productsNoImages.length,
            products: productsNoImages.map(p => ({
                id: p._id.toString(),
                title: p.title,
                category: p.category,
                price: p.price,
                images: p.images,
                mainImage: p.mainImage || null,
                createdAt: p.createdAt
            }))
        };

        // Save to JSON file
        fs.writeFileSync(
            'products_no_images.json',
            JSON.stringify(results, null, 2),
            'utf8'
        );

        console.log(`\n📊 Found ${results.totalProducts} product(s) without proper images`);
        console.log('📄 Full report saved to: products_no_images.json');

        if (results.totalProducts > 0) {
            console.log('\n🔍 Summary:');
            results.products.forEach((p, i) => {
                console.log(`${i + 1}. ${p.title} (${p.category}) - Images: ${JSON.stringify(p.images)}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

findProductsWithNoImages();
