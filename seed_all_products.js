const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        const products = [
            // Costumes
            {
                title: 'Costume Trois Pièces Premium',
                price: 8500,
                currency: 'MAD',
                category: 'Costumes',
                description: 'Costume trois pièces en laine Super 150s italienne. Coupe slim moderne avec finitions main.',
                mainImage: 'http://localhost:3030/uploads/costume1.jpg',
                stock: 5,
                isFeatured: true
            },
            {
                title: 'Costume Business Class',
                price: 6500,
                currency: 'MAD',
                category: 'Costumes',
                description: 'Costume deux pièces classique. Parfait pour le bureau et les occasions formelles.',
                mainImage: 'http://localhost:3030/uploads/costume2.jpg',
                stock: 8,
                isFeatured: true
            },
            // Vestes
            {
                title: 'Veste Blazer Marine',
                price: 3500,
                currency: 'MAD',
                category: 'Vestes',
                description: 'Blazer en laine peignée. Style décontracté élégant.',
                mainImage: 'http://localhost:3030/uploads/blazer1.jpg',
                stock: 12,
                isFeatured: false
            },
            {
                title: 'Veste Sport Chic',
                price: 2800,
                currency: 'MAD',
                category: 'Vestes',
                description: 'Veste sport en coton stretch. Confort et élégance au quotidien.',
                mainImage: 'http://localhost:3030/uploads/veste1.jpg',
                stock: 10,
                isFeatured: true
            },
            // Pantalons
            {
                title: 'Pantalon Costume Gris',
                price: 1800,
                currency: 'MAD',
                category: 'Pantalons',
                description: 'Pantalon de costume en laine. Coupe droite classique.',
                mainImage: 'http://localhost:3030/uploads/pantalon1.jpg',
                stock: 15,
                isFeatured: false
            },
            {
                title: 'Chino Premium Beige',
                price: 1200,
                currency: 'MAD',
                category: 'Pantalons',
                description: 'Chino en coton égyptien. Style casual chic.',
                mainImage: 'http://localhost:3030/uploads/chino1.jpg',
                stock: 20,
                isFeatured: false
            },
            // Accessoires
            {
                title: 'Cravate en Soie Italienne',
                price: 450,
                currency: 'MAD',
                category: 'Accessoires',
                description: 'Cravate artisanale 100% soie, parfaite pour compléter votre costume de luxe.',
                mainImage: 'http://localhost:3030/uploads/cravate1.jpg',
                stock: 25,
                isFeatured: true
            },
            {
                title: 'Boutons de Manchettes Argent',
                price: 850,
                currency: 'MAD',
                category: 'Accessoires',
                description: 'Une touche de distinction discrète et élégante.',
                mainImage: 'http://localhost:3030/uploads/boutons1.jpg',
                stock: 10,
                isFeatured: false
            },
            {
                title: 'Ceinture Cuir Italien',
                price: 680,
                currency: 'MAD',
                category: 'Accessoires',
                description: 'Ceinture en cuir véritable. Boucle en acier inoxydable.',
                mainImage: 'http://localhost:3030/uploads/ceinture1.jpg',
                stock: 18,
                isFeatured: false
            },
            {
                title: 'Richelieu Cuir Noir',
                price: 2200,
                currency: 'MAD',
                category: 'Chaussures',
                description: 'Chaussures Richelieu en cuir de veau. Élégance intemporelle.',
                mainImage: 'http://localhost:3030/uploads/richelieu1.jpg',
                stock: 7,
                isFeatured: true
            }
        ];

        for (const item of products) {
            await Product.create(item);
            console.log(`✓ Added: ${item.title}`);
        }

        console.log(`\n✅ Successfully seeded ${products.length} products!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
};

seed();
