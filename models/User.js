const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom est requis']
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }, // Requis seulement si pas de login social
        select: false // Ne pas renvoyer le password par défaut
    },
    googleId: String,
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    addresses: [{
        street: String,
        city: String,
        zipCode: String,
        country: { type: String, default: 'Morocco' },
        isDefault: { type: Boolean, default: false }
    }],
    loyalty: {
        points: { type: Number, default: 0 },
        tier: {
            type: String,
            enum: ['Silver', 'Gold', 'VIP'],
            default: 'Silver'
        }
    },
    wishlist: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
    }],
    cart: [{
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    welcomeOffer: {
        code: String,
        discount: { type: Number, default: 20 },
        isUsed: { type: Boolean, default: false },
        expiresAt: Date
    }
});

// Hash password avant sauvegarde
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
