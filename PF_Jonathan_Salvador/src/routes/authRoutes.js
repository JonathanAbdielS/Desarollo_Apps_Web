// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // Ruta protegida para obtener datos del usuario logueado
router.put('/changepassword', protect, changePassword);

module.exports = router;