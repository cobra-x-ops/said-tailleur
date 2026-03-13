const Product = require('../models/Product');

// @desc    Obtenir tous les produits (avec filtres)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        let query;

        // Copie des query params
        const reqQuery = { ...req.query };

        // Champs à exclure pour le filtrage
        const removeFields = ['select', 'sort', 'page', 'limit', '_t'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Créer chaîne de requête (support pour filtres avancés : gt, lte, in)
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Recherche
        query = Product.find(JSON.parse(queryStr));

        // SELECT Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // SORT
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt'); // Plus récent d'abord par défaut
        }

        // PAGINATION
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const startIndex = (page - 1) * limit;
        query = query.skip(startIndex).limit(limit);

        // Exécution de la requête
        const products = await query;

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Obtenir un seul produit par slug
// @route   GET /api/products/:slug
// @access  Public
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            $or: [
                { slug: req.params.id_or_slug },
                { _id: (req.params.id_or_slug.length === 24) ? req.params.id_or_slug : null }
            ]
        });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Produit non trouvé' });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (err) {
        next(err);
    }
};
