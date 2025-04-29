const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById } = require('../controllers/product');
const { getCartProducts } = require('../controllers/shopping_cart'); 

router.get('/', getAllProducts);

router.get('/:id', getProductById);

router.post('/cart', getCartProducts);

module.exports = router;
