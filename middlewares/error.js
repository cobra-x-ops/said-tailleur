const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log pour le dévelopeur
    console.error(err.stack);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Ressource non trouvée.`;
        error = new Error(message);
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Cet email est déjà associé à un compte. Veuillez vous connecter.';
        error = new Error(message);
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new Error(message);
        error.statusCode = 400;
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Erreur Serveur'
    });
};

module.exports = errorHandler;
