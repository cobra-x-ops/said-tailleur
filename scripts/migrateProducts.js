const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const path = require('path');

// Logic: Migrate local products.js array to MongoDB
// 🚨 Ensure MONGO_URI is set in your .env file

dotenv.config({ path: path.join(__dirname, '../.env') });

const legacyProducts = [
    {
        id: 'blue-leather-jacket',
        title: 'Veste en Cuir Bleu',
        price: '2800 MAD',
        description: 'Une pièce maîtresse de votre garde-robe. Cette veste en cuir bleu allie l\'audace moderne au savoir-faire traditionnel.',
        image: 'product info/blue cuire jacket.png',
        category: 'Vestes'
    },
    {
        id: 'black-shoes',
        title: 'Chaussures Sapatos Noires',
        price: '1500 MAD',
        description: 'L\'élégance jusqu\'au bout des pieds. Fabriquées à la main pour le confort.',
        image: 'product info/chosure noire sapatos.png',
        category: 'Chaussures'
    },
    {
        id: 'beige-suit',
        title: 'Costume Beige Premium',
        price: '3800 MAD',
        description: 'La sophistication estivale. Idéal pour les mariages.',
        image: 'product info/costume bieg.png',
        category: 'Costumes'
    },
    {
        id: 'classic-blue-suit',
        title: 'Costume Bleu Classique',
        price: '3500 MAD',
        description: 'Laine italienne de première qualité, coupe moderne.',
        image: 'product info/costume blue.png',
        category: 'Costumes'
    },
    {
        id: 'dark-blue-suit',
        title: 'Costume Bleu Nuit',
        price: '4000 MAD',
        description: 'Autorité et prestige. Taillé pour les décideurs.',
        image: 'product info/costume bleu foncé.png',
        category: 'Costumes'
    },
    {
        id: 'brown-jacket',
        title: 'Veste Marron Casual',
        price: '2200 MAD',
        description: 'L\'élégance décontractée. Détails cousus main.',
        image: 'product info/jacket brown.png',
        category: 'Vestes'
    },
    {
        id: 'dark-jeans',
        title: 'Jean Denim Brut',
        price: '900 MAD',
        description: 'Jean en denim brut premium, coupe sur mesure.',
        image: 'product info/jeans_dark.jpg',
        category: 'Pantalons'
    }
];

const migrate = async () => {
    try {
        console.log('🔄 Démarrage de la migration...');
        await mongoose.connect(process.env.MONGO_URI);

        for (const item of legacyProducts) {
            const numericPrice = parseInt(item.price.replace(/[^0-9]/g, ''));

            // SEO Check: Check if product already exists by slug
            const exists = await Product.findOne({ slug: item.id });
            if (exists) {
                console.log(`⏩ Sauts : ${item.title} (Déjà en base)`);
                continue;
            }

            const product = new Product({
                title: item.title,
                slug: item.id,
                price: numericPrice,
                description: item.description,
                category: item.category,
                mainImage: item.image,
                images: [item.image],
                stock: 15,
                isFeatured: true
            });

            await product.save();
            console.log(`✅ Migré : ${item.title}`);
        }

        console.log('🏁 Migration terminée !');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
};

migrate();
