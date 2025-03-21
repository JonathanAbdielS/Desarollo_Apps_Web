import { Product } from './product.js';


let products = [
    new Product(
        "df2008a5-1c40-4dd1-9db7-8aacc03ae2fb",
        "Plátano",
        "Los mejores plátanos de México, directo desde Tabasco.",
        "https://images.freeimages.com/images/large-previews/4ec/banana-s-1326714.jpg",
        "pieza",
        15,
        3.6,
        "Fruta"
    ),
    new Product(
        "a1b2c3d4-e5f6-4a3b-9c8d-1e2f3a4b5c6d",
        "Manzana",
        "Manzanas rojas y jugosas, cultivadas en Chihuahua.",
        "url",
        "pieza",
        20,
        5.0,
        "Fruta"
    ),
    new Product(
        "b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e",
        "Lechuga",
        "Lechuga fresca y crujiente, ideal para ensaladas.",
        "url",
        "pieza",
        30,
        2.5,
        "Verdura"
    ),
    new Product(
        "c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f",
        "Pollo",
        "Pollo fresco, listo para cocinar.",
        "url",
        "kg",
        10,
        50.0,
        "Carne"
    )
];

function getProducts() {
    return products;
}

function getProductById(uuid) {
    return products.find(product => product.uuid === uuid);
}

function createProduct(product) {
    if (!(product instanceof Product)) {
        throw new Error("El producto debe ser una instancia de la clase Product.");
    }
    products.push(product);
    return product;
}

function updateProduct(uuid, updatedProduct) {
    const index = products.findIndex(product => product.uuid === uuid);
    if (index === -1) {
        throw new Error("Producto no encontrado.");
    }
    if (!(updatedProduct instanceof Product)) {
        throw new Error("El producto actualizado debe ser una instancia de la clase Product.");
    }
    products[index] = updatedProduct;
    return updatedProduct;
}

function deleteProduct(uuid) {
    const index = products.findIndex(product => product.uuid === uuid);
    if (index === -1) {
        throw new Error("Producto no encontrado.");
    }
    const deletedProduct = products.splice(index, 1);
    return deletedProduct[0];
}

function findProduct(query) {
    const [category, title] = query.split(":").map(part => part.trim());
    return products.filter(product => {
        const matchesCategory = category ? product.category.toLowerCase().includes(category.toLowerCase()) : true;
        const matchesTitle = title ? product.title.toLowerCase().includes(title.toLowerCase()) : true;
        return matchesCategory && matchesTitle;
    });
}

function productListToHTML(lista, htmlElement) {
    const htmlText = lista.map(product => product.toHTML()).join("");
    htmlElement.innerHTML = htmlText;
}

export { products, getProducts, getProductById, createProduct, updateProduct, deleteProduct, findProduct, productListToHTML };