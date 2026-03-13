const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Product.countDocuments();
        const featured = await Product.countDocuments({ isFeatured: true });
        const sample = await Product.find().limit(5);

        console.log(`Total Products: ${count}`);
        console.log(`Featured Products: ${featured}`);
        console.log('Sample Products:', sample.map(p => p.title));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkProducts();
