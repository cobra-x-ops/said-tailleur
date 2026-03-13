const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be guest
    },
    guestInfo: {
        name: String,
        email: String,
        phone: String
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            title: String, // Snapshot in case product is deleted
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'],
        default: 'En attente'
    },
    shippingAddress: {
        address: String,
        city: String,
        zipCode: String,
        country: String
    },
    paymentMethod: {
        type: String,
        enum: ['cod'], // Cash on Delivery only for now
        default: 'cod'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);
