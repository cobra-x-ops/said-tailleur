const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    createOrder,
    validatePromo,
    getAdminOrders,
    getMyOrders
} = require('../controllers/orderController');

// @desc    Valider un code promo (Check Only)
// @route   POST /api/orders/validate-promo
// @access  Public
router.post('/validate-promo', validatePromo);

// @desc    Créer une nouvelle commande
// @route   POST /api/orders
// @access  Public (Guest or User)
router.post('/', createOrder);

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/orders/admin
// @access  Private (Admin)
router.get('/admin', protect, authorize('admin'), getAdminOrders);

// @desc    Obtenir les commandes de l'utilisateur connecté
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, getMyOrders);

module.exports = router;
