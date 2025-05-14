// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token del header: "Bearer TOKEN_AQUI"
            token = req.headers.authorization.split(' ')[1];

            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Obtener el usuario del token (sin la contraseña) y adjuntarlo al objeto request
            // para que esté disponible en las rutas protegidas
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'No autorizado, token falló (usuario no encontrado).' });
            }

            next(); // Continuar con el siguiente middleware o el controlador de la ruta
        } catch (error) {
            console.error('Error de autenticación:', error.message);
            // Manejar diferentes errores de token (expirado, inválido, etc.)
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'No autorizado, el token ha expirado.' });
            }
            return res.status(401).json({ message: 'No autorizado, token inválido.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no se proporcionó un token.' });
    }
};

// Middleware para verificar roles (ej. si es administrador)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.tipo_usuario)) {
            return res.status(403).json({ message: `Acceso denegado. El rol '${req.user ? req.user.tipo_usuario : 'desconocido'}' no está autorizado para este recurso.` });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };