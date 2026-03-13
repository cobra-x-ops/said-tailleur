const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    register,
    login,
    logout,
    getMe,
    checkAuth
} = require('../controllers/authController');

// @desc    S'enregistrer
// @route   POST /api/auth/register
// @access  Public
router.post('/register', register);

// @desc    Se connecter
// @route   POST /api/auth/login
// @access  Public
router.post('/login', login);

// @desc    Se déconnecter / Clear cookie
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', logout);

// @desc    Vérifier le statut auth (pour le frontend)
// @route   GET /api/auth/check
// @access  Public
router.get('/check', checkAuth);

// @desc    Obtenir l'utilisateur courant
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
