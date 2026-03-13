const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function updateProductImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all available images in uploads folder
        const uploadsPath = path.join(__dirname, 'uploads');
        const availableImages = fs.readdirSync(uploadsPath)
            .filter(file => file.match(/\.(jpg|jpeg|png|webp|gif)$/i))
            .filter(file => !file.startsWith('image-')) // Exclude generic uploads
            .filter(file => file !== 'logo_annakhil.png' && file !== 'hero background.jpeg'); // Exclude non-product images

        console.log('📸 Available product images:', availableImages.length);
        availableImages.forEach(img => console.log(`   - ${img}`));
        console.log('');

        // Get all products
        const products = await Product.find();
        console.log(`📦 Products in database: ${products.length}\n`);

        // Smart mapping based on keywords
        const mapping = {
            // Costumes
            'Costume Trois Pièces Premium': 'costume blue.png',
            'Costume Business Class': 'costume bleu foncé.png',
            'Costume Beige Premium': 'costume bieg.png',

            // Vestes/Jackets
            'Veste Blazer Marine': 'blue cuire jacket.png',
            'Veste Sport Chic': 'jacket brown.png',
            'Veste en Cuir Bleu': 'blue cuire jacket.png',
            'Veste Marron Casual': 'jacket brown.png',

            // Pantalons
            'Pantalon Costume Gris': 'jeans_dark.jpg',
            'Chino Premium Beige': 'jeans_dark.jpg',
            'Jean Denim Brut': 'jeans_dark.jpg',

            // Chaussures
            'Richelieu Cuir Noir': 'chosure noire sapatos.png',
            'Chaussures Sapatos Noires': 'chosure noire sapatos.png',

            // Accessoires - use first available image or null
            'Cravate en Soie Italienne': null,
            'Boutons de Manchettes Argent': null,
            'Ceinture Cuir Italien': null
        };

        let updatedCount = 0;
        const updatedProducts = [];

        for (const product of products) {
            const imageName = mapping[product.title];

            if (imageName && availableImages.includes(imageName)) {
                // Update product with the correct image
                product.images = [imageName];
                product.mainImage = imageName;
                await product.save();
                console.log(`✅ ${product.title}`);
                console.log(`   └─ Image: ${imageName}\n`);
                updatedCount++;
                updatedProducts.push({
                    title: product.title,
                    image: imageName
                });
            } else if (imageName === null) {
                console.log(`⚠️  ${product.title}`);
                console.log(`   └─ No image assigned (accessory)\n`);
            } else {
                console.log(`❌ ${product.title}`);
                console.log(`   └─ Image not found: ${imageName || 'not mapped'}\n`);
            }
        }

        console.log('='.repeat(70));
        console.log(`📊 Summary:`);
        console.log(`   - Total products: ${products.length}`);
        console.log(`   - Successfully updated: ${updatedCount}`);
        console.log(`   - Products without images: ${products.length - updatedCount}`);

        await mongoose.disconnect();
        console.log('\n✅ Database updated! Your images should now be visible.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

updateProductImages();
