function validateAdmin(req, res, next) {
    const auth = req.headers['x-auth'];

    if (auth !== 'admin') {
        return res.status(403).json({ error: "Acceso no autorizado, no se cuenta con privilegios de administrador" });
    }
    next();
}

module.exports = { validateAdmin };
