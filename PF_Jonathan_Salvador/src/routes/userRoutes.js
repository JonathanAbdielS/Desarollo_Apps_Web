// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas estas rutas son solo para administradores
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;