const express = require('express');
const router = express.Router();
const { getProducts, getProduct } = require('../controllers/productController');

// @desc    Obtenir tous les produits (avec filtres)
// @route   GET /api/products
// @access  Public
router.get('/', getProducts);

// @desc    Obtenir un seul produit par slug
// @route   GET /api/products/:slug
// @access  Public
router.get('/:id_or_slug', getProduct);

module.exports = router;
