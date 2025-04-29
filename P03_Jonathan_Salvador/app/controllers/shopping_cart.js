const { readProducts } = require('./data_handler');

function getCartProducts(req, res) {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "El cuerpo debe ser un arreglo" });
    }

    const products = readProducts();
    let cart = [];

    for (const item of req.body) {
        const found = products.find(p => p.uuid === item.productUuid);
        if (!found) {
            return res.status(404).json({ error: `Producto con ID ${item.productUuid} no encontrado` });
        }
        cart.push({ ...found, amount: item.amount });
    }

    res.status(200).json(cart);
}

module.exports = {
    getCartProducts
};
