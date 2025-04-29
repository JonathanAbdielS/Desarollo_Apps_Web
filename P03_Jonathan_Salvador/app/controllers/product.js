const { readProducts, saveProducts } = require('./data_handler');
const { v4: uuidv4 } = require('uuid');

function getAllProducts(req, res) {
    const products = readProducts();
    const query = req.query.query;
    console.log(query);
    if (query) {
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );
        return res.status(200).json(filtered);
    }
    res.status(200).json(products);
}

function getProductById(req, res) {
    const products = readProducts();
    const product = products.find(p => p.uuid === req.params.id);

    if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(200).json(product);
}

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

function createProduct(req, res) {
    try {
        const { imageUrl, title, description, unit, category, pricePerUnit, stock } = req.body;
        if (!imageUrl || !title || !description || !unit || !category || !pricePerUnit || !stock) {
            return res.status(400).json({ error: "Faltan atributos requeridos" });
        }

        const products = readProducts();
        const newProduct = {
            uuid: uuidv4(),
            imageUrl,
            title,
            description,
            unit,
            category,
            pricePerUnit,
            stock
        };

        products.push(newProduct);
        saveProducts(products);

        res.status(201).json({ message: `Producto ${title} creado correctamente.` });
    } catch (err) {
        res.status(400).json({ error: "Error al crear producto" });
    }
}

function updateProduct(req, res) {
    const products = readProducts();
    const index = products.findIndex(p => p.uuid === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    const { imageUrl, title, description, unit, category, pricePerUnit, stock } = req.body;

    if (!imageUrl || !title || !description || !unit || !category || !pricePerUnit || !stock) {
        return res.status(400).json({ error: "Faltan atributos requeridos" });
    }

    products[index] = {
        ...products[index],
        imageUrl,
        title,
        description,
        unit,
        category,
        pricePerUnit,
        stock
    };

    saveProducts(products);
    res.status(200).json({ message: `Producto ${title} actualizado correctamente.` });
}

function deleteProduct(req, res) {
    const products = readProducts();
    const index = products.findIndex(p => p.uuid === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    const deletedProduct = products.splice(index, 1)[0];
    saveProducts(products);

    res.status(200).json({ message: `Producto ${deletedProduct.title} eliminado correctamente.` });
}

module.exports = {
    getAllProducts,
    getProductById,
    getCartProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
