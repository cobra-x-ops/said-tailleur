const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const setFeatured = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find().limit(4);
        for (const p of products) {
            p.isFeatured = true;
            await p.save();
            console.log(`Set as featured: ${p.title}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

setFeatured();
