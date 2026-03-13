const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function listAllProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const products = await Product.find().select('title category images mainImage');

        console.log(`📦 Total products: ${products.length}\n`);
        console.log('='.repeat(70));

        products.forEach((p, i) => {
            console.log(`${i + 1}. ${p.title}`);
            console.log(`   Category: ${p.category}`);
            console.log(`   Images: ${JSON.stringify(p.images)}`);
            console.log(`   Main: ${p.mainImage || 'Not set'}`);
            console.log('-'.repeat(70));
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listAllProducts();
