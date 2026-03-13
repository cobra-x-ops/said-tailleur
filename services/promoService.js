const User = require('../models/User');

class PromoService {
    /**
     * Valider un code promo
     * @param {string} code - Le code promo
     * @param {string} userId - ID de l'utilisateur (optionnel)
     * @returns {Object} { isValid, discount, type, message, error }
     */
    static async validate(code, userId) {
        if (!code) return { isValid: false, error: 'Code requis' };

        code = code.toUpperCase();

        // 1. Check hardcoded static codes
        if (code === 'ANNAKHIL2025') {
            return {
                isValid: true,
                discount: 20,
                type: 'percent',
                message: 'Code promo valide ! (-20%)'
            };
        }

        // 2. Check User specific codes (Welcome Offer)
        if (userId) {
            const user = await User.findById(userId);
            // Strict First Order Check for Welcome Codes
            if (code.startsWith('WELCOME') || (user && user.welcomeOffer && user.welcomeOffer.code === code)) {
                const Order = require('../models/Order');
                const orderCount = await Order.countDocuments({ user: userId });

                if (orderCount > 0) {
                    return { isValid: false, error: 'Ce code est réservé à la première commande uniquement.' };
                }

                if (user && user.welcomeOffer && user.welcomeOffer.code === code) {
                    if (user.welcomeOffer.isUsed) {
                        return { isValid: false, error: 'Code déjà utilisé' };
                    }
                    if (new Date() > user.welcomeOffer.expiresAt) {
                        return { isValid: false, error: 'Code expiré' };
                    }

                    return {
                        isValid: true,
                        discount: user.welcomeOffer.discount,
                        type: 'percent',
                        message: 'Code Bienvenue valide !'
                    };
                }
            }
        }

        return { isValid: false, error: 'Code invalide' };
    }

    /**
     * Marquer un code comme utilisé
     * @param {string} code 
     * @param {string} userId 
     */
    static async markAsUsed(code, userId) {
        if (!userId) return;
        const user = await User.findById(userId);
        if (user && user.welcomeOffer && user.welcomeOffer.code === code) {
            user.welcomeOffer.isUsed = true;
            await user.save();
        }
    }
}

module.exports = PromoService;
