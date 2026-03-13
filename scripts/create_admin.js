const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

const path = require('path');


// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        const db = process.env.MONGO_URI;
        if (!db) {
            console.error('❌ ERREUR: MONGO_URI introuvable dans .env');
            process.exit(1);
        }

        await mongoose.connect(db);
        console.log('✅ Connecté à MongoDB');

        const adminEmail = 'admin@annakhil.com';
        const password = 'adminpassword123'; // Changez-le après la connexion !

        // Vérifier si l'admin existe déjà
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('⚠️ L\'utilisateur admin existe déjà.');
            // Update role just in case
            admin.role = 'admin';
            await admin.save();
            console.log('✅ Rôle mis à jour en ADMIN.');
        } else {
            admin = await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: password,
                role: 'admin'
            });
            console.log('🎉 Compte Admin créé avec succès !');
        }

        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${password}`);

        process.exit();
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
};

createAdmin();
