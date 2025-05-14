// src/controllers/authController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Ya lo instalamos, pero lo requerimos aquí también

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, nombre, email, password, fecha_nacimiento, tipo_usuario } = req.body;

    try {
        // Validar que todos los campos necesarios estén presentes
        if (!username || !nombre || !email || !password || !fecha_nacimiento) {
            return res.status(400).json({ message: 'Por favor, incluye todos los campos requeridos.' });
        }

        // Verificar si el usuario ya existe (por username o email)
        const userExistsByUsername = await User.findOne({ username });
        if (userExistsByUsername) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        const userExistsByEmail = await User.findOne({ email });
        if (userExistsByEmail) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
        }

        // Crear el nuevo usuario
        // La contraseña se hasheará automáticamente gracias al middleware pre-save en el modelo User
        const user = await User.create({
            username,
            nombre,
            email,
            password,
            fecha_nacimiento,
            tipo_usuario // Si no se provee, tomará el default 'cliente' del modelo
        });

        if (user) {
            // Generar token JWT
            const token = jwt.sign({ id: user._id, tipo_usuario: user.tipo_usuario }, process.env.JWT_SECRET, {
                expiresIn: '30d' // El token expira en 30 días
            });

            res.status(201).json({
                _id: user._id,
                username: user.username,
                nombre: user.nombre,
                email: user.email,
                tipo_usuario: user.tipo_usuario,
                token: token
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos.' });
        }
    } catch (error) {
        console.error("Error en registerUser:", error);
        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al registrar el usuario.' });
    }
};

// @desc    Autenticar (login) un usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, introduce email y contraseña.' });
        }

        // Buscar usuario por email
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            // Generar token JWT
            const token = jwt.sign({ id: user._id, tipo_usuario: user.tipo_usuario }, process.env.JWT_SECRET, {
                expiresIn: '30d'
            });

            res.json({
                _id: user._id,
                username: user.username,
                nombre: user.nombre,
                email: user.email,
                tipo_usuario: user.tipo_usuario,
                token: token
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
        }
    } catch (error) {
        console.error("Error en loginUser:", error);
        res.status(500).json({ message: 'Error del servidor al intentar iniciar sesión.' });
    }
};

// @desc    Obtener datos del usuario actual (protegido)
// @route   GET /api/auth/me
// @access  Private (necesitará un token)
const getMe = async (req, res) => {
    // req.user será establecido por el middleware de autenticación
    if (!req.user) {
         return res.status(401).json({ message: 'No autorizado, usuario no encontrado en la petición.' });
    }
    try {
        // Volvemos a buscar al usuario para obtener los datos más frescos, excluyendo la contraseña
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        console.error("Error en getMe:", error);
        res.status(500).json({ message: 'Error del servidor al obtener datos del usuario.' });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getMe
};