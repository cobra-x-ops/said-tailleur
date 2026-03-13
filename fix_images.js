const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const fixImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        const updates = [
            {
                title: 'Cravate en Soie Italienne',
                mainImage: 'product info/jeans_dark.jpg', // Placeholder since real one is missing
                description: 'Cravate artisanale 100% soie (Image temporaire).'
            },
            {
                title: 'Boutons de Manchettes Argent',
                mainImage: 'product info/hero background.jpeg', // Placeholder
                description: 'Distinction discrète et élégante (Image temporaire).'
            },
            {
                title: 'Veste en Cuir Bleue',
                mainImage: 'product info/blue cuire jacket.png'
            },
            {
                title: 'Veste Marron Vintage',
                mainImage: 'product info/jacket brown.png'
            },
            {
                title: 'Costume Bleu Royal',
                mainImage: 'product info/costume blue.png'
            },
            {
                title: 'Costume Beige Été',
                mainImage: 'product info/costume bieg.png'
            },
            {
                title: 'Costume Bleu Nuit',
                mainImage: 'product info/costume bleu foncé.png'
            },
            {
                title: 'Chaussuer de Luxe Noire',
                mainImage: 'product info/chosure noire sapatos.png'
            }
        ];

        for (const item of updates) {
            const res = await Product.findOneAndUpdate(
                { title: item.title },
                { $set: { mainImage: item.mainImage, description: item.description } },
                { new: true }
            );
            if (res) console.log(`Updated: ${item.title}`);
            else console.log(`Not found: ${item.title}`);
        }

        console.log("Image fix complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixImages();
