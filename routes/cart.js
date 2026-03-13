const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');


// @desc    Get User Cart
// @route   GET /api/cart?userId=...
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

        // Basic ID format check
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, error: 'Format ID utilisateur invalide' });
        }

        console.log('Fetching cart for userId:', userId);
        const user = await User.findById(userId).populate({
            path: 'cart.product',
            model: 'Product'
        });

        console.log('User found:', !!user);
        if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });

        // Defensive mapping to handle potential issues with populated products
        const cartItems = (user.cart || []).map(item => {
            if (!item || !item.product) {
                console.warn('Skipping malformed or missing product in cart for user:', userId);
                return null;
            }
            return {
                id: item.product._id || item.product,
                title: item.product.title || 'Produit inconnu',
                price: item.product.price || 0,
                mainImage: item.product.mainImage || 'default-product.jpg',
                currency: item.product.currency || 'MAD',
                quantity: item.quantity || 1
            };
        }).filter(Boolean);

        console.log(`Cart retrieved: ${cartItems.length} items for user: ${user.email}`);
        res.status(200).json({ success: true, count: cartItems.length, data: cartItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Add Item to Cart
// @route   POST /api/cart
router.post('/', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        const qty = parseInt(quantity) || 1;

        if (!userId || !productId) {
            return res.status(400).json({ success: false, error: 'Champs requis manquants' });
        }

        if (!userId.match(/^[0-9a-fA-F]{24}$/) || !productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, error: 'Format ID invalide' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

        // Check if already in cart
        const existingIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (existingIndex > -1) {
            user.cart[existingIndex].quantity += qty;
        } else {
            user.cart.push({ product: productId, quantity: qty });
        }

        await user.save();

        // Return updated cart count or basic success
        res.status(200).json({ success: true, message: 'Cart updated', cartLength: user.cart.length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Remove Item
// @route   DELETE /api/cart/:userId/:productId
router.delete('/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        user.cart = user.cart.filter(item => item.product.toString() !== productId);
        await user.save();

        res.status(200).json({ success: true, message: 'Item removed' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
