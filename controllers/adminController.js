const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Ajouter un nouveau produit
// @route   POST /api/admin/products
exports.createProduct = async (req, res) => {
    try {
        const { title, price, description, category, mainImage, stock } = req.body;

        if (!title || !price || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez remplir tous les champs obligatoires'
            });
        }

        const product = await Product.create({
            title,
            price,
            description,
            category,
            mainImage: mainImage || 'product info/logo_annakhil.png',
            stock: stock || 0,
            images: [mainImage || 'product info/logo_annakhil.png'],
            isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true'
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (err) {
        console.error('Erreur ajout produit:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Un produit avec ce nom existe déjà.' });
        }
        res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'ajout du produit.' });
    }
};

// @desc    Modifier un produit
// @route   PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (err) {
        console.error('Erreur modification produit:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Un produit avec ce nom existe déjà.' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
    }
};

// @desc    Supprimer un produit
// @route   DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Produit supprimé'
        });
    } catch (err) {
        console.error('Erreur suppression produit:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// @desc    Obtenir les statistiques du dashboard
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: 'Annulée' } });
        const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        const products = await Product.find();
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => p.stock < 5).length;
        const outOfStockProducts = products.filter(p => p.stock === 0).length;

        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'En attente' });
        const totalUsers = await User.countDocuments();

        // Placeholder for chart data logic
        const salesData = [0, 0, 0, 0, 0, 0];

        res.status(200).json({
            success: true,
            data: {
                revenue: totalRevenue,
                products: {
                    total: totalProducts,
                    lowStock: lowStockProducts,
                    outOfStock: outOfStockProducts
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders
                },
                users: {
                    total: totalUsers
                },
                salesChart: salesData
            }
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
    }
};

// @desc    Obtenir insights avancés
// @route   GET /api/admin/insights
exports.getInsights = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: 'Annulée' } });

        // 1. Panier Moyen
        const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const averageCart = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

        // 2. Top 3 Produits
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.product?.toString() || 'unknown';
                if (!productSales[productId]) {
                    productSales[productId] = { productId, quantity: 0, revenue: 0 };
                }
                productSales[productId].quantity += item.quantity || 0;
                productSales[productId].revenue += (item.price * item.quantity) || 0;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 3);

        const enrichedTopProducts = await Promise.all(
            topProducts.map(async (item) => {
                const product = await Product.findById(item.productId);
                return {
                    ...item,
                    title: product?.title || 'Produit supprimé',
                    image: product?.mainImage || '',
                    stock: product?.stock || 0,
                    price: product?.price || 0
                };
            })
        );

        // 3. Ventes par jour (7 derniers jours)
        const last7Days = [];
        const salesByDay = Array(7).fill(0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last7Days.push(date);
        }

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            const dayIndex = last7Days.findIndex(d => d.getTime() === orderDate.getTime());
            if (dayIndex !== -1) {
                salesByDay[dayIndex] += order.totalAmount || 0;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                averageCart,
                topProducts: enrichedTopProducts,
                salesByDay,
                labels: last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short' }))
            }
        });

    } catch (err) {
        console.error('Insights Error:', err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des insights' });
    }
};

// @desc    Obtenir notifications
// @route   GET /api/admin/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = [];

        // 1. Stock Critique
        const criticalProducts = await Product.find({ stock: { $lt: 3 } });
        if (criticalProducts.length > 0) {
            notifications.push({
                id: 'stock-critical',
                type: 'critical',
                icon: '⚠️',
                title: 'Stock Critique',
                message: `${criticalProducts.length} produit${criticalProducts.length > 1 ? 's' : ''} en rupture imminente`,
                action: 'Restock',
                actionUrl: '#products',
                timestamp: new Date(),
                priority: 1
            });
        }

        // 2. Commandes Urgentes
        const urgentOrders = await Order.find({
            status: 'En attente',
            createdAt: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) }
        });
        if (urgentOrders.length > 0) {
            notifications.push({
                id: 'orders-urgent',
                type: 'warning',
                icon: '📦',
                title: 'Commandes Urgentes',
                message: `${urgentOrders.length} commande${urgentOrders.length > 1 ? 's' : ''} en attente depuis +48h`,
                action: 'Traiter',
                actionUrl: '#orders',
                timestamp: new Date(),
                priority: 2
            });
        }

        // 3. Commandes du Jour
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        if (todayOrders > 0) {
            notifications.push({
                id: 'orders-today',
                type: 'info',
                icon: '✓',
                title: 'Nouvelles Commandes',
                message: `${todayOrders} commande${todayOrders > 1 ? 's' : ''} aujourd'hui`,
                action: 'Voir',
                actionUrl: '#orders',
                timestamp: new Date(),
                priority: 3
            });
        }

        notifications.sort((a, b) => a.priority - b.priority);

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (err) {
        console.error('Notifications Error:', err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications' });
    }
};

// @desc    Obtenir la liste des clients
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        // Enrichir avec le nombre de commandes (optionnel, peut être coûteux si bcp de données)
        // Pour l'instant on fait simple
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des clients' });
    }
};
// @desc    Mettre à jour un utilisateur (ex: changer rôle)
// @route   PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error('Update User Error:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};
