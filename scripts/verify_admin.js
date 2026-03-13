const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyAdmin = async () => {
    try {
        const db = process.env.MONGO_URI;
        if (!db) {
            console.error('❌ ERREUR: MONGO_URI introuvable');
            process.exit(1);
        }

        await mongoose.connect(db);
        console.log('✅ Connecté à MongoDB');

        const adminEmail = 'admin@annakhil.com';
        const user = await User.findOne({ email: adminEmail }).select('+password');

        if (!user) {
            console.error('❌ L\'utilisateur admin n\'existe pas !');
        } else {
            console.log('👤 Utilisateur trouvé :');
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`ID: ${user._id}`);

            if (user.role === 'admin') {
                console.log('✅ STATUS ADMIN CONFIRMÉ');
            } else {
                console.log('⚠️ ATTENTION: Le rôle n\'est pas "admin" !');
                user.role = 'admin';
                await user.save();
                console.log('🔧 Rôle corrigé en "admin"');
            }
        }

        process.exit();
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
};

verifyAdmin();
