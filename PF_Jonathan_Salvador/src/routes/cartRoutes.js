// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getCart);
router.post('/item', addItemToCart);
router.put('/item', updateCartItemQuantity); 
router.delete('/item', removeCartItem);
router.delete('/', clearCart);

module.exports = router;