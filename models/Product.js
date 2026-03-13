const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        unique: true,
        trim: true
    },
    slug: String,
    category: {
        type: String,
        required: [true, 'La catégorie est requise'],
        enum: ['Costumes', 'Vestes', 'Pantalons', 'Traditionnel', 'Accessoires', 'Chaussures']
    },
    price: {
        type: Number,
        required: [true, 'Le prix est requis']
    },
    currency: {
        type: String,
        default: 'MAD'
    },
    description: {
        type: String,
        required: [true, 'La description est requise']
    },
    images: {
        type: [String],
        default: ['default-product.jpg']
    },
    mainImage: String,
    video: String, // Support pour vidéos premium
    stock: {
        type: Number,
        default: 0
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    specifications: {
        fabric: String,
        fit: String,
        care: String
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Créer le slug automatiquement
ProductSchema.pre('save', function () {
    this.slug = slugify(this.title, { lower: true });
});

module.exports = mongoose.model('Product', ProductSchema);
