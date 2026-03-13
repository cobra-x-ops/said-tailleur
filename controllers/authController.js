const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper: Send Token Response
const sendTokenResponse = (user, statusCode, res) => {
    // Créer le token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        httpOnly: true, // 🔒 Inaccessible au JS client => Stop XSS
        secure: process.env.NODE_ENV === 'production', // HTTPS only en prod
        sameSite: 'strict' // Protection CSRF
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyalty: user.loyalty,
                welcomeOffer: user.welcomeOffer
            }
        });
};

// @desc    S'enregistrer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validation du mot de passe (Fort)
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.'
            });
        }

        // Générer un code de bienvenue unique
        const welcomeCode = `WELCOME-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

        // Créer l'utilisateur avec l'offre
        const user = await User.create({
            name,
            email,
            password,
            welcomeOffer: {
                code: welcomeCode,
                discount: 20,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Valide 30 jours
            }
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Se connecter
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Valider email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
        }

        // Vérifier l'utilisateur
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Identifiants invalides' });
        }

        // Vérifier si le mot de passe correspond
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Identifiants invalides' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Se déconnecter / Clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
};

// @desc    Obtenir l'utilisateur courant
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyalty: user.loyalty
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Vérifier le statut auth (pour le frontend)
// @route   GET /api/auth/check
// @access  Public
exports.checkAuth = async (req, res) => {
    try {
        let token;
        if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(200).json({ success: false, user: null });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(200).json({ success: false, user: null });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyalty: user.loyalty,
                welcomeOffer: user.welcomeOffer
            }
        });
    } catch (err) {
        res.status(200).json({ success: false, user: null });
    }
};
