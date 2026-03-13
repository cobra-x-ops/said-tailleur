const Order = require('../models/Order');
const User = require('../models/User');
const PromoService = require('../services/promoService');

// @desc    Valider un code promo (Check Only)
// @route   POST /api/orders/validate-promo
// @access  Public
exports.validatePromo = async (req, res) => {
    try {
        const { code, userId } = req.body;
        const result = await PromoService.validate(code, userId);

        if (result.isValid) {
            return res.status(200).json({
                success: true,
                discount: result.discount,
                type: result.type,
                message: result.message
            });
        }

        return res.status(400).json({ success: false, error: result.error });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};

// @desc    Créer une nouvelle commande
// @route   POST /api/orders
// @access  Public (Guest or User)
exports.createOrder = async (req, res, next) => {
    try {
        const { userId, guestInfo, items, total, shipping, promoCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Panier vide' });
        }

        // Format products for DB
        const products = items.map(item => ({
            product: item.id.length === 24 ? item.id : null, // Handle valid ObjectId or ignore
            title: item.title,
            quantity: item.quantity,
            price: item.price
        }));

        const orderData = {
            products,
            totalAmount: total,
            shippingAddress: shipping,
            guestInfo: guestInfo || {}
        };

        // Pre-validate promo code if present before creating order
        if (promoCode && userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
            const promoResult = await PromoService.validate(promoCode, userId);
            if (!promoResult.isValid) {
                return res.status(400).json({ success: false, error: promoResult.error });
            }
        }

        const order = await Order.create(orderData);

        // Link User if exists
        if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
            orderData.user = userId;
        }
        // and perform post-order updates
        if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
            const user = await User.findById(userId);
            if (user) {
                // Handle Promo Code via Service (Mark as used)
                if (promoCode) {
                    await PromoService.markAsUsed(promoCode, userId);
                }

                // Update Loyalty Points
                const points = Math.floor(total / 10);
                user.loyalty = user.loyalty || { points: 0, tier: 'Silver' };
                user.loyalty.points += points;
                await user.save();
            }
        }

        res.status(201).json({
            success: true,
            message: 'Commande validée !',
            orderId: order._id
        });

    } catch (err) {
        console.error('Order Error:', err);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/orders/admin
// @access  Private (Admin)
exports.getAdminOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};

// @desc    Obtenir les commandes de l'utilisateur connecté
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
