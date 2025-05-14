// src/controllers/userController.js
const User = require('../models/user');
const Sale = require('../models/Sale'); // Para verificar si un usuario tiene ventas antes de eliminarlo
const Cart = require('../models/Cart'); // Para eliminar el carrito del usuario si se elimina el usuario

// Funciones que ya podríamos tener del authController o nuevas
// @desc    Obtener datos del usuario actual (ya existe en authController como getMe)
//          Podríamos moverlo aquí si queremos centralizar más las operaciones de usuario.
//          Por ahora, lo mantenemos en authController para la ruta /api/auth/me

// --- Funciones para Administradores ---

// @desc    Obtener todos los usuarios (Admin)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        // Excluir contraseñas de la respuesta
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error("Error en getAllUsers:", error);
        res.status(500).json({ message: 'Error del servidor al obtener los usuarios.' });
    }
};

// @desc    Obtener un usuario por su ID (Admin)
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error("Error en getUserById:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Usuario no encontrado (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener el usuario.' });
    }
};

// @desc    Actualizar el tipo de un usuario (Admin)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
    const { tipo_usuario } = req.body;

    if (!tipo_usuario || !['cliente', 'admin'].includes(tipo_usuario)) {
        return res.status(400).json({ message: "El 'tipo_usuario' es inválido. Valores permitidos: cliente, admin." });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Prevenir que un admin se quite el rol de admin a sí mismo si es el único
        if (user._id.toString() === req.user.id && user.tipo_usuario === 'admin' && tipo_usuario === 'cliente') {
            const adminCount = await User.countDocuments({ tipo_usuario: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'No se puede cambiar el rol del último administrador.' });
            }
        }

        user.tipo_usuario = tipo_usuario;
        await user.save();
        // Devolver usuario sin contraseña
        const updatedUser = await User.findById(user._id).select('-password');
        res.json({ message: 'Rol del usuario actualizado.', user: updatedUser });

    } catch (error) {
        console.error("Error en updateUserRole:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Usuario no encontrado (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el rol del usuario.' });
    }
};

// @desc    Eliminar un usuario (Admin)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Prevenir que un admin se elimine a sí mismo
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de administrador.' });
        }

        // Consideración: ¿Qué hacer con las ventas/órdenes del usuario?
        // Opción 1: No permitir eliminar si tiene ventas.
        // Opción 2: Anonimizar las ventas (quitar la referencia al usuario o asignarla a un usuario "eliminado").
        // Opción 3: Eliminar en cascada (peligroso y generalmente no recomendado para datos financieros).
        // Por ahora, implementaremos la Opción 1 para simplicidad y seguridad de datos.
        const userSales = await Sale.findOne({ user: user._id });
        if (userSales) {
            return res.status(400).json({ message: 'No se puede eliminar el usuario porque tiene ventas asociadas. Considere desactivar la cuenta o anonimizar sus datos.' });
        }

        // Eliminar el carrito del usuario
        await Cart.deleteOne({ user: user._id });
        // Eliminar el usuario
        await user.deleteOne();

        res.json({ message: 'Usuario eliminado correctamente.' });

    } catch (error) {
        console.error("Error en deleteUser:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Usuario no encontrado (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar el usuario.' });
    }
};


module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
    // Aquí podrían ir funciones para que el usuario actualice su perfil, contraseña, etc.
};