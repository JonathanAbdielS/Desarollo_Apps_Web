const express = require('express');
const app = express();
const PORT = 3000;
const productsRouter = require('./app/routes/products');
const adminProductsRouter = require('./app/routes/admin_products');
const { getHomePage, getShoppingCartPage, ping } = require('./app/controllers/router');

app.use(express.json());

app.use('/products', productsRouter);
app.use('/admin/products', adminProductsRouter);

app.get(['/', '/home'], getHomePage);
app.get('/shopping_cart', getShoppingCartPage);
app.get('/ping', ping);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
