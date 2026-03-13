const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = 3000;

// Security Middleware - Permissive CSP for development
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"], // 🛡️ Allow onclick handlers
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:", "http:", "http://localhost:3030"],
            connectSrc: ["'self'", "http://localhost:3030", "http://127.0.0.1:3030", "https://wa.me"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Virtual routes for Admin Dashboard SPA behavior
app.get(['/orders.html', '/products.html', '/clients.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin-dashboard.html'));
});

// Fallback to index.html for other non-API routes
app.use((req, res, next) => {
    if (req.path.includes('.')) return next(); // Let static serve physical files
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Frontend server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'frontend')}`);
});
