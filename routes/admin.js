const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// @desc    Ajouter un nouveau produit
// @route   POST /api/admin/products
// @access  Private (Admin only)
router.post('/products', protect, authorize('admin'), adminController.createProduct);

// @desc    Modifier un produit
// @route   PUT /api/admin/products/:id
// @access  Private (Admin only)
router.put('/products/:id', protect, authorize('admin'), adminController.updateProduct);

// @desc    Supprimer un produit
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
router.delete('/products/:id', protect, authorize('admin'), adminController.deleteProduct);

// @desc    Obtenir les statistiques du dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), adminController.getStats);

// @desc    Obtenir insights avancés (panier moyen, top produits)
// @route   GET /api/admin/insights
// @access  Private (Admin only)
router.get('/insights', protect, authorize('admin'), adminController.getInsights);

// @desc    Obtenir notifications/alertes actives
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
router.get('/notifications', protect, authorize('admin'), adminController.getNotifications);

// @desc    Obtenir tous les utilisateurs (Clients)
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), adminController.getUsers);

// @desc    Mettre à jour un utilisateur (rôle, etc)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), adminController.updateUser);

module.exports = router;
