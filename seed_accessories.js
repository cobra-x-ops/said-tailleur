const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const accessories = [
            {
                title: 'Cravate en Soie Italienne',
                price: 450,
                currency: 'MAD',
                category: 'Accessoires',
                description: 'Cravate artisanale 100% soie, parfaite pour compléter votre costume de luxe.',
                mainImage: 'product info/cravate.jpg',
                stock: 25,
                isFeatured: true
            },
            {
                title: 'Boutons de Manchettes Argent',
                price: 850,
                currency: 'MAD',
                category: 'Accessoires',
                description: 'Une touche de distinction discrète et élégante.',
                mainImage: 'product info/boutons.jpg',
                stock: 10,
                isFeatured: false
            }
        ];

        for (const item of accessories) {
            const exists = await Product.findOne({ title: item.title });
            if (!exists) {
                await Product.create(item);
                console.log(`Added Accessory: ${item.title}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
