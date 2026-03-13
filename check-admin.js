const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@annakhil.com' });
        if (user) {
            console.log('✅ Admin user found');
            console.log('Role:', user.role);
            // We can't easily check the hashed password here without bcrypt, but we can see if it exists
            console.log('Password hash length:', user.password ? user.password.length : 0);
        } else {
            console.log('❌ Admin user NOT found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
