// src/routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const {
    createSale,
    getMySalesHistory,
    getAllSales,
    getSaleById,
    updateSaleStatus
} = require('../controllers/saleController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Rutas para usuarios logueados
router.post('/checkout', protect, createSale);
router.get('/history', protect, getMySalesHistory);

// Rutas para administradores
router.get('/', protect, authorizeRoles('admin'), getAllSales);
router.put('/:id/status', protect, authorizeRoles('admin'), updateSaleStatus);

// Ruta para obtener una venta específica (puede ser accedida por el dueño o un admin)
router.get('/:id', protect, getSaleById);


module.exports = router;